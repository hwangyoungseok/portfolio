// UPS Trend 차트 페이지 스크립트 (목업 데이터)
// 화면: 데이터 조회 > UPS Trend 차트
(function () {

  const UPS_LIST = ['UPS-1F-A', 'UPS-1F-B', 'UPS-1F-C', 'UPS-2F-A', 'UPS-2F-B', 'UPS-DR-1', 'UPS-DR-2'];
  const METRICS = [
    { key: 'inV',  label: '입력전압', unit: 'V',  color: '#2ecc71' },
    { key: 'outV', label: '출력전압', unit: 'V',  color: '#8e44ad' },
    { key: 'load', label: '부하율',   unit: '%',  color: '#e08a1e' },
    { key: 'freq', label: '주파수',   unit: 'Hz', color: '#1a6ed8' },
    { key: 'temp', label: '온도',     unit: '℃', color: '#145a32' },
  ];

  const INTERVAL_HOURS = 2;
  const DAYS = 30;
  const MAX_SERIES = 10;

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function dateOnly(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function jitter(range) { return (Math.random() - 0.5) * 2 * range; }
  function round(v, digits) { const p = Math.pow(10, digits); return Math.round(v * p) / p; }

  // ---- 목업 데이터 생성: 최근 30일, UPS별 2시간 간격 ----
  // UPS 계측값은 실제로 거의 평평하다가 아주 서서히만 흔들리는 값이라(정전 같은 이벤트가 아닌 한),
  // 매 시점 독립적인 난수(white noise)를 쓰면 들쭉날쭉한 낙서처럼 보인다.
  // 그래서 직전 값에서 아주 조금씩만 움직이고 기준선으로 서서히 복귀하는 랜덤워크(평균회귀)로 생성한다.
  // 생성은 과거 -> 현재 순서로 진행해야 연속성이 생기므로, i(now로부터 몇 스텝 전인지)를 큰 값부터 줄여나간다.
  const DATA = [];
  (function gen() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const totalPoints = Math.floor((DAYS * 24) / INTERVAL_HOURS);
    UPS_LIST.forEach(function (name, idx) {
      const baseIn = 220 + (idx % 3) * 2;
      const baseLoad = 20 + (idx * 7) % 50;
      const baseTemp = 24 + (idx % 4) * 2;

      let inV = baseIn, load = baseLoad, temp = baseTemp, freq = 60;
      for (let i = totalPoints - 1; i >= 0; i--) {
        const t = new Date(now.getTime() - i * INTERVAL_HOURS * 60 * 60 * 1000);

        // 입력전압: 상용전원이라 거의 고정 — 미세하게만 흔들리고 기준선으로 서서히 복귀
        inV += jitter(0.5) - (inV - baseIn) * 0.06;
        if (Math.random() < 0.004) inV += jitter(8);   // 아주 가끔(순간전압강하 등) 크게 튐

        // 부하율: 업무시간대에 완만히 높아지는 하루 주기 + 작은 랜덤워크
        const dayPattern = Math.sin((t.getHours() / 24) * Math.PI * 2 - Math.PI / 2) * 6;
        load += jitter(1) - (load - (baseLoad + dayPattern)) * 0.12;
        load = Math.max(5, Math.min(95, load));

        // 온도: 실내온도라 하루 단위로만 아주 천천히 변함
        temp += jitter(0.12) - (temp - baseTemp) * 0.04;

        // 주파수: 계통 주파수라 60Hz 근방에서 거의 안 움직임 — 다른 지표와 마찬가지로 랜덤워크 처리
        freq += jitter(0.015) - (freq - 60) * 0.08;

        DATA.push({
          time: fmt(t), date: dateOnly(t), ups: name,
          inV: round(inV, 1),
          outV: round(inV - 1 + jitter(0.2), 1),
          load: round(load, 1),
          freq: round(freq, 2),
          temp: round(temp, 1),
        });
      }
    });
    DATA.sort(function (a, b) { return a.time < b.time ? -1 : (a.time > b.time ? 1 : 0); });
  })();

  const ROW_INDEX = {};
  DATA.forEach(function (r) { ROW_INDEX[r.ups + '|' + r.time] = r; });

  // ---- 상태 ----
  const selectedUps = new Set(['UPS-1F-A']);
  const selectedMetrics = new Set(METRICS.map(function (m) { return m.key; }));
  const hiddenSeries = new Set();
  let zoomRange = null;   // [startTime, endTime] | null
  let lastScale = null;   // {padL, plotW, n, domain}

  // ---- 다중 선택 드롭다운 (대상 UPS, 단일/복수 선택 가능) ----
  function renderUpsPanel() {
    const allChecked = selectedUps.size === UPS_LIST.length;
    document.getElementById('mselUpsPanel').innerHTML =
      '<label class="msel-all"><input type="checkbox" ' + (allChecked ? 'checked' : '') + ' onchange="mselUpsToggleAll(this.checked)">전체</label>'
      + UPS_LIST.map(function (u) {
          return '<label><input type="checkbox" ' + (selectedUps.has(u) ? 'checked' : '') + ' onchange="mselUpsToggleOne(\'' + u + '\', this.checked)">' + u + '</label>';
        }).join('');
    let label;
    if (selectedUps.size === 0) label = '선택 안함';
    else if (selectedUps.size === UPS_LIST.length) label = '전체';
    else if (selectedUps.size === 1) label = Array.from(selectedUps)[0];
    else label = selectedUps.size + '개 선택';
    document.getElementById('mselUpsLabel').textContent = label;
  }
  function mselUpsToggleAll(checked) {
    selectedUps.clear();
    if (checked) UPS_LIST.forEach(function (u) { selectedUps.add(u); });
    renderUpsPanel();
  }
  function mselUpsToggleOne(u, checked) {
    if (checked) selectedUps.add(u); else selectedUps.delete(u);
    renderUpsPanel();
  }

  // ---- 다중 선택 드롭다운 (계측 항목) ----
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

  // ---- 조회기간 프리셋 ----
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

  // ---- 색상: 같은 계측항목이라도 UPS별로 명도를 달리해 구분 ----
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

  // ---- 시리즈(대상 UPS × 계측 항목) 구성 ----
  function buildSeriesList() {
    const upsArr = Array.from(selectedUps);
    const metricArr = METRICS.filter(function (m) { return selectedMetrics.has(m.key); });
    let list = [];
    upsArr.forEach(function (u, ui) {
      metricArr.forEach(function (m) {
        const amt = upsArr.length <= 1 ? 0 : ((ui / (upsArr.length - 1)) - 0.5) * 0.8;
        list.push({
          id: u + '|' + m.key, ups: u, metric: m,
          label: upsArr.length > 1 ? (u + ' · ' + m.label) : m.label,
          color: shade(m.color, amt),
        });
      });
    });
    const truncated = list.length > MAX_SERIES;
    if (truncated) list = list.slice(0, MAX_SERIES);
    return { list: list, truncated: truncated };
  }

  // ---- x축 도메인(조회기간 내 실제 수집시각 목록, 줌 적용) ----
  function buildDomain(fFrom, fTo) {
    const set = new Set();
    DATA.forEach(function (r) {
      if (selectedUps.has(r.ups) && (!fFrom || r.date >= fFrom) && (!fTo || r.date <= fTo)) set.add(r.time);
    });
    let domain = Array.from(set).sort();
    if (zoomRange) domain = domain.filter(function (t) { return t >= zoomRange[0] && t <= zoomRange[1]; });
    return domain;
  }

  // ---- Catmull-Rom -> Bezier 스무스 패스 ----
  // 제어점의 y를 구간 양끝 값 사이로 clamp → 베지어 곡선은 제어점들의 convex hull
  // 안에만 그려지므로, 급격한 지그재그에서도 실제 최대/최소 범위를 넘어 튀어나오지 않는다.
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

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
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = clamp(p1.y + (p2.y - p0.y) / 6, yLo, yHi);
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = clamp(p2.y - (p3.y - p1.y) / 6, yLo, yHi);
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2.x + ',' + p2.y;
    }
    return d;
  }

  // ---- 메인 렌더 ----
  let lastDomain = null, lastSeriesList = null;

  function renderChart() {
    const fFrom = document.getElementById('fFrom').value;
    const fTo = document.getElementById('fTo').value;

    const domain = buildDomain(fFrom, fTo);
    const built = buildSeriesList();
    if (built.truncated) umsToast('선택한 UPS·계측항목 조합이 많아 처음 ' + MAX_SERIES + '개 계열만 표시합니다.');

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
      const row = ROW_INDEX[s.ups + '|' + t];
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

  // ---- 차트 영역 드래그 확대 / 더블클릭 원복 ----
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
      if (x1 - x0 < 8) return; // 클릭 수준 이동은 무시
      const idx0 = Math.round(((x0 - lastScale.padL) / lastScale.plotW) * (lastScale.n - 1));
      const idx1 = Math.round(((x1 - lastScale.padL) / lastScale.plotW) * (lastScale.n - 1));
      const a = Math.max(0, Math.min(lastScale.n - 1, idx0));
      const b = Math.max(0, Math.min(lastScale.n - 1, idx1));
      if (b - a < 1) return;
      zoomRange = [lastScale.domain[a], lastScale.domain[b]];
      renderChart();
    });
    wrap.addEventListener('dblclick', function () {
      zoomRange = null;
      renderChart();
    });
  }

  function resetSearch() {
    selectedUps.clear(); selectedUps.add(UPS_LIST[0]);
    selectedMetrics.clear(); METRICS.forEach(function (m) { selectedMetrics.add(m.key); });
    hiddenSeries.clear();
    zoomRange = null;
    renderUpsPanel();
    renderMetricPanel();
    applyPreset('7d');
  }

  // ---- 초기화 ----
  renderUpsPanel();
  renderMetricPanel();
  initZoomDrag();
  applyPreset('7d');

  // chartWrap 의 실제 크기가 확정될 때마다(최초 레이아웃 포함) 다시 그린다.
  // 최초 렌더 시점엔 getBoundingClientRect() 가 아직 최종 크기를 반영하지 못해
  // 축 라벨이 잘리거나 사라져 보일 수 있는데, ResizeObserver 는 관찰을 시작하면
  // 레이아웃이 실제로 끝난 뒤의 정확한 크기로 최소 한 번은 콜백을 보장해 준다
  // (requestAnimationFrame 한 프레임만으로는 부족한 경우가 있어 이 방식으로 교체).
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(function () {
      if (lastDomain) renderSvg(lastDomain, lastSeriesList);
    });
    ro.observe(document.getElementById('chartWrap'));
  }

  window.addEventListener('resize', function () { renderChart(); });

  window.mselToggle = mselToggle;
  window.mselUpsToggleAll = mselUpsToggleAll;
  window.mselUpsToggleOne = mselUpsToggleOne;
  window.mselMetricToggleAll = mselMetricToggleAll;
  window.mselMetricToggleOne = mselMetricToggleOne;
  window.applyPreset = applyPreset;
  window.renderChart = renderChart;
  window.resetSearch = resetSearch;
  window.toggleSeries = toggleSeries;

  document.getElementById('fFrom').addEventListener('change', function () { clearPresetActive(); zoomRange = null; renderChart(); });
  document.getElementById('fTo').addEventListener('change', function () { clearPresetActive(); zoomRange = null; renderChart(); });

})();
