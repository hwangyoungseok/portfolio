// 배터리 실시간 모니터링 페이지 스크립트 (목업 데이터)
// 화면: 데이터 조회 > 배터리 실시간 모니터링
(function () {

  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];
  const UPS_LOC = {
    'UPS-1F-A': '본사 IDC-1F', 'UPS-1F-B': '본사 IDC-1F', 'UPS-1F-C': '본사 IDC-1F',
    'UPS-2F-A': '본사 IDC-2F', 'UPS-2F-B': '본사 IDC-2F',
    'UPS-DR-1': '판교 DR센터', 'UPS-DR-2': '판교 DR센터',
  };
  const UPS_LIST = Object.keys(UPS_LOC);

  const BATTERIES = [
    { id: 'BAT-1F-A-1', ups: 'UPS-1F-A' },
    { id: 'BAT-1F-B-1', ups: 'UPS-1F-B' },
    { id: 'BAT-1F-B-2', ups: 'UPS-1F-B' },
    { id: 'BAT-1F-C-1', ups: 'UPS-1F-C' },
    { id: 'BAT-2F-A-1', ups: 'UPS-2F-A' },
    { id: 'BAT-2F-B-1', ups: 'UPS-2F-B' },
    { id: 'BAT-2F-B-2', ups: 'UPS-2F-B' },
    { id: 'BAT-DR-1-1', ups: 'UPS-DR-1' },
    { id: 'BAT-DR-2-1', ups: 'UPS-DR-2' },
  ];

  function jitter(range) { return (Math.random() - 0.5) * 2 * range; }
  function round(v, digits) { const p = Math.pow(10, digits); return Math.round(v * p) / p; }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // ---- 목업 데이터: 배터리별 현재값 + 최근 24시간 이력(시간당) ----
  BATTERIES.forEach(function (b, idx) {
    b.loc = UPS_LOC[b.ups];
    b.baseTemp = 24 + (idx % 4) * 1.8;
    b.baseSoh = 96 - idx * 0.5;
    b.baseSoc = idx === 2 ? 42 : 90 + jitter(6); // 하나는 경고/위험 시나리오용으로 낮게
    b.soc = Math.round(clamp(b.baseSoc + jitter(3), 5, 100));
    b.soh = round(clamp(b.baseSoh + jitter(1), 60, 100), 1);
    b.temp = round(b.baseTemp + jitter(1.5), 1);
    b.history = [];
    for (let h = 23; h >= 0; h--) {
      b.history.push({
        h: 23 - h,
        soc: Math.round(clamp(b.baseSoc + jitter(5), 5, 100)),
        soh: round(clamp(b.baseSoh + jitter(1.2), 60, 100), 1),
        temp: round(b.baseTemp + jitter(2), 1),
      });
    }
  });

  function statusOf(b) {
    if (b.soc < 20 || b.soh < 80 || b.temp >= 35) return 'crit';
    if (b.soc < 50 || b.soh < 90 || b.temp >= 30) return 'warn';
    return 'ok';
  }
  const STATUS_LABEL = { ok: '정상', warn: '경고', crit: '위험' };

  function gaugeLevel(pct, kind) {
    if (kind === 'soc') return pct < 20 ? 'crit' : (pct < 50 ? 'warn' : '');
    return pct < 80 ? 'crit' : (pct < 90 ? 'warn' : '');
  }
  function gaugeRow(label, v, kind) {
    const level = gaugeLevel(v, kind);
    return '<div class="gauge">'
      + '<span class="gauge-label">' + label + '</span>'
      + '<div class="gauge-track"><div class="gauge-fill ' + level + '" style="width:' + v + '%;"></div></div>'
      + '<span class="gauge-pct">' + v + '%</span>'
      + '</div>';
  }

  function fillScopeOptions() {
    document.getElementById('locOptions').innerHTML = LOCATIONS.map(function (l) { return '<option value="' + l + '">' + l + '</option>'; }).join('');
    document.getElementById('upsOptions').innerHTML = UPS_LIST.map(function (u) { return '<option value="' + u + '">' + u + '</option>'; }).join('');
  }

  function renderCards() {
    const scope = document.getElementById('fScope').value;
    const rows = BATTERIES.filter(function (b) {
      if (!scope) return true;
      if (LOCATIONS.indexOf(scope) >= 0) return b.loc === scope;
      return b.ups === scope;
    });

    const grid = document.getElementById('batrtGrid');
    if (!rows.length) {
      grid.innerHTML = '<div class="batrt-empty">조회된 배터리가 없습니다.</div>';
      return;
    }

    grid.innerHTML = rows.map(function (b) {
      const st = statusOf(b);
      return '<div class="batrt-card' + (st === 'crit' ? ' crit' : (st === 'warn' ? ' warn' : '')) + '" onclick="batrtOpenTrend(\'' + b.id + '\')">'
        + '<div class="batrt-head"><div class="batrt-name">' + b.id + '</div><div class="batrt-sub">' + b.ups + ' · ' + b.loc + '</div></div>'
        + '<div class="batrt-gauges">' + gaugeRow('SOC', b.soc, 'soc') + gaugeRow('SOH', b.soh, 'soh') + '</div>'
        + '<div class="batrt-bottom">'
        +   '<div class="batrt-temp">현재 온도 <b>' + b.temp + '℃</b></div>'
        +   '<div class="batrt-status ' + st + '">' + STATUS_LABEL[st] + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  // ---- 자동 새로고침 ----
  let refreshTimer = null;

  function tick() {
    BATTERIES.forEach(function (b) {
      b.soc = Math.round(clamp(b.soc + jitter(2), 5, 100));
      b.soh = round(clamp(b.soh + jitter(0.3), 60, 100), 1);
      b.temp = round(clamp(b.temp + jitter(0.4), 15, 45), 1);
    });
    renderCards();
  }

  function toggleAutoRefresh() {
    const on = document.getElementById('autoRefresh').checked;
    if (on) {
      refreshTimer = setInterval(tick, 5000);
      umsToast('자동 새로고침이 켜졌습니다. (5초 주기)');
    } else {
      clearInterval(refreshTimer);
      refreshTimer = null;
      umsToast('자동 새로고침이 꺼졌습니다.');
    }
  }

  // ---- 상세 트렌드 모달 (24h) ----
  function clampV(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function smoothPath(points) {
    if (!points.length) return '';
    if (points.length === 1) return 'M' + points[0].x + ',' + points[0].y;
    let d = 'M' + points[0].x + ',' + points[0].y;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const yLo = Math.min(p1.y, p2.y), yHi = Math.max(p1.y, p2.y);
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = clampV(p1.y + (p2.y - p0.y) / 6, yLo, yHi);
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = clampV(p2.y - (p3.y - p1.y) / 6, yLo, yHi);
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2.x + ',' + p2.y;
    }
    return d;
  }

  function buildTrendSvg(history) {
    const W = 620, H = 220, padL = 32, padR = 12, padT = 12, padB = 22;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = history.length;

    function x(i) { return padL + (plotW * i) / (n - 1); }

    function series(key, color) {
      const vals = history.map(function (p) { return p[key]; });
      const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      const span = (max - min) || 1;
      const points = vals.map(function (v, i) { return { x: x(i), y: padT + plotH - (plotH * (v - min)) / span }; });
      return '<path d="' + smoothPath(points) + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    }

    const gridLines = [0, 1, 2, 3, 4].map(function (g) {
      const y = padT + (plotH * g) / 4;
      return '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#eef1f4" stroke-width="1"/>';
    }).join('');

    const xLabels = history.filter(function (p) { return p.h % 4 === 0; }).map(function (p) {
      return '<text x="' + x(p.h) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="#98a2b3">' + p.h + 'h</text>';
    }).join('');

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '">'
      + gridLines + xLabels
      + series('soc', '#3498db') + series('soh', '#1a5276') + series('temp', '#e08a1e')
      + '</svg>';
  }

  function batrtOpenTrend(id) {
    const b = BATTERIES.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    document.getElementById('trendTitle').textContent = b.id + ' 상세 트렌드 (최근 24시간)';
    document.getElementById('trendChart').innerHTML = buildTrendSvg(b.history);
    document.getElementById('trendModal').classList.add('show');
  }
  function trendClose() { document.getElementById('trendModal').classList.remove('show'); }

  // ---- 초기화 ----
  fillScopeOptions();
  renderCards();

  window.renderCards = renderCards;
  window.toggleAutoRefresh = toggleAutoRefresh;
  window.batrtOpenTrend = batrtOpenTrend;
  window.trendClose = trendClose;

})();
