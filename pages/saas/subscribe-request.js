// 구독 요청 관리 페이지 스크립트 (목업 데이터)
// 화면: SaaS 관리 > 구독 요청 관리   (호스트 모드 전용)
// ※ 고객이 [구독 > 구독 현황]에서 보낸 요청은 localStorage(ums.subscribe.requests)에 쌓인다.
//   여기서 상태를 바꾸면 고객의 [구독 > 요청 내역]에도 그대로 반영된다.
(function () {

  const REQ_KEY = 'ums.subscribe.requests';
  const CUSTOMER_TENANT = window.umsTenant || '세종클라우드';

  const TENANTS = ['한빛데이터센터', '세종클라우드', '대성정보기술', '미래네트웍스', '정우텔레콤'];

  // 호스트가 보는 전체 요청 (고객 화면의 과거 요청 4건 + 다른 테넌트 요청)
  const SEED = [
    { no: 'REQ-260903', tenant: '미래네트웍스', at: '2026-09-03 11:07', type: 'extend',
      from: 'Standard', to: 'Standard', cycle: 'year', wish: '2026-09-15',
      contact: 'admin@mirae-networks.co.kr', memo: '계약 만료 후 재개 검토 중입니다. 1년 연장 요청드립니다.',
      state: 'new', done: '', reply: '' },
    { no: 'REQ-260902', tenant: '정우텔레콤', at: '2026-09-02 15:33', type: 'change',
      from: 'Standard', to: 'Professional', cycle: 'month', wish: '2026-10-01',
      contact: 'trial@jungwoo-telecom.co.kr', memo: '평가판 사용 후 정식 전환 희망합니다.',
      state: 'review', done: '', reply: '' },
    { no: 'REQ-260828', tenant: '한빛데이터센터', at: '2026-08-28 09:41', type: 'change',
      from: 'Professional', to: 'Enterprise', cycle: 'year', wish: '2026-09-01',
      contact: 'admin@hanbit-idc.co.kr', memo: '판교 DR센터 추가로 무제한 사이트가 필요합니다.',
      state: 'done', done: '2026-08-29 10:20',
      reply: '2026-09-01 자로 Enterprise 에디션이 적용되었습니다.' },
    { no: 'REQ-260820', tenant: '대성정보기술', at: '2026-08-20 14:12', type: 'cancel',
      from: 'Enterprise', to: '', cycle: '', wish: '2026-12-31',
      contact: 'ops@daesung-it.co.kr', memo: '내부 시스템 이관 검토로 해지 문의드립니다.',
      state: 'reject', done: '2026-08-22 16:48',
      reply: '계약 기간이 남아 있어 중도 해지가 불가합니다. 만료일(2026-12-31) 기준으로 재요청 부탁드립니다.' },
    // 아래 4건은 고객 화면(구독 > 요청 내역)의 과거 요청과 같은 건이다
    { no: 'REQ-260812', tenant: CUSTOMER_TENANT, at: '2026-08-12 10:24', type: 'change',
      from: 'Standard', to: 'Professional', cycle: 'year', wish: '2026-09-01',
      contact: 'it@sejongcloud.co.kr', memo: '판교 사이트 추가 오픈으로 사이트 한도 상향이 필요합니다.',
      state: 'done', done: '2026-08-14 09:10',
      reply: '2026-09-01 자로 Professional 에디션이 적용되었습니다.' },
    { no: 'REQ-260705', tenant: CUSTOMER_TENANT, at: '2026-07-05 16:41', type: 'extend',
      from: 'Standard', to: 'Standard', cycle: 'month', wish: '2026-07-21',
      contact: 'it@sejongcloud.co.kr', memo: '검토 기간이 필요해 1개월만 연장 요청합니다.',
      state: 'done', done: '2026-07-06 11:02', reply: '1개월 연장 처리되었습니다.' },
    { no: 'REQ-260620', tenant: CUSTOMER_TENANT, at: '2026-06-20 09:15', type: 'change',
      from: 'Standard', to: 'Enterprise', cycle: 'year', wish: '2026-07-01',
      contact: 'it@sejongcloud.co.kr', memo: 'Open API 연동 검토 중입니다.',
      state: 'reject', done: '2026-06-23 14:35',
      reply: '요청하신 Open API 연동 범위가 확정되지 않아 반려합니다. 요건 확정 후 재요청 부탁드립니다.' },
    { no: 'REQ-260602', tenant: CUSTOMER_TENANT, at: '2026-06-02 13:58', type: 'change',
      from: 'Standard', to: 'Professional', cycle: 'month', wish: '',
      contact: '02-555-1234', memo: '실시간 모니터링 기능 사용 문의드립니다.',
      state: 'canceled', done: '2026-06-03 08:20', reply: '' },
  ];

  const TYPE = { change: '에디션 변경', extend: '기간 연장', cancel: '해지' };
  const STATE = {
    new:      ['badge-new',    '접수'],
    review:   ['badge-review', '검토 중'],
    done:     ['badge-done',   '승인'],
    reject:   ['badge-reject', '반려'],
    canceled: ['badge-cancel', '취소'],
  };

  let sortKey   = 'at';
  let sortAsc   = false;
  let page      = 1;
  let curNo     = null;
  let actKind   = 'done';
  let quickFilter = '';   // 상단 요약 카드 클릭 필터

  function readStore() {
    try { return JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); } catch (e) { return []; }
  }
  function writeStore(list) {
    try { localStorage.setItem(REQ_KEY, JSON.stringify(list)); } catch (e) { /* file:// 제한 무시 */ }
  }

  // 고객 화면에서 들어온 요청(localStorage) + 호스트 목업
  function all() {
    const fromCustomer = readStore().map(function (r) {
      const c = {};
      Object.keys(r).forEach(function (k) { c[k] = r[k]; });
      c.tenant = c.tenant || CUSTOMER_TENANT;
      c.live = 1;                       // localStorage 에 있는 실제 건 (상태 변경이 고객에게 반영됨)
      return c;
    });
    return fromCustomer.concat(SEED);
  }

  function row(no) { return all().filter(function (r) { return r.no === no; })[0]; }

  function badge(state) {
    const p = STATE[state] || STATE.new;
    return '<span class="badge ' + p[0] + '">' + p[1] + '</span>';
  }

  function flow(r) {
    if (r.type === 'cancel') return '<span class="req-flow">구독 해지 (' + r.from + ')</span>';
    if (r.type === 'extend') {
      return '<span class="req-flow"><b>' + r.from + '</b> '
        + (r.cycle === 'year' ? '1년' : '1개월') + ' 연장</span>';
    }
    return '<span class="req-flow"><b>' + r.from + '</b> &rarr; <b>' + r.to + '</b>'
      + (r.cycle ? ' (' + (r.cycle === 'year' ? '연 단위' : '월 단위') + ')' : '') + '</span>';
  }

  function stampNow() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      + '-' + String(d.getDate()).padStart(2, '0') + ' '
      + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // ---- 상태 변경 (고객 화면 건이면 localStorage 에 반영) ----
  function update(no, patch) {
    const list = readStore();
    let hit = false;
    list.forEach(function (r) {
      if (r.no === no) {
        Object.keys(patch).forEach(function (k) { r[k] = patch[k]; });
        hit = true;
      }
    });
    if (hit) { writeStore(list); return true; }

    const seed = SEED.filter(function (r) { return r.no === no; })[0];
    if (seed) Object.keys(patch).forEach(function (k) { seed[k] = patch[k]; });
    return false;
  }

  // ---- 상단 요약 ----
  function renderSummary() {
    const rows = all();
    const cnt = { all: rows.length, new: 0, review: 0, done: 0, reject: 0 };
    rows.forEach(function (r) { if (cnt[r.state] !== undefined) cnt[r.state]++; });

    const cards = [
      { key: '',       cls: '',       label: '전체',    v: cnt.all },
      { key: 'new',    cls: 'new',    label: '접수',    v: cnt.new },
      { key: 'review', cls: 'review', label: '검토 중', v: cnt.review },
      { key: 'done',   cls: 'done',   label: '승인',    v: cnt.done },
      { key: 'reject', cls: 'reject', label: '반려',    v: cnt.reject },
    ];
    document.getElementById('summary').innerHTML = cards.map(function (c) {
      return '<div class="sum-card ' + c.cls + (quickFilter === c.key ? ' on' : '') + '"'
        + ' onclick="quick(\'' + c.key + '\')">'
        + '<div class="sum-label">' + c.label + '</div>'
        + '<div class="sum-value">' + c.v + '</div></div>';
    }).join('');
  }

  function quick(key) {
    quickFilter = key;
    document.getElementById('fState').value = key;
    page = 1;
    renderGrid();
  }

  // ---- 목록 ----
  function filtered() {
    const kw = (document.getElementById('q').value || '').trim();
    const tn = document.getElementById('fTenant').value;
    const ft = document.getElementById('fType').value;
    const fs = document.getElementById('fState').value;
    const from = document.getElementById('fFrom').value;
    const to   = document.getElementById('fTo').value;

    const rows = all().filter(function (r) {
      const d = r.at.substring(0, 10);
      return (!kw || r.no.indexOf(kw) >= 0 || r.from.indexOf(kw) >= 0
              || (r.to || '').indexOf(kw) >= 0 || (r.memo || '').indexOf(kw) >= 0)
        && (!tn || r.tenant === tn)
        && (!ft || r.type === ft)
        && (!fs || r.state === fs)
        && (!from || d >= from)
        && (!to   || d <= to);
    });
    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });
    return rows;
  }

  function rowActs(r) {
    if (r.state === 'done' || r.state === 'reject' || r.state === 'canceled') {
      return '<button class="mini-btn" onclick="detOpen(\'' + r.no + '\')">상세</button>';
    }
    return '<span class="row-acts">'
      + '<button class="mini-btn" onclick="detOpen(\'' + r.no + '\')">상세</button>'
      + '<button class="mini-btn ok" onclick="actOpen(\'done\',\'' + r.no + '\')">승인</button>'
      + '<button class="mini-btn no" onclick="actOpen(\'reject\',\'' + r.no + '\')">반려</button>'
      + '</span>';
  }

  function renderGrid() {
    const rows  = filtered();
    const size  = Number(document.getElementById('pSize').value);
    const total = rows.length;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (page > maxPage) page = maxPage;
    const from = (page - 1) * size;
    const cur  = rows.slice(from, from + size);

    document.getElementById('gridBody').innerHTML = cur.length
      ? cur.map(function (r) {
          return '<tr>'
            + '<td>' + rowActs(r) + '</td>'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.tenant + (r.live ? '<span class="from-customer">고객 접수</span>' : '') + '</td>'
            + '<td>' + r.at + '</td>'
            + '<td>' + (TYPE[r.type] || r.type) + '</td>'
            + '<td>' + flow(r) + '</td>'
            + '<td>' + (r.wish || '<span class="req-none">-</span>') + '</td>'
            + '<td>' + badge(r.state) + '</td>'
            + '<td>' + (r.done || '<span class="req-none">-</span>') + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="9" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = total;
    document.getElementById('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('pNo').textContent = page;

    document.querySelectorAll('#reqTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
    renderSummary();
  }

  function sortBy(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    page = 1;
    renderGrid();
  }

  function go(dir) {
    if (dir === 'size') { page = 1; renderGrid(); return; }
    const size = Number(document.getElementById('pSize').value);
    const maxPage = Math.max(1, Math.ceil(filtered().length / size));
    if (dir === 'first') page = 1;
    if (dir === 'prev')  page = Math.max(1, page - 1);
    if (dir === 'next')  page = Math.min(maxPage, page + 1);
    if (dir === 'last')  page = maxPage;
    renderGrid();
  }

  function resetSearch() {
    ['fTenant', 'fType', 'fState', 'fFrom', 'fTo', 'q']
      .forEach(function (id) { document.getElementById(id).value = ''; });
    quickFilter = '';
    page = 1;
    renderGrid();
  }

  // ---- 상세 ----
  function detOpen(no) {
    const r = row(no);
    if (!r) return;
    curNo = no;
    const open = (r.state === 'new' || r.state === 'review');

    document.getElementById('dTitle').textContent = r.no + ' 요청 상세';
    document.getElementById('detBody').innerHTML =
      '<dl class="det-dl">'
      + '<dt>테넌트</dt><dd>' + r.tenant + '</dd>'
      + '<dt>요청 일시</dt><dd>' + r.at + '</dd>'
      + '<dt>요청 유형</dt><dd>' + (TYPE[r.type] || r.type) + '</dd>'
      + '<dt>내용</dt><dd>' + flow(r) + '</dd>'
      + '<dt>희망 적용일</dt><dd>' + (r.wish || '-') + '</dd>'
      + '<dt>담당자 연락처</dt><dd>' + (r.contact || '-') + '</dd>'
      + '<dt>요청 사유</dt><dd>' + (r.memo || '-') + '</dd>'
      + '<dt>처리 상태</dt><dd>' + badge(r.state) + '</dd>'
      + '<dt>처리 일시</dt><dd>' + (r.done || '-') + '</dd>'
      + '</dl>'
      + (r.reply ? '<div class="det-reply"><b>고객 회신</b><br>' + r.reply + '</div>' : '');

    document.getElementById('btnReview').style.display  = (r.state === 'new') ? '' : 'none';
    document.getElementById('btnReject').style.display  = open ? '' : 'none';
    document.getElementById('btnApprove').style.display = open ? '' : 'none';
    show('detModal');
  }

  function setReview() {
    update(curNo, { state: 'review' });
    hide('detModal');
    renderGrid();
    umsToast('검토 중으로 변경했습니다.');
  }

  // ---- 승인 / 반려 ----
  function actOpen(kind, no) {
    if (no) curNo = no;
    const r = row(curNo);
    if (!r) return;
    actKind = kind;
    document.getElementById('aTitle').textContent = (kind === 'done') ? '요청 승인' : '요청 반려';
    document.getElementById('a-req').textContent  = r.no + ' · ' + r.tenant;
    document.getElementById('a-flow').innerHTML   = flow(r);
    document.getElementById('a-apply').value = r.wish || '';
    document.getElementById('a-reply').value = (kind === 'done')
      ? (r.type === 'cancel'
          ? '요청하신 일자로 해지 처리 예정입니다.'
          : '요청하신 내용으로 적용 예정입니다.')
      : '';
    document.getElementById('l-apply').style.display = (kind === 'done') ? '' : 'none';
    document.getElementById('a-apply').style.display = (kind === 'done') ? '' : 'none';
    document.getElementById('l-reply').textContent = (kind === 'done') ? '고객 회신' : '반려 사유';
    document.getElementById('a-submit').textContent = (kind === 'done') ? '승인' : '반려';
    document.getElementById('a-submit').className = (kind === 'done') ? 'btn btn-primary' : 'btn btn-danger';
    hide('detModal');
    show('actModal');
  }

  function actSubmit() {
    const reply = (document.getElementById('a-reply').value || '').trim();
    if (actKind === 'reject' && !reply) { umsToast('반려 사유를 입력하세요.'); return; }
    const apply = document.getElementById('a-apply').value;
    const live = update(curNo, {
      state: actKind,
      done: stampNow(),
      reply: reply,
      applied: (actKind === 'done') ? apply : '',
    });
    hide('actModal');
    renderGrid();
    umsToast(actKind === 'done'
      ? '승인 처리했습니다.' + (live ? ' 고객 화면에도 반영됩니다.' : '')
      : '반려 처리했습니다.' + (live ? ' 고객 화면에도 반영됩니다.' : ''));
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  document.getElementById('fTenant').innerHTML = '<option value="">전체</option>'
    + TENANTS.map(function (t) { return '<option>' + t + '</option>'; }).join('');
  renderGrid();

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    hide('detModal'); hide('actModal');
  });

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid    = renderGrid;
  window.resetSearch   = resetSearch;
  window.sortBy        = sortBy;
  window.go            = go;
  window.quick         = quick;
  window.detOpen       = detOpen;
  window.setReview     = setReview;
  window.actOpen       = actOpen;
  window.actSubmit     = actSubmit;
  window.detModalClose = function () { hide('detModal'); };
  window.actModalClose = function () { hide('actModal'); };

})();
