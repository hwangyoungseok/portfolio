// GW 서버 상태 모니터링 (호스트) — 전 고객사 GW 설치 서버 리소스
// 화면: GW > GW 서버 상태 모니터링 (호스트)
// GW HA 구조: 논리 GW 1개 = 인스턴스(실제 설치 서버) 1~N개. 서버 리소스는 인스턴스 단위로 보고되므로
// 카드도 인스턴스 단위로 그린다. 대부분 GW는 인스턴스 1개라 그룹으로 묶으면 자리만 낭비되므로
// 그룹 박스 없이 전부 한 그리드에 나란히 두고, HA(인스턴스 2대 이상)인 경우만 카드 이름 옆에
// Active/Standby 뱃지를 붙여 같은 GW의 인스턴스끼리 구분한다(1대뿐이면 당연히 Active라 뱃지 생략).
(function () {

  const TENANTS = ['세종클라우드', '대한IDC', '한빛전산', '미래테크'];
  const CRIT = 90, WARN = 70;

  function genHistory(bc, bm, bd) {
    const pts = [];
    for (let h = 0; h < 24; h++) {
      const j = function (b) { return Math.max(1, Math.min(99, Math.round(b + (Math.random() - 0.5) * 16))); };
      pts.push({ h: h, cpu: j(bc), mem: j(bm), disk: Math.max(1, Math.min(99, Math.round(bd + (Math.random() - 0.5) * 4))) });
    }
    return pts;
  }

  // ---- 목업: GW(논리) + 인스턴스(실제 설치 서버) ----
  const DATA = [
    { tenant: '세종클라우드', gw: 'GW-IDC-01', instances: [
      { role: 'Active',  ip: '10.10.1.5', hostname: 'GWHOST-01',  cpu: 42, mem: 61, disk: 38, os: 'Ubuntu 22.04 LTS', uptime: '128일 4시간' },
      { role: 'Standby', ip: '10.10.1.6', hostname: 'GWHOST-01B', cpu: 15, mem: 24, disk: 38, os: 'Ubuntu 22.04 LTS', uptime: '128일 4시간' },
    ]},
    { tenant: '세종클라우드', gw: 'GW-IDC-02', instances: [
      { role: 'Active', ip: '10.10.2.5', hostname: 'GWHOST-02', cpu: 91, mem: 88, disk: 72, os: 'Ubuntu 22.04 LTS', uptime: '6일 2시간' },
    ]},
    { tenant: '세종클라우드', gw: 'GW-DR-01', instances: [
      { role: 'Active', ip: '10.20.1.5', hostname: 'GWHOST-03', cpu: 55, mem: 47, disk: 83, os: 'CentOS 7.9', uptime: '302일 11시간' },
    ]},
    { tenant: '대한IDC', gw: 'GW-A-01', instances: [
      { role: 'Active', ip: '172.16.0.11', hostname: 'DHIDC-GW01', cpu: 38, mem: 52, disk: 44, os: 'Rocky Linux 9', uptime: '77일 6시간' },
    ]},
    { tenant: '한빛전산', gw: 'GW-01', instances: [
      { role: 'Active',  ip: '192.168.10.20', hostname: 'HANBIT-GW',  cpu: 47, mem: 93, disk: 61, os: 'Ubuntu 20.04 LTS', uptime: '41일 9시간' },
      { role: 'Standby', ip: '192.168.10.21', hostname: 'HANBIT-GW-B', cpu: 20, mem: 33, disk: 61, os: 'Ubuntu 20.04 LTS', uptime: '41일 9시간' },
    ]},
    { tenant: '한빛전산', gw: 'GW-02', instances: [
      { role: 'Active', ip: '192.168.20.20', hostname: 'HANBIT-GW2', cpu: 22, mem: 35, disk: 29, os: 'Ubuntu 22.04 LTS', uptime: '15일 3시간' },
    ]},
    { tenant: '미래테크', gw: 'GW-MAIN', instances: [
      { role: 'Active', ip: '10.30.1.9', hostname: 'MRT-GW-MAIN', cpu: 61, mem: 58, disk: 95, os: 'Debian 12', uptime: '210일 1시간' },
    ]},
    { tenant: '미래테크', gw: 'GW-LAB', instances: [
      { role: 'Active', ip: '10.30.5.5', hostname: 'MRT-LAB', cpu: 12, mem: 28, disk: 33, os: 'Ubuntu 22.04 LTS', uptime: '3일 7시간' },
    ]},
  ];
  DATA.forEach(function (g) { g.instances.forEach(function (ins) { ins.history = genHistory(ins.cpu, ins.mem, ins.disk); }); });

  function el(id) { return document.getElementById(id); }
  function fill(id, arr) { el(id).innerHTML = '<option value="">전체</option>' + arr.map(function (v) { return '<option>' + v + '</option>'; }).join(''); }
  function lvl(v) { return v >= CRIT ? 'crit' : (v >= WARN ? 'warn' : ''); }
  function gauge(label, v) {
    return '<div class="gauge"><span class="gauge-label">' + label + '</span>'
      + '<div class="gauge-track"><div class="gauge-fill ' + lvl(v) + '" style="width:' + v + '%;"></div></div>'
      + '<span class="gauge-pct">' + v + '%</span></div>';
  }
  function roleBadge(role) {
    return role === 'Active' ? '<span class="gwsrv-role-badge active">Active</span>' : '<span class="gwsrv-role-badge standby">Standby · 백업</span>';
  }

  function gvRefreshGwList() {
    const ft = el('fTenant').value;
    const names = DATA.filter(function (r) { return !ft || r.tenant === ft; }).map(function (r) { return r.gw; });
    fill('fGw', names);
  }

  function instanceCard(g, ins) {
    const crit = [ins.cpu, ins.mem, ins.disk].some(function (v) { return v >= CRIT; });
    const ha = g.instances.length > 1;   // 1대뿐이면 뻔히 Active라 뱃지 생략
    return '<div class="gwsrv-card' + (crit ? ' crit' : '') + (ins.role === 'Standby' ? ' standby' : '') + '" onclick="gvOpenTrend(\'' + g.gw + '\',\'' + ins.ip + '\')">'
      + '<div class="gwsrv-name">' + g.gw + (ha ? ' ' + roleBadge(ins.role) : '') + (crit ? ' <span class="badge badge-crit">경고</span>' : '') + '</div>'
      + '<div class="gwsrv-tenant">' + g.tenant + '</div>'
      + '<div class="gwsrv-ip">' + ins.hostname + ' · ' + ins.ip + '</div>'
      + '<div class="gwsrv-gauges">' + gauge('CPU', ins.cpu) + gauge('메모리', ins.mem) + gauge('디스크', ins.disk) + '</div>'
      + '<div class="gwsrv-meta">'
      + '<div><span>OS 정보</span><span>' + ins.os + '</span></div>'
      + '<div><span>가동시간</span><span>' + ins.uptime + '</span></div>'
      + '</div></div>';
  }

  function gvRender() {
    const ft = el('fTenant').value, fg = el('fGw').value;
    const groups = DATA.filter(function (r) { return (!ft || r.tenant === ft) && (!fg || r.gw === fg); });
    const grid = el('gvGrid');
    const cards = [];
    groups.forEach(function (g) { g.instances.forEach(function (ins) { cards.push(instanceCard(g, ins)); }); });
    grid.innerHTML = cards.length ? cards.join('') : '<div class="gwsrv-empty">조회된 서버 정보가 없습니다.</div>';
  }
  function gvReset() {
    ['fTenant', 'fGw'].forEach(function (id) { el(id).value = ''; });
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
  function gvOpenTrend(gwName, ip) {
    const g = DATA.filter(function (x) { return x.gw === gwName; })[0];
    if (!g) return;
    const ins = g.instances.filter(function (x) { return x.ip === ip; })[0];
    if (!ins) return;
    el('gvTrendTitle').textContent = g.tenant + ' · ' + g.gw + ' (' + ins.hostname + (ins.role === 'Standby' ? ' · 백업' : '') + ') 리소스 추이 (최근 24시간)';
    el('gvTrendChart').innerHTML = trendSvg(ins.history);
    el('gvTrendModal').classList.add('show');
  }
  function gvTrendClose() { el('gvTrendModal').classList.remove('show'); }

  fill('fTenant', TENANTS);
  gvRefreshGwList();
  gvRender();

  window.gvRefreshGwList = gvRefreshGwList;
  window.gvRender = gvRender;
  window.gvReset = gvReset;
  window.gvOpenTrend = gvOpenTrend;
  window.gvTrendClose = gvTrendClose;

})();
