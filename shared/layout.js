// =====================================================================
// UMS 공통 레이아웃 스크립트
// ---------------------------------------------------------------------
// - 모든 페이지가 <script src=".../shared/layout.js"></script> 한 줄로 포함
// - 서버(fetch) 없이 로컬(file://) 에서 그대로 동작하도록 설계
// - 각 페이지는 <body data-page="그룹/키"> + <div id="umsContent"> ...본문... </div>
//   만 두면 이 스크립트가 사이드바 / 헤더 / 브레드크럼 / 푸터를 조립해 넣는다.
// - 페이지 이동은 사이드바의 <a href> 상대경로 링크 (SPA 아님, 진짜 페이지 이동)
// =====================================================================
(function () {

  // ---- 메뉴 트리 (대메뉴 > 중메뉴). page = "그룹/키" (파일: pages/그룹/키.html) ----
  const MENU = [
    { label: '설비현황', children: [
      { label: '전력계통',            page: 'status/power-topology' },
      { label: '위치',                page: 'status/location-status' },
      { label: '맵',                  page: 'status/map-view' },
      { label: '맵 관리',             page: 'status/map-manage' },
    ]},
    { label: '설비관리', children: [
      { label: '위치 관리',           page: 'facility/location-manage' },
      { label: 'UPS 관리',            page: 'facility/ups-list' },
      { label: 'PDU 관리',            page: 'facility/pdu-list' },
      { label: '칠러 관리',           page: 'facility/chiller-list' },
      { label: '배터리 관리',         page: 'facility/battery-list' },
      { label: '배터리 교체 이력',    page: 'facility/battery-history' },
    ]},
    { label: '데이터 조회', children: [
      { label: 'UPS 데이터 조회',     page: 'data/ups-data' },
      { label: 'UPS Trend 차트',      page: 'data/ups-trend' },
      { label: 'PDU 데이터 조회',     page: 'data/pdu-data' },
      { label: 'PDU Trend 차트',      page: 'data/pdu-trend' },
      { label: '칠러 데이터 조회',    page: 'data/chiller-data' },
      { label: '칠러 Trend 차트',     page: 'data/chiller-trend' },
      { label: '배터리 데이터 조회',  page: 'data/battery-data' },
      { label: '배터리 Trend 차트',   page: 'data/battery-trend' },
      { label: '배터리 실시간 모니터링', page: 'data/battery-realtime' },
    ]},
    { label: '알람', children: [
      { label: '알람 룰 관리',        page: 'alarm/alarm-rule' },
      { label: '알람 이력 조회',      page: 'alarm/alarm-history' },
    ]},
    { label: '티켓', children: [
      { label: '내 티켓',             page: 'ticket/ticket-my' },
      { label: '미할당 티켓',         page: 'ticket/ticket-unassigned' },
      { label: '전체 티켓',           page: 'ticket/ticket-all' },
    ]},
    { label: 'GW', children: [
      { label: 'GW 관리',             page: 'gw/gw-list' },
      { label: 'GW 상태 모니터링',    page: 'gw/gw-status' },
      { label: 'GW 서버 상태 모니터링', page: 'gw/gw-server' },
    ]},
  ];

  // ---- 구현 완료된 화면. 여기 없는 키는 메뉴 클릭 시 "준비 중" 토스트만 뜬다.
  //      화면 하나 완성하면 그 키를 아래에 추가할 것. ----
  const DONE = new Set([
    'facility/ups-list',
    'facility/location-manage',
  ]);

  // ---- 루트 경로 계산: 이 스크립트 = <ROOT>/shared/layout.js ----
  const scriptSrc = (document.currentScript && document.currentScript.src) || '';
  const ROOT = scriptSrc.replace(/shared\/layout\.js(?:\?.*)?$/, '');

  // ---- 페이지 메타: "그룹/키" -> { category, label } ----
  const PAGE_META = {};
  MENU.forEach(cat => {
    (cat.children || []).forEach(it => {
      if (it.page) PAGE_META[it.page] = { category: cat.label, label: it.label };
    });
  });

  // ---- 현재 페이지 키 ----
  function currentKey() {
    return document.body.getAttribute('data-page') || '';
  }

  // ---- 사이드바 렌더 ----
  function renderMenu(activeKey) {
    return MENU.map(cat => {
      const kids = (cat.children || []).map(it => {
        const active = it.page === activeKey ? ' active' : '';
        const done = DONE.has(it.page);
        return '<div class="nav-node d1">'
          + '<a class="nav-row' + active + (done ? '' : ' nav-todo') + '"'
          + (done ? ' href="' + ROOT + 'pages/' + it.page + '.html"' : ' data-todo="' + it.page + '"')
          + '><span class="nav-text">' + it.label + '</span></a></div>';
      }).join('');
      const open = (cat.children || []).some(it => it.page === activeKey);
      return '<div class="nav-node d0' + (open ? ' open' : '') + '">'
        + '<div class="nav-row"><span class="nav-text">' + cat.label + '</span>'
        + '<span class="nav-caret">&#9662;</span></div>'
        + '<div class="nav-sub">' + kids + '</div></div>';
    }).join('');
  }

  // ---- 크롬(사이드바/헤더/브레드크럼/푸터) 조립 ----
  function buildChrome() {
    const key = currentKey();
    const meta = PAGE_META[key] || { category: '', label: (document.title || 'UMS').replace(/\s*-\s*UMS$/, '') };

    // 페이지 본문 추출
    const holder = document.getElementById('umsContent');
    const inner = holder ? holder.innerHTML : '';
    if (holder) holder.remove();

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML =
      '<a class="sidebar-logo" href="' + ROOT + 'index.html">UMS</a>'
      + '<nav class="sidebar-nav">' + renderMenu(key) + '</nav>';

    const bc = (meta.category && meta.category !== meta.label)
      ? '<div class="breadcrumb-path">' + meta.category + '</div>' : '';

    const main = document.createElement('div');
    main.className = 'main';
    main.innerHTML =
      '<div class="header">'
      +   '<div class="header-brand">UMS 통합 관리 시스템</div>'
      +   '<div class="header-right">'
      +     '<span class="header-link">알림</span>'
      +     '<div class="header-user"><span class="avatar">관</span><span>관리자님</span></div>'
      +     '<a class="header-link" href="' + ROOT + 'index.html">홈</a>'
      +   '</div>'
      + '</div>'
      + '<div id="content">'
      +   '<div class="breadcrumb-bar"><div class="breadcrumb-left">'
      +     bc + '<div class="breadcrumb-title">' + meta.label + '</div>'
      +   '</div></div>'
      +   inner
      + '</div>'
      + '<div class="footer">'
      +   '<span>&copy; 2026 ETEVERSE EPA. All Rights Reserved.</span>'
      +   '<div class="footer-links"><span>이용약관</span><span>개인정보처리방침</span><span>고객지원</span></div>'
      + '</div>';

    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.insertBefore(main, sidebar.nextSibling);

    // 사이드바 클릭: 카테고리 펼치기/접기 + 미구현 화면 안내
    sidebar.querySelector('.sidebar-nav').addEventListener('click', function (e) {
      const cat = e.target.closest('.nav-node.d0 > .nav-row');
      if (cat) { cat.parentElement.classList.toggle('open'); return; }
      const todo = e.target.closest('.nav-todo');
      if (todo) { e.preventDefault(); window.umsToast && window.umsToast('준비 중입니다.'); }
    });
  }

  // ---- 공통 토스트 (window.umsToast('저장되었습니다.')) ----
  window.umsToast = function (msg) {
    let t = document.getElementById('umsToast');
    if (!t) { t = document.createElement('div'); t.id = 'umsToast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__umsToastT);
    window.__umsToastT = setTimeout(function () { t.classList.remove('show'); }, 1800);
  };

  // ---- 실행 ----
  if (document.body) buildChrome();
  else document.addEventListener('DOMContentLoaded', buildChrome);

})();
