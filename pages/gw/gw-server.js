// GW 서버 상태 모니터링 페이지 스크립트 (목업 데이터)
// 화면: GW > GW 서버 상태 모니터링
(function () {

  const CRIT = 90, WARN = 70;

  function genHistory(baseCpu, baseMem, baseDisk) {
    const pts = [];
    for (let h = 0; h < 24; h++) {
      const jitter = function (base) {
        return Math.max(1, Math.min(99, Math.round(base + (Math.random() - 0.5) * 16)));
      };
      pts.push({ h: h, cpu: jitter(baseCpu), mem: jitter(baseMem), disk: Math.max(1, Math.min(99, Math.round(baseDisk + (Math.random() - 0.5) * 4))) });
    }
    return pts;
  }

  const DATA = [
    { name: 'GW-IDC-01', cpu: 42, mem: 61, disk: 38, os: 'Ubuntu 22.04 LTS', uptime: '128일 4시간' },
    { name: 'GW-IDC-02', cpu: 91, mem: 88, disk: 72, os: 'Ubuntu 22.04 LTS', uptime: '6일 2시간' },
    { name: 'GW-DR-01',  cpu: 55, mem: 47, disk: 83, os: 'CentOS 7.9',      uptime: '302일 11시간' },
  ];
  DATA.forEach(function (r) { r.history = genHistory(r.cpu, r.mem, r.disk); });

  function fillSelect(id, arr, withAll) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  function gaugeLevel(v) { return v >= CRIT ? 'crit' : (v >= WARN ? 'warn' : ''); }

  function gaugeRow(label, v) {
    const level = gaugeLevel(v);
    return '<div class="gauge">'
      + '<span class="gauge-label">' + label + '</span>'
      + '<div class="gauge-track"><div class="gauge-fill ' + level + '" style="width:' + v + '%;"></div></div>'
      + '<span class="gauge-pct">' + v + '%</span>'
      + '</div>';
  }

  function renderCards() {
    const fGw = document.getElementById('fGw').value;

    const rows = DATA.filter(function (r) {
      return (!fGw || r.name === fGw);
    });

    const grid = document.getElementById('gwsrvGrid');
    if (!rows.length) {
      grid.innerHTML = '<div class="gwsrv-empty">조회된 서버 정보가 없습니다.</div>';
      return;
    }

    grid.innerHTML = rows.map(function (r) {
      const crit = [r.cpu, r.mem, r.disk].some(function (v) { return v >= CRIT; });
      return '<div class="gwsrv-card' + (crit ? ' crit' : '') + '" onclick="gwsrvOpenTrend(\'' + r.name + '\')">'
        + '<div class="gwsrv-name">' + r.name + (crit ? ' <span class="badge badge-crit">경고</span>' : '') + '</div>'
        + '<div class="gwsrv-gauges">'
        +   gaugeRow('CPU', r.cpu) + gaugeRow('메모리', r.mem) + gaugeRow('디스크', r.disk)
        + '</div>'
        + '<div class="gwsrv-meta">'
        +   '<div><span>OS 정보</span><span>' + r.os + '</span></div>'
        +   '<div><span>가동시간</span><span>' + r.uptime + '</span></div>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function resetSearch() {
    document.getElementById('fGw').value = '';
    renderCards();
  }

  // ---- 24h 추이 SVG 라인차트 ----
  function buildTrendSvg(history) {
    const W = 660, H = 220, padL = 32, padR = 12, padT = 12, padB = 24;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = history.length;

    function x(i) { return padL + (plotW * i) / (n - 1); }
    function y(v) { return padT + plotH - (plotH * v) / 100; }

    function polyline(key, color) {
      const pts = history.map(function (p, i) { return x(i) + ',' + y(p[key]); }).join(' ');
      return '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    }

    const gridLines = [0, 25, 50, 75, 100].map(function (v) {
      return '<line x1="' + padL + '" y1="' + y(v) + '" x2="' + (W - padR) + '" y2="' + y(v) + '" stroke="#eef1f4" stroke-width="1"/>'
        + '<text x="' + (padL - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end" font-size="10" fill="#98a2b3">' + v + '</text>';
    }).join('');

    const xLabels = history.filter(function (p) { return p.h % 4 === 0; }).map(function (p) {
      return '<text x="' + x(p.h) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="#98a2b3">' + p.h + '시</text>';
    }).join('');

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '">'
      + gridLines + xLabels
      + polyline('cpu', '#1a6ed8') + polyline('mem', '#2e9e5b') + polyline('disk', '#e08a1e')
      + '</svg>';
  }

  function gwsrvOpenTrend(name) {
    const r = DATA.filter(function (x) { return x.name === name; })[0];
    if (!r) return;
    document.getElementById('trendTitle').textContent = r.name + ' 리소스 추이 (최근 24시간)';
    document.getElementById('trendChart').innerHTML = buildTrendSvg(r.history);
    document.getElementById('trendModal').classList.add('show');
  }

  function trendClose() { document.getElementById('trendModal').classList.remove('show'); }

  // ---- 초기화 ----
  fillSelect('fGw', DATA.map(function (r) { return r.name; }), true);
  renderCards();

  window.renderCards     = renderCards;
  window.resetSearch     = resetSearch;
  window.gwsrvOpenTrend  = gwsrvOpenTrend;
  window.trendClose      = trendClose;

})();
