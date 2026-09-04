// 감사로그 페이지 스크립트 (목업 데이터)
// 화면: 관리 > 감사로그   (호스트 모드 전용)
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

  const TYPE_BADGE = { C: ['badge-create', '생성'], U: ['badge-update', '수정'], D: ['badge-delete', '삭제'] };

  let sortKey = 'time';
  let sortAsc = false;
  let detailNo = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function logRow(no) { return LOGS.filter(function (r) { return r.no === no; })[0]; }

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
  function renderLog() {
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

    document.getElementById('logBody').innerHTML = rows.length
      ? rows.map(function (r) {
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

    document.getElementById('logCount').textContent = rows.length;

    document.querySelectorAll('#logTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  function sortLog(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    renderLog();
  }

  function resetLog() {
    ['fFrom', 'fTo', 'fMethod', 'fCode', 'fExc', 'fMin', 'fMax', 'fCorr', 'q']
      .forEach(function (id) { document.getElementById(id).value = ''; });
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
  function renderEntity() {
    const kw   = (document.getElementById('eq').value || '').trim();
    const from = document.getElementById('eFrom').value;
    const to   = document.getElementById('eTo').value;
    const type = document.getElementById('eType').value;
    const ent  = document.getElementById('eEntity').value;

    const rows = CHANGES.filter(function (r) {
      const d = r.time.substring(0, 10);
      return (!kw   || String(r.eid).indexOf(kw) >= 0 || r.user.indexOf(kw) >= 0)
        && (!from || d >= from)
        && (!to   || d <= to)
        && (!type || r.type === type)
        && (!ent  || r.entity === ent);
    });

    document.getElementById('entityBody').innerHTML = rows.length
      ? rows.map(function (r) {
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

    document.getElementById('entityCount').textContent = rows.length;
  }

  function resetEntity() {
    ['eFrom', 'eTo', 'eType', 'eEntity', 'eq'].forEach(function (id) { document.getElementById(id).value = ''; });
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
    + ENTITIES.map(function (v) { return '<option>' + v + '</option>'; }).join('');
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
  window.renderEntity     = renderEntity;
  window.resetEntity      = resetEntity;
  window.entityDetail     = entityDetail;
  window.logModalClose    = function () { hide('logModal'); };
  window.entityModalClose = function () { hide('entityModal'); };

})();
