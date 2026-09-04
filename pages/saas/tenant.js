// 테넌트 페이지 스크립트 (목업 데이터)
// 화면: SaaS 관리 > 테넌트   (호스트 모드 전용)
(function () {

  const EDITIONS = ['Standard', 'Professional', 'Enterprise'];
  const TODAY    = new Date('2026-09-04');

  const DATA = [
    { no: 1, name: '한빛데이터센터',   domain: 'hanbit',  edition: 'Enterprise',   end: '2027-03-31', admin: 'admin@hanbit-idc.co.kr',    active: 'on',  conn: '', memo: '본사 IDC + 판교 DR센터 2개 사이트' },
    { no: 2, name: '세종클라우드',     domain: 'sejong',  edition: 'Professional', end: '2026-09-20', admin: 'it@sejongcloud.co.kr',      active: 'on',  conn: '', memo: '' },
    { no: 3, name: '대성정보기술',     domain: 'daesung', edition: 'Enterprise',   end: '',           admin: 'ops@daesung-it.co.kr',      active: 'on',  conn: 'Server=db-ds;Database=ums_daesung;User Id=ums;Password=****', memo: '전용 DB 사용 (무기한 계약)' },
    { no: 4, name: '미래네트웍스',     domain: 'mirae',   edition: 'Standard',     end: '2026-08-15', admin: 'admin@mirae-networks.co.kr', active: 'off', conn: '', memo: '계약 만료 — 갱신 협의 중' },
    { no: 5, name: '정우텔레콤',       domain: 'jungwoo', edition: 'Standard',     end: '2026-09-30', admin: 'trial@jungwoo-telecom.co.kr', active: 'on', conn: '', memo: '30일 평가판' },
  ];

  const ACTIVE_BADGE = { on: ['badge-on', '활성'], off: ['badge-off', '비활성'] };

  let sortKey = 'name';
  let sortAsc = true;
  let menuNo  = null;   // 현재 [작업] 메뉴가 열려 있는 행
  let editNo  = null;   // 편집/연결문자열 대상 행

  function badge(map, key) {
    const pair = map[key] || ['badge-off', key];
    return '<span class="badge ' + pair[0] + '">' + pair[1] + '</span>';
  }

  function row(no) {
    return DATA.filter(function (r) { return r.no === no; })[0];
  }

  // 만료일까지 남은 일수 (만료일 없으면 null)
  function daysLeft(end) {
    if (!end) return null;
    return Math.round((new Date(end) - TODAY) / 86400000);
  }

  function endCell(end) {
    if (!end) return '<span style="color:#98a2b3;">-</span>';
    const d = daysLeft(end);
    if (d < 0)  return '<span class="date-over">' + end + ' (만료)</span>';
    if (d <= 30) return '<span class="date-soon">' + end + ' (D-' + d + ')</span>';
    return end;
  }

  function fillSelect(id, arr, withAll) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  function renderGrid() {
    const kw    = (document.getElementById('q').value || '').trim();
    const fEd   = document.getElementById('fEdition').value;
    const fAct  = document.getElementById('fActive').value;
    const fExp  = document.getElementById('fExpiry').value;

    const rows = DATA.filter(function (r) {
      const d = daysLeft(r.end);
      const expOk = !fExp
        || (fExp === 'none' && d === null)
        || (fExp === 'over' && d !== null && d < 0)
        || (fExp === 'soon' && d !== null && d >= 0 && d <= 30);
      return (!kw || r.name.indexOf(kw) >= 0 || r.domain.indexOf(kw) >= 0 || r.admin.indexOf(kw) >= 0)
        && (!fEd  || r.edition === fEd)
        && (!fAct || r.active === fAct)
        && expOk;
    });

    rows.sort(function (a, b) {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === 'end') { va = va || '9999-12-31'; vb = vb || '9999-12-31'; }
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr data-no="' + r.no + '">'
            + '<td><button class="act-menu-btn" onclick="openMenu(event,' + r.no + ')">'
            +   '&#9881; 작업 <span class="caret">&#9662;</span></button></td>'
            + '<td>' + r.name + '</td>'
            + '<td>' + r.edition + '</td>'
            + '<td>' + endCell(r.end) + '</td>'
            + '<td>' + r.domain + '.ums.eteverse.com</td>'
            + '<td>' + r.admin + '</td>'
            + '<td>' + badge(ACTIVE_BADGE, r.active) + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="7" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

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
    ['fEdition', 'fActive', 'fExpiry'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('q').value = '';
    renderGrid();
  }

  // ---- 행 [작업] 드롭다운 ----
  function openMenu(e, no) {
    e.stopPropagation();
    const menu = document.getElementById('tenantMenu');
    if (menuNo === no && menu.classList.contains('show')) { closeMenu(); return; }
    menuNo = no;
    const r = e.currentTarget.getBoundingClientRect();
    menu.classList.add('show');
    // 화면 아래로 넘치면 버튼 위쪽으로 띄운다
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
    document.getElementById('tenantMenu').classList.remove('show');
    document.querySelectorAll('#gridBody tr.selected').forEach(function (tr) {
      tr.classList.remove('selected');
    });
    menuNo = null;
  }

  function menuAct(act) {
    const r = row(menuNo);
    closeMenu();
    if (!r) return;
    switch (act) {
      case 'edit':    tenantOpen(r.no); break;
      case 'conn':    connOpen(r.no); break;
      case 'migrate': umsToast(r.name + ' — 마이그레이션을 적용했습니다. (목업)'); break;
      case 'feature': umsToast(r.name + ' — 기능 설정 (목업)'); break;
      case 'invite':  umsToast(r.name + ' — 관리자 초대 메일을 발송했습니다. (목업)'); break;
      case 'passwd':  umsToast(r.name + ' — 비밀번호 설정 (목업)'); break;
      case 'login':   umsToast(r.name + ' 테넌트로 로그인 (목업)'); break;
      case 'delete':  askDelete(r.no); break;
    }
  }

  // ---- 등록/수정 ----
  function tenantOpen(no) {
    const r = (no == null) ? null : row(no);
    editNo = r ? r.no : null;
    document.getElementById('mTitle').textContent = r ? '테넌트 수정' : '테넌트 등록';
    document.getElementById('m-name').value    = r ? r.name : '';
    document.getElementById('m-domain').value  = r ? r.domain : '';
    document.getElementById('m-edition').value = r ? r.edition : EDITIONS[0];
    document.getElementById('m-end').value     = r ? r.end : '';
    document.getElementById('m-admin').value   = r ? r.admin : '';
    document.getElementById('m-memo').value    = r ? r.memo : '';
    const active = r ? (r.active === 'on') : true;
    document.getElementById('m-active').checked = active;
    document.getElementById('m-activeText').textContent = active ? '활성' : '비활성';
    show('tenantModal');
  }

  function tenantSave() { hide('tenantModal'); renderGrid(); umsToast('저장되었습니다.'); }

  // ---- DB 연결 문자열 ----
  function connOpen(no) {
    const r = row(no);
    if (!r) return;
    editNo = no;
    document.getElementById('c-name').textContent = r.name;
    document.getElementById('c-conn').value = r.conn || '';
    show('connModal');
  }
  function connSave() { hide('connModal'); umsToast('연결 문자열이 저장되었습니다.'); }

  // ---- 삭제 ----
  function askDelete(no) {
    const r = row(no);
    if (!r) return;
    editNo = no;
    document.getElementById('d-name').textContent = r.name;
    show('delModal');
  }
  function tenantDelete() { hide('delModal'); umsToast('삭제되었습니다.'); }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  fillSelect('fEdition', EDITIONS, true);
  fillSelect('m-edition', EDITIONS, false);
  renderGrid();

  document.getElementById('m-active').addEventListener('change', function () {
    document.getElementById('m-activeText').textContent = this.checked ? '활성' : '비활성';
  });

  // 바깥 클릭 / ESC / 스크롤 시 드롭다운 닫기
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#tenantMenu') && !e.target.closest('.act-menu-btn')) closeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('scroll', closeMenu, true);

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid        = renderGrid;
  window.resetSearch       = resetSearch;
  window.sortBy            = sortBy;
  window.openMenu          = openMenu;
  window.menuAct           = menuAct;
  window.tenantOpen        = tenantOpen;
  window.tenantSave        = tenantSave;
  window.tenantDelete      = tenantDelete;
  window.connSave          = connSave;
  window.tenantModalClose  = function () { hide('tenantModal'); };
  window.connModalClose    = function () { hide('connModal'); };
  window.delModalClose     = function () { hide('delModal'); };

})();
