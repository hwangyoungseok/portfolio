// 역할 페이지 스크립트 (목업 데이터)
// 화면: 관리 > ID 관리 > 역할   (호스트 모드 전용)
// ※ 역할 목록과 사용자 수는 [조직] · [사용자] 화면의 역할/구성원 매핑과 동일.
(function () {

  // ---- 권한 트리 (UMS 메뉴 기준) ----
  const PERM_GROUPS = [
    { key: 'saas',     name: 'SaaS 관리', items: [
      { key: 'saas.tenant.view', name: '테넌트 조회' }, { key: 'saas.tenant.edit', name: '테넌트 관리' },
      { key: 'saas.edition.view', name: '에디션 조회' }, { key: 'saas.edition.edit', name: '에디션 관리' } ]},
    { key: 'admin',    name: '관리', items: [
      { key: 'admin.org',      name: '조직' },        { key: 'admin.user',    name: '사용자' },
      { key: 'admin.role',     name: '역할' },        { key: 'admin.job',     name: '작업' },
      { key: 'admin.template', name: '템플릿 관리' }, { key: 'admin.audit',   name: '감사로그' },
      { key: 'admin.setting',  name: '설정' } ]},
    { key: 'ticket',   name: '티켓', items: [
      { key: 'ticket.view',   name: '조회' },   { key: 'ticket.create', name: '등록' },
      { key: 'ticket.assign', name: '배정' },   { key: 'ticket.close',  name: '처리/종료' } ]},
    { key: 'facility', name: '설비', items: [
      { key: 'facility.view',  name: '설비 조회' }, { key: 'facility.edit', name: '설비 등록·수정' },
      { key: 'facility.del',   name: '설비 삭제' }, { key: 'status.view',   name: '설비 현황' } ]},
    { key: 'data',     name: '데이터 / 알람', items: [
      { key: 'data.view',   name: '데이터 조회' }, { key: 'data.export', name: '데이터 내보내기' },
      { key: 'alarm.view',  name: '알람 이력' },   { key: 'alarm.rule',  name: '알람 룰 관리' } ]},
    { key: 'gw',       name: 'G/W', items: [
      { key: 'gw.view', name: 'G/W 조회' }, { key: 'gw.edit', name: 'G/W 관리' } ]},
  ];

  const ALL_KEYS = PERM_GROUPS.reduce(function (a, g) {
    return a.concat(g.items.map(function (i) { return i.key; }));
  }, []);

  function keySet(keys) {
    const o = {};
    keys.forEach(function (k) { o[k] = true; });
    return o;
  }

  // ---- 역할 (조직 화면 ROLES 와 동일) ----
  const DATA = [
    { no: 1, name: '시스템 관리자', desc: '전체 메뉴 및 설정 접근', isDefault: 0, isPublic: 1,
      perms: keySet(ALL_KEYS) },
    { no: 2, name: '설비 운영자', desc: '설비 등록·수정 및 알람 처리', isDefault: 0, isPublic: 1,
      perms: keySet(['facility.view', 'facility.edit', 'status.view', 'data.view', 'data.export',
                     'alarm.view', 'alarm.rule', 'ticket.view', 'ticket.create', 'gw.view']) },
    { no: 3, name: '티켓 담당자', desc: '티켓 배정 및 처리', isDefault: 0, isPublic: 1,
      perms: keySet(['ticket.view', 'ticket.create', 'ticket.assign', 'ticket.close',
                     'facility.view', 'status.view', 'alarm.view']) },
    { no: 4, name: '조회 전용', desc: '데이터 조회만 가능', isDefault: 1, isPublic: 1,
      perms: keySet(['facility.view', 'status.view', 'data.view', 'alarm.view', 'ticket.view']) },
    { no: 5, name: '게스트', desc: '임시 계정용 — 현황 화면만 열람', isDefault: 0, isPublic: 0,
      perms: keySet(['status.view']) },
  ];

  // ---- 사용자 (사용자 화면 DATA 와 동일한 집합: 역할별 인원 산출용) ----
  const USERS = [
    { uname: 'admin',    name: 'admin',  org: '-',            role: '시스템 관리자' },
    { uname: 'oh.yh',    name: '오영훈', org: '경영지원본부', role: '시스템 관리자' },
    { uname: 'kim.jh',   name: '김진호', org: '기술본부',     role: '시스템 관리자' },
    { uname: 'nam.kh',   name: '남기훈', org: '기술본부',     role: '시스템 관리자' },
    { uname: 'pyeon.sh', name: '편승훈', org: '보안팀',       role: '시스템 관리자' },
    { uname: 'hwang.by', name: '황보영', org: '인프라운영팀', role: '설비 운영자' },
    { uname: 'park.jh',  name: '박지훈', org: '인프라운영팀', role: '설비 운영자' },
    { uname: 'han.sy',   name: '한서연', org: '인프라운영팀', role: '설비 운영자' },
    { uname: 'cho.sw',   name: '조성우', org: '인프라운영팀', role: '설비 운영자' },
    { uname: 'ahn.js',   name: '안준서', org: '인프라운영팀', role: '설비 운영자' },
    { uname: 'yang.jh',  name: '양준혁', org: '인프라운영팀', role: '설비 운영자' },
    { uname: 'moon.tj',  name: '문태준', org: '시설관리팀',   role: '설비 운영자' },
    { uname: 'lim.cw',   name: '임채원', org: '시설관리팀',   role: '설비 운영자' },
    { uname: 'kwak.dy',  name: '곽도윤', org: '시설관리팀',   role: '설비 운영자' },
    { uname: 'ma.sj',    name: '마성진', org: '시설관리팀',   role: '설비 운영자' },
    { uname: 'koo.jh',   name: '구자현', org: '보안팀',       role: '설비 운영자' },
    { uname: 'choi.ma',  name: '최민아', org: '인사팀',       role: '티켓 담당자' },
    { uname: 'yoon.dh',  name: '윤도현', org: '시설관리팀',   role: '티켓 담당자' },
    { uname: 'baek.sh',  name: '백승호', org: '시설관리팀',   role: '티켓 담당자' },
    { uname: 'bae.sh',   name: '배수현', org: '인프라운영팀', role: '티켓 담당자' },
    { uname: 'pyo.jh',   name: '표지훈', org: '인프라운영팀', role: '티켓 담당자' },
    { uname: 'song.mj',  name: '송민재', org: '보안팀',       role: '티켓 담당자' },
    { uname: 'lee.sm',   name: '이수민', org: '총무부',       role: '조회 전용' },
    { uname: 'jung.ws',  name: '정우성', org: '총무부',       role: '조회 전용' },
    { uname: 'oh.sr',    name: '오세라', org: '총무부',       role: '조회 전용' },
    { uname: 'kang.yr',  name: '강예린', org: '재무팀',       role: '조회 전용' },
    { uname: 'hong.yj',  name: '홍유진', org: '재무팀',       role: '조회 전용' },
    { uname: 'ha.ya',    name: '하윤아', org: '재무팀',       role: '조회 전용' },
    { uname: 'yoo.hr',   name: '유하린', org: '인사팀',       role: '조회 전용' },
    { uname: 'shim.de',  name: '심다은', org: '인사팀',       role: '조회 전용' },
    { uname: 'shin.hn',  name: '신하늘', org: '보안팀',       role: '조회 전용' },
    { uname: 'seo.jw',   name: '서지우', org: '영업1팀',      role: '조회 전용' },
    { uname: 'noh.km',   name: '노경민', org: '영업1팀',      role: '조회 전용' },
    { uname: 'jin.sy',   name: '진소영', org: '영업1팀',      role: '조회 전용' },
    { uname: 'jeon.ms',  name: '전미소', org: '영업본부',     role: '조회 전용' },
  ];

  let sortKey = 'name';
  let sortAsc = true;
  let page    = 1;
  let menuNo  = null;
  let editNo  = null;
  let permDraft = {};   // 권한 모달 편집 중 상태

  function row(no) { return DATA.filter(function (r) { return r.no === no; })[0]; }
  function usersOf(name) { return USERS.filter(function (u) { return u.role === name; }); }
  function permCount(r) { return Object.keys(r.perms).filter(function (k) { return r.perms[k]; }).length; }

  // ---- 목록 ----
  function filtered() {
    const kw = (document.getElementById('q').value || '').trim();
    const rows = DATA.filter(function (r) {
      return !kw || r.name.indexOf(kw) >= 0 || r.desc.indexOf(kw) >= 0;
    }).map(function (r) {
      r.users = usersOf(r.name).length;
      return r;
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
          const cnt = permCount(r);
          return '<tr data-no="' + r.no + '">'
            + '<td><button class="act-menu-btn" onclick="openMenu(event,' + r.no + ')">'
            +   '&#9881; 작업 <span class="caret">&#9662;</span></button></td>'
            + '<td><span class="role-name">' + r.name + '</span>'
            +   (r.isPublic  ? ' <span class="badge badge-public">공개</span>' : '')
            +   (r.isDefault ? ' <span class="badge badge-default">기본</span>' : '')
            + '</td>'
            + '<td>' + r.desc + '</td>'
            + '<td>' + (cnt === ALL_KEYS.length
                  ? '<span class="perm-all">전체</span>'
                  : '<span class="perm-count">' + cnt + ' / ' + ALL_KEYS.length + '</span>') + '</td>'
            + '<td>' + r.users + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="5" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('pNo').textContent = page;

    document.querySelectorAll('#roleTable th.sortable').forEach(function (th) {
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

  function go(dir) {
    const size = Number(document.getElementById('pSize').value);
    const maxPage = Math.max(1, Math.ceil(filtered().length / size));
    if (dir === 'first') page = 1;
    if (dir === 'prev')  page = Math.max(1, page - 1);
    if (dir === 'next')  page = Math.min(maxPage, page + 1);
    if (dir === 'last')  page = maxPage;
    renderGrid();
  }

  // ---- 행 [작업] 드롭다운 ----
  function openMenu(e, no) {
    e.stopPropagation();
    const menu = document.getElementById('roleMenu');
    const wasOpen = (menuNo === no && menu.classList.contains('show'));
    closeMenu();
    if (wasOpen) return;
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
    document.getElementById('roleMenu').classList.remove('show');
    document.querySelectorAll('#gridBody tr.selected').forEach(function (tr) { tr.classList.remove('selected'); });
    menuNo = null;
  }

  function menuAct(act) {
    const r = row(menuNo);
    closeMenu();
    if (!r) return;
    if (act === 'edit')   roleOpen(r.no);
    if (act === 'perm')   permOpen(r.no);
    if (act === 'users')  usersOpen(r.no);
    if (act === 'delete') askDelete(r.no);
  }

  // ---- 등록/수정 ----
  function roleOpen(no) {
    const r = (no == null) ? null : row(no);
    editNo = r ? r.no : null;
    document.getElementById('mTitle').textContent = r ? '역할 수정' : '새 역할';
    document.getElementById('m-name').value = r ? r.name : '';
    document.getElementById('m-desc').value = r ? r.desc : '';
    const def = r ? !!r.isDefault : false;
    const pub = r ? !!r.isPublic : true;
    document.getElementById('m-default').checked = def;
    document.getElementById('m-public').checked  = pub;
    document.getElementById('m-defaultText').textContent = def ? '사용' : '사용 안 함';
    document.getElementById('m-publicText').textContent  = pub ? '공개' : '비공개';
    show('roleModal');
  }

  function roleSave() {
    const n = (document.getElementById('m-name').value || '').trim();
    if (!n) { umsToast('역할 이름을 입력하세요.'); return; }
    hide('roleModal');
    renderGrid();
    umsToast('저장되었습니다.');
  }

  // ---- 권한 ----
  function permOpen(no) {
    const r = row(no);
    if (!r) return;
    editNo = no;
    permDraft = {};
    Object.keys(r.perms).forEach(function (k) { permDraft[k] = r.perms[k]; });
    document.getElementById('pTitle').textContent = r.name + ' — 권한';
    document.getElementById('permTotal').textContent = ALL_KEYS.length;
    renderPerm();
    show('permModal');
  }

  function renderPerm() {
    document.getElementById('permList').innerHTML = PERM_GROUPS.map(function (g) {
      const on  = g.items.filter(function (i) { return permDraft[i.key]; }).length;
      const all = (on === g.items.length);
      return '<div class="perm-group">'
        + '<label class="perm-group-head">'
        +   '<input type="checkbox" ' + (all ? 'checked' : '') + ' onchange="permGroup(\'' + g.key + '\',this.checked)">'
        +   g.name + ' <span class="hint">(' + on + '/' + g.items.length + ')</span>'
        + '</label>'
        + '<div class="perm-items">'
        + g.items.map(function (i) {
            return '<label class="perm-item"><input type="checkbox" '
              + (permDraft[i.key] ? 'checked' : '')
              + ' onchange="permOne(\'' + i.key + '\',this.checked)">' + i.name + '</label>';
          }).join('')
        + '</div></div>';
    }).join('');
    document.getElementById('permCount').textContent =
      ALL_KEYS.filter(function (k) { return permDraft[k]; }).length;
  }

  function permOne(key, on) { permDraft[key] = on; renderPerm(); }

  function permGroup(gkey, on) {
    const g = PERM_GROUPS.filter(function (x) { return x.key === gkey; })[0];
    g.items.forEach(function (i) { permDraft[i.key] = on; });
    renderPerm();
  }

  function permAll(on) {
    ALL_KEYS.forEach(function (k) { permDraft[k] = on; });
    renderPerm();
  }

  function permSave() {
    const r = row(editNo);
    if (r) {
      r.perms = {};
      ALL_KEYS.forEach(function (k) { if (permDraft[k]) r.perms[k] = true; });
    }
    hide('permModal');
    renderGrid();
    umsToast('권한이 저장되었습니다.');
  }

  // ---- 사용자 보기 ----
  function usersOpen(no) {
    const r = row(no);
    if (!r) return;
    const list = usersOf(r.name);
    document.getElementById('uTitle').textContent = r.name + ' — 사용자 ' + list.length + '명';
    document.getElementById('usersBody').innerHTML = list.length
      ? list.map(function (u) {
          return '<tr><td>' + u.uname + '</td><td>' + u.name + '</td><td>' + u.org + '</td></tr>';
        }).join('')
      : '<tr><td colspan="3" class="mini-empty">이 역할을 가진 사용자가 없습니다.</td></tr>';
    show('usersModal');
  }

  // ---- 삭제 ----
  function askDelete(no) {
    const r = row(no);
    if (!r) return;
    editNo = no;
    const cnt = usersOf(r.name).length;
    document.getElementById('d-msg').innerHTML = cnt
      ? '<span class="confirm-hl">' + r.name + '</span> 역할은<br>사용자 ' + cnt + '명에게 부여되어 있습니다.<br>삭제할 수 없습니다.'
      : '<span class="confirm-hl">' + r.name + '</span> 역할을<br>삭제하시겠습니까?';
    document.getElementById('d-yes').style.display = cnt ? 'none' : '';
    document.querySelector('#delModal .btn-danger').textContent = cnt ? '닫기' : '아니오';
    show('delModal');
  }

  function roleDelete() { hide('delModal'); umsToast('삭제되었습니다.'); }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  renderGrid();

  document.getElementById('m-default').addEventListener('change', function () {
    document.getElementById('m-defaultText').textContent = this.checked ? '사용' : '사용 안 함';
  });
  document.getElementById('m-public').addEventListener('change', function () {
    document.getElementById('m-publicText').textContent = this.checked ? '공개' : '비공개';
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.drop-menu') && !e.target.closest('.act-menu-btn')) closeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('scroll', closeMenu, true);

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid       = renderGrid;
  window.sortBy           = sortBy;
  window.go               = go;
  window.openMenu         = openMenu;
  window.menuAct          = menuAct;
  window.roleOpen         = roleOpen;
  window.roleSave         = roleSave;
  window.roleDelete       = roleDelete;
  window.permOne          = permOne;
  window.permGroup        = permGroup;
  window.permAll          = permAll;
  window.permSave         = permSave;
  window.roleModalClose   = function () { hide('roleModal'); };
  window.permModalClose   = function () { hide('permModal'); };
  window.usersModalClose  = function () { hide('usersModal'); };
  window.delModalClose    = function () { hide('delModal'); };

})();
