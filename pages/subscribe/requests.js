// 요청 내역 페이지 스크립트 (목업 데이터)
// 화면: 구독 > 요청 내역   (고객 모드 전용)
(function () {

  const REQ_KEY = 'ums.subscribe.requests';

  // 과거 요청 (목업). [구독 현황]에서 보낸 요청은 localStorage 에서 읽어 앞에 붙는다.
  const SEED = [
    { no: 'REQ-260812', at: '2026-08-12 10:24', type: 'change', from: 'Standard', to: 'Professional',
      cycle: 'year', wish: '2026-09-01', contact: 'it@sejongcloud.co.kr',
      memo: '판교 사이트 추가 오픈으로 사이트 한도 상향이 필요합니다.',
      state: 'done', done: '2026-08-14 09:10',
      reply: '2026-09-01 자로 Professional 에디션이 적용되었습니다.' },
    { no: 'REQ-260705', at: '2026-07-05 16:41', type: 'extend', from: 'Standard', to: 'Standard',
      cycle: 'month', wish: '2026-07-21', contact: 'it@sejongcloud.co.kr',
      memo: '검토 기간이 필요해 1개월만 연장 요청합니다.',
      state: 'done', done: '2026-07-06 11:02',
      reply: '1개월 연장 처리되었습니다.' },
    { no: 'REQ-260620', at: '2026-06-20 09:15', type: 'change', from: 'Standard', to: 'Enterprise',
      cycle: 'year', wish: '2026-07-01', contact: 'it@sejongcloud.co.kr',
      memo: 'Open API 연동 검토 중입니다.',
      state: 'reject', done: '2026-06-23 14:35',
      reply: '요청하신 Open API 연동 범위가 확정되지 않아 반려합니다. 요건 확정 후 재요청 부탁드립니다.' },
    { no: 'REQ-260602', at: '2026-06-02 13:58', type: 'change', from: 'Standard', to: 'Professional',
      cycle: 'month', wish: '', contact: '02-555-1234',
      memo: '실시간 모니터링 기능 사용 문의드립니다.',
      state: 'canceled', done: '2026-06-03 08:20',
      reply: '' },
  ];

  const TYPE = { change: '에디션 변경', extend: '기간 연장', cancel: '해지' };
  const STATE = {
    new:      ['badge-new',    '접수'],
    review:   ['badge-review', '검토 중'],
    done:     ['badge-done',   '승인'],
    reject:   ['badge-reject', '반려'],
    canceled: ['badge-cancel', '취소'],
  };

  let sortKey = 'at';
  let sortAsc = false;
  let page    = 1;
  let curNo   = null;

  function readReq() {
    try { return JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); } catch (e) { return []; }
  }
  function writeReq(list) {
    try { localStorage.setItem(REQ_KEY, JSON.stringify(list)); } catch (e) { /* file:// 제한 무시 */ }
  }

  // 저장된 요청 + 목업 요청
  function all() { return readReq().concat(SEED); }
  function row(no) { return all().filter(function (r) { return r.no === no; })[0]; }

  function badge(state) {
    const p = STATE[state] || STATE.new;
    return '<span class="badge ' + p[0] + '">' + p[1] + '</span>';
  }

  function flow(r) {
    if (r.type === 'cancel') return '<span class="req-flow">구독 해지</span>';
    if (r.type === 'extend') {
      return '<span class="req-flow"><b>' + r.from + '</b> '
        + (r.cycle === 'year' ? '1년' : '1개월') + ' 연장</span>';
    }
    return '<span class="req-flow"><b>' + r.from + '</b> &rarr; <b>' + r.to + '</b>'
      + (r.cycle ? ' (' + (r.cycle === 'year' ? '연 단위' : '월 단위') + ')' : '') + '</span>';
  }

  // ---- 목록 ----
  function filtered() {
    const kw = (document.getElementById('q').value || '').trim();
    const ft = document.getElementById('fType').value;
    const fs = document.getElementById('fState').value;

    const rows = all().filter(function (r) {
      return (!kw || r.no.indexOf(kw) >= 0 || (r.to || '').indexOf(kw) >= 0
              || r.from.indexOf(kw) >= 0 || (r.memo || '').indexOf(kw) >= 0)
        && (!ft || r.type === ft)
        && (!fs || r.state === fs);
    });
    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });
    return rows;
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
            + '<td><button class="btn-detail" onclick="detOpen(\'' + r.no + '\')">상세</button></td>'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.at + '</td>'
            + '<td>' + (TYPE[r.type] || r.type) + '</td>'
            + '<td>' + flow(r) + '</td>'
            + '<td>' + (r.wish || '<span class="req-none">-</span>') + '</td>'
            + '<td>' + badge(r.state) + '</td>'
            + '<td>' + (r.done || '<span class="req-none">-</span>') + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="8" style="padding:30px;color:#98a2b3;">요청 내역이 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = total;
    document.getElementById('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('pNo').textContent = page;

    document.querySelectorAll('#reqTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
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
    ['fType', 'fState', 'q'].forEach(function (id) { document.getElementById(id).value = ''; });
    page = 1;
    renderGrid();
  }

  // ---- 상세 ----
  function detOpen(no) {
    const r = row(no);
    if (!r) return;
    curNo = no;
    document.getElementById('dTitle').textContent = r.no + ' 요청 상세';
    document.getElementById('detBody').innerHTML =
      '<dl class="det-dl">'
      + '<dt>요청 일시</dt><dd>' + r.at + '</dd>'
      + '<dt>요청 유형</dt><dd>' + (TYPE[r.type] || r.type) + '</dd>'
      + '<dt>내용</dt><dd>' + flow(r) + '</dd>'
      + '<dt>희망 적용일</dt><dd>' + (r.wish || '-') + '</dd>'
      + '<dt>담당자 연락처</dt><dd>' + (r.contact || '-') + '</dd>'
      + '<dt>요청 사유</dt><dd>' + (r.memo || '-') + '</dd>'
      + '<dt>처리 상태</dt><dd>' + badge(r.state) + '</dd>'
      + '<dt>처리 일시</dt><dd>' + (r.done || '-') + '</dd>'
      + '</dl>'
      + (r.reply ? '<div class="det-reply"><b>담당자 회신</b><br>' + r.reply + '</div>' : '');

    // 접수 상태의 요청만 취소할 수 있다
    document.getElementById('cancelBtn').style.display = (r.state === 'new') ? '' : 'none';
    show('detModal');
  }

  function askCancel() {
    const r = row(curNo);
    if (!r) return;
    document.getElementById('c-msg').innerHTML =
      '<span class="confirm-hl">' + r.no + '</span> 요청을<br>취소하시겠습니까?';
    show('delModal');
  }

  function doCancel() {
    const list = readReq();
    const now = new Date();
    const stamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
      + '-' + String(now.getDate()).padStart(2, '0') + ' '
      + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    list.forEach(function (r) {
      if (r.no === curNo) { r.state = 'canceled'; r.done = stamp; }
    });
    writeReq(list);
    hide('delModal');
    hide('detModal');
    renderGrid();
    umsToast('요청을 취소했습니다.');
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  document.getElementById('newReq').href =
    (window.umsLink ? window.umsLink('status.html') : 'status.html');
  renderGrid();

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    hide('detModal'); hide('delModal');
  });

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid     = renderGrid;
  window.resetSearch    = resetSearch;
  window.sortBy         = sortBy;
  window.go             = go;
  window.detOpen        = detOpen;
  window.askCancel      = askCancel;
  window.doCancel       = doCancel;
  window.detModalClose  = function () { hide('detModal'); };
  window.delModalClose  = function () { hide('delModal'); };

})();
