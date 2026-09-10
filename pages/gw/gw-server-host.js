// GW 서버 상태 모니터링 (호스트) — 전 고객사 GW 설치 서버 리소스
// 화면: GW > GW 서버 상태 모니터링 (호스트)
(function () {

  const TENANTS = ['세종클라우드', '대한IDC', '한빛전산', '미래테크'];
  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터', 'DR센터', '지사 전산실'];
  const CRIT = 90, WARN = 70;

  function genHistory(bc, bm, bd) {
    const pts = [];
    for (let h = 0; h < 24; h++) {
      const j = function (b) { return Math.max(1, Math.min(99, Math.round(b + (Math.random() - 0.5) * 16))); };
      pts.push({ h: h, cpu: j(bc), mem: j(bm), disk: Math.max(1, Math.min(99, Math.round(bd + (Math.random() - 0.5) * 4))) });
    }
    return pts;
  }

  const DATA = [
    { tenant: '세종클라우드', name: 'GW-IDC-01', loc: '본사 IDC-1F', cpu: 42, mem: 61, disk: 38, os: 'Ubuntu 22.04 LTS', uptime: '128일 4시간' },
    { tenant: '세종클라우드', name: 'GW-IDC-02', loc: '본사 IDC-2F', cpu: 91, mem: 88, disk: 72, os: 'Ubuntu 22.04 LTS', uptime: '6일 2시간' },
    { tenant: '세종클라우드', name: 'GW-DR-01', loc: '판교 DR센터', cpu: 55, mem: 47, disk: 83, os: 'CentOS 7.9', uptime: '302일 11시간' },
    { tenant: '대한IDC', name: 'GW-A-01', loc: '본사 IDC-1F', cpu: 38, mem: 52, disk: 44, os: 'Rocky Linux 9', uptime: '77일 6시간' },
    { tenant: '한빛전산', name: 'GW-01', loc: '본사 IDC-1F', cpu: 47, mem: 93, disk: 61, os: 'Ubuntu 20.04 LTS', uptime: '41일 9시간' },
    { tenant: '한빛전산', name: 'GW-02', loc: '지사 전산실', cpu: 22, mem: 35, disk: 29, os: 'Ubuntu 22.04 LTS', uptime: '15일 3시간' },
    { tenant: '미래테크', name: 'GW-MAIN', loc: '본사 IDC-2F', cpu: 61, mem: 58, disk: 95, os: 'Debian 12', uptime: '210일 1시간' },
    { tenant: '미래테크', name: 'GW-LAB', loc: '지사 전산실', cpu: 12, mem: 28, disk: 33, os: 'Ubuntu 22.04 LTS', uptime: '3일 7시간' },
  ];
  DATA.forEach(function (r) { r.history = genHistory(r.cpu, r.mem, r.disk); });

  function el(id) { return document.getElementById(id); }
  function fill(id, arr) { el(id).innerHTML = '<option value="">전체</option>' + arr.map(function (v) { return '<option>' + v + '</option>'; }).join(''); }
  function lvl(v) { return v >= CRIT ? 'crit' : (v >= WARN ? 'warn' : ''); }
  function gauge(label, v) {
    return '<div class="gauge"><span class="gauge-label">' + label + '</span>'
      + '<div class="gauge-track"><div class="gauge-fill ' + lvl(v) + '" style="width:' + v + '%;"></div></div>'
      + '<span class="gauge-pct">' + v + '%</span></div>';
  }

  function gvRefreshGwList() {
    const ft = el('fTenant').value;
    const names = DATA.filter(function (r) { return !ft || r.tenant === ft; }).map(function (r) { return r.name; });
    fill('fGw', names);
  }

  function gvRender() {
    const ft = el('fTenant').value, fl = el('fLoc').value, fg = el('fGw').value;
    const rows = DATA.filter(function (r) { return (!ft || r.tenant === ft) && (!fl || r.loc === fl) && (!fg || r.name === fg); });
    const grid = el('gvGrid');
    if (!rows.length) { grid.innerHTML = '<div class="gwsrv-empty">조회된 서버 정보가 없습니다.</div>'; return; }
    grid.innerHTML = rows.map(function (r) {
      const crit = [r.cpu, r.mem, r.disk].some(function (v) { return v >= CRIT; });
      return '<div class="gwsrv-card' + (crit ? ' crit' : '') + '" onclick="gvOpenTrend(\'' + r.name + '\')">'
        + '<div class="gwsrv-name">' + r.name + (crit ? ' <span class="badge badge-crit">경고</span>' : '') + '</div>'
        + '<div class="gwsrv-tenant">' + r.tenant + '</div>'
        + '<div class="gwsrv-gauges">' + gauge('CPU', r.cpu) + gauge('메모리', r.mem) + gauge('디스크', r.disk) + '</div>'
        + '<div class="gwsrv-meta">'
        + '<div><span>위치</span><span>' + r.loc + '</span></div>'
        + '<div><span>OS 정보</span><span>' + r.os + '</span></div>'
        + '<div><span>가동시간</span><span>' + r.uptime + '</span></div>'
        + '</div></div>';
    }).join('');
  }
  function gvReset() {
    ['fTenant', 'fLoc', 'fGw'].forEach(function (id) { el(id).value = ''; });
    gvRefreshGwList();
    gvRender();
  }

  function trendSvg(history) {
    const W = 660, H = 220, padL = 32, padR = 12, padT = 12, padB = 24;
    const plotW = W - padL - padR, plotH = H - padT - padB, n = history.length;
    function x(i) { return padL + (plotW * i) / (n - 1); }
    function y(v) { return padT + plotH - (plotH * v) / 100; }
    function poly(key, color) {
      return '<polyline points="' + history.map(function (p, i) { return x(i) + ',' + y(p[key]); }).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    const g = [0, 25, 50, 75, 100].map(function (v) {
      return '<line x1="' + padL + '" y1="' + y(v) + '" x2="' + (W - padR) + '" y2="' + y(v) + '" stroke="#eef1f4"/>'
        + '<text x="' + (padL - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end" font-size="10" fill="#98a2b3">' + v + '</text>';
    }).join('');
    const xl = history.filter(function (p) { return p.h % 4 === 0; }).map(function (p) {
      return '<text x="' + x(p.h) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="#98a2b3">' + p.h + '시</text>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '">' + g + xl
      + poly('cpu', '#1a6ed8') + poly('mem', '#2e9e5b') + poly('disk', '#e08a1e') + '</svg>';
  }
  function gvOpenTrend(name) {
    const r = DATA.filter(function (x) { return x.name === name; })[0];
    if (!r) return;
    el('gvTrendTitle').textContent = r.tenant + ' · ' + r.name + ' 리소스 추이 (최근 24시간)';
    el('gvTrendChart').innerHTML = trendSvg(r.history);
    el('gvTrendModal').classList.add('show');
  }
  function gvTrendClose() { el('gvTrendModal').classList.remove('show'); }

  fill('fTenant', TENANTS);
  fill('fLoc', LOCATIONS);
  gvRefreshGwList();
  gvRender();

  window.gvRefreshGwList = gvRefreshGwList;
  window.gvRender = gvRender;
  window.gvReset = gvReset;
  window.gvOpenTrend = gvOpenTrend;
  window.gvTrendClose = gvTrendClose;

})();
