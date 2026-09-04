// 사용자 페이지 스크립트 (목업 데이터)
// 화면: 관리 > ID 관리 > 사용자   (호스트/고객 공통)
// ※ 사용자 목록은 [관리 > ID 관리 > 조직] 화면의 구성원(pages/admin/id-org.js USERS)과 동일한 집합.
(function () {

  const ROLES = ['시스템 관리자', '설비 운영자', '티켓 담당자', '조회 전용'];
  const ORGS  = ['경영지원본부', '총무부', '인사팀', '재무팀', '기술본부',
                 '인프라운영팀', '시설관리팀', '보안팀', '영업본부', '영업1팀'];

  // uname / email / role / org 는 조직 화면의 구성원 매핑과 일치
  const DATA = [
    // sys: 1 = 호스트 시스템 계정 (고객 모드에서는 보이지 않는다)
    { no: 1,  uname: 'admin',    email: 'admin@eteverse.com',    role: '시스템 관리자', org: '-', sys: 1,
      phone: '02-1234-5678',  first: 'admin', last: '',     active: 1, locked: 0, mailok: 1, tfa: 1, fail: 0,
      created: '2026-08-03 17:33:54', last_login: '2026-09-04 09:30:46' },
    { no: 2,  uname: 'oh.yh',    email: 'oh.yh@eteverse.com',    role: '시스템 관리자', org: '경영지원본부',
      phone: '010-2211-3344', first: '영훈', last: '오',    active: 1, locked: 0, mailok: 1, tfa: 1, fail: 0,
      created: '2026-08-03 17:37:27', last_login: '2026-09-04 08:52:10' },
    { no: 3,  uname: 'kim.jh',   email: 'kim.jh@eteverse.com',   role: '시스템 관리자', org: '기술본부',
      phone: '010-3344-5566', first: '진호', last: '김',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-03 17:37:27', last_login: '2026-09-02 17:45:12' },
    { no: 4,  uname: 'hwang.by', email: 'hwang.by@eteverse.com', role: '설비 운영자',   org: '인프라운영팀',
      phone: '010-4455-6677', first: '보영', last: '황',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-05 09:12:03', last_login: '2026-09-03 14:22:31' },
    { no: 5,  uname: 'park.jh',  email: 'park.jh@eteverse.com',  role: '설비 운영자',   org: '인프라운영팀',
      phone: '010-5566-7788', first: '지훈', last: '박',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 1,
      created: '2026-08-05 09:12:03', last_login: '2026-09-03 11:04:55' },
    { no: 6,  uname: 'han.sy',   email: 'han.sy@eteverse.com',   role: '설비 운영자',   org: '인프라운영팀',
      phone: '010-6677-8899', first: '서연', last: '한',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-11 13:40:18', last_login: '2026-09-01 16:33:02' },
    { no: 7,  uname: 'cho.sw',   email: 'cho.sw@eteverse.com',   role: '설비 운영자',   org: '인프라운영팀',
      phone: '010-7788-9900', first: '성우', last: '조',    active: 1, locked: 0, mailok: 0, tfa: 0, fail: 0,
      created: '2026-08-24 10:05:41', last_login: '' },
    { no: 8,  uname: 'yoon.dh',  email: 'yoon.dh@eteverse.com',  role: '티켓 담당자',   org: '시설관리팀',
      phone: '010-8899-0011', first: '도현', last: '윤',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-11 13:40:18', last_login: '2026-09-03 09:18:47' },
    { no: 9,  uname: 'choi.ma',  email: 'choi.ma@eteverse.com',  role: '티켓 담당자',   org: '인사팀',
      phone: '010-9900-1122', first: '민아', last: '최',    active: 1, locked: 0, mailok: 1, tfa: 1, fail: 0,
      created: '2026-08-11 13:40:18', last_login: '2026-09-02 10:41:29' },
    { no: 10, uname: 'lee.sm',   email: 'lee.sm@eteverse.com',   role: '조회 전용',     org: '총무부',
      phone: '010-1010-2020', first: '수민', last: '이',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-14 15:21:09', last_login: '2026-08-31 13:12:00' },
    { no: 11, uname: 'jung.ws',  email: 'jung.ws@eteverse.com',  role: '조회 전용',     org: '총무부',
      phone: '010-2020-3030', first: '우성', last: '정',    active: 0, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-14 15:21:09', last_login: '2026-08-20 09:02:44' },
    { no: 12, uname: 'kang.yr',  email: 'kang.yr@eteverse.com',  role: '조회 전용',     org: '재무팀',
      phone: '010-3030-4040', first: '예린', last: '강',    active: 1, locked: 1, mailok: 1, tfa: 0, fail: 5,
      created: '2026-08-14 15:21:09', last_login: '2026-08-29 17:55:13' },
    { no: 13, uname: 'shin.hn',  email: 'shin.hn@eteverse.com',  role: '조회 전용',     org: '보안팀',
      phone: '010-4040-5050', first: '하늘', last: '신',    active: 1, locked: 0, mailok: 0, tfa: 0, fail: 2,
      created: '2026-08-26 09:39:20', last_login: '' },
    { no: 14,  uname: 'seo.jw',   email: 'seo.jw@eteverse.com',     role: '조회 전용',     org: '영업1팀',
      phone: '010-5151-6161', first: '지우', last: '서',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-17 10:22:41', last_login: '2026-09-01 09:14:22' },
    { no: 15,  uname: 'moon.tj',  email: 'moon.tj@eteverse.com',    role: '설비 운영자',   org: '시설관리팀',
      phone: '010-5252-6262', first: '태준', last: '문',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-17 10:22:41', last_login: '2026-09-03 08:41:07' },
    { no: 16,  uname: 'bae.sh',   email: 'bae.sh@eteverse.com',     role: '티켓 담당자',   org: '인프라운영팀',
      phone: '010-5353-6363', first: '수현', last: '배',    active: 1, locked: 0, mailok: 1, tfa: 1, fail: 0,
      created: '2026-08-17 10:22:41', last_login: '2026-09-03 17:26:50' },
    { no: 17,  uname: 'noh.km',   email: 'noh.km@eteverse.com',     role: '조회 전용',     org: '영업1팀',
      phone: '010-5454-6464', first: '경민', last: '노',    active: 1, locked: 0, mailok: 0, tfa: 0, fail: 0,
      created: '2026-08-18 14:05:12', last_login: '' },
    { no: 18,  uname: 'lim.cw',   email: 'lim.cw@eteverse.com',     role: '설비 운영자',   org: '시설관리팀',
      phone: '010-5555-6565', first: '채원', last: '임',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 1,
      created: '2026-08-18 14:05:12', last_login: '2026-09-02 13:37:19' },
    { no: 19,  uname: 'song.mj',  email: 'song.mj@eteverse.com',    role: '티켓 담당자',   org: '보안팀',
      phone: '010-5656-6666', first: '민재', last: '송',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-18 14:05:12', last_login: '2026-09-04 08:11:03' },
    { no: 20,  uname: 'hong.yj',  email: 'hong.yj@eteverse.com',    role: '조회 전용',     org: '재무팀',
      phone: '010-5757-6767', first: '유진', last: '홍',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-19 09:48:33', last_login: '2026-08-28 15:52:41' },
    { no: 21,  uname: 'ahn.js',   email: 'ahn.js@eteverse.com',     role: '설비 운영자',   org: '인프라운영팀',
      phone: '010-5858-6868', first: '준서', last: '안',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-19 09:48:33', last_login: '2026-09-03 19:04:58' },
    { no: 22,  uname: 'yoo.hr',   email: 'yoo.hr@eteverse.com',     role: '조회 전용',     org: '인사팀',
      phone: '010-5959-6969', first: '하린', last: '유',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-19 09:48:33', last_login: '2026-09-01 11:20:36' },
    { no: 23,  uname: 'kwak.dy',  email: 'kwak.dy@eteverse.com',    role: '설비 운영자',   org: '시설관리팀',
      phone: '010-6060-7070', first: '도윤', last: '곽',    active: 0, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-20 16:31:07', last_login: '2026-08-25 10:05:14' },
    { no: 24,  uname: 'nam.kh',   email: 'nam.kh@eteverse.com',     role: '시스템 관리자', org: '기술본부',
      phone: '010-6161-7171', first: '기훈', last: '남',    active: 1, locked: 0, mailok: 1, tfa: 1, fail: 0,
      created: '2026-08-20 16:31:07', last_login: '2026-09-04 07:58:12' },
    { no: 25,  uname: 'oh.sr',    email: 'oh.sr@eteverse.com',      role: '조회 전용',     org: '총무부',
      phone: '010-6262-7272', first: '세라', last: '오',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-20 16:31:07', last_login: '2026-09-02 09:33:45' },
    { no: 26,  uname: 'baek.sh',  email: 'baek.sh@eteverse.com',    role: '티켓 담당자',   org: '시설관리팀',
      phone: '010-6363-7373', first: '승호', last: '백',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 3,
      created: '2026-08-21 11:14:52', last_login: '2026-09-03 16:47:29' },
    { no: 27,  uname: 'jeon.ms',  email: 'jeon.ms@eteverse.com',    role: '조회 전용',     org: '영업본부',
      phone: '010-6464-7474', first: '미소', last: '전',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-21 11:14:52', last_login: '2026-08-30 14:02:57' },
    { no: 28,  uname: 'koo.jh',   email: 'koo.jh@eteverse.com',     role: '설비 운영자',   org: '보안팀',
      phone: '010-6565-7575', first: '자현', last: '구',    active: 1, locked: 1, mailok: 1, tfa: 0, fail: 5,
      created: '2026-08-21 11:14:52', last_login: '2026-08-27 18:22:40' },
    { no: 29,  uname: 'shim.de',  email: 'shim.de@eteverse.com',    role: '조회 전용',     org: '인사팀',
      phone: '010-6666-7676', first: '다은', last: '심',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-24 13:27:18', last_login: '2026-09-01 15:41:03' },
    { no: 30,  uname: 'yang.jh',  email: 'yang.jh@eteverse.com',    role: '설비 운영자',   org: '인프라운영팀',
      phone: '010-6767-7777', first: '준혁', last: '양',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-24 13:27:18', last_login: '2026-09-04 06:12:55' },
    { no: 31,  uname: 'pyo.jh',   email: 'pyo.jh@eteverse.com',     role: '티켓 담당자',   org: '인프라운영팀',
      phone: '010-6868-7878', first: '지훈', last: '표',    active: 1, locked: 0, mailok: 0, tfa: 0, fail: 0,
      created: '2026-08-25 09:03:44', last_login: '' },
    { no: 32,  uname: 'ha.ya',    email: 'ha.ya@eteverse.com',      role: '조회 전용',     org: '재무팀',
      phone: '010-6969-7979', first: '윤아', last: '하',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-25 09:03:44', last_login: '2026-08-31 10:18:26' },
    { no: 33,  uname: 'ma.sj',    email: 'ma.sj@eteverse.com',      role: '설비 운영자',   org: '시설관리팀',
      phone: '010-7070-8080', first: '성진', last: '마',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-26 15:56:09', last_login: '2026-09-02 20:35:11' },
    { no: 34,  uname: 'jin.sy',   email: 'jin.sy@eteverse.com',     role: '조회 전용',     org: '영업1팀',
      phone: '010-7171-8181', first: '소영', last: '진',    active: 1, locked: 0, mailok: 1, tfa: 0, fail: 0,
      created: '2026-08-26 15:56:09', last_login: '2026-08-29 09:47:38' },
    { no: 35,  uname: 'pyeon.sh', email: 'pyeon.sh@eteverse.com',   role: '시스템 관리자', org: '보안팀',
      phone: '010-7272-8282', first: '승훈', last: '편',    active: 1, locked: 0, mailok: 1, tfa: 1, fail: 0,
      created: '2026-08-27 10:41:25', last_login: '2026-09-04 09:02:31' },
  ];

  let sortKey = 'uname';
  let sortAsc = true;
  let page    = 1;
  let menuNo  = null;   // [작업] 메뉴 대상 행
  let editNo  = null;

  function row(no) { return DATA.filter(function (r) { return r.no === no; })[0]; }

  function bool(v) {
    return v ? '<span class="bool-y">&#10004;</span>' : '<span class="bool-n">&#128683;</span>';
  }

  function fillSelect(id, arr, withAll) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  // ---- 필터 토글 ----
  function toggleFilter() {
    const on = document.getElementById('filterBar').classList.toggle('show');
    document.getElementById('filterBtn').classList.toggle('on', on);
  }

  // ---- 목록 ----
  function filtered() {
    const kw   = (document.getElementById('q').value || '').trim();
    const role = document.getElementById('fRole').value;
    const org  = document.getElementById('fOrg').value;
    const act  = document.getElementById('fActive').value;
    const lock = document.getElementById('fLock').value;
    const mail = document.getElementById('fMail').value;

    const rows = DATA.filter(function (r) {
      const name = r.last + r.first;
      // 고객 모드에서는 호스트 시스템 계정을 제외한다
      if (!window.umsIsHost && r.sys) return false;
      return (!kw   || r.uname.indexOf(kw) >= 0 || r.email.indexOf(kw) >= 0 || name.indexOf(kw) >= 0)
        && (!role || r.role === role)
        && (!org  || r.org === org)
        && (!act  || (act === 'y' ? r.active : !r.active))
        && (!lock || (lock === 'y' ? r.locked : !r.locked))
        && (!mail || (mail === 'y' ? r.mailok : !r.mailok));
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
          return '<tr data-no="' + r.no + '">'
            + '<td><button class="act-menu-btn" onclick="openMenu(event,' + r.no + ')">'
            +   '&#9881; 작업 <span class="caret">&#9662;</span></button></td>'
            + '<td>' + r.uname + '</td>'
            + '<td>' + r.email + '</td>'
            + '<td>' + r.role + '</td>'
            + '<td>' + r.org + '</td>'
            + '<td>' + r.phone + '</td>'
            + '<td>' + r.first + '</td>'
            + '<td>' + (r.last || '<span class="bool-n">-</span>') + '</td>'
            + '<td>' + bool(r.active) + '</td>'
            + '<td>' + bool(r.locked) + '</td>'
            + '<td>' + bool(r.mailok) + '</td>'
            + '<td>' + bool(r.tfa) + '</td>'
            + '<td>' + r.fail + '</td>'
            + '<td>' + r.created + '</td>'
            + '<td>' + (r.last_login || '<span class="bool-n">-</span>') + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="15" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('pNo').textContent = page;

    document.querySelectorAll('#userTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  function sortBy(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    closeMenus();
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

  function resetSearch() {
    ['fRole', 'fOrg', 'fActive', 'fLock', 'fMail', 'q']
      .forEach(function (id) { document.getElementById(id).value = ''; });
    page = 1;
    renderGrid();
  }

  // ---- 드롭다운 ----
  function placeMenu(menu, rect) {
    menu.classList.add('show');
    const below = window.innerHeight - rect.bottom;
    menu.style.left = Math.min(rect.left, window.innerWidth - menu.offsetWidth - 12) + 'px';
    menu.style.top  = (below < menu.offsetHeight + 12)
      ? (rect.top - menu.offsetHeight - 4) + 'px'
      : (rect.bottom + 4) + 'px';
  }

  function closeMenus() {
    ['userMenu', 'impMenu', 'expMenu'].forEach(function (id) {
      document.getElementById(id).classList.remove('show');
    });
    document.querySelectorAll('#gridBody tr.selected').forEach(function (tr) { tr.classList.remove('selected'); });
    menuNo = null;
  }

  function openMenu(e, no) {
    e.stopPropagation();
    const menu = document.getElementById('userMenu');
    const wasOpen = (menuNo === no && menu.classList.contains('show'));
    closeMenus();
    if (wasOpen) return;
    menuNo = no;
    placeMenu(menu, e.currentTarget.getBoundingClientRect());
    document.querySelectorAll('#gridBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
  }

  function openTopMenu(e, kind) {
    e.stopPropagation();
    const id = (kind === 'imp') ? 'impMenu' : 'expMenu';
    const menu = document.getElementById(id);
    const wasOpen = menu.classList.contains('show');
    closeMenus();
    if (wasOpen) return;
    placeMenu(menu, e.currentTarget.getBoundingClientRect());
  }

  function topAct(act) {
    closeMenus();
    const msg = {
      'excel-in':  '엑셀 파일 가져오기 (목업)',
      'template':  '사용자 등록 양식을 내려받았습니다. (목업)',
      'excel-out': '엑셀로 내보내기 (목업)',
      'csv-out':   'CSV로 내보내기 (목업)',
    };
    umsToast(msg[act] || '(목업)');
  }

  function menuAct(act) {
    const r = row(menuNo);
    closeMenus();
    if (!r) return;
    switch (act) {
      case 'edit':   userOpen(r.no); break;
      case 'perm':   umsToast(r.uname + ' — 권한 설정 (목업)'); break;
      case 'passwd': umsToast(r.uname + ' — 비밀번호 변경 (목업)'); break;
      case 'unlock':
        umsToast(r.locked ? r.uname + ' 계정 잠금을 해제했습니다. (목업)' : r.uname + ' 계정은 잠겨 있지 않습니다.');
        break;
      case 'delete': askDelete(r.no); break;
    }
  }

  // ---- 등록/수정 ----
  function userOpen(no) {
    const r = (no == null) ? null : row(no);
    editNo = r ? r.no : null;
    document.getElementById('mTitle').textContent = r ? '사용자 수정' : '새 사용자';
    document.getElementById('m-uname').value = r ? r.uname : '';
    document.getElementById('m-email').value = r ? r.email : '';
    document.getElementById('m-last').value  = r ? r.last : '';
    document.getElementById('m-first').value = r ? r.first : '';
    document.getElementById('m-phone').value = r ? r.phone : '';
    document.getElementById('m-role').value  = r ? r.role : ROLES[0];
    document.getElementById('m-org').value   = (r && r.org !== '-') ? r.org : ORGS[0];
    const act = r ? !!r.active : true;
    const tfa = r ? !!r.tfa : false;
    document.getElementById('m-active').checked = act;
    document.getElementById('m-tfa').checked    = tfa;
    document.getElementById('m-activeText').textContent = act ? '활성' : '비활성';
    document.getElementById('m-tfaText').textContent    = tfa ? '사용' : '사용 안 함';
    show('userModal');
  }

  function userSave() {
    const u = (document.getElementById('m-uname').value || '').trim();
    if (!u) { umsToast('사용자 이름을 입력하세요.'); return; }
    hide('userModal');
    renderGrid();
    umsToast('저장되었습니다.');
  }

  // ---- 초대 ----
  function inviteOpen() {
    document.getElementById('i-emails').value = '';
    show('inviteModal');
  }

  function inviteSend() {
    const raw = (document.getElementById('i-emails').value || '').trim();
    const cnt = raw ? raw.split(/[\n,]+/).filter(function (s) { return s.trim(); }).length : 0;
    if (!cnt) { umsToast('초대할 이메일 주소를 입력하세요.'); return; }
    hide('inviteModal');
    umsToast(cnt + '명에게 초대 메일을 발송했습니다. (목업)');
  }

  // ---- 삭제 ----
  function askDelete(no) {
    const r = row(no);
    if (!r) return;
    editNo = no;
    const isAdmin = (r.uname === 'admin');
    document.getElementById('d-msg').innerHTML = isAdmin
      ? '<span class="confirm-hl">admin</span> 계정은<br>삭제할 수 없습니다.'
      : '<span class="confirm-hl">' + r.uname + '</span> 사용자를<br>삭제하시겠습니까?';
    document.getElementById('d-yes').style.display = isAdmin ? 'none' : '';
    document.querySelector('#delModal .btn-danger').textContent = isAdmin ? '닫기' : '아니오';
    show('delModal');
  }

  function userDelete() { hide('delModal'); umsToast('삭제되었습니다.'); }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  fillSelect('fRole', ROLES, true);
  fillSelect('fOrg',  ORGS,  true);
  fillSelect('m-role', ROLES, false);
  fillSelect('m-org',  ORGS,  false);
  fillSelect('i-role', ROLES, false);
  fillSelect('i-org',  ORGS,  false);
  renderGrid();

  document.getElementById('m-active').addEventListener('change', function () {
    document.getElementById('m-activeText').textContent = this.checked ? '활성' : '비활성';
  });
  document.getElementById('m-tfa').addEventListener('change', function () {
    document.getElementById('m-tfaText').textContent = this.checked ? '사용' : '사용 안 함';
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.drop-menu') && !e.target.closest('.act-menu-btn')
        && !e.target.closest('.page-actions .btn')) closeMenus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenus(); });
  document.addEventListener('scroll', closeMenus, true);

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid       = renderGrid;
  window.resetSearch      = resetSearch;
  window.toggleFilter     = toggleFilter;
  window.sortBy           = sortBy;
  window.go               = go;
  window.openMenu         = openMenu;
  window.openTopMenu      = openTopMenu;
  window.topAct           = topAct;
  window.menuAct          = menuAct;
  window.userOpen         = userOpen;
  window.userSave         = userSave;
  window.userDelete       = userDelete;
  window.inviteOpen       = inviteOpen;
  window.inviteSend       = inviteSend;
  window.userModalClose   = function () { hide('userModal'); };
  window.inviteModalClose = function () { hide('inviteModal'); };
  window.delModalClose    = function () { hide('delModal'); };

})();
