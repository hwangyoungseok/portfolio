// 에디션 페이지 스크립트 (목업 데이터)
// 화면: SaaS 관리 > 에디션   (호스트 모드 전용)
(function () {

  // 에디션이 켜고 끌 수 있는 기능 목록 (UMS 고객 모드 메뉴 기준)
  const FEATURES = [
    { key: 'facility', name: '설비 관리',        desc: 'UPS / PDU / 칠러 / 배터리 등록·수정' },
    { key: 'status',   name: '설비 현황',        desc: '전력계통 · 위치 · 맵 화면' },
    { key: 'data',     name: '데이터 조회',      desc: '계측 데이터 조회 및 Trend 차트' },
    { key: 'realtime', name: '실시간 모니터링',  desc: '배터리 실시간 모니터링' },
    { key: 'alarm',    name: '알람',             desc: '알람 룰 관리 및 이력 조회' },
    { key: 'ticket',   name: '티켓',             desc: '장애/요청 티켓 등록 및 조회' },
    { key: 'gw',       name: 'G/W 관리',         desc: '게이트웨이 등록 및 상태 모니터링' },
    { key: 'api',      name: 'Open API',         desc: '외부 시스템 연동용 REST API' },
  ];

  const DATA = [
    { no: 1, name: 'Standard', desc: '소규모 IDC 1개 사이트 기준 기본 요금제',
      monthly: 300000, yearly: 3000000, trial: 30, pub: 'on', tenants: 2, memo: '',
      feat: { facility: true, status: true, data: true, realtime: false, alarm: true, ticket: true, gw: false, api: false },
      lim: { sites: 1, users: 10, retention: 6 } },

    { no: 2, name: 'Professional', desc: '다중 사이트 운영 + 실시간 모니터링 포함',
      monthly: 800000, yearly: 8000000, trial: 14, pub: 'on', tenants: 1, memo: '',
      feat: { facility: true, status: true, data: true, realtime: true, alarm: true, ticket: true, gw: true, api: false },
      lim: { sites: 5, users: 50, retention: 12 } },

    { no: 3, name: 'Enterprise', desc: '무제한 사이트 · Open API · 전용 DB 지원',
      monthly: 2000000, yearly: 20000000, trial: 0, pub: 'on', tenants: 2, memo: '전용 DB 분리 가능',
      feat: { facility: true, status: true, data: true, realtime: true, alarm: true, ticket: true, gw: true, api: true },
      lim: { sites: 0, users: 0, retention: 36 } },

    { no: 4, name: 'Trial', desc: '30일 평가판 — 기능 제한 없음, 한도만 축소',
      monthly: 0, yearly: 0, trial: 30, pub: 'off', tenants: 0, memo: '영업 시연용 (비공개)',
      feat: { facility: true, status: true, data: true, realtime: true, alarm: true, ticket: true, gw: true, api: false },
      lim: { sites: 1, users: 5, retention: 1 } },
  ];

  const PUB_BADGE = { on: ['badge-on', '공개'], off: ['badge-off', '비공개'] };

  let sortKey = 'monthly';
  let sortAsc = true;
  let menuNo  = null;   // 현재 [작업] 메뉴가 열려 있는 행
  let editNo  = null;   // 편집/기능설정/삭제 대상 행

  function badge(map, key) {
    const pair = map[key] || ['badge-off', key];
    return '<span class="badge ' + pair[0] + '">' + pair[1] + '</span>';
  }

  function row(no) { return DATA.filter(function (r) { return r.no === no; })[0]; }

  function won(v) { return v ? v.toLocaleString('ko-KR') + '원' : '무료'; }

  function featNames(r) {
    return FEATURES.filter(function (f) { return r.feat[f.key]; }).map(function (f) { return f.name; });
  }

  // 제공 기능을 칩 3개 + "외 N" 으로 요약
  function featCell(r) {
    const names = featNames(r);
    if (!names.length) return '<span style="color:#98a2b3;">-</span>';
    const head = names.slice(0, 3).map(function (n) { return '<span class="feat-chip">' + n + '</span>'; }).join('');
    return head + (names.length > 3 ? '<span class="feat-more">외 ' + (names.length - 3) + '</span>' : '');
  }

  function renderGrid() {
    const kw    = (document.getElementById('q').value || '').trim();
    const fPub  = document.getElementById('fPublic').value;
    const fTri  = document.getElementById('fTrial').value;

    const rows = DATA.filter(function (r) {
      return (!kw || r.name.indexOf(kw) >= 0 || r.desc.indexOf(kw) >= 0)
        && (!fPub || r.pub === fPub)
        && (!fTri || (fTri === 'y' ? r.trial > 0 : r.trial === 0));
    });

    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr data-no="' + r.no + '">'
            + '<td><button class="act-menu-btn" onclick="openMenu(event,' + r.no + ')">'
            +   '&#9881; 작업 <span class="caret">&#9662;</span></button></td>'
            + '<td><b>' + r.name + '</b></td>'
            + '<td>' + r.desc + '</td>'
            + '<td>' + won(r.monthly) + '</td>'
            + '<td>' + won(r.yearly) + '</td>'
            + '<td>' + (r.trial ? r.trial + '일' : '<span style="color:#98a2b3;">미제공</span>') + '</td>'
            + '<td>' + featCell(r) + '</td>'
            + '<td>' + (r.tenants ? r.tenants + '개' : '<span style="color:#98a2b3;">0개</span>') + '</td>'
            + '<td>' + badge(PUB_BADGE, r.pub) + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="9" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = rows.length;

    document.querySelectorAll('.grid-table th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  function sortBy(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    closeMenu();
    renderGrid();
  }

  function resetSearch() {
    ['fPublic', 'fTrial'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('q').value = '';
    renderGrid();
  }

  // ---- 행 [작업] 드롭다운 ----
  function openMenu(e, no) {
    e.stopPropagation();
    const menu = document.getElementById('editionMenu');
    if (menuNo === no && menu.classList.contains('show')) { closeMenu(); return; }
    menuNo = no;
    const r = e.currentTarget.getBoundingClientRect();
    menu.classList.add('show');
    const below = window.innerHeight - r.bottom;
    menu.style.left = r.left + 'px';
    menu.style.top  = (below < menu.offsetHeight + 12)
      ? (r.top - menu.offsetHeight - 4) + 'px'
      : (r.bottom + 4) + 'px';
    document.querySelectorAll('#gridBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
  }

  function closeMenu() {
    document.getElementById('editionMenu').classList.remove('show');
    document.querySelectorAll('#gridBody tr.selected').forEach(function (tr) { tr.classList.remove('selected'); });
    menuNo = null;
  }

  function menuAct(act) {
    const r = row(menuNo);
    closeMenu();
    if (!r) return;
    switch (act) {
      case 'edit':    editionOpen(r.no); break;
      case 'feature': featOpen(r.no); break;
      case 'price':   editionOpen(r.no); umsToast('가격 항목을 확인하세요. (목업)'); break;
      case 'copy':    umsToast(r.name + ' 에디션을 복제했습니다. (목업)'); break;
      case 'tenants': umsToast(r.name + ' 사용 테넌트 ' + r.tenants + '개 (목업)'); break;
      case 'delete':  askDelete(r.no); break;
    }
  }

  // ---- 등록/수정 ----
  function editionOpen(no) {
    const r = (no == null) ? null : row(no);
    editNo = r ? r.no : null;
    document.getElementById('mTitle').textContent = r ? '에디션 수정' : '에디션 등록';
    document.getElementById('m-name').value    = r ? r.name : '';
    document.getElementById('m-desc').value    = r ? r.desc : '';
    document.getElementById('m-monthly').value = r ? r.monthly : '';
    document.getElementById('m-yearly').value  = r ? r.yearly : '';
    document.getElementById('m-trial').value   = r ? r.trial : 0;
    document.getElementById('m-memo').value    = r ? r.memo : '';
    const pub = r ? (r.pub === 'on') : true;
    document.getElementById('m-public').checked = pub;
    document.getElementById('m-publicText').textContent = pub ? '공개' : '비공개';
    show('editionModal');
  }

  function editionSave() { hide('editionModal'); renderGrid(); umsToast('저장되었습니다.'); }

  // ---- 기능 설정 ----
  function featOpen(no) {
    const r = row(no);
    if (!r) return;
    editNo = no;
    document.getElementById('fTitle').textContent = r.name + ' — 기능 설정';
    document.getElementById('featList').innerHTML = FEATURES.map(function (f) {
      return '<div class="feat-row">'
        + '<div><div class="feat-name">' + f.name + '</div><div class="feat-desc">' + f.desc + '</div></div>'
        + '<label class="switch"><input type="checkbox" id="f-' + f.key + '"'
        +   (r.feat[f.key] ? ' checked' : '') + '><span class="switch-track"></span></label>'
        + '</div>';
    }).join('');
    document.getElementById('l-sites').value     = r.lim.sites;
    document.getElementById('l-users').value     = r.lim.users;
    document.getElementById('l-retention').value = r.lim.retention;
    show('featModal');
  }

  function featSave() { hide('featModal'); renderGrid(); umsToast('기능 설정이 저장되었습니다.'); }

  // ---- 삭제 ----
  function askDelete(no) {
    const r = row(no);
    if (!r) return;
    editNo = no;
    const inUse = r.tenants > 0;
    document.getElementById('d-msg').innerHTML = inUse
      ? '<span class="confirm-hl">' + r.name + '</span> 에디션은<br>테넌트 ' + r.tenants + '개가 사용 중입니다.<br>삭제할 수 없습니다.'
      : '<span class="confirm-hl">' + r.name + '</span> 에디션을<br>삭제하시겠습니까?';
    document.getElementById('d-yes').style.display = inUse ? 'none' : '';
    document.querySelector('#delModal .btn-danger').textContent = inUse ? '닫기' : '아니오';
    show('delModal');
  }

  function editionDelete() { hide('delModal'); umsToast('삭제되었습니다.'); }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  renderGrid();

  document.getElementById('m-public').addEventListener('change', function () {
    document.getElementById('m-publicText').textContent = this.checked ? '공개' : '비공개';
  });

  // 바깥 클릭 / ESC / 스크롤 시 드롭다운 닫기
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#editionMenu') && !e.target.closest('.act-menu-btn')) closeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('scroll', closeMenu, true);

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid         = renderGrid;
  window.resetSearch        = resetSearch;
  window.sortBy             = sortBy;
  window.openMenu           = openMenu;
  window.menuAct            = menuAct;
  window.editionOpen        = editionOpen;
  window.editionSave        = editionSave;
  window.editionDelete      = editionDelete;
  window.featSave           = featSave;
  window.editionModalClose  = function () { hide('editionModal'); };
  window.featModalClose     = function () { hide('featModal'); };
  window.delModalClose      = function () { hide('delModal'); };

})();
