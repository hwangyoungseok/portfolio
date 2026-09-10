// 세션 페이지 스크립트 (목업 데이터)
// 화면: (헤더 사용자 메뉴) > 세션   (호스트/고객 공통)
// ※ 본인 계정의 활성 세션만 다룬다. 대응 테이블: AbpSessions
(function () {

  const HOST = (window.umsIsHost !== false);

  // device: 'web' | 'mobile' | 'oauth'  (AbpSessions.Device)
  // current: 지금 이 브라우저의 세션. 종료할 수 없다.
  const DATA = HOST ? [
    { id: 1, current: true,  device: 'web',    name: 'Chrome 141 / Windows 11',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0.0.0',
      client: 'UMS-Portal Web', ip: '14.52.234.104', at: '2026-09-04 09:30:48', last: '방금' },
    { id: 2, current: false, device: 'mobile', name: 'Safari / iPhone (iOS 18.2)',
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2) Version/18.2 Mobile Safari/604.1',
      client: 'UMS-Portal Web', ip: '121.128.45.6', at: '2026-08-31 16:48:55', last: '3일 전' },
    { id: 3, current: false, device: 'web',    name: 'Edge 140 / Windows 11',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Edg/140.0.0.0',
      client: 'UMS-Portal Web', ip: '58.226.19.88', at: '2026-08-21 08:55:41', last: '2주 전' },
    { id: 4, current: false, device: 'oauth',  name: 'UMS 연동 앱 (API)',
      ua: 'UMS_App / OpenIddict token',
      client: 'UMS_App', ip: '211.35.120.77', at: '2026-09-02 17:45:12', last: '2일 전' },
  ] : [
    { id: 1, current: true,  device: 'web',    name: 'Chrome 141 / Windows 11',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0.0.0',
      client: 'UMS-Portal Web', ip: '210.94.41.22', at: '2026-09-04 08:52:10', last: '방금' },
    { id: 2, current: false, device: 'mobile', name: 'Safari / iPhone (iOS 18.2)',
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2) Version/18.2 Mobile Safari/604.1',
      client: 'UMS-Portal Web', ip: '175.223.10.61', at: '2026-09-02 13:47:02', last: '2일 전' },
    { id: 3, current: false, device: 'oauth',  name: 'UMS 연동 앱 (API)',
      ua: 'UMS_App / OpenIddict token',
      client: 'UMS_App', ip: '210.94.41.22', at: '2026-08-28 11:02:57', last: '1주 전' },
  ];

  const DEV_BADGE = {
    web:    ['web',    '웹 브라우저'],
    mobile: ['mobile', '모바일'],
    oauth:  ['oauth',  '연동 앱'],
  };

  let revokeId = null;   // null = '다른 세션 모두 종료'

  function el(id) { return document.getElementById(id); }
  function row(id) { return DATA.filter(function (r) { return r.id === id; })[0]; }
  function others() { return DATA.filter(function (r) { return !r.current; }); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function devBadge(d) {
    const p = DEV_BADGE[d] || DEV_BADGE.web;
    return '<span class="se-badge ' + p[0] + '">' + p[1] + '</span>';
  }

  // ---- 목록 ----
  function renderGrid() {
    el('gridBody').innerHTML = DATA.length
      ? DATA.map(function (r) {
          return '<tr class="' + (r.current ? 'se-current' : '') + '">'
            + '<td><span class="se-dev">'
            +   '<span class="se-dev-name">' + esc(r.name)
            +     (r.current ? ' <span class="se-badge now">현재 세션</span>' : '') + '</span>'
            +   '<span class="se-dev-ua" title="' + esc(r.ua) + '">' + esc(r.ua) + '</span>'
            + '</span></td>'
            + '<td>' + devBadge(r.device) + '</td>'
            + '<td>' + esc(r.client) + '</td>'
            + '<td>' + esc(r.ip) + '</td>'
            + '<td>' + esc(r.at) + '</td>'
            + '<td>' + esc(r.last) + '</td>'
            + '<td>' + (r.current
                ? '<span class="se-empty">-</span>'
                : '<button class="se-revoke" onclick="askRevoke(' + r.id + ')">종료</button>')
            + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="7" style="padding:30px;color:#98a2b3;">활성 세션이 없습니다.</td></tr>';

    el('seCount').textContent = DATA.length;
    el('seRevokeAll').disabled = (others().length === 0);
  }

  // ---- 종료 ----
  function askRevoke(id) {
    const r = row(id);
    if (!r) return;
    revokeId = id;
    el('r-msg').innerHTML =
      '<span class="confirm-hl">' + esc(r.name) + '</span><br>세션을 종료하시겠습니까?';
    el('revokeModal').classList.add('show');
  }

  function askRevokeAll() {
    const n = others().length;
    if (!n) { umsToast('종료할 다른 세션이 없습니다.'); return; }
    revokeId = null;
    el('r-msg').innerHTML =
      '현재 세션을 제외한 <span class="confirm-hl">' + n + '개</span> 세션을<br>모두 종료하시겠습니까?';
    el('revokeModal').classList.add('show');
  }

  function revokeModalClose() { el('revokeModal').classList.remove('show'); }

  function revokeConfirm() {
    revokeModalClose();
    if (revokeId == null) {
      const n = others().length;
      for (let i = DATA.length - 1; i >= 0; i--) {
        if (!DATA[i].current) DATA.splice(i, 1);
      }
      renderGrid();
      umsToast(n + '개 세션을 종료했습니다. (목업)');
      return;
    }
    const r = row(revokeId);
    const i = DATA.indexOf(r);
    if (i >= 0) DATA.splice(i, 1);
    revokeId = null;
    renderGrid();
    umsToast((r ? r.name + ' — ' : '') + '세션을 종료했습니다. (목업)');
  }

  // ---- 초기화 ----
  renderGrid();

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') revokeModalClose();
  });

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.askRevoke        = askRevoke;
  window.askRevokeAll     = askRevokeAll;
  window.revokeConfirm    = revokeConfirm;
  window.revokeModalClose = revokeModalClose;

})();
