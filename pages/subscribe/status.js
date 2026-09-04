// 구독 현황 페이지 스크립트 (목업 데이터)
// 화면: 구독 > 구독 현황   (고객 모드 전용)
// ※ 에디션 정보는 [SaaS 관리 > 에디션] 화면(pages/saas/edition.js)의 공개 에디션과 동일.
(function () {

  const FEATURES = [
    { key: 'facility', name: '설비 관리' },
    { key: 'status',   name: '설비 현황' },
    { key: 'data',     name: '데이터 조회' },
    { key: 'realtime', name: '실시간 모니터링' },
    { key: 'alarm',    name: '알람' },
    { key: 'ticket',   name: '티켓' },
    { key: 'gw',       name: 'G/W 관리' },
    { key: 'api',      name: 'Open API' },
  ];

  // 공개 에디션만 (Trial 은 비공개라 고객에게 노출하지 않는다)
  const EDITIONS = [
    { name: 'Standard', desc: '소규모 IDC 1개 사이트 기준 기본 요금제',
      monthly: 300000, yearly: 3000000, trial: 30,
      feat: { facility: 1, status: 1, data: 1, realtime: 0, alarm: 1, ticket: 1, gw: 0, api: 0 },
      lim: { sites: 1, users: 10, retention: 6 } },
    { name: 'Professional', desc: '다중 사이트 운영 + 실시간 모니터링 포함',
      monthly: 800000, yearly: 8000000, trial: 14,
      feat: { facility: 1, status: 1, data: 1, realtime: 1, alarm: 1, ticket: 1, gw: 1, api: 0 },
      lim: { sites: 5, users: 50, retention: 12 } },
    { name: 'Enterprise', desc: '무제한 사이트 · Open API · 전용 DB 지원',
      monthly: 2000000, yearly: 20000000, trial: 0,
      feat: { facility: 1, status: 1, data: 1, realtime: 1, alarm: 1, ticket: 1, gw: 1, api: 1 },
      lim: { sites: 0, users: 0, retention: 36 } },
  ];

  // 현재 구독 (테넌트 목록의 '세종클라우드' 계약과 동일)
  const CUR = {
    tenant: (window.umsTenant || '세종클라우드'),
    edition: 'Professional',
    from: '2025-09-21',
    to: '2026-09-20',
    cycle: 'year',
    next: '2026-09-21',
    use: { sites: 3, users: 34, retention: 12 },
  };

  const REQ_KEY = 'ums.subscribe.requests';
  const TODAY   = new Date('2026-09-04');

  function ed(name) { return EDITIONS.filter(function (e) { return e.name === name; })[0]; }
  function won(v) { return v ? v.toLocaleString('ko-KR') + '원' : '무료'; }
  function limText(v, unit) { return v ? v + unit : '무제한'; }

  function daysLeft(d) { return Math.round((new Date(d) - TODAY) / 86400000); }

  // ---- 현재 구독 ----
  function renderCurrent() {
    const e = ed(CUR.edition);
    const left = daysLeft(CUR.to);

    document.getElementById('curEdition').textContent = e.name;
    document.getElementById('curDesc').textContent = e.desc;
    document.getElementById('curPrice').textContent =
      CUR.cycle === 'year' ? won(e.yearly) + ' / 년' : won(e.monthly) + ' / 월';

    document.getElementById('curTenant').textContent = CUR.tenant;
    document.getElementById('curState').innerHTML = left < 0
      ? '<span class="badge badge-major">만료됨</span>'
      : (left <= 30 ? '<span class="badge badge-warn">만료 임박 (D-' + left + ')</span>'
                    : '<span class="badge badge-on">이용 중</span>');
    document.getElementById('curFrom').textContent = CUR.from;
    document.getElementById('curTo').textContent   = CUR.to;
    document.getElementById('curCycle').textContent = CUR.cycle === 'year' ? '연 단위' : '월 단위';
    document.getElementById('curNext').textContent  = CUR.next;

    // 사용량 막대는 소진되는 한도만 (데이터 보관 기간은 아래 안내 문구로)
    const items = [
      { label: '사이트', use: CUR.use.sites, lim: e.lim.sites, unit: '개' },
      { label: '사용자', use: CUR.use.users, lim: e.lim.users, unit: '명' },
    ];
    document.getElementById('usage').innerHTML = items.map(function (it) {
      const unlimited = !it.lim;
      const pct = unlimited ? 0 : Math.min(100, Math.round(it.use / it.lim * 100));
      const cls = pct >= 100 ? ' over' : (pct >= 80 ? ' warn' : '');
      return '<div class="usage-item">'
        + '<div class="usage-top"><span>' + it.label + '</span>'
        +   '<b>' + it.use + it.unit + ' / ' + limText(it.lim, it.unit) + '</b></div>'
        + '<div class="bar' + cls + '"><i style="width:' + (unlimited ? 100 : pct) + '%"></i></div>'
        + '<div class="usage-note">' + (unlimited ? '한도 없음' : '한도의 ' + pct + '% 사용 중') + '</div>'
        + '</div>';
    }).join('')
    + '<div class="usage-item">'
    +   '<div class="usage-top"><span>데이터 보관</span><b>' + e.lim.retention + '개월</b></div>'
    +   '<div class="bar"><i style="width:100%"></i></div>'
    +   '<div class="usage-note">' + e.lim.retention + '개월이 지난 계측 데이터는 자동 삭제됩니다.</div>'
    + '</div>';
  }

  // ---- 에디션 카드 ----
  function renderEditions() {
    document.getElementById('edGrid').innerHTML = EDITIONS.map(function (e) {
      const isCur = (e.name === CUR.edition);
      return '<div class="ed-card' + (isCur ? ' cur' : '') + '">'
        + '<div class="ed-name">' + e.name
        +   (isCur ? ' <span class="badge badge-on">이용 중</span>' : '') + '</div>'
        + '<div class="ed-desc">' + e.desc + '</div>'
        + '<div class="ed-price">' + won(e.monthly) + ' <small>/ 월</small></div>'
        + '<div class="ed-year">연 결제 시 ' + won(e.yearly) + ' / 년'
        +   (e.trial ? ' · 평가판 ' + e.trial + '일' : '') + '</div>'
        + '<ul class="ed-list">'
        + FEATURES.map(function (f) {
            return '<li class="' + (e.feat[f.key] ? '' : 'off') + '">' + f.name + '</li>';
          }).join('')
        + '</ul>'
        + '<div class="ed-limit">사이트 ' + limText(e.lim.sites, '개')
        +   ' · 사용자 ' + limText(e.lim.users, '명')
        +   ' · 데이터 보관 ' + e.lim.retention + '개월</div>'
        + '<div class="ed-actions">'
        +   (isCur
              ? '<button class="btn" disabled>현재 에디션</button>'
              : '<button class="btn btn-primary" onclick="reqOpen(\'change\',\'' + e.name + '\')">'
                + (EDITIONS.indexOf(e) > EDITIONS.indexOf(ed(CUR.edition)) ? '업그레이드 요청' : '변경 요청')
                + '</button>')
        + '</div></div>';
    }).join('');
  }

  // ---- 요청 모달 ----
  function reqOpen(type, edition) {
    document.getElementById('r-tenant').textContent = CUR.tenant;
    document.getElementById('r-cur').textContent =
      CUR.edition + ' (' + (CUR.cycle === 'year' ? '연 단위' : '월 단위') + ', ~' + CUR.to + ')';
    document.getElementById('r-type').value = type;
    document.getElementById('r-edition').innerHTML = EDITIONS.map(function (e) {
      return '<option' + (e.name === (edition || CUR.edition) ? ' selected' : '') + '>' + e.name + '</option>';
    }).join('');
    document.getElementById('r-cycle').value = CUR.cycle;
    document.getElementById('r-from').value = '';
    document.getElementById('r-contact').value = '';
    document.getElementById('r-memo').value = '';
    typeChange();
    show('reqModal');
  }

  function typeChange() {
    const t = document.getElementById('r-type').value;
    document.getElementById('rTitle').textContent =
      t === 'change' ? '구독 변경 요청' : (t === 'extend' ? '기간 연장 요청' : '해지 요청');
    // 해지는 에디션/주기 선택이 필요 없다
    ['l-edition', 'r-edition', 'l-cycle', 'r-cycle'].forEach(function (id) {
      document.getElementById(id).style.display = (t === 'cancel') ? 'none' : '';
    });
    document.getElementById('l-from').textContent = (t === 'cancel') ? '희망 해지일' : '희망 적용일';
    renderDiff();
  }

  // 선택에 따른 변경 요약
  function renderDiff() {
    const t = document.getElementById('r-type').value;
    const box = document.getElementById('diff');
    if (t === 'cancel') {
      box.innerHTML = '해지 요청은 담당자 확인 후 처리됩니다. '
        + '현재 계약은 <b>' + CUR.to + '</b> 까지이며, 해지 시 이후 데이터 조회가 제한됩니다.';
      return;
    }
    if (t === 'extend') {
      const e = ed(document.getElementById('r-edition').value);
      const cyc = document.getElementById('r-cycle').value;
      box.innerHTML = '<b>' + e.name + '</b> 에디션을 '
        + (cyc === 'year' ? '1년' : '1개월') + ' 연장합니다. '
        + '예상 금액 <b>' + won(cyc === 'year' ? e.yearly : e.monthly) + '</b> · '
        + '만료일 ' + CUR.to + ' → <b>' + addPeriod(CUR.to, cyc) + '</b>';
      return;
    }
    const now = ed(CUR.edition);
    const nxt = ed(document.getElementById('r-edition').value);
    const cyc = document.getElementById('r-cycle').value;
    if (now.name === nxt.name) {
      box.innerHTML = '현재와 같은 에디션입니다. 다른 에디션을 선택하거나 요청 유형을 <b>기간 연장</b>으로 바꿔 주세요.';
      return;
    }
    const gained = FEATURES.filter(function (f) { return !now.feat[f.key] && nxt.feat[f.key]; });
    const lost   = FEATURES.filter(function (f) { return now.feat[f.key] && !nxt.feat[f.key]; });
    const price  = cyc === 'year' ? [now.yearly, nxt.yearly] : [now.monthly, nxt.monthly];

    box.innerHTML =
      '에디션 <b>' + now.name + '</b> → <b>' + nxt.name + '</b><br>'
      + '요금 ' + won(price[0]) + ' → <b>' + won(price[1]) + '</b>'
      + (price[1] > price[0] ? ' <span class="up">(+' + won(price[1] - price[0]) + ')</span>'
                             : ' <span class="down">(-' + won(price[0] - price[1]) + ')</span>') + '<br>'
      + '사이트 ' + limText(now.lim.sites, '개') + ' → <b>' + limText(nxt.lim.sites, '개') + '</b>'
      + ' · 사용자 ' + limText(now.lim.users, '명') + ' → <b>' + limText(nxt.lim.users, '명') + '</b><br>'
      + (gained.length ? '추가 기능 <span class="up">' + gained.map(function (f) { return f.name; }).join(', ') + '</span><br>' : '')
      + (lost.length   ? '제외 기능 <span class="down">' + lost.map(function (f) { return f.name; }).join(', ') + '</span>' : '');
  }

  function addPeriod(d, cyc) {
    const t = new Date(d);
    if (cyc === 'year') t.setFullYear(t.getFullYear() + 1);
    else t.setMonth(t.getMonth() + 1);
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0')
      + '-' + String(t.getDate()).padStart(2, '0');
  }

  // ---- 요청 저장 (요청 내역 화면에서 읽는다) ----
  function readReq() {
    try { return JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); } catch (e) { return []; }
  }
  function writeReq(list) {
    try { localStorage.setItem(REQ_KEY, JSON.stringify(list)); } catch (e) { /* file:// 제한 무시 */ }
  }

  function reqSubmit() {
    const t   = document.getElementById('r-type').value;
    const nxt = document.getElementById('r-edition').value;
    if (t === 'change' && nxt === CUR.edition) {
      umsToast('현재와 다른 에디션을 선택하세요.');
      return;
    }
    const now = new Date();
    const stamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
      + '-' + String(now.getDate()).padStart(2, '0') + ' '
      + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    const list = readReq();
    list.unshift({
      no: 'REQ-' + String(Date.now()).slice(-6),
      at: stamp,
      type: t,
      from: CUR.edition,
      to: (t === 'cancel') ? '' : nxt,
      cycle: (t === 'cancel') ? '' : document.getElementById('r-cycle').value,
      wish: document.getElementById('r-from').value || '',
      contact: (document.getElementById('r-contact').value || '').trim(),
      memo: (document.getElementById('r-memo').value || '').trim(),
      state: 'new',
      done: '',
      reply: '',
    });
    writeReq(list);
    hide('reqModal');
    umsToast('요청을 접수했습니다. [구독 > 요청 내역]에서 진행 상태를 확인하세요.');
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  renderCurrent();
  renderEditions();

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide('reqModal'); });

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.reqOpen       = reqOpen;
  window.typeChange    = typeChange;
  window.renderDiff    = renderDiff;
  window.reqSubmit     = reqSubmit;
  window.reqModalClose = function () { hide('reqModal'); };

})();
