// GW 관리 (호스트) — 전 고객사 GW 조회 전용
// 화면: GW > GW 관리 (호스트)
(function () {

  const TENANTS = ['세종클라우드', '대한IDC', '한빛전산', '미래테크'];
  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터', 'DR센터', '지사 전산실'];

  const DATA = [
    { no: 1, tenant: '세종클라우드', name: 'GW-IDC-01', loc: '본사 IDC-1F', host: 'GWHOST-01 / 10.10.1.5', ver: 'v2.3.1', use: true, fac: [{ n: 'UPS-1F-A', l: 'on' }, { n: 'UPS-1F-B', l: 'on' }, { n: 'PDU-1F-01', l: 'on' }] },
    { no: 2, tenant: '세종클라우드', name: 'GW-IDC-02', loc: '본사 IDC-2F', host: 'GWHOST-02 / 10.10.2.5', ver: 'v2.3.1', use: true, fac: [{ n: 'UPS-2F-A', l: 'on' }, { n: 'UPS-2F-B', l: 'off' }, { n: 'CH-2F-01', l: 'on' }] },
    { no: 3, tenant: '세종클라우드', name: 'GW-DR-01', loc: '판교 DR센터', host: 'GWHOST-03 / 10.20.1.5', ver: 'v2.2.8', use: true, fac: [{ n: 'UPS-DR-1', l: 'on' }, { n: 'UPS-DR-2', l: 'on' }] },
    { no: 4, tenant: '대한IDC', name: 'GW-A-01', loc: '본사 IDC-1F', host: 'DHIDC-GW01 / 172.16.0.11', ver: 'v2.3.1', use: true, fac: [{ n: 'UPS-A-1', l: 'on' }, { n: 'PDU-A-01', l: 'on' }, { n: 'PDU-A-02', l: 'on' }] },
    { no: 5, tenant: '대한IDC', name: 'GW-DR-02', loc: 'DR센터', host: '-', ver: '-', use: false, fac: [] },
    { no: 6, tenant: '한빛전산', name: 'GW-01', loc: '본사 IDC-1F', host: 'HANBIT-GW / 192.168.10.20', ver: 'v2.2.8', use: true, fac: [{ n: 'UPS-1F-A', l: 'on' }, { n: 'CH-01', l: 'on' }, { n: 'BAT-1F-01', l: 'on' }] },
    { no: 7, tenant: '한빛전산', name: 'GW-02', loc: '지사 전산실', host: 'HANBIT-GW2 / 192.168.20.20', ver: 'v2.3.1', use: true, fac: [{ n: 'UPS-2F-01', l: 'off' }] },
    { no: 8, tenant: '미래테크', name: 'GW-MAIN', loc: '본사 IDC-2F', host: 'MRT-GW-MAIN / 10.30.1.9', ver: 'v2.3.1', use: true, fac: [{ n: 'UPS-2F-A', l: 'on' }, { n: 'PDU-MAIN-01', l: 'on' }, { n: 'CH-MAIN', l: 'on' }] },
    { no: 9, tenant: '미래테크', name: 'GW-SUB', loc: '판교 DR센터', host: 'MRT-GW-SUB / 10.30.9.9', ver: 'v2.2.8', use: true, fac: [{ n: 'UPS-DR-1', l: 'on' }] },
    { no: 10, tenant: '미래테크', name: 'GW-LAB', loc: '지사 전산실', host: 'MRT-LAB / 10.30.5.5', ver: 'v2.1.4', use: false, fac: [] },
  ];

  const LINK = { on: ['badge-on', '온라인'], off: ['badge-off', '오프라인'] };
  const USE = { 1: ['badge-on', '사용'], 0: ['badge-off', '미사용'] };
  function badge(map, k) { const p = map[k] || ['badge-off', k]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }
  function el(id) { return document.getElementById(id); }
  function fill(id, arr) { el(id).innerHTML = '<option value="">전체</option>' + arr.map(function (v) { return '<option>' + v + '</option>'; }).join(''); }

  function ghRender() {
    const ft = el('fTenant').value, fl = el('fLoc').value, fu = el('fUse').value, kw = (el('q').value || '').trim();
    const rows = DATA.filter(function (r) {
      return (!ft || r.tenant === ft) && (!fl || r.loc === fl)
        && (fu === '' || String(r.use ? 1 : 0) === fu)
        && (!kw || r.name.indexOf(kw) >= 0 || r.host.indexOf(kw) >= 0);
    });
    el('ghBody').innerHTML = rows.length ? rows.map(function (r) {
      return '<tr data-no="' + r.no + '" onclick="ghRowClick(' + r.no + ')">'
        + '<td>' + r.no + '</td>'
        + '<td><span class="gh-tenant">' + r.tenant + '</span></td>'
        + '<td>' + r.name + '</td>'
        + '<td>' + r.loc + '</td>'
        + '<td>' + r.host + '</td>'
        + '<td>' + r.ver + '</td>'
        + '<td>' + r.fac.length + '대</td>'
        + '<td>' + badge(USE, r.use ? 1 : 0) + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="8" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';
    el('ghCount').textContent = rows.length;
  }
  function ghReset() {
    ['fTenant', 'fLoc', 'fUse'].forEach(function (id) { el(id).value = ''; });
    el('q').value = '';
    ghRender();
  }

  function ghRowClick(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    document.querySelectorAll('#ghBody tr').forEach(function (tr) { tr.classList.toggle('selected', Number(tr.dataset.no) === no); });
    el('ghdTitle').textContent = r.tenant + ' · ' + r.name + ' 소속 설비';
    el('ghdBody').innerHTML = r.fac.length
      ? '<table class="gh-fac-list"><thead><tr><th>설비명</th><th style="width:90px;">통신상태</th></tr></thead><tbody>'
        + r.fac.map(function (f) { return '<tr><td>' + f.n + '</td><td>' + badge(LINK, f.l) + '</td></tr>'; }).join('')
        + '</tbody></table>'
      : '<div style="color:#98a2b3;font-size:12px;padding:16px 2px;">연결된 설비가 없습니다.</div>';
    el('ghMask').classList.add('show');
    el('ghDrawer').classList.add('show');
  }
  function ghDrawerClose() {
    el('ghMask').classList.remove('show');
    el('ghDrawer').classList.remove('show');
  }

  fill('fTenant', TENANTS);
  fill('fLoc', LOCATIONS);
  ghRender();

  window.ghRender = ghRender;
  window.ghReset = ghReset;
  window.ghRowClick = ghRowClick;
  window.ghDrawerClose = ghDrawerClose;

})();
