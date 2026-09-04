// 조직 페이지 스크립트 (목업 데이터)
// 화면: 관리 > ID 관리 > 조직   (호스트 모드 전용)
(function () {

  // ---- 조직 트리 (parent = null 이면 최상위) ----
  const ORGS = [
    { id: 1,  parent: null, name: '경영지원본부', desc: '' },
    { id: 2,  parent: 1,    name: '총무부',       desc: '' },
    { id: 3,  parent: 1,    name: '인사팀',       desc: '' },
    { id: 4,  parent: 1,    name: '재무팀',       desc: '' },
    { id: 5,  parent: null, name: '기술본부',     desc: 'IDC 운영 총괄' },
    { id: 6,  parent: 5,    name: '인프라운영팀', desc: '전력/공조 설비 운영' },
    { id: 7,  parent: 5,    name: '시설관리팀',   desc: '' },
    { id: 8,  parent: 5,    name: '보안팀',       desc: '' },
    { id: 9,  parent: null, name: '영업본부',     desc: '' },
    { id: 10, parent: 9,    name: '영업1팀',      desc: '' },
  ];

  // ---- 전체 사용자 ----
  const USERS = [
    { id: 1,  name: '김진호', email: 'kim.jh@eteverse.com',   role: '시스템 관리자' },
    { id: 2,  name: '황보영', email: 'hwang.by@eteverse.com', role: '설비 운영자' },
    { id: 3,  name: '오영훈', email: 'oh.yh@eteverse.com',    role: '시스템 관리자' },
    { id: 4,  name: '이수민', email: 'lee.sm@eteverse.com',   role: '조회 전용' },
    { id: 5,  name: '박지훈', email: 'park.jh@eteverse.com',  role: '설비 운영자' },
    { id: 6,  name: '최민아', email: 'choi.ma@eteverse.com',  role: '티켓 담당자' },
    { id: 7,  name: '정우성', email: 'jung.ws@eteverse.com',  role: '조회 전용' },
    { id: 8,  name: '한서연', email: 'han.sy@eteverse.com',   role: '설비 운영자' },
    { id: 9,  name: '윤도현', email: 'yoon.dh@eteverse.com',  role: '티켓 담당자' },
    { id: 10, name: '강예린', email: 'kang.yr@eteverse.com',  role: '조회 전용' },
    { id: 11, name: '조성우', email: 'cho.sw@eteverse.com',   role: '설비 운영자' },
    { id: 12, name: '신하늘', email: 'shin.hn@eteverse.com',  role: '조회 전용' },
    { id: 13,  name: '서지우',  email: 'seo.jw@eteverse.com',     role: '조회 전용' },
    { id: 14,  name: '문태준',  email: 'moon.tj@eteverse.com',    role: '설비 운영자' },
    { id: 15,  name: '배수현',  email: 'bae.sh@eteverse.com',     role: '티켓 담당자' },
    { id: 16,  name: '노경민',  email: 'noh.km@eteverse.com',     role: '조회 전용' },
    { id: 17,  name: '임채원',  email: 'lim.cw@eteverse.com',     role: '설비 운영자' },
    { id: 18,  name: '송민재',  email: 'song.mj@eteverse.com',    role: '티켓 담당자' },
    { id: 19,  name: '홍유진',  email: 'hong.yj@eteverse.com',    role: '조회 전용' },
    { id: 20,  name: '안준서',  email: 'ahn.js@eteverse.com',     role: '설비 운영자' },
    { id: 21,  name: '유하린',  email: 'yoo.hr@eteverse.com',     role: '조회 전용' },
    { id: 22,  name: '곽도윤',  email: 'kwak.dy@eteverse.com',    role: '설비 운영자' },
    { id: 23,  name: '남기훈',  email: 'nam.kh@eteverse.com',     role: '시스템 관리자' },
    { id: 24,  name: '오세라',  email: 'oh.sr@eteverse.com',      role: '조회 전용' },
    { id: 25,  name: '백승호',  email: 'baek.sh@eteverse.com',    role: '티켓 담당자' },
    { id: 26,  name: '전미소',  email: 'jeon.ms@eteverse.com',    role: '조회 전용' },
    { id: 27,  name: '구자현',  email: 'koo.jh@eteverse.com',     role: '설비 운영자' },
    { id: 28,  name: '심다은',  email: 'shim.de@eteverse.com',    role: '조회 전용' },
    { id: 29,  name: '양준혁',  email: 'yang.jh@eteverse.com',    role: '설비 운영자' },
    { id: 30,  name: '표지훈',  email: 'pyo.jh@eteverse.com',     role: '티켓 담당자' },
    { id: 31,  name: '하윤아',  email: 'ha.ya@eteverse.com',      role: '조회 전용' },
    { id: 32,  name: '마성진',  email: 'ma.sj@eteverse.com',      role: '설비 운영자' },
    { id: 33,  name: '진소영',  email: 'jin.sy@eteverse.com',     role: '조회 전용' },
    { id: 34,  name: '편승훈',  email: 'pyeon.sh@eteverse.com',   role: '시스템 관리자' },
  ];

  // ---- 전체 역할 ----
  const ROLES = [
    { id: 1, name: '시스템 관리자', desc: '전체 메뉴 및 설정 접근' },
    { id: 2, name: '설비 운영자',   desc: '설비 등록·수정 및 알람 처리' },
    { id: 3, name: '티켓 담당자',   desc: '티켓 배정 및 처리' },
    { id: 4, name: '조회 전용',     desc: '데이터 조회만 가능' },
    { id: 5, name: '게스트',        desc: '임시 계정용 — 현황 화면만 열람' },
  ];

  // ---- 조직별 구성원 / 역할 매핑 ----
  const ORG_USERS = {
    1: [3], 2: [4, 7, 24], 3: [6, 21, 28], 4: [10, 19, 31], 5: [1, 23],
    6: [2, 5, 8, 11, 15, 20, 29, 30], 7: [9, 14, 17, 22, 25, 32],
    8: [12, 18, 27, 34], 9: [26], 10: [13, 16, 33],
  };
  const ORG_ROLES = { 1: [1], 2: [4], 3: [4], 4: [4], 5: [1, 2], 6: [2, 3], 7: [2], 8: [1], 9: [], 10: [] };

  let curId    = 5;       // 선택된 조직
  let openIds  = { 1: true, 5: true, 9: true };
  let menuId   = null;    // 트리 [▾] 메뉴 대상
  let editId   = null;    // 조직 수정 대상 (null 이면 신규)
  let newParent = null;   // 신규 등록 시 상위 조직
  let delTarget = null;   // { kind: 'org'|'member'|'role', id }
  let sortKey  = 'name';
  let sortAsc  = true;
  let mPage    = 1;

  function org(id)  { return ORGS.filter(function (o) { return o.id === id; })[0]; }
  function user(id) { return USERS.filter(function (u) { return u.id === id; })[0]; }
  function role(id) { return ROLES.filter(function (r) { return r.id === id; })[0]; }
  function children(pid) { return ORGS.filter(function (o) { return o.parent === pid; }); }

  // ---- 트리 렌더 ----
  function renderTree() {
    function node(o, depth) {
      const kids = children(o.id);
      const open = !!openIds[o.id];
      const cnt  = (ORG_USERS[o.id] || []).length;
      const html = '<div class="tree-row' + (o.id === curId ? ' active' : '') + '"'
        + ' style="padding-left:' + (12 + depth * 16) + 'px"'
        + ' onclick="selectOrg(' + o.id + ')">'
        + '<span class="tree-caret' + (kids.length ? '' : ' leaf') + '"'
        +   ' onclick="event.stopPropagation();toggleOrg(' + o.id + ')">'
        +   (open ? '&#9662;' : '&#9656;') + '</span>'
        + '<span class="tree-icon">&#128193;</span>'
        + '<span class="tree-name">' + o.name + '</span>'
        + '<span class="tree-badge">' + cnt + '</span>'
        + '<span class="tree-menu" onclick="openNodeMenu(event,' + o.id + ')">&#9662;</span>'
        + '</div>';
      return html + (open && kids.length
        ? kids.map(function (k) { return node(k, depth + 1); }).join('')
        : '');
    }
    document.getElementById('orgTree').innerHTML =
      children(null).map(function (o) { return node(o, 0); }).join('');
  }

  function selectOrg(id) {
    curId = id;
    mPage = 1;
    closeNodeMenu();
    renderTree();
    renderDetail();
  }

  function toggleOrg(id) {
    openIds[id] = !openIds[id];
    renderTree();
  }

  // ---- 우측 상세 ----
  function renderDetail() {
    const o = org(curId);
    const name = o ? o.name : '-';
    document.getElementById('memberTitle').textContent = name;
    document.getElementById('roleTitle').textContent   = name;
    renderMembers();
    renderRoles();
  }

  function switchTab(name) {
    ['member', 'role'].forEach(function (n) {
      document.getElementById('tab-' + n).classList.toggle('show', n === name);
      document.getElementById('tabBtn-' + n).classList.toggle('active', n === name);
    });
  }

  // ---- 구성원 ----
  function memberRows() {
    const kw = (document.getElementById('mq').value || '').trim();
    const rows = (ORG_USERS[curId] || []).map(user).filter(function (u) {
      return u && (!kw || u.name.indexOf(kw) >= 0 || u.email.indexOf(kw) >= 0);
    });
    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });
    return rows;
  }

  function renderMembers() {
    const rows  = memberRows();
    const size  = Number(document.getElementById('mSize').value);
    const total = rows.length;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (mPage > maxPage) mPage = maxPage;
    const from = (mPage - 1) * size;
    const page = rows.slice(from, from + size);

    document.getElementById('memberBody').innerHTML = page.length
      ? page.map(function (u) {
          return '<tr>'
            + '<td><button class="icon-btn del" title="구성원 제외"'
            +   ' onclick="askDelete(\'member\',' + u.id + ')">&#128465;</button></td>'
            + '<td>' + u.name + '</td>'
            + '<td>' + u.email + '</td>'
            + '<td>' + u.role + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="4" style="padding:30px;color:#98a2b3;">등록된 구성원이 없습니다.</td></tr>';

    document.getElementById('mInfo').textContent = total
      ? (from + 1) + ' - ' + (from + page.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('mPageNo').textContent = mPage;

    document.querySelectorAll('#memberTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  function sortMember(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    renderMembers();
  }

  function mGo(dir) {
    const size  = Number(document.getElementById('mSize').value);
    const maxPage = Math.max(1, Math.ceil(memberRows().length / size));
    if (dir === 'first') mPage = 1;
    if (dir === 'prev')  mPage = Math.max(1, mPage - 1);
    if (dir === 'next')  mPage = Math.min(maxPage, mPage + 1);
    if (dir === 'last')  mPage = maxPage;
    renderMembers();
  }

  // ---- 역할 ----
  function renderRoles() {
    const rows = (ORG_ROLES[curId] || []).map(role).filter(Boolean);
    document.getElementById('roleBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr>'
            + '<td><button class="icon-btn del" title="역할 제외"'
            +   ' onclick="askDelete(\'role\',' + r.id + ')">&#128465;</button></td>'
            + '<td>' + r.name + '</td>'
            + '<td>' + r.desc + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="3" style="padding:30px;color:#98a2b3;">등록된 역할이 없습니다.</td></tr>';
    document.getElementById('rInfo').textContent = rows.length
      ? '1 - ' + rows.length + ' / 전체 ' + rows.length + ' 건'
      : '0 - 0 / 전체 0 건';
  }

  // ---- 트리 노드 [▾] 메뉴 ----
  function openNodeMenu(e, id) {
    e.stopPropagation();
    const menu = document.getElementById('orgMenu');
    if (menuId === id && menu.classList.contains('show')) { closeNodeMenu(); return; }
    menuId = id;
    const r = e.currentTarget.getBoundingClientRect();
    menu.classList.add('show');
    const below = window.innerHeight - r.bottom;
    menu.style.left = Math.min(r.left, window.innerWidth - 170) + 'px';
    menu.style.top  = (below < menu.offsetHeight + 12)
      ? (r.top - menu.offsetHeight - 4) + 'px'
      : (r.bottom + 4) + 'px';
  }

  function closeNodeMenu() {
    document.getElementById('orgMenu').classList.remove('show');
    menuId = null;
  }

  function nodeAct(act) {
    const id = menuId;
    closeNodeMenu();
    const o = org(id);
    if (!o) return;
    if (act === 'add')    { openIds[id] = true; orgOpen(null, id); }
    if (act === 'edit')   orgOpen(id, o.parent);
    if (act === 'delete') askDelete('org', id);
  }

  // ---- 조직 등록/수정 ----
  function orgOpen(id, parentId) {
    editId    = id;
    newParent = parentId;
    const o = id ? org(id) : null;
    const p = parentId ? org(parentId) : null;
    document.getElementById('oTitle').textContent = o ? '조직 단위 수정' : '조직 단위 추가';
    document.getElementById('o-parent').textContent = p ? p.name : '(최상위)';
    document.getElementById('o-name').value = o ? o.name : '';
    document.getElementById('o-desc').value = o ? o.desc : '';
    show('orgModal');
  }

  function orgSave() {
    const name = (document.getElementById('o-name').value || '').trim();
    if (!name) { umsToast('단위 이름을 입력하세요.'); return; }
    hide('orgModal');
    umsToast('저장되었습니다.');
  }

  // ---- 구성원 추가 ----
  let pickSel = {};

  function memberAddOpen() {
    pickSel = {};
    document.getElementById('pickq').value = '';
    renderPickList();
    show('memberModal');
  }

  function renderPickList() {
    const kw  = (document.getElementById('pickq').value || '').trim();
    const has = ORG_USERS[curId] || [];
    const rows = USERS.filter(function (u) {
      return !kw || u.name.indexOf(kw) >= 0 || u.email.indexOf(kw) >= 0;
    });
    document.getElementById('pickList').innerHTML = rows.length
      ? rows.map(function (u) {
          const already = has.indexOf(u.id) >= 0;
          return '<div class="pick-row' + (already ? ' added' : '') + '"'
            + (already ? '' : ' onclick="togglePick(' + u.id + ')"') + '>'
            + '<input type="checkbox" ' + (already ? 'checked disabled' : (pickSel[u.id] ? 'checked' : ''))
            +   ' onclick="event.stopPropagation();togglePick(' + u.id + ')">'
            + '<span>' + u.name + '</span>'
            + '<span class="pick-email">' + u.email + (already ? ' (이미 소속)' : '') + '</span>'
            + '</div>';
        }).join('')
      : '<div class="pick-empty">검색 결과가 없습니다.</div>';
  }

  function togglePick(id) {
    if ((ORG_USERS[curId] || []).indexOf(id) >= 0) return;
    pickSel[id] = !pickSel[id];
    renderPickList();
  }

  function memberAddSave() {
    const cnt = Object.keys(pickSel).filter(function (k) { return pickSel[k]; }).length;
    hide('memberModal');
    umsToast(cnt ? cnt + '명을 추가했습니다. (목업)' : '선택된 구성원이 없습니다.');
  }

  // ---- 역할 추가 ----
  let rolePick = {};

  function roleAddOpen() {
    rolePick = {};
    renderRolePick();
    show('roleModal');
  }

  function renderRolePick() {
    const has = ORG_ROLES[curId] || [];
    document.getElementById('rolePickList').innerHTML = ROLES.map(function (r) {
      const already = has.indexOf(r.id) >= 0;
      return '<div class="pick-row' + (already ? ' added' : '') + '"'
        + (already ? '' : ' onclick="toggleRolePick(' + r.id + ')"') + '>'
        + '<input type="checkbox" ' + (already ? 'checked disabled' : (rolePick[r.id] ? 'checked' : ''))
        +   ' onclick="event.stopPropagation();toggleRolePick(' + r.id + ')">'
        + '<span>' + r.name + '</span>'
        + '<span class="pick-email">' + r.desc + (already ? ' (이미 부여)' : '') + '</span>'
        + '</div>';
    }).join('');
  }

  function toggleRolePick(id) {
    if ((ORG_ROLES[curId] || []).indexOf(id) >= 0) return;
    rolePick[id] = !rolePick[id];
    renderRolePick();
  }

  function roleAddSave() {
    const cnt = Object.keys(rolePick).filter(function (k) { return rolePick[k]; }).length;
    hide('roleModal');
    umsToast(cnt ? cnt + '개 역할을 추가했습니다. (목업)' : '선택된 역할이 없습니다.');
  }

  // ---- 삭제 ----
  function askDelete(kind, id) {
    delTarget = { kind: kind, id: id };
    let msg = '';
    if (kind === 'org') {
      const o = org(id);
      const kids = children(id).length;
      msg = kids
        ? '<span class="confirm-hl">' + o.name + '</span> 아래에<br>하위 단위 ' + kids + '개가 있습니다.<br>함께 삭제하시겠습니까?'
        : '<span class="confirm-hl">' + o.name + '</span> 단위를<br>삭제하시겠습니까?';
    }
    if (kind === 'member') {
      msg = '<span class="confirm-hl">' + user(id).name + '</span> 님을<br>이 조직에서 제외하시겠습니까?';
    }
    if (kind === 'role') {
      msg = '<span class="confirm-hl">' + role(id).name + '</span> 역할을<br>이 조직에서 제외하시겠습니까?';
    }
    document.getElementById('d-msg').innerHTML = msg;
    show('delModal');
  }

  function delConfirm() {
    hide('delModal');
    umsToast(delTarget && delTarget.kind === 'org' ? '삭제되었습니다.' : '제외되었습니다.');
    delTarget = null;
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  renderTree();
  renderDetail();

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#orgMenu') && !e.target.closest('.tree-menu')) closeNodeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNodeMenu(); });
  document.addEventListener('scroll', closeNodeMenu, true);

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.selectOrg         = selectOrg;
  window.toggleOrg         = toggleOrg;
  window.switchTab         = switchTab;
  window.renderMembers     = renderMembers;
  window.sortMember        = sortMember;
  window.mGo               = mGo;
  window.openNodeMenu      = openNodeMenu;
  window.nodeAct           = nodeAct;
  window.orgOpen           = orgOpen;
  window.orgSave           = orgSave;
  window.memberAddOpen     = memberAddOpen;
  window.renderPickList    = renderPickList;
  window.togglePick        = togglePick;
  window.memberAddSave     = memberAddSave;
  window.roleAddOpen       = roleAddOpen;
  window.toggleRolePick    = toggleRolePick;
  window.roleAddSave       = roleAddSave;
  window.askDelete         = askDelete;
  window.delConfirm        = delConfirm;
  window.orgModalClose     = function () { hide('orgModal'); };
  window.memberModalClose  = function () { hide('memberModal'); };
  window.roleModalClose    = function () { hide('roleModal'); };
  window.delModalClose     = function () { hide('delModal'); };

})();
