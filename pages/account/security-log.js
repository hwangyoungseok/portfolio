// 보안 로그 페이지 스크립트 (목업 데이터)
// 화면: (헤더 사용자 메뉴) > 보안 로그   (호스트/고객 공통)
// ※ 본인 계정의 이력만 보여준다. 전체 사용자 이력은 [관리 > 감사로그]에서 본다.
(function () {

  const HOST = (window.umsIsHost !== false);
  const ME   = HOST ? 'admin' : 'it.sejong';

  const UA = {
    mac:   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    win:   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    edge:  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    ios:   'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
  };

  const WEB = 'UMS-Portal Web';
  const API = 'UMS-API';

  // 작업(이벤트) 종류. ABP AbpSecurityLogs.Action 값.
  const ACT_STYLE = {
    LoginSucceeded:     'ok',
    LoginFailed:        'fail',
    LockedOut:          'fail',
    Logout:             'neu',
    ChangePassword:     'warn',
    ChangeEmail:        'warn',
    TwoFactorEnabled:   'warn',
    TwoFactorDisabled:  'warn',
    TokenRefreshed:     'neu',
  };

  // ---- 목업: 본인 계정의 보안 이벤트 (최신순) ----
  const DATA = HOST ? [
    { at: '2026-09-04T09:30:48', action: 'LoginSucceeded',    ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-03T18:02:11', action: 'Logout',            ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-03T09:39:38', action: 'ChangePassword',    ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-03T09:12:05', action: 'LoginSucceeded',    ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-02T17:45:12', action: 'TokenRefreshed',    ip: '211.35.120.77', ua: UA.edge, app: API, identity: 'OpenIddict',  client: 'UMS_App' },
    { at: '2026-09-02T08:02:39', action: 'LoginFailed',       ip: '203.244.11.9',  ua: UA.mac,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-02T08:02:12', action: 'LoginFailed',       ip: '203.244.11.9',  ua: UA.mac,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-01T11:15:27', action: 'LoginSucceeded',    ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-31T16:48:55', action: 'LoginSucceeded',    ip: '121.128.45.6',  ua: UA.ios,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-28T10:20:03', action: 'TwoFactorEnabled',  ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-28T10:18:44', action: 'LoginSucceeded',    ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-26T09:30:22', action: 'LoginSucceeded',    ip: '14.52.234.104', ua: UA.mac,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-24T14:05:19', action: 'ChangeEmail',       ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-21T08:55:41', action: 'LoginSucceeded',    ip: '58.226.19.88',  ua: UA.edge, app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-19T19:31:07', action: 'LockedOut',         ip: '203.244.11.9',  ua: UA.mac,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-19T19:30:52', action: 'LoginFailed',       ip: '203.244.11.9',  ua: UA.mac,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-19T19:30:31', action: 'LoginFailed',       ip: '203.244.11.9',  ua: UA.mac,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-14T09:10:26', action: 'LoginSucceeded',    ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-11T13:40:18', action: 'TokenRefreshed',    ip: '211.35.120.77', ua: UA.edge, app: API, identity: 'OpenIddict',  client: 'UMS_App' },
    { at: '2026-08-07T09:16:26', action: 'LoginSucceeded',    ip: '14.52.234.104', ua: UA.mac,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-05T09:12:03', action: 'Logout',            ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-03T17:37:27', action: 'LoginSucceeded',    ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-03T17:33:54', action: 'ChangePassword',    ip: '14.52.234.104', ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
  ] : [
    { at: '2026-09-04T08:52:10', action: 'LoginSucceeded',    ip: '210.94.41.22',  ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-03T17:20:44', action: 'Logout',            ip: '210.94.41.22',  ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-03T09:05:31', action: 'LoginSucceeded',    ip: '210.94.41.22',  ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-02T13:47:02', action: 'LoginSucceeded',    ip: '175.223.10.61', ua: UA.ios,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-01T09:33:18', action: 'LoginFailed',       ip: '210.94.41.22',  ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-09-01T09:33:44', action: 'LoginSucceeded',    ip: '210.94.41.22',  ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-28T11:02:57', action: 'TokenRefreshed',    ip: '210.94.41.22',  ua: UA.win,  app: API, identity: 'OpenIddict',  client: 'UMS_App' },
    { at: '2026-08-27T08:41:12', action: 'LoginSucceeded',    ip: '210.94.41.22',  ua: UA.edge, app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-24T16:29:05', action: 'ChangePassword',    ip: '210.94.41.22',  ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-20T10:14:39', action: 'LoginSucceeded',    ip: '210.94.41.22',  ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-14T09:10:26', action: 'LoginSucceeded',    ip: '175.223.10.61', ua: UA.ios,  app: WEB, identity: 'Identity',    client: '' },
    { at: '2026-08-12T10:24:03', action: 'LoginSucceeded',    ip: '210.94.41.22',  ua: UA.win,  app: WEB, identity: 'Identity',    client: '' },
  ];

  let sortKey = 'at';
  let sortAsc = false;      // 최신순이 기본
  let page    = 1;

  function el(id) { return document.getElementById(id); }

  // "2026-09-04T09:30:48" -> "2026년 9월 4일 오전 9:30:48"
  function fmtKo(iso) {
    const d = new Date(iso);
    const h = d.getHours();
    const ampm = h < 12 ? '오전' : '오후';
    const h12 = (h % 12) || 12;
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 '
      + ampm + ' ' + h12 + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function actCell(action) {
    const style = ACT_STYLE[action] || 'neu';
    return '<span class="sl-act ' + style + '">' + action + '</span>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function dash(v) { return v ? esc(v) : '<span class="sl-empty">-</span>'; }

  // ---- 조회 ----
  function filtered() {
    const from = el('fFrom').value;   // "2026-09-01T00:00" 또는 ''
    const to   = el('fTo').value;
    const act  = (el('fAction').value || '').trim().toLowerCase();

    const rows = DATA.filter(function (r) {
      if (from && r.at < from) return false;
      // 종료 시간은 그 분(minute)까지 포함시킨다 (초 단위 입력이 없으므로)
      if (to && r.at > to + ':59') return false;
      if (act && r.action.toLowerCase().indexOf(act) < 0) return false;
      return true;
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
    const size  = Number(el('pSize').value);
    const total = rows.length;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (page > maxPage) page = maxPage;
    const from = (page - 1) * size;
    const cur  = rows.slice(from, from + size);

    el('gridBody').innerHTML = cur.length
      ? cur.map(function (r) {
          return '<tr>'
            + '<td>' + fmtKo(r.at) + '</td>'
            + '<td>' + actCell(r.action) + '</td>'
            + '<td>' + esc(r.ip) + '</td>'
            + '<td><span class="sl-ua" title="' + esc(r.ua) + '">' + esc(r.ua) + '</span></td>'
            + '<td>' + esc(r.app) + '</td>'
            + '<td>' + esc(r.identity) + '</td>'
            + '<td>' + dash(r.client) + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="7" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    el('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    el('pNo').textContent = page;

    document.querySelectorAll('#slTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  function search() { page = 1; renderGrid(); }

  function resetSearch() {
    ['fFrom', 'fTo', 'fAction'].forEach(function (id) { el(id).value = ''; });
    sortKey = 'at'; sortAsc = false; page = 1;
    renderGrid();
  }

  function sortBy(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = (key !== 'at'); }   // 시간은 최신순부터
    page = 1;
    renderGrid();
  }

  function go(dir) {
    if (dir === 'size') { page = 1; renderGrid(); return; }
    const size = Number(el('pSize').value);
    const maxPage = Math.max(1, Math.ceil(filtered().length / size));
    if (dir === 'first') page = 1;
    if (dir === 'prev')  page = Math.max(1, page - 1);
    if (dir === 'next')  page = Math.min(maxPage, page + 1);
    if (dir === 'last')  page = maxPage;
    renderGrid();
  }

  // ---- 초기화 ----
  renderGrid();

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.search      = search;
  window.resetSearch = resetSearch;
  window.sortBy      = sortBy;
  window.go          = go;

})();
