// =====================================================================
// UMS 공통 레이아웃 스크립트
// ---------------------------------------------------------------------
// - 모든 페이지가 <script src=".../shared/layout.js"></script> 한 줄로 포함
// - 서버(fetch) 없이 로컬(file://) 에서 그대로 동작하도록 설계
// - 각 페이지는 <body data-page="그룹/키"> + <div id="umsContent"> ...본문... </div>
//   만 두면 이 스크립트가 사이드바 / 헤더 / 브레드크럼 / 푸터를 조립해 넣는다.
// - 페이지 이동은 사이드바의 <a href> 상대경로 링크 (SPA 아님, 진짜 페이지 이동)
//
// [ 모드(role) 구조 ]
// - host(운영사) / customer(입주 고객) 두 모드. 메뉴 트리는 MENUS 에서 완전히 분리.
// - 페이지 파일(pages/**)은 두 모드가 공유한다. 화면 안에서 모드별 차이가 필요하면
//   <body data-role="host|customer"> 를 CSS 로 걸어 쓴다:
//       .host-only     -> customer 모드에서 숨김
//       .customer-only -> host 모드에서 숨김
// - 모드 전달: URL 쿼리 ?role=customer (사이드바/헤더 링크에 자동 부착)
//              + localStorage 백업(파일을 직접 열었을 때 복구용). 기본값 host.
// =====================================================================
(function () {

  // ---- 모드 정의 ----------------------------------------------------
  const ROLES = {
    host: {
      label: '호스트',
      brand: 'UMS 통합 관리 시스템',
      user:  '관리자님',
      avatar: '관',
      avatarBg: '#3498db',
    },
    customer: {
      label: '고객',
      brand: 'UMS 고객 포털',
      user:  '고객사님',
      avatar: '고',
      avatarBg: '#27ae60',
    },
  };
  const DEFAULT_ROLE = 'host';

  // ---- 메뉴 트리 (모드별로 분리) --------------------------------------
  // 대메뉴 > 중메뉴. page = "그룹/키" (파일: pages/그룹/키.html)
  // 같은 page 키를 두 모드가 함께 가리켜도 된다(파일 공유).
  const MENUS = {

    // ↓↓↓ 호스트(운영사) 모드 — 고객사/티켓 처리 등 운영 업무.
    //     화면이 아직 없는 항목은 page 키만 잡아두고 파일을 만들면 된다.
    host: [
      { label: 'SaaS 관리', children: [
        { label: '테넌트',              page: 'saas/tenant' },
        { label: '에디션',              page: 'saas/edition' },
      ]},
      { label: '티켓', children: [
        { label: '내 티켓',             page: 'ticket/ticket-my' },
        { label: '미할당 티켓',         page: 'ticket/ticket-unassigned' },
        { label: '전체 티켓',           page: 'ticket/ticket-all' },
      ]},
      { label: '관리', children: [
        { label: 'ID 관리', children: [
          { label: '조직',              page: 'admin/id-org' },
          { label: '사용자',            page: 'admin/id-user' },
          { label: '역할',              page: 'admin/id-role' },
        ]},
        { label: '작업',                page: 'admin/job' },
        { label: '템플릿 관리',         page: 'admin/template' },
        { label: '감사로그',            page: 'admin/audit-log' },
      ]},
    ],

    // ↓↓↓ 고객 모드 — 설비현황 / 설비관리 / 데이터 조회 / 알람 / GW
    customer: [
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
      ]},
      { label: 'GW', children: [
        { label: 'GW 관리',             page: 'gw/gw-list' },
        { label: 'GW 상태 모니터링',    page: 'gw/gw-status' },
        { label: 'GW 서버 상태 모니터링', page: 'gw/gw-server' },
      ]},
    ],

  };

  // ---- 구현 완료된 화면. 여기 없는 키는 사이드바에서 흐리게(nav-todo) 표시된다.
  //      (모드 공통 — 페이지 파일 단위로 관리)
  //      화면 하나 완성하면 그 키를 아래에 추가할 것. ----
  const DONE = new Set([
    'saas/tenant',
    'saas/edition',
    'facility/ups-list',
    'facility/location-manage',
    'gw/gw-list',
    'gw/gw-status',
    'gw/gw-server',
  ]);

  // ---- 루트 경로 계산: 이 스크립트 = <ROOT>/shared/layout.js ----
  const scriptSrc = (document.currentScript && document.currentScript.src) || '';
  const ROOT = scriptSrc.replace(/shared\/layout\.js(?:\?.*)?$/, '');

  // ---- 현재 모드 결정: ?role= > localStorage > 기본값 --------------------
  const STORE_KEY = 'ums.role';

  function readStore() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function writeStore(v) {
    try { localStorage.setItem(STORE_KEY, v); } catch (e) { /* file:// 제한 무시 */ }
  }

  function resolveRole() {
    const q = (location.search.match(/[?&]role=([^&]+)/) || [])[1];
    const fromUrl = q && decodeURIComponent(q);
    if (fromUrl && ROLES[fromUrl]) { writeStore(fromUrl); return fromUrl; }
    const stored = readStore();
    if (stored && ROLES[stored]) return stored;
    return DEFAULT_ROLE;
  }

  const ROLE = resolveRole();
  const MENU = MENUS[ROLE] || MENUS[DEFAULT_ROLE];

  // 링크에 현재 모드를 붙인다 (기본 모드는 URL 을 지저분하게 만들지 않도록 생략)
  // force=true 면 기본 모드라도 ?role= 를 명시한다.
  //  -> 모드 전환 링크는 반드시 force. 안 그러면 URL 에 role 이 없어서
  //     localStorage 에 남아있던 이전 모드로 되돌아간다.
  function withRole(href, role, force) {
    const r = role || ROLE;
    if (r === DEFAULT_ROLE && !force) return href;
    return href + (href.indexOf('?') >= 0 ? '&' : '?') + 'role=' + r;
  }

  function pageHref(page, role, force) {
    return withRole(ROOT + 'pages/' + page + '.html', role, force);
  }

  // ---- 페이지 메타: "그룹/키" -> { category, label } (모드별) ----
  //      메뉴 깊이는 제한 없음. category 는 상위 메뉴들을 " > " 로 이어 붙인 경로.
  function buildMeta(menu) {
    const m = {};
    (function walk(items, path) {
      items.forEach(it => {
        if (it.page) m[it.page] = { category: path.join(' > '), label: it.label };
        if (it.children) walk(it.children, path.concat(it.label));
      });
    })(menu, []);
    return m;
  }
  const PAGE_META = buildMeta(MENU);

  // 다른 모드의 메뉴에서 페이지를 찾는다 (권한 안내 배너용)
  function findInOtherRoles(key) {
    for (const r in MENUS) {
      if (r === ROLE) continue;
      const meta = buildMeta(MENUS[r])[key];
      if (meta) return { role: r, meta: meta };
    }
    return null;
  }

  // ---- 현재 페이지 키 ----
  function currentKey() {
    return document.body.getAttribute('data-page') || '';
  }

  // ---- 사이드바 렌더 (깊이 제한 없음) ----
  //  - children 이 있으면  : 접기/펼치기 노드 (하위에 활성 화면이 있으면 자동으로 펼침)
  //  - page 만 있으면      : 이동 링크
  //  - 둘 다 있으면        : 링크이면서 하위 메뉴도 갖는 노드 (캐럿으로 접기/펼치기)
  //  깊이는 d0, d1, d2 ... 클래스로 나가고, 들여쓰기는 common.css 가 처리한다.
  function hasActive(items, activeKey) {
    return items.some(it =>
      it.page === activeKey || (it.children && hasActive(it.children, activeKey)));
  }

  function renderItems(items, activeKey, depth) {
    return items.map(it => {
      const kids = it.children || null;
      const open = kids && (hasActive(kids, activeKey) || it.page === activeKey);
      const active = it.page === activeKey ? ' active' : '';
      const caret = kids ? '<span class="nav-caret">&#9662;</span>' : '';

      // 노드 머리: page 가 있으면 <a>(이동), 없으면 <div>(펼치기 전용)
      const head = it.page
        ? '<a class="nav-row' + active + (DONE.has(it.page) ? '' : ' nav-todo') + '"'
          + ' href="' + pageHref(it.page) + '">'
          + '<span class="nav-text">' + it.label + '</span>' + caret + '</a>'
        : '<div class="nav-row' + active + '">'
          + '<span class="nav-text">' + it.label + '</span>' + caret + '</div>';

      return '<div class="nav-node d' + depth + (open ? ' open' : '') + '">'
        + head
        + (kids ? '<div class="nav-sub">' + renderItems(kids, activeKey, depth + 1) + '</div>' : '')
        + '</div>';
    }).join('');
  }

  function renderMenu(activeKey) {
    return renderItems(MENU, activeKey, 0);
  }

  // ---- 모드 전환 링크: 같은 화면이 대상 모드에도 있으면 그 화면 유지, 없으면 홈 ----
  function switchHref(targetRole) {
    const key = currentKey();
    const targetMeta = buildMeta(MENUS[targetRole] || []);
    if (key && targetMeta[key]) return pageHref(key, targetRole, true);
    return withRole(ROOT + 'index.html', targetRole, true);
  }

  function renderRoleSwitch() {
    return '<div class="role-switch">'
      + Object.keys(ROLES).map(function (r) {
          const on = r === ROLE ? ' on' : '';
          return '<a class="role-switch-btn' + on + '" href="' + switchHref(r) + '">'
            + ROLES[r].label + '</a>';
        }).join('')
      + '</div>';
  }

  // ---- 크롬(사이드바/헤더/브레드크럼/푸터) 조립 ----
  function buildChrome() {
    const key = currentKey();
    const cfg = ROLES[ROLE];
    document.body.setAttribute('data-role', ROLE);

    const meta = PAGE_META[key] || { category: '', label: (document.title || 'UMS').replace(/\s*-\s*UMS$/, '') };

    // 현재 모드 메뉴에 없는 화면이면 안내 배너를 띄운다 (프로토타입 수준의 접근 안내)
    const foreign = (key && !PAGE_META[key]) ? findInOtherRoles(key) : null;
    const notice = foreign
      ? '<div class="role-notice">이 화면은 <b>' + ROLES[foreign.role].label
        + '</b> 모드 메뉴입니다. 현재 <b>' + cfg.label + '</b> 모드에서는 메뉴에 노출되지 않습니다.</div>'
      : '';

    // 페이지 본문 추출
    const holder = document.getElementById('umsContent');
    const inner = holder ? holder.innerHTML : '';
    if (holder) holder.remove();

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML =
      '<a class="sidebar-logo" href="' + withRole(ROOT + 'index.html') + '">UMS'
      + '<span class="sidebar-role">' + cfg.label + '</span></a>'
      + '<nav class="sidebar-nav">' + renderMenu(key) + '</nav>';

    const bc = (meta.category && meta.category !== meta.label)
      ? '<div class="breadcrumb-path">' + meta.category + '</div>' : '';

    const main = document.createElement('div');
    main.className = 'main';
    main.innerHTML =
      '<div class="header">'
      +   '<div class="header-brand">' + cfg.brand + '</div>'
      +   '<div class="header-right">'
      +     renderRoleSwitch()
      +     '<span class="header-link">알림</span>'
      +     '<div class="header-user"><span class="avatar" style="background:' + cfg.avatarBg + '">'
      +       cfg.avatar + '</span><span>' + cfg.user + '</span></div>'
      +     '<a class="header-link" href="' + withRole(ROOT + 'index.html') + '">홈</a>'
      +   '</div>'
      + '</div>'
      + '<div id="content">'
      +   '<div class="breadcrumb-bar"><div class="breadcrumb-left">'
      +     bc + '<div class="breadcrumb-title">' + meta.label + '</div>'
      +   '</div></div>'
      +   notice
      +   inner
      + '</div>'
      + '<div class="footer">'
      +   '<span>&copy; 2026 ETEVERSE EPA. All Rights Reserved.</span>'
      +   '<div class="footer-links"><span>이용약관</span><span>개인정보처리방침</span><span>고객지원</span></div>'
      + '</div>';

    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.insertBefore(main, sidebar.nextSibling);

    // 사이드바 클릭: 카테고리 펼치기/접기 (하위 링크는 그대로 이동)
    sidebar.querySelector('.sidebar-nav').addEventListener('click', function (e) {
      // 캐럿을 누르면 링크 노드라도 이동 대신 접기/펼치기
      const caret = e.target.closest('.nav-caret');
      if (caret) {
        e.preventDefault();
        caret.closest('.nav-node').classList.toggle('open');
        return;
      }
      // 링크가 아닌 노드 머리(<div class="nav-row">)는 접기/펼치기
      const row = e.target.closest('.nav-row');
      if (row && row.tagName !== 'A') row.parentElement.classList.toggle('open');
    });
  }

  // ---- 페이지 스크립트에서 쓸 수 있는 모드 정보 ----
  window.umsRole = ROLE;
  window.umsIsHost = (ROLE === 'host');
  window.umsLink = withRole;   // 페이지 안에서 다른 화면으로 링크 만들 때 사용

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
