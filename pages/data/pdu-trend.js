// PDU Trend 차트 페이지 스크립트 (목업 데이터) — UPS Trend 차트와 동일 패턴
// 화면: 데이터 조회 > PDU Trend 차트
(function () {

  const DEV_LIST = ['PDU-1F-01', 'PDU-1F-02', 'PDU-2F-01', 'PDU-2F-02', 'PDU-DR-01', 'PDU-DR-02'];
  const METRICS = [
    { key: 'volt', label: '입력전압', unit: 'V',  color: '#2ecc71' },
    { key: 'curr', label: '입력전류', unit: 'A',  color: '#e08a1e' },
    { key: 'kw',   label: '유효전력', unit: 'kW', color: '#8e44ad' },
    { key: 'pf',   label: '역률',     unit: '',   color: '#145a32' },
    { key: 'freq', label: '주파수',   unit: 'Hz', color: '#1a6ed8' },
    { key: 'load', label: '부하율',   unit: '%',  color: '#c0392b' },
  ];

  const INTERVAL_HOURS = 2;
  const DAYS = 30;
  const MAX_SERIES = 10;
  const RATED_A = 32;

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function dateOnly(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function round(v, digits) { const p = Math.pow(10, digits); return Math.round(v * p) / p; }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // 현실적인 변동: 완만한 저주파 물결 + 작은 노이즈 + 드문 스파이크
  function realistic(base, n, o) {
    const amp = o.amp, noise = o.noise, ph = o.phase || 0;
    const spikeP = o.spikeP == null ? 0.02 : o.spikeP;
    const spikeAmp = o.spikeAmp == null ? amp * 3.5 : o.spikeAmp;
    const arr = [];
    for (let i = 0; i < n; i++) {
      let v = base
        + Math.sin(i / 17 + ph) * amp * 0.6
        + Math.sin(i / 5.3 + ph * 2) * amp * 0.25
        + (Math.random() - 0.5) * 2 * noise;
      if (Math.random() < spikeP) v += (Math.random() - 0.5) * 2 * spikeAmp;
      arr.push(v);
    }
    return arr;
  }

  // ---- 목업 데이터 생성 (시간 오름차순) ----
  const DATA = [];
  (function gen() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const nPts = Math.floor((DAYS * 24) / INTERVAL_HOURS);
    DEV_LIST.forEach(function (name, idx) {
      const volt = realistic(220 + (idx % 3), nPts, { amp: 1.4, noise: 0.4, phase: idx, spikeAmp: 4 });
      const curr = realistic(7 + (idx * 2.5) % 15, nPts, { amp: 0.9, noise: 0.25, phase: idx * 1.3, spikeAmp: 3.5 });
      const pf   = realistic(0.965, nPts, { amp: 0.006, noise: 0.004, phase: idx, spikeP: 0.01, spikeAmp: 0.02 });
      const freq = realistic(60, nPts, { amp: 0.02, noise: 0.015, phase: idx, spikeP: 0.005, spikeAmp: 0.15 });
      for (let i = 0; i < nPts; i++) {
        const t = new Date(now.getTime() - i * INTERVAL_HOURS * 3600 * 1000);
        const c = Math.max(0.3, curr[i]);
        const v = volt[i];
        const p = clamp(pf[i], 0.7, 1);
        DATA.push({
          time: fmt(t), date: dateOnly(t), dev: name,
          volt: round(v, 1),
          curr: round(c, 1),
          kw: round(c * v * p / 1000, 2),
          pf: round(p, 3),
          freq: round(freq[i], 2),
          load: round(clamp(c / RATED_A * 100, 1, 99), 1),
        });
      }
    });
    DATA.sort(function (a, b) { return a.time < b.time ? -1 : (a.time > b.time ? 1 : 0); });
  })();

  const ROW_INDEX = {};
  DATA.forEach(function (r) { ROW_INDEX[r.dev + '|' + r.time] = r; });

  // ---- 상태 ----
  const selectedDev = new Set([DEV_LIST[0]]);
  const selectedMetrics = new Set(METRICS.map(function (m) { return m.key; }));
  const hiddenSeries = new Set();
  let zoomRange = null;
  let lastScale = null;

  function renderDevPanel() {
    const allChecked = selectedDev.size === DEV_LIST.length;
    document.getElementById('mselDevPanel').innerHTML =
      '<label class="msel-all"><input type="checkbox" ' + (allChecked ? 'checked' : '') + ' onchange="mselDevToggleAll(this.checked)">전체</label>'
      + DEV_LIST.map(function (u) {
          return '<label><input type="checkbox" ' + (selectedDev.has(u) ? 'checked' : '') + ' onchange="mselDevToggleOne(\'' + u + '\', this.checked)">' + u + '</label>';
        }).join('');
    let label;
    if (selectedDev.size === 0) label = '선택 안함';
    else if (selectedDev.size === DEV_LIST.length) label = '전체';
    else if (selectedDev.size === 1) label = Array.from(selectedDev)[0];
    else label = selectedDev.size + '개 선택';
    document.getElementById('mselDevLabel').textContent = label;
  }
  function mselDevToggleAll(checked) {
    selectedDev.clear();
    if (checked) DEV_LIST.forEach(function (u) { selectedDev.add(u); });
    renderDevPanel();
  }
  function mselDevToggleOne(u, checked) {
    if (checked) selectedDev.add(u); else selectedDev.delete(u);
    renderDevPanel();
  }

  function renderMetricPanel() {
    const allChecked = selectedMetrics.size === METRICS.length;
    document.getElementById('mselMetricPanel').innerHTML =
      '<label class="msel-all"><input type="checkbox" ' + (allChecked ? 'checked' : '') + ' onchange="mselMetricToggleAll(this.checked)">전체</label>'
      + METRICS.map(function (m) {
          return '<label><input type="checkbox" ' + (selectedMetrics.has(m.key) ? 'checked' : '') + ' onchange="mselMetricToggleOne(\'' + m.key + '\', this.checked)">' + m.label + '</label>';
        }).join('');
    const label = selectedMetrics.size === METRICS.length ? '전체'
      : (selectedMetrics.size === 0 ? '선택 안함' : selectedMetrics.size + '개 선택');
    document.getElementById('mselMetricLabel').textContent = label;
  }
  function mselMetricToggleAll(checked) {
    selectedMetrics.clear();
    if (checked) METRICS.forEach(function (m) { selectedMetrics.add(m.key); });
    renderMetricPanel();
  }
  function mselMetricToggleOne(key, checked) {
    if (checked) selectedMetrics.add(key); else selectedMetrics.delete(key);
    renderMetricPanel();
  }

  function mselToggle(id) {
    const panel = document.getElementById(id + 'Panel');
    const isShown = panel.classList.contains('show');
    document.querySelectorAll('.msel-panel.show').forEach(function (p) { p.classList.remove('show'); });
    if (!isShown) panel.classList.add('show');
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.msel')) {
      document.querySelectorAll('.msel-panel.show').forEach(function (p) { p.classList.remove('show'); });
    }
  });

  function applyPreset(kind) {
    const now = new Date();
    const to = dateOnly(now);
    let from = to;
    if (kind === '7d') { const d = new Date(now); d.setDate(d.getDate() - 6); from = dateOnly(d); }
    if (kind === '30d') { const d = new Date(now); d.setDate(d.getDate() - 29); from = dateOnly(d); }
    document.getElementById('fFrom').value = from;
    document.getElementById('fTo').value = to;
    ['presetToday', 'preset7', 'preset30'].forEach(function (id) { document.getElementById(id).classList.remove('active'); });
    document.getElementById({ today: 'presetToday', '7d': 'preset7', '30d': 'preset30' }[kind]).classList.add('active');
    zoomRange = null;
    renderChart();
  }
  function clearPresetActive() {
    ['presetToday', 'preset7', 'preset30'].forEach(function (id) { document.getElementById(id).classList.remove('active'); });
  }

  function hexToRgb(hex) {
    const v = hex.replace('#', '');
    return { r: parseInt(v.substr(0, 2), 16), g: parseInt(v.substr(2, 2), 16), b: parseInt(v.substr(4, 2), 16) };
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join('');
  }
  function shade(hex, amt) {
    const c = hexToRgb(hex);
    const t = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    return rgbToHex(c.r + (t - c.r) * p, c.g + (t - c.g) * p, c.b + (t - c.b) * p);
  }

  function buildSeriesList() {
    const devArr = Array.from(selectedDev);
    const metricArr = METRICS.filter(function (m) { return selectedMetrics.has(m.key); });
    let list = [];
    devArr.forEach(function (u, ui) {
      metricArr.forEach(function (m) {
        const amt = devArr.length <= 1 ? 0 : ((ui / (devArr.length - 1)) - 0.5) * 0.8;
        list.push({
          id: u + '|' + m.key, dev: u, metric: m,
          label: devArr.length > 1 ? (u + ' · ' + m.label) : m.label,
          color: shade(m.color, amt),
        });
      });
    });
    const truncated = list.length > MAX_SERIES;
    if (truncated) list = list.slice(0, MAX_SERIES);
    return { list: list, truncated: truncated };
  }

  function buildDomain(fFrom, fTo) {
    const set = new Set();
    DATA.forEach(function (r) {
      if (selectedDev.has(r.dev) && (!fFrom || r.date >= fFrom) && (!fTo || r.date <= fTo)) set.add(r.time);
    });
    let domain = Array.from(set).sort();
    if (zoomRange) domain = domain.filter(function (t) { return t >= zoomRange[0] && t <= zoomRange[1]; });
    return domain;
  }

  function clampY(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
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
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = clampY(p1.y + (p2.y - p0.y) / 6, yLo, yHi);
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = clampY(p2.y - (p3.y - p1.y) / 6, yLo, yHi);
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2.x + ',' + p2.y;
    }
    return d;
  }

  let lastDomain = null, lastSeriesList = null;

  function renderChart() {
    const fFrom = document.getElementById('fFrom').value;
    const fTo = document.getElementById('fTo').value;
    const domain = buildDomain(fFrom, fTo);
    const built = buildSeriesList();
    if (built.truncated) umsToast('선택한 PDU·계측항목 조합이 많아 처음 ' + MAX_SERIES + '개 계열만 표시합니다.');
    lastDomain = domain; lastSeriesList = built.list;
    renderLegend(built.list);
    renderSvg(domain, built.list);
    renderSummary(domain, built.list);
  }

  function renderLegend(series) {
    document.getElementById('legend').innerHTML = series.length ? series.map(function (s) {
      const off = hiddenSeries.has(s.id);
      return '<div class="trend-legend-item' + (off ? ' off' : '') + '" onclick="toggleSeries(\'' + s.id + '\')">'
        + '<span class="trend-legend-dot" style="background:' + s.color + ';"></span>' + s.label + '</div>';
    }).join('') : '<div class="trend-hint">표시할 계열이 없습니다.</div>';
  }
  function toggleSeries(id) {
    if (hiddenSeries.has(id)) hiddenSeries.delete(id); else hiddenSeries.add(id);
    renderChart();
  }

  function seriesValues(domain, s) {
    return domain.map(function (t) {
      const row = ROW_INDEX[s.dev + '|' + t];
      return row ? row[s.metric.key] : null;
    });
  }

  function renderSvg(domain, series) {
    const host = document.getElementById('chartSvgHost');
    const rect = document.getElementById('chartWrap').getBoundingClientRect();
    const W = Math.max(300, Math.round(rect.width));
    const H = Math.max(200, Math.round(rect.height));
    const padL = 40, padR = 16, padT = 16, padB = 26;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = domain.length;
    lastScale = { padL: padL, plotW: plotW, n: n, domain: domain };

    if (n < 2 || !series.length) {
      host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%">'
        + '<text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" font-size="12" fill="#98a2b3">표시할 데이터가 없습니다.</text></svg>';
      return;
    }
    function xAt(i) { return padL + (plotW * i) / (n - 1); }

    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%">';
    for (let g = 0; g <= 4; g++) {
      const y = padT + (plotH * g) / 4;
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#eef1f4" stroke-width="1"/>';
    }
    const labelStep = Math.max(1, Math.ceil(n / 7));
    for (let i = 0; i < n; i += labelStep) {
      svg += '<text x="' + xAt(i) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="9" fill="#98a2b3">' + domain[i].slice(5, 16) + '</text>';
    }
    series.forEach(function (s) {
      if (hiddenSeries.has(s.id)) return;
      const vals = seriesValues(domain, s);
      const present = vals.filter(function (v) { return v != null; });
      if (!present.length) return;
      const min = Math.min.apply(null, present), max = Math.max.apply(null, present);
      const span = (max - min) || 1;
      const points = [];
      vals.forEach(function (v, i) {
        if (v == null) return;
        points.push({ x: xAt(i), y: padT + plotH - (plotH * (v - min)) / span });
      });
      svg += '<path d="' + smoothPath(points) + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    });
    svg += '</svg>';
    host.innerHTML = svg;
  }

  function renderSummary(domain, series) {
    const body = document.getElementById('summaryBody');
    if (!series.length) {
      body.innerHTML = '<tr><td colspan="4" style="padding:20px;color:#98a2b3;">표시할 계열이 없습니다.</td></tr>';
      return;
    }
    body.innerHTML = series.map(function (s) {
      const vals = seriesValues(domain, s).filter(function (v) { return v != null; });
      const u = s.metric.unit;
      const dot = '<span class="trend-legend-dot" style="background:' + s.color + ';display:inline-block;margin-right:6px;vertical-align:middle;"></span>';
      if (!vals.length) return '<tr><td style="text-align:left;">' + dot + s.label + '</td><td colspan="3" style="color:#98a2b3;">데이터 없음</td></tr>';
      const avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      const max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
      return '<tr><td style="text-align:left;">' + dot + s.label + '</td>'
        + '<td>' + round(avg, 2) + u + '</td><td>' + max + u + '</td><td>' + min + u + '</td></tr>';
    }).join('');
  }

  let dragging = false, dragStartX = 0;
  function initZoomDrag() {
    const wrap = document.getElementById('chartWrap');
    const box = document.getElementById('zoomBox');
    wrap.addEventListener('mousedown', function (e) {
      dragging = true;
      dragStartX = e.clientX - wrap.getBoundingClientRect().left;
      box.style.left = dragStartX + 'px'; box.style.width = '0px'; box.style.display = 'block';
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      const rect = wrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      box.style.left = Math.min(dragStartX, x) + 'px';
      box.style.width = Math.abs(x - dragStartX) + 'px';
    });
    document.addEventListener('mouseup', function (e) {
      if (!dragging) return;
      dragging = false;
      box.style.display = 'none';
      if (!lastScale) return;
      const rect = wrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const x0 = Math.min(dragStartX, x), x1 = Math.max(dragStartX, x);
      if (x1 - x0 < 8) return;
      const idx0 = Math.round(((x0 - lastScale.padL) / lastScale.plotW) * (lastScale.n - 1));
      const idx1 = Math.round(((x1 - lastScale.padL) / lastScale.plotW) * (lastScale.n - 1));
      const a = Math.max(0, Math.min(lastScale.n - 1, idx0));
      const b = Math.max(0, Math.min(lastScale.n - 1, idx1));
      if (b - a < 1) return;
      zoomRange = [lastScale.domain[a], lastScale.domain[b]];
      renderChart();
    });
    wrap.addEventListener('dblclick', function () { zoomRange = null; renderChart(); });
  }

  function resetSearch() {
    selectedDev.clear(); selectedDev.add(DEV_LIST[0]);
    selectedMetrics.clear(); METRICS.forEach(function (m) { selectedMetrics.add(m.key); });
    hiddenSeries.clear();
    zoomRange = null;
    renderDevPanel();
    renderMetricPanel();
    applyPreset('7d');
  }

  // ---- 초기화 ----
  renderDevPanel();
  renderMetricPanel();
  initZoomDrag();
  applyPreset('7d');

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(function () {
      if (lastDomain) renderSvg(lastDomain, lastSeriesList);
    });
    ro.observe(document.getElementById('chartWrap'));
  }
  window.addEventListener('resize', function () { renderChart(); });

  window.mselToggle = mselToggle;
  window.mselDevToggleAll = mselDevToggleAll;
  window.mselDevToggleOne = mselDevToggleOne;
  window.mselMetricToggleAll = mselMetricToggleAll;
  window.mselMetricToggleOne = mselMetricToggleOne;
  window.applyPreset = applyPreset;
  window.renderChart = renderChart;
  window.resetSearch = resetSearch;
  window.toggleSeries = toggleSeries;

  document.getElementById('fFrom').addEventListener('change', function () { clearPresetActive(); zoomRange = null; renderChart(); });
  document.getElementById('fTo').addEventListener('change', function () { clearPresetActive(); zoomRange = null; renderChart(); });

})();
