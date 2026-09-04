// 감사로그 페이지 스크립트 (목업 데이터)
// 화면: 관리 > 감사로그   (호스트/고객 공통)
(function () {

  const EXC_JSON =
    '[\n'
  + '  {\n'
  + '    "code": null,\n'
  + '    "message": "An internal error occurred during your request!",\n'
  + '    "details": null,\n'
  + '    "data": null,\n'
  + '    "validationErrors": null\n'
  + '  }\n'
  + ']';

  // ---- 감사 로그 (HTTP 요청 단위) ----
  const LOGS = [
    { no: 1,  code: 500, method: 'GET',  url: '/Admin/AuditLogs',  user: 'admin',    ip: '14.52.234.104', time: '2026-09-04 01:57:17', dur: 139,  app: 'UMS-Portal Web', corr: '8ae3708d32f247c5aec2f81c717c7770', exc: EXC_JSON, client: '',
      acts: [ { svc: 'AuditLogAppService', mtd: 'GetListAsync', dur: 118, param: '{ maxResultCount: 20, skipCount: 0 }' },
              { svc: 'PermissionChecker',  mtd: 'IsGrantedAsync', dur: 12, param: '{ policy: "Admin.AuditLog" }' },
              { svc: 'AuditLogRepository', mtd: 'GetCountAsync', dur: 9, param: '{}' } ] },
    { no: 2,  code: 500, method: 'GET',  url: '/Admin/AuditLogs',  user: 'admin',    ip: '14.52.234.104', time: '2026-09-04 01:56:52', dur: 128,  app: 'UMS-Portal Web', corr: 'ac66a82fa73f4c1785f83dd7193ac132', exc: EXC_JSON, client: '',
      acts: [ { svc: 'AuditLogAppService', mtd: 'GetListAsync', dur: 110, param: '{ maxResultCount: 20, skipCount: 0 }' } ] },
    { no: 3,  code: 500, method: 'GET',  url: '/Saas/Tenants',     user: 'admin',    ip: '14.52.234.104', time: '2026-09-04 09:31:00', dur: 677,  app: 'UMS-Portal Web', corr: '9cb94d83efaf4e0187aeaff903b87e2a', exc: EXC_JSON, client: '',
      acts: [ { svc: 'TenantAppService',   mtd: 'GetListAsync', dur: 640, param: '{ filter: null, sorting: "Name" }' },
              { svc: 'EditionAppService',  mtd: 'GetAllListAsync', dur: 28, param: '{}' } ] },
    { no: 4,  code: 302, method: 'POST', url: '/Account/Login',    user: 'admin',    ip: '14.52.234.104', time: '2026-09-04 09:30:46', dur: 5954, app: 'UMS-Portal Web', corr: '8b7d11f5853b4363a5e8eb264702c878', exc: '', client: 'Chrome 141 / Windows 11',
      acts: [ { svc: 'AccountAppService',  mtd: 'LoginAsync', dur: 5820, param: '{ userNameOrEmailAddress: "admin", rememberMe: true }' },
              { svc: 'AuditLogAppService', mtd: 'SaveAsync', dur: 96, param: '{}' } ] },
    { no: 5,  code: 200, method: 'POST', url: '/Admin/Settings',   user: 'admin',    ip: '14.52.234.104', time: '2026-09-03 09:39:38', dur: 142,  app: 'UMS-Portal Web', corr: '2a13a37e69104932a6bfb615a30020b1', exc: '', client: 'Chrome 141 / Windows 11',
      acts: [ { svc: 'SettingAppService',  mtd: 'UpdateAsync', dur: 121, param: '{ name: "Alarm.Mail.Enabled", value: "true" }' } ] },
    { no: 6,  code: 200, method: 'POST', url: '/Admin/Settings',   user: 'admin',    ip: '14.52.234.104', time: '2026-09-03 09:39:20', dur: 101,  app: 'UMS-Portal Web', corr: '5d5a58aa325e477998832f3ca61ef0b5', exc: '', client: 'Chrome 141 / Windows 11',
      acts: [ { svc: 'SettingAppService',  mtd: 'UpdateAsync', dur: 88, param: '{ name: "Alarm.Mail.Sender", value: "noreply@eteverse.com" }' } ] },
    { no: 7,  code: 200, method: 'POST', url: '/Saas/Tenants',     user: 'admin',    ip: '14.52.234.104', time: '2026-09-03 15:22:04', dur: 412,  app: 'UMS-Portal Web', corr: 'c41b0f9a77e34b1e9d0a5f2b8c6d1e33', exc: '', client: 'Chrome 141 / Windows 11',
      acts: [ { svc: 'TenantAppService',   mtd: 'CreateAsync', dur: 380, param: '{ name: "정우텔레콤", editionId: 1 }' },
              { svc: 'TenantDbMigrator',   mtd: 'MigrateAsync', dur: 21, param: '{}' } ] },
    { no: 8,  code: 200, method: 'PUT',  url: '/Saas/Editions',    user: 'admin',    ip: '14.52.234.104', time: '2026-09-03 14:10:51', dur: 233,  app: 'UMS-Portal Web', corr: 'ff20d5c8b1a24e6ea9c8d7a5b3e10f21', exc: '', client: 'Chrome 141 / Windows 11',
      acts: [ { svc: 'EditionAppService',  mtd: 'UpdateAsync', dur: 210, param: '{ id: 2, name: "Professional" }' } ] },
    { no: 9,  code: 404, method: 'GET',  url: '/Facility/UpsList', user: 'kim.jh',   ip: '211.35.120.77', time: '2026-09-02 17:45:12', dur: 58,   app: 'UMS-Portal Web', corr: '7b1e4d2f9c3a45f0b8d6e5a1c2f30948', exc: '', client: 'Edge 140 / Windows 11',
      acts: [ { svc: 'UpsAppService',      mtd: 'GetAsync', dur: 41, param: '{ id: 9999 }' } ] },
    { no: 10, code: 200, method: 'GET',  url: '/Data/UpsData',     user: 'kim.jh',   ip: '211.35.120.77', time: '2026-09-02 17:44:03', dur: 1820, app: 'UMS-API',        corr: '3c9f8e7d6b5a4c3d2e1f0a9b8c7d6e5f', exc: '', client: '',
      acts: [ { svc: 'UpsDataAppService',  mtd: 'GetListAsync', dur: 1760, param: '{ from: "2026-08-01", to: "2026-09-02" }' } ] },
    { no: 11, code: 401, method: 'POST', url: '/Account/Login',    user: '-',        ip: '203.244.11.9',  time: '2026-09-02 08:02:39', dur: 312,  app: 'UMS-Portal Web', corr: '1a2b3c4d5e6f708192a3b4c5d6e7f809', exc: '', client: 'Chrome 140 / macOS',
      acts: [ { svc: 'AccountAppService',  mtd: 'LoginAsync', dur: 298, param: '{ userNameOrEmailAddress: "test01" }' } ] },
    { no: 12, code: 200, method: 'DELETE', url: '/Admin/Users',    user: 'admin',    ip: '14.52.234.104', time: '2026-09-01 11:15:27', dur: 176,  app: 'UMS-Portal Web', corr: '9f8e7d6c5b4a39281706f5e4d3c2b1a0', exc: '', client: 'Chrome 141 / Windows 11',
      acts: [ { svc: 'IdentityUserAppService', mtd: 'DeleteAsync', dur: 160, param: '{ id: "e1f2..." }' } ] },
  ];

  // ---- 엔티티 변경 사항 ----
  const ENTITIES = ['Tenant', 'Edition', 'Setting', 'IdentityUser', 'Ups'];
  const CHANGES = [
    { no: 1, type: 'C', entity: 'Tenant',       eid: '1042', user: 'admin',  time: '2026-09-03 15:22:04', corr: 'c41b0f9a77e34b1e9d0a5f2b8c6d1e33',
      fields: [ { f: 'Name', o: '', n: '정우텔레콤' }, { f: 'EditionId', o: '', n: '1' }, { f: 'IsActive', o: '', n: 'true' } ] },
    { no: 2, type: 'U', entity: 'Edition',      eid: '2',    user: 'admin',  time: '2026-09-03 14:10:51', corr: 'ff20d5c8b1a24e6ea9c8d7a5b3e10f21',
      fields: [ { f: 'MonthlyPrice', o: '700000', n: '800000' }, { f: 'TrialDays', o: '30', n: '14' } ] },
    { no: 3, type: 'U', entity: 'Setting',      eid: 'Alarm.Mail.Enabled', user: 'admin', time: '2026-09-03 09:39:38', corr: '2a13a37e69104932a6bfb615a30020b1',
      fields: [ { f: 'Value', o: 'false', n: 'true' } ] },
    { no: 4, type: 'U', entity: 'Tenant',       eid: '1039', user: 'admin',  time: '2026-09-02 10:04:18', corr: 'aa11bb22cc33dd44ee55ff6677889900',
      fields: [ { f: 'IsActive', o: 'true', n: 'false' }, { f: 'EditionEndDateUtc', o: '2026-08-15', n: '2026-08-15' } ] },
    { no: 5, type: 'D', entity: 'IdentityUser', eid: 'e1f2a3b4', user: 'admin', time: '2026-09-01 11:15:27', corr: '9f8e7d6c5b4a39281706f5e4d3c2b1a0',
      fields: [ { f: 'UserName', o: 'test01', n: '' }, { f: 'Email', o: 'test01@example.com', n: '' } ] },
    { no: 6, type: 'U', entity: 'Ups',          eid: '7',    user: 'kim.jh', time: '2026-08-31 16:48:55', corr: '55aa66bb77cc88dd99ee00ff11223344',
      fields: [ { f: 'CapacityKva', o: '10', n: '15' }, { f: 'Memo', o: '', n: '2026년 증설' } ] },
  ];

  // ---- 목업 데이터 보강: 페이징 확인용으로 로그/변경이력을 자동 생성해 덧붙인다 ----
  //      (손으로 적은 위 데이터가 앞쪽, 생성 데이터가 뒤쪽 날짜로 이어진다)
  (function generate() {
    // 재현 가능한 난수 (새로고침해도 같은 목록)
    let seed = 20260904;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function hex(n) {
      let out = '';
      for (let i = 0; i < n; i++) out += '0123456789abcdef'.charAt(Math.floor(rnd() * 16));
      return out;
    }
    function pad(n) { return String(n).padStart(2, '0'); }

    const USERS = ['admin', 'oh.yh', 'kim.jh', 'nam.kh', 'hwang.by', 'park.jh', 'han.sy',
                   'choi.ma', 'yoon.dh', 'lee.sm', 'seo.jw', 'bae.sh', 'ahn.js', 'ma.sj'];
    const IPS   = ['14.52.234.104', '211.35.120.77', '203.244.11.9', '121.128.45.6', '58.226.19.88'];
    const CLIENTS = ['Chrome 141 / Windows 11', 'Edge 140 / Windows 11', 'Chrome 140 / macOS', ''];

    // URL 별 호출되는 서비스/메서드 (작업 탭에 표시)
    const EP = [
      { url: '/Saas/Tenants',       m: 'GET',    svc: 'TenantAppService',        mtd: 'GetListAsync' },
      { url: '/Saas/Editions',      m: 'GET',    svc: 'EditionAppService',       mtd: 'GetListAsync' },
      { url: '/Admin/Users',        m: 'GET',    svc: 'IdentityUserAppService',  mtd: 'GetListAsync' },
      { url: '/Admin/Users',        m: 'POST',   svc: 'IdentityUserAppService',  mtd: 'CreateAsync' },
      { url: '/Admin/Roles',        m: 'GET',    svc: 'IdentityRoleAppService',  mtd: 'GetListAsync' },
      { url: '/Admin/Roles',        m: 'PUT',    svc: 'IdentityRoleAppService',  mtd: 'UpdateAsync' },
      { url: '/Admin/OrgUnits',     m: 'GET',    svc: 'OrganizationUnitAppService', mtd: 'GetListAsync' },
      { url: '/Admin/OrgUnits',     m: 'POST',   svc: 'OrganizationUnitAppService', mtd: 'CreateAsync' },
      { url: '/Admin/AuditLogs',    m: 'GET',    svc: 'AuditLogAppService',      mtd: 'GetListAsync' },
      { url: '/Admin/Settings',     m: 'POST',   svc: 'SettingAppService',       mtd: 'UpdateAsync' },
      { url: '/Facility/UpsList',   m: 'GET',    svc: 'UpsAppService',           mtd: 'GetListAsync' },
      { url: '/Facility/UpsList',   m: 'PUT',    svc: 'UpsAppService',           mtd: 'UpdateAsync' },
      { url: '/Facility/PduList',   m: 'GET',    svc: 'PduAppService',           mtd: 'GetListAsync' },
      { url: '/Data/UpsData',       m: 'GET',    svc: 'UpsDataAppService',       mtd: 'GetListAsync' },
      { url: '/Data/PduData',       m: 'GET',    svc: 'PduDataAppService',       mtd: 'GetListAsync' },
      { url: '/Alarm/Rules',        m: 'GET',    svc: 'AlarmRuleAppService',     mtd: 'GetListAsync' },
      { url: '/Alarm/History',      m: 'GET',    svc: 'AlarmHistoryAppService',  mtd: 'GetListAsync' },
      { url: '/Ticket/My',          m: 'GET',    svc: 'TicketAppService',        mtd: 'GetMyListAsync' },
      { url: '/Ticket/Assign',      m: 'POST',   svc: 'TicketAppService',        mtd: 'AssignAsync' },
      { url: '/Gw/GwList',          m: 'GET',    svc: 'GatewayAppService',       mtd: 'GetListAsync' },
      { url: '/Account/Login',      m: 'POST',   svc: 'AccountAppService',       mtd: 'LoginAsync' },
      { url: '/Account/Logout',     m: 'POST',   svc: 'AccountAppService',       mtd: 'LogoutAsync' },
      { url: '/Admin/Users',        m: 'DELETE', svc: 'IdentityUserAppService',  mtd: 'DeleteAsync' },
    ];

    let no = LOGS.length;
    // 2026-09-04 09:00 부터 과거로 내려가며 생성
    let t = new Date(2026, 8, 4, 9, 0, 0);

    for (let i = 0; i < 36; i++) {
      t = new Date(t.getTime() - (8 + Math.floor(rnd() * 190)) * 60000);   // 8분~3시간 간격
      const ep = pick(EP);
      const r  = rnd();
      const code = r > 0.92 ? 500 : (r > 0.88 ? 404 : (r > 0.85 ? 401 : (r > 0.80 ? 302 : 200)));
      const dur  = code === 500 ? 120 + Math.floor(rnd() * 600)
                 : (ep.url.indexOf('/Data/') === 0 ? 800 + Math.floor(rnd() * 2500)
                                                   : 40 + Math.floor(rnd() * 500));
      const time = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate())
                 + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds());
      const acts = [{ svc: ep.svc, mtd: ep.mtd, dur: Math.max(10, dur - 20 - Math.floor(rnd() * 30)), param: '{ maxResultCount: 20, skipCount: 0 }' }];
      if (rnd() > 0.5) acts.push({ svc: 'PermissionChecker', mtd: 'IsGrantedAsync', dur: 4 + Math.floor(rnd() * 20), param: '{ policy: "' + ep.url.split('/')[1] + '" }' });

      LOGS.push({
        no: ++no, code: code, method: ep.m, url: ep.url,
        user: code === 401 ? '-' : pick(USERS),
        ip: pick(IPS), time: time, dur: dur,
        app: ep.url.indexOf('/Data/') === 0 ? 'UMS-API' : 'UMS-Portal Web',
        corr: hex(32), exc: code === 500 ? EXC_JSON : '',
        client: pick(CLIENTS), acts: acts,
      });
    }

    // ---- 엔티티 변경 이력도 함께 생성 ----
    const ENT = [
      { e: 'Tenant',       f: [['Name', '세종클라우드', '세종클라우드(주)'], ['EditionId', '1', '2'], ['IsActive', 'true', 'false']] },
      { e: 'Edition',      f: [['MonthlyPrice', '300000', '350000'], ['TrialDays', '30', '14']] },
      { e: 'Setting',      f: [['Value', 'false', 'true'], ['Value', '30', '90']] },
      { e: 'IdentityUser', f: [['Email', 'old@eteverse.com', 'new@eteverse.com'], ['IsActive', 'true', 'false'], ['PhoneNumber', '010-0000-0000', '010-1111-2222']] },
      { e: 'Ups',          f: [['CapacityKva', '10', '15'], ['Memo', '', '점검 완료'], ['LocationId', '2', '3']] },
    ];
    const ENT_USERS = ['admin', 'oh.yh', 'kim.jh', 'nam.kh', 'hwang.by'];

    let cno = CHANGES.length;
    let ct = new Date(2026, 8, 3, 18, 0, 0);
    for (let i = 0; i < 22; i++) {
      ct = new Date(ct.getTime() - (30 + Math.floor(rnd() * 600)) * 60000);
      const src = pick(ENT);
      const type = pick(['C', 'U', 'U', 'U', 'D']);
      const cnt  = 1 + Math.floor(rnd() * src.f.length);
      const time = ct.getFullYear() + '-' + pad(ct.getMonth() + 1) + '-' + pad(ct.getDate())
                 + ' ' + pad(ct.getHours()) + ':' + pad(ct.getMinutes()) + ':' + pad(ct.getSeconds());
      CHANGES.push({
        no: ++cno, type: type, entity: src.e,
        eid: String(1000 + Math.floor(rnd() * 9000)),
        user: pick(ENT_USERS), time: time, corr: hex(32),
        fields: src.f.slice(0, cnt).map(function (x) {
          return { f: x[0], o: type === 'C' ? '' : x[1], n: type === 'D' ? '' : x[2] };
        }),
      });
    }
  })();

  const TYPE_BADGE = { C: ['badge-create', '생성'], U: ['badge-update', '수정'], D: ['badge-delete', '삭제'] };

  let sortKey = 'time';
  let sortAsc = false;
  let detailNo = null;
  let lPage = 1;   // 감사 로그 탭 페이지
  let ePage = 1;   // 엔티티 변경 사항 탭 페이지

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function logRow(no) { return LOGS.filter(function (r) { return r.no === no; })[0]; }

  // 고객 모드에서 감춰야 하는 항목 (호스트 전용 영역)
  const HOST_URL_PREFIX = ['/Saas/'];
  const HOST_ENTITY = ['Tenant', 'Edition', 'Setting'];

  function isHostLog(r) {
    return HOST_URL_PREFIX.some(function (p) { return r.url.indexOf(p) === 0; });
  }
  function isHostChange(r) { return HOST_ENTITY.indexOf(r.entity) >= 0; }

  function httpReq(r) {
    return '<span class="http-req">'
      + '<span class="http-code code-' + String(r.code).charAt(0) + '">' + r.code + '</span>'
      + '<span class="http-method">' + r.method + '</span>'
      + '<span class="http-url">' + r.url + '</span></span>';
  }

  // ---- 탭 전환 ----
  function switchTab(name) {
    ['log', 'entity'].forEach(function (n) {
      document.getElementById('tab-' + n).classList.toggle('show', n === name);
      document.getElementById('tabBtn-' + n).classList.toggle('active', n === name);
    });
  }

  function switchDetailTab(name) {
    ['all', 'act'].forEach(function (n) {
      document.getElementById('dtab-' + n).classList.toggle('show', n === name);
      document.getElementById('dtabBtn-' + n).classList.toggle('active', n === name);
    });
  }

  // ---- 감사 로그 그리드 ----
  // 검색조건 + 정렬을 적용한 전체 행 (페이징 전)
  function logRows() {
    const kw   = (document.getElementById('q').value || '').trim();
    const from = document.getElementById('fFrom').value;
    const to   = document.getElementById('fTo').value;
    const mtd  = document.getElementById('fMethod').value;
    const code = document.getElementById('fCode').value;
    const exc  = document.getElementById('fExc').value;
    const min  = document.getElementById('fMin').value;
    const max  = document.getElementById('fMax').value;
    const corr = (document.getElementById('fCorr').value || '').trim();

    const rows = LOGS.filter(function (r) {
      if (!window.umsIsHost && isHostLog(r)) return false;
      const d = r.time.substring(0, 10);
      return (!kw   || r.url.indexOf(kw) >= 0 || r.user.indexOf(kw) >= 0 || r.ip.indexOf(kw) >= 0)
        && (!from || d >= from)
        && (!to   || d <= to)
        && (!mtd  || r.method === mtd)
        && (!code || String(r.code).charAt(0) === code)
        && (!exc  || (exc === 'y' ? !!r.exc : !r.exc))
        && (!min  || r.dur >= Number(min))
        && (!max  || r.dur <= Number(max))
        && (!corr || r.corr.indexOf(corr) >= 0);
    });

    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });
    return rows;
  }

  function renderLog() {
    const rows   = logRows();
    const lSize  = Number(document.getElementById('lSize').value);
    const lTotal = rows.length;
    const lMax   = Math.max(1, Math.ceil(lTotal / lSize));
    if (lPage > lMax) lPage = lMax;
    const lFrom = (lPage - 1) * lSize;
    const pageRows = rows.slice(lFrom, lFrom + lSize);

    document.getElementById('logBody').innerHTML = pageRows.length
      ? pageRows.map(function (r) {
          return '<tr>'
            + '<td><button class="btn-detail" onclick="logDetail(' + r.no + ')">&#128065; 상세</button></td>'
            + '<td>' + httpReq(r) + '</td>'
            + '<td>' + r.user + '</td>'
            + '<td>' + r.ip + '</td>'
            + '<td>' + r.time + '</td>'
            + '<td>' + r.dur.toLocaleString('ko-KR') + '</td>'
            + '<td>' + r.app + '</td>'
            + '<td><span class="corr-id">' + r.corr.substring(0, 12) + '…</span></td>'
            + '<td>' + r.url + '</td>'
            + '<td>' + (r.exc ? '<span class="exc-yes">&#10004;</span>' : '<span class="exc-no">-</span>') + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="10" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('logCount').textContent = lTotal;
    document.getElementById('lInfo').textContent = lTotal
      ? (lFrom + 1) + ' - ' + (lFrom + pageRows.length) + ' / 전체 ' + lTotal + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('lNo').textContent = lPage;

    document.querySelectorAll('#logTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  function sortLog(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    lPage = 1;
    renderLog();
  }

  // 감사 로그 탭 페이지 이동 ('size' 는 페이지 크기 변경)
  function lGo(dir) {
    if (dir === 'size') { lPage = 1; renderLog(); return; }
    const size = Number(document.getElementById('lSize').value);
    const max  = Math.max(1, Math.ceil(logRows().length / size));
    if (dir === 'first') lPage = 1;
    if (dir === 'prev')  lPage = Math.max(1, lPage - 1);
    if (dir === 'next')  lPage = Math.min(max, lPage + 1);
    if (dir === 'last')  lPage = max;
    renderLog();
  }

  function resetLog() {
    ['fFrom', 'fTo', 'fMethod', 'fCode', 'fExc', 'fMin', 'fMax', 'fCorr', 'q']
      .forEach(function (id) { document.getElementById(id).value = ''; });
    lPage = 1;
    renderLog();
  }

  // ---- 감사 로그 상세 팝업 ----
  function aRow(label, val) {
    return '<div class="audit-row"><div class="audit-label">' + label + '</div>'
      + '<div class="audit-val">' + (val || '<span class="empty">-</span>') + '</div></div>';
  }

  function logDetail(no) {
    const r = logRow(no);
    if (!r) return;
    detailNo = no;

    document.getElementById('dtab-all').innerHTML = '<div class="audit-dv">'
      + aRow('HTTP 상태 코드', '<span class="http-code code-' + String(r.code).charAt(0) + '">' + r.code + '</span>')
      + aRow('HTTP 메서드', '<span class="http-method">' + r.method + '</span>')
      + aRow('URL', r.url)
      + aRow('클라이언트 IP 주소', r.ip)
      + aRow('클라이언트 이름', r.client)
      + aRow('애플리케이션 이름', r.app)
      + aRow('상관관계 ID', '<span class="corr-id">' + r.corr + '</span>')
      + aRow('예외', r.exc ? '<div class="json-box">' + esc(r.exc) + '</div>' : '')
      + aRow('사용자 이름', r.user)
      + aRow('실행 시간', r.time)
      + aRow('소요 시간', r.dur.toLocaleString('ko-KR') + ' ms')
      + '</div>';

    document.getElementById('dActCount').textContent = r.acts.length;
    document.getElementById('dtab-act').innerHTML = r.acts.length
      ? '<table class="mini-table"><thead><tr>'
        + '<th style="width:34px;">#</th><th>서비스</th><th>메서드</th>'
        + '<th style="width:90px;">소요 시간</th><th>파라미터</th></tr></thead><tbody>'
        + r.acts.map(function (a, i) {
            return '<tr><td class="num">' + (i + 1) + '</td>'
              + '<td>' + a.svc + '</td><td>' + a.mtd + '</td>'
              + '<td class="num">' + a.dur.toLocaleString('ko-KR') + ' ms</td>'
              + '<td><span class="corr-id">' + esc(a.param) + '</span></td></tr>';
          }).join('')
        + '</tbody></table>'
      : '<div style="padding:24px;text-align:center;color:#98a2b3;">기록된 작업이 없습니다.</div>';

    switchDetailTab('all');
    show('logModal');
  }

  // ---- 엔티티 변경 사항 ----
  // 검색조건을 적용한 전체 행 (페이징 전)
  function entityRows() {
    const kw   = (document.getElementById('eq').value || '').trim();
    const from = document.getElementById('eFrom').value;
    const to   = document.getElementById('eTo').value;
    const type = document.getElementById('eType').value;
    const ent  = document.getElementById('eEntity').value;

    const rows = CHANGES.filter(function (r) {
      if (!window.umsIsHost && isHostChange(r)) return false;
      const d = r.time.substring(0, 10);
      return (!kw   || String(r.eid).indexOf(kw) >= 0 || r.user.indexOf(kw) >= 0)
        && (!from || d >= from)
        && (!to   || d <= to)
        && (!type || r.type === type)
        && (!ent  || r.entity === ent);
    });
    return rows;
  }

  function renderEntity() {
    const rows   = entityRows();
    const eSize  = Number(document.getElementById('eSize').value);
    const eTotal = rows.length;
    const eMax   = Math.max(1, Math.ceil(eTotal / eSize));
    if (ePage > eMax) ePage = eMax;
    const eFrom = (ePage - 1) * eSize;
    const pageRows = rows.slice(eFrom, eFrom + eSize);

    document.getElementById('entityBody').innerHTML = pageRows.length
      ? pageRows.map(function (r) {
          const pair = TYPE_BADGE[r.type];
          return '<tr>'
            + '<td><button class="btn-detail" onclick="entityDetail(' + r.no + ')">&#128065; 상세</button></td>'
            + '<td><span class="badge ' + pair[0] + '">' + pair[1] + '</span></td>'
            + '<td>' + r.entity + '</td>'
            + '<td>' + r.eid + '</td>'
            + '<td>' + r.fields.length + '개</td>'
            + '<td>' + r.user + '</td>'
            + '<td>' + r.time + '</td>'
            + '<td><span class="corr-id">' + r.corr.substring(0, 12) + '…</span></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="8" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('entityCount').textContent = eTotal;
    document.getElementById('eInfo').textContent = eTotal
      ? (eFrom + 1) + ' - ' + (eFrom + pageRows.length) + ' / 전체 ' + eTotal + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('eNo').textContent = ePage;
  }

  // 엔티티 변경 사항 탭 페이지 이동
  function eGo(dir) {
    if (dir === 'size') { ePage = 1; renderEntity(); return; }
    const size = Number(document.getElementById('eSize').value);
    const max  = Math.max(1, Math.ceil(entityRows().length / size));
    if (dir === 'first') ePage = 1;
    if (dir === 'prev')  ePage = Math.max(1, ePage - 1);
    if (dir === 'next')  ePage = Math.min(max, ePage + 1);
    if (dir === 'last')  ePage = max;
    renderEntity();
  }

  function resetEntity() {
    ['eFrom', 'eTo', 'eType', 'eEntity', 'eq'].forEach(function (id) { document.getElementById(id).value = ''; });
    ePage = 1;
    renderEntity();
  }

  function entityDetail(no) {
    const r = CHANGES.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    const pair = TYPE_BADGE[r.type];
    document.getElementById('entityBodyDetail').innerHTML =
      '<div class="audit-dv">'
      + aRow('변경 유형', '<span class="badge ' + pair[0] + '">' + pair[1] + '</span>')
      + aRow('엔티티', r.entity)
      + aRow('엔티티 ID', r.eid)
      + aRow('사용자 이름', r.user)
      + aRow('변경 일시', r.time)
      + aRow('상관관계 ID', '<span class="corr-id">' + r.corr + '</span>')
      + '</div>'
      + '<div style="margin-top:16px;">'
      + '<table class="mini-table"><thead><tr><th>필드</th><th>이전 값</th><th>새 값</th></tr></thead><tbody>'
      + r.fields.map(function (f) {
          return '<tr><td>' + f.f + '</td>'
            + '<td>' + (f.o ? '<span class="val-old">' + esc(f.o) + '</span>' : '<span class="empty" style="color:#b6bec8;">-</span>') + '</td>'
            + '<td>' + (f.n ? '<span class="val-new">' + esc(f.n) + '</span>' : '<span class="empty" style="color:#b6bec8;">-</span>') + '</td></tr>';
        }).join('')
      + '</tbody></table></div>';
    show('entityModal');
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  document.getElementById('eEntity').innerHTML = '<option value="">전체</option>'
    + ENTITIES.filter(function (v) { return window.umsIsHost || HOST_ENTITY.indexOf(v) < 0; })
              .map(function (v) { return '<option>' + v + '</option>'; }).join('');
  renderLog();
  renderEntity();

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    hide('logModal');
    hide('entityModal');
  });

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.switchTab        = switchTab;
  window.switchDetailTab  = switchDetailTab;
  window.renderLog        = renderLog;
  window.sortLog          = sortLog;
  window.resetLog         = resetLog;
  window.logDetail        = logDetail;
  window.lGo              = lGo;
  window.eGo              = eGo;
  window.renderEntity     = renderEntity;
  window.resetEntity      = resetEntity;
  window.entityDetail     = entityDetail;
  window.logModalClose    = function () { hide('logModal'); };
  window.entityModalClose = function () { hide('entityModal'); };

})();
