// 알람 액션 그룹 관리 — 목록 + 우측 상세 + 등록/수정 모달 + 멤버 추가 팝업
// 화면: 알람 > 알람 액션 그룹 관리
// DB: umsRuleActionGroup / umsRuleActionGroupMember
(function () {

  const MEM_TYPE = { User: ['t-user', '사용자'], Contact: ['t-contact', '연락처'] };

  // ---- 목업: 액션 그룹 ----
  let GROUPS = [
    { no: 1, name: '야간당직팀', desc: '22:00~08:00 당직 대응조', members: [
      { type: 'User', name: '김당직', email: 'kim.dc@corp.com', phone: '010-1111-2222' },
      { type: 'User', name: '이야근', email: 'lee.yg@corp.com', phone: '010-3333-4444' },
      { type: 'Contact', name: '외주 협력사(전기)', email: 'night@partner.co.kr', phone: '02-555-7777' },
    ]},
    { no: 2, name: '전기설비 1차대응', desc: 'UPS/PDU 알람 1차 확인', members: [
      { type: 'User', name: '박전기', email: 'park.elec@corp.com', phone: '010-5555-6666' },
      { type: 'User', name: '관리자', email: 'admin@corp.com', phone: '010-0000-0001' },
    ]},
    { no: 3, name: '공조 담당', desc: '칠러/항온항습 관련', members: [
      { type: 'User', name: '최공조', email: 'choi.hvac@corp.com', phone: '010-7777-8888' },
    ]},
    { no: 4, name: '관리자 전체', desc: 'Critical 알람 전체 통지', members: [
      { type: 'User', name: '관리자', email: 'admin@corp.com', phone: '010-0000-0001' },
      { type: 'User', name: '운영팀장', email: 'ops.lead@corp.com', phone: '010-0000-0002' },
      { type: 'Contact', name: '대표 비상연락', email: 'emergency@corp.com', phone: '010-0000-9999' },
    ]},
  ];
  let seq = 4;

  // ---- 목업: ABP 사용자 (팝업 검색용) ----
  const DEPTS = ['운영팀', '전기설비팀', '기계설비팀', 'IT인프라팀', '시설관리팀'];
  const ROLES = ['관리자', '엔지니어', '당직', '뷰어'];
  const USERS = [
    { id: 'u01', name: '관리자',   email: 'admin@corp.com',     dept: '운영팀',     role: '관리자', phone: '010-0000-0001' },
    { id: 'u02', name: '운영팀장', email: 'ops.lead@corp.com',  dept: '운영팀',     role: '관리자', phone: '010-0000-0002' },
    { id: 'u03', name: '박전기',   email: 'park.elec@corp.com', dept: '전기설비팀', role: '엔지니어', phone: '010-5555-6666' },
    { id: 'u04', name: '김당직',   email: 'kim.dc@corp.com',    dept: '전기설비팀', role: '당직',   phone: '010-1111-2222' },
    { id: 'u05', name: '이야근',   email: 'lee.yg@corp.com',    dept: '전기설비팀', role: '당직',   phone: '010-3333-4444' },
    { id: 'u06', name: '최공조',   email: 'choi.hvac@corp.com', dept: '기계설비팀', role: '엔지니어', phone: '010-7777-8888' },
    { id: 'u07', name: '정기계',   email: 'jung.mech@corp.com', dept: '기계설비팀', role: '엔지니어', phone: '010-2222-3333' },
    { id: 'u08', name: '한인프라', email: 'han.infra@corp.com', dept: 'IT인프라팀', role: '엔지니어', phone: '010-4444-5555' },
    { id: 'u09', name: '오시설',   email: 'oh.fac@corp.com',    dept: '시설관리팀', role: '뷰어',   phone: '010-6666-7777' },
    { id: 'u10', name: '서당직',   email: 'seo.dc@corp.com',    dept: '시설관리팀', role: '당직',   phone: '010-8888-9999' },
  ];

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function typeBadge(t) { const p = MEM_TYPE[t] || ['t-contact', t]; return '<span class="ag-mem-type ' + p[0] + '">' + p[1] + '</span>'; }
  function show(id) { el(id).classList.add('show'); }
  function hide(id) { el(id).classList.remove('show'); }

  // ---- 목록 ----
  function agRender() {
    const kw = (el('q').value || '').trim();
    const list = GROUPS.filter(function (g) { return !kw || g.name.indexOf(kw) >= 0; });
    el('agBody').innerHTML = list.length ? list.map(function (g) {
      return '<tr data-no="' + g.no + '" onclick="agRowClick(' + g.no + ')">'
        + '<td>' + g.no + '</td>'
        + '<td>' + esc(g.name) + '</td>'
        + '<td>' + esc(g.desc || '') + '</td>'
        + '<td>' + g.members.length + '</td>'
        + '<td><span class="col-act">'
        +   '<button class="icon-btn" title="수정" onclick="event.stopPropagation();agOpen(' + g.no + ')">&#9998;</button>'
        +   '<button class="icon-btn del" title="삭제" onclick="event.stopPropagation();agAskDelete(' + g.no + ')">&#128465;</button>'
        + '</span></td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="5" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';
    el('agCount').textContent = list.length;
  }
  function agReset() { el('q').value = ''; agRender(); }

  // ---- 우측 상세 ----
  let detailNo = null;
  function agRowClick(no) {
    document.querySelectorAll('#agBody tr').forEach(function (tr) { tr.classList.toggle('selected', Number(tr.dataset.no) === no); });
    agDetailOpen(no);
  }
  function agDetailOpen(no) {
    const g = GROUPS.filter(function (x) { return x.no === no; })[0];
    if (!g) return;
    detailNo = no;
    el('agdTitle').textContent = g.name;
    const rows = g.members.length ? g.members.map(function (m) {
      return '<tr><td>' + typeBadge(m.type) + '</td><td>' + esc(m.name) + '</td><td>' + esc(m.email || '-') + '</td><td>' + esc(m.phone || '-') + '</td></tr>';
    }).join('') : '<tr><td colspan="4" style="color:#98a2b3;">멤버 없음</td></tr>';
    el('agdBody').innerHTML =
      '<div class="dv"><div class="dv-group">'
      + '<div class="dv-row"><span class="dv-label">그룹명</span><div class="dv-box">' + esc(g.name) + '</div></div>'
      + '<div class="dv-row multi"><span class="dv-label">설명</span><div class="dv-box multi">' + (esc(g.desc) || '<span style="color:#8a97a5;">-</span>') + '</div></div>'
      + '</div>'
      + '<div class="dv-group"><div class="dv-row multi"><span class="dv-label">멤버 (' + g.members.length + ')</span>'
      + '<div class="dv-box multi" style="padding:0;border:none;background:none;">'
      + '<table class="ag-mem-list"><thead><tr><th style="width:64px;">구분</th><th>이름</th><th>이메일</th><th>연락처</th></tr></thead>'
      + '<tbody>' + rows + '</tbody></table></div></div></div>'
      + '</div>';
    el('agMask').classList.add('show');
    el('agDrawer').classList.add('show');
  }
  function agDetailClose() {
    el('agMask').classList.remove('show');
    el('agDrawer').classList.remove('show');
  }
  function agEditFromDetail() { const no = detailNo; agDetailClose(); agOpen(no); }

  // ---- 등록/수정 모달 ----
  let editNo = null;
  let memRows = [];   // {type:'User'|'Contact', name, email, phone}

  function agOpen(no) {
    const g = (no == null) ? null : GROUPS.filter(function (x) { return x.no === no; })[0];
    editNo = g ? g.no : null;
    el('agmTitle').textContent = g ? '그룹 수정' : '그룹 등록';
    el('m-name').value = g ? g.name : '';
    el('m-desc').value = g ? (g.desc || '') : '';
    memRows = g ? g.members.map(function (m) { return { type: m.type, name: m.name, email: m.email || '', phone: m.phone || '' }; }) : [];
    agMemRender();
    show('agModal');
  }

  function agMemRender() {
    el('agMemCount').textContent = memRows.length;
    el('agMemBody').innerHTML = memRows.length ? memRows.map(function (m, i) {
      return '<tr>'
        + '<td>' + typeBadge(m.type) + '</td>'
        + '<td>' + esc(m.name) + '</td>'
        + '<td>' + esc(m.email || '-') + '</td>'
        + '<td>' + esc(m.phone || '-') + '</td>'
        + '<td><button class="mem-del" type="button" title="빼기" onclick="agMemDel(' + i + ')">&#10005;</button></td>'
        + '</tr>';
    }).join('') : '<tr class="ag-mem-empty"><td colspan="5">[+ 멤버 추가] 로 멤버를 담아주세요.</td></tr>';
  }
  function agMemDel(i) { memRows.splice(i, 1); agMemRender(); }
  function agMemClearAll() { if (!memRows.length) return; memRows = []; agMemRender(); umsToast('멤버를 모두 비웠습니다.'); }

  function memKey(m) { return m.type + '|' + (m.name || '') + '|' + (m.email || ''); }

  // ---- 멤버 추가 팝업 ----
  let basket = [];   // {type, name, email, phone}

  function agPickOpen() {
    basket = [];
    agPickTab('user');
    el('pk-q').value = '';
    el('pk-dept').value = '';
    el('pk-role').value = '';
    el('ct-name').value = ''; el('ct-email').value = ''; el('ct-phone').value = '';
    agPickRenderUsers();
    agBasketRender();
    show('agPickModal');
  }
  function agPickClose() { hide('agPickModal'); }
  function agPickTab(t) {
    el('agTabUser').classList.toggle('active', t === 'user');
    el('agTabContact').classList.toggle('active', t === 'contact');
    el('agPaneUser').hidden = (t !== 'user');
    el('agPaneContact').hidden = (t !== 'contact');
  }

  function agPickRenderUsers() {
    const q = (el('pk-q').value || '').trim();
    const d = el('pk-dept').value, r = el('pk-role').value;
    const inBasket = {};
    basket.forEach(function (b) { if (b._uid) inBasket[b._uid] = true; });
    const rows = USERS.filter(function (u) {
      return (!q || u.name.indexOf(q) >= 0 || u.email.indexOf(q) >= 0)
        && (!d || u.dept === d) && (!r || u.role === r);
    });
    el('agPickUsers').innerHTML = rows.length ? rows.map(function (u) {
      const picked = !!inBasket[u.id];
      return '<tr class="' + (picked ? 'picked' : '') + '">'
        + '<td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>' + esc(u.dept) + '</td><td>' + esc(u.role) + '</td>'
        + '<td>' + (picked ? '<span style="font-size:11px;color:#98a2b3;">담김</span>'
            : '<button class="btn pick-add" type="button" onclick="agPickAddUser(\'' + u.id + '\')">담기</button>') + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="5" style="padding:20px;color:#98a2b3;">검색 결과가 없습니다.</td></tr>';
  }
  function agPickAddUser(uid) {
    const u = USERS.filter(function (x) { return x.id === uid; })[0];
    if (!u) return;
    if (basket.some(function (b) { return b._uid === uid; })) return;
    basket.push({ type: 'User', name: u.name, email: u.email, phone: u.phone, _uid: uid });
    agPickRenderUsers();
    agBasketRender();
  }
  function agPickAddContact() {
    const name = (el('ct-name').value || '').trim();
    if (!name) { umsToast('이름을 입력하세요.'); return; }
    basket.push({ type: 'Contact', name: name, email: (el('ct-email').value || '').trim(), phone: (el('ct-phone').value || '').trim() });
    el('ct-name').value = ''; el('ct-email').value = ''; el('ct-phone').value = '';
    agBasketRender();
  }
  function agBasketRender() {
    el('agBasketCount').textContent = basket.length;
    el('agBasket').innerHTML = basket.length ? basket.map(function (b, i) {
      return '<tr><td>' + typeBadge(b.type) + '</td><td>' + esc(b.name) + '</td><td>' + esc(b.email || '-') + '</td><td>' + esc(b.phone || '-') + '</td>'
        + '<td><button class="mem-del" type="button" title="빼기" onclick="agBasketDel(' + i + ')">&#10005;</button></td></tr>';
    }).join('') : '<tr class="ag-basket-empty"><td colspan="5">담긴 멤버가 없습니다.</td></tr>';
  }
  function agBasketDel(i) { basket.splice(i, 1); agPickRenderUsers(); agBasketRender(); }
  function agPickConfirm() {
    const have = {};
    memRows.forEach(function (m) { have[memKey(m)] = true; });
    let added = 0;
    basket.forEach(function (b) {
      const m = { type: b.type, name: b.name, email: b.email, phone: b.phone };
      if (!have[memKey(m)]) { memRows.push(m); have[memKey(m)] = true; added++; }
    });
    hide('agPickModal');
    agMemRender();
    umsToast(added + '명 추가되었습니다.');
  }

  function agSave() {
    const name = (el('m-name').value || '').trim();
    if (!name) { umsToast('그룹명을 입력하세요.'); return; }
    const members = memRows.map(function (m) { return { type: m.type, name: m.name, email: m.email, phone: m.phone }; });
    if (editNo != null) {
      const g = GROUPS.filter(function (x) { return x.no === editNo; })[0];
      if (g) { g.name = name; g.desc = el('m-desc').value.trim(); g.members = members; }
    } else {
      GROUPS.push({ no: ++seq, name: name, desc: el('m-desc').value.trim(), members: members });
    }
    hide('agModal');
    agRender();
    if (detailNo === editNo && editNo != null) agDetailOpen(editNo);
    umsToast('저장되었습니다.');
  }

  // ---- 삭제 ----
  let delNo = null;
  function agAskDelete(no) {
    const g = GROUPS.filter(function (x) { return x.no === no; })[0];
    if (!g) return;
    delNo = no;
    el('agDelName').textContent = g.name;
    show('agDelModal');
  }
  function agDelClose() { hide('agDelModal'); }
  function agDelConfirm() {
    GROUPS = GROUPS.filter(function (x) { return x.no !== delNo; });
    if (detailNo === delNo) agDetailClose();
    delNo = null;
    hide('agDelModal');
    agRender();
    umsToast('삭제되었습니다.');
  }

  // ---- init ----
  el('pk-dept').innerHTML = '<option value="">부서 전체</option>' + DEPTS.map(function (d) { return '<option>' + d + '</option>'; }).join('');
  el('pk-role').innerHTML = '<option value="">역할 전체</option>' + ROLES.map(function (r) { return '<option>' + r + '</option>'; }).join('');
  agRender();

  window.agRender = agRender;
  window.agReset = agReset;
  window.agRowClick = agRowClick;
  window.agDetailClose = agDetailClose;
  window.agEditFromDetail = agEditFromDetail;
  window.agOpen = agOpen;
  window.agModalClose = function () { hide('agModal'); };
  window.agMemDel = agMemDel;
  window.agMemClearAll = agMemClearAll;
  window.agPickOpen = agPickOpen;
  window.agPickClose = agPickClose;
  window.agPickTab = agPickTab;
  window.agPickRenderUsers = agPickRenderUsers;
  window.agPickAddUser = agPickAddUser;
  window.agPickAddContact = agPickAddContact;
  window.agBasketDel = agBasketDel;
  window.agPickConfirm = agPickConfirm;
  window.agSave = agSave;
  window.agAskDelete = agAskDelete;
  window.agDelClose = agDelClose;
  window.agDelConfirm = agDelConfirm;

})();
