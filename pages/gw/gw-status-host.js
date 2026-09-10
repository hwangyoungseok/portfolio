// GW 상태 모니터링 (호스트) — 전 고객사 GW 연결상태
// 화면: GW > GW 상태 모니터링 (호스트)
(function () {

  const TENANTS = ['세종클라우드', '대한IDC', '한빛전산', '미래테크'];
  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터', 'DR센터', '지사 전산실'];

  const DATA = [
    { tenant: '세종클라우드', name: 'GW-IDC-01', loc: '본사 IDC-1F', state: 'on', last: '2026-09-10 09:41:07', delay: 0, fac: 3 },
    { tenant: '세종클라우드', name: 'GW-IDC-02', loc: '본사 IDC-2F', state: 'on', last: '2026-09-10 09:41:05', delay: 2, fac: 3 },
    { tenant: '세종클라우드', name: 'GW-DR-01', loc: '판교 DR센터', state: 'on', last: '2026-09-10 09:41:11', delay: 0, fac: 2 },
    { tenant: '대한IDC', name: 'GW-A-01', loc: '본사 IDC-1F', state: 'on', last: '2026-09-10 09:41:02', delay: 0, fac: 3 },
    { tenant: '대한IDC', name: 'GW-DR-02', loc: 'DR센터', state: 'off', last: '2026-09-10 09:29:12', delay: 0, fac: 0 },
    { tenant: '한빛전산', name: 'GW-01', loc: '본사 IDC-1F', state: 'on', last: '2026-09-10 09:41:09', delay: 41, fac: 3 },
    { tenant: '한빛전산', name: 'GW-02', loc: '지사 전산실', state: 'off', last: '2026-09-10 07:50:33', delay: 0, fac: 1 },
    { tenant: '미래테크', name: 'GW-MAIN', loc: '본사 IDC-2F', state: 'on', last: '2026-09-10 09:41:08', delay: 0, fac: 3 },
    { tenant: '미래테크', name: 'GW-SUB', loc: '판교 DR센터', state: 'off', last: '2026-09-10 09:36:40', delay: 0, fac: 1 },
    { tenant: '미래테크', name: 'GW-LAB', loc: '지사 전산실', state: 'on', last: '2026-09-10 09:41:03', delay: 0, fac: 0 },
  ];

  const STATE = { on: ['badge-on', 'On'], off: ['badge-off', 'Off'] };
  function badge(map, k) { const p = map[k] || ['badge-off', k]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }
  function el(id) { return document.getElementById(id); }
  function fill(id, arr) { el(id).innerHTML = '<option value="">전체</option>' + arr.map(function (v) { return '<option>' + v + '</option>'; }).join(''); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function nowStr() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }

  function gsRender() {
    const ft = el('fTenant').value, fl = el('fLoc').value, fs = el('fState').value;
    const rows = DATA.filter(function (r) { return (!ft || r.tenant === ft) && (!fl || r.loc === fl) && (!fs || r.state === fs); });
    el('gsBody').innerHTML = rows.length ? rows.map(function (r) {
      return '<tr class="' + (r.state === 'off' ? 'row-off' : '') + '" onclick="gsRowClick(\'' + r.name + '\')">'
        + '<td><span class="gs-tenant">' + r.tenant + '</span></td>'
        + '<td>' + r.name + '</td>'
        + '<td>' + r.loc + '</td>'
        + '<td>' + badge(STATE, r.state) + '</td>'
        + '<td>' + r.last + '</td>'
        + '<td>' + (r.state === 'off' && r.fac === 0 ? '-' : r.delay + '건') + '</td>'
        + '<td>' + r.fac + '대</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="7" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';
    el('gsCount').textContent = rows.length;
  }
  function gsRowClick(name) {
    const r = DATA.filter(function (x) { return x.name === name; })[0];
    if (!r) return;
    umsToast(r.state === 'off' ? (r.tenant + ' / ' + name + ' 오프라인 상태입니다.') : (name + ' 정상 통신 중.'));
  }

  let timer = null;
  function tick() {
    DATA.forEach(function (r) {
      if (r.state === 'on') { r.last = nowStr(); r.delay = Math.random() < 0.85 ? 0 : Math.floor(Math.random() * 3) + 1; }
    });
    gsRender();
    el('gsLast').textContent = '마지막 새로고침 ' + nowStr();
  }
  function gsToggleAuto() {
    if (el('autoRefresh').checked) { tick(); timer = setInterval(tick, 5000); umsToast('자동 새로고침 ON (5초)'); }
    else { clearInterval(timer); timer = null; el('gsLast').textContent = ''; umsToast('자동 새로고침 OFF'); }
  }

  fill('fTenant', TENANTS);
  fill('fLoc', LOCATIONS);
  gsRender();

  window.gsRender = gsRender;
  window.gsRowClick = gsRowClick;
  window.gsToggleAuto = gsToggleAuto;

})();
