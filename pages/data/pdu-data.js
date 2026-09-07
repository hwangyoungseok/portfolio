// PDU 데이터 조회 페이지 스크립트 (목업 데이터) — UPS 데이터 조회와 동일 패턴
// 화면: 데이터 조회 > PDU 데이터 조회
(function () {

  const DEV_LIST = ['PDU-1F-01', 'PDU-1F-02', 'PDU-2F-01', 'PDU-2F-02', 'PDU-DR-01', 'PDU-DR-02'];
  const METRICS = [
    { key: 'volt', label: '입력전압', unit: 'V' },
    { key: 'curr', label: '입력전류', unit: 'A' },
    { key: 'kw',   label: '유효전력', unit: 'kW' },
    { key: 'pf',   label: '역률',     unit: '' },
    { key: 'freq', label: '주파수',   unit: 'Hz' },
    { key: 'load', label: '부하율',   unit: '%' },
  ];
  const PAGE_SIZE = 20;
  const INTERVAL_HOURS = 6;
  const DAYS = 30;
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

  // ---- 목업 데이터 생성 ----
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
    DATA.sort(function (a, b) { return a.time < b.time ? 1 : (a.time > b.time ? -1 : 0); });
  })();

  // ---- 상태 ----
  const selectedDev = new Set(DEV_LIST);
  const selectedMetrics = new Set(METRICS.map(function (m) { return m.key; }));
  let sortKey = 'time';
  let sortDir = 'desc';
  let currentPage = 1;

  // ---- 다중 선택 드롭다운 (대상 PDU) ----
  function renderDevPanel() {
    const allChecked = selectedDev.size === DEV_LIST.length;
    document.getElementById('mselDevPanel').innerHTML =
      '<label class="msel-all"><input type="checkbox" ' + (allChecked ? 'checked' : '') + ' onchange="mselDevToggleAll(this.checked)">전체</label>'
      + DEV_LIST.map(function (u) {
          return '<label><input type="checkbox" ' + (selectedDev.has(u) ? 'checked' : '') + ' onchange="mselDevToggleOne(\'' + u + '\', this.checked)">' + u + '</label>';
        }).join('');
    const label = selectedDev.size === DEV_LIST.length ? '전체'
      : (selectedDev.size === 0 ? '선택 안함' : selectedDev.size + '개 선택');
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
    renderGrid();
  }
  function clearPresetActive() {
    ['presetToday', 'preset7', 'preset30'].forEach(function (id) { document.getElementById(id).classList.remove('active'); });
  }

  // ---- 정렬 ----
  function sortRows(rows) {
    return rows.slice().sort(function (a, b) {
      const av = a[sortKey], bv = b[sortKey];
      let cmp;
      if (typeof av === 'number') cmp = av - bv;
      else cmp = av < bv ? -1 : (av > bv ? 1 : 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }
  function onSort(key) {
    if (sortKey === key) sortDir = (sortDir === 'asc' ? 'desc' : 'asc');
    else { sortKey = key; sortDir = 'asc'; }
    currentPage = 1;
    renderGrid();
  }

  // ---- 그리드 ----
  function activeMetrics() { return METRICS.filter(function (m) { return selectedMetrics.has(m.key); }); }

  function renderHead() {
    const metrics = activeMetrics();
    const cols = [{ key: 'time', label: '수집시각' }, { key: 'dev', label: 'PDU명' }]
      .concat(metrics.map(function (m) { return { key: m.key, label: m.label + (m.unit ? ' (' + m.unit + ')' : '') }; }));
    document.getElementById('gridHead').innerHTML = cols.map(function (c) {
      const sorted = sortKey === c.key;
      const arrow = sorted ? (sortDir === 'asc' ? '&#9650;' : '&#9660;') : '&#9650;&#9660;';
      return '<th class="sortable' + (sorted ? ' sorted' : '') + '" onclick="onSort(\'' + c.key + '\')">' + c.label + '<span class="sort-arrow">' + arrow + '</span></th>';
    }).join('');
  }

  function renderGrid() {
    const fFrom = document.getElementById('fFrom').value;
    const fTo   = document.getElementById('fTo').value;
    const metrics = activeMetrics();

    const filtered = DATA.filter(function (r) {
      return selectedDev.has(r.dev) && (!fFrom || r.date >= fFrom) && (!fTo || r.date <= fTo);
    });
    const sorted = sortRows(filtered);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    renderHead();
    document.getElementById('gridBody').innerHTML = pageRows.length
      ? pageRows.map(function (r) {
          return '<tr><td>' + r.time + '</td><td>' + r.dev + '</td>'
            + metrics.map(function (m) { return '<td>' + r[m.key] + '</td>'; }).join('') + '</tr>';
        }).join('')
      : '<tr><td colspan="' + (2 + metrics.length) + '" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = sorted.length;
    renderPaging(totalPages);
  }

  function renderPaging(totalPages) {
    const pages = [];
    const add = function (p) { if (pages[pages.length - 1] !== p) pages.push(p); };
    add(1);
    for (let p = currentPage - 2; p <= currentPage + 2; p++) { if (p > 1 && p < totalPages) add(p); }
    if (totalPages > 1) add(totalPages);

    let html = '<button class="page-btn" ' + (currentPage === 1 ? 'disabled' : '') + ' onclick="gotoPage(' + (currentPage - 1) + ')">&#9664;</button>';
    let prev = 0;
    pages.forEach(function (p) {
      if (p - prev > 1) html += '<span class="page-btn" style="border:none;cursor:default;">…</span>';
      html += '<button class="page-btn' + (p === currentPage ? ' active' : '') + '" onclick="gotoPage(' + p + ')">' + p + '</button>';
      prev = p;
    });
    html += '<button class="page-btn" ' + (currentPage === totalPages ? 'disabled' : '') + ' onclick="gotoPage(' + (currentPage + 1) + ')">&#9654;</button>';
    document.getElementById('paging').innerHTML = html;
  }
  function gotoPage(p) { currentPage = p; renderGrid(); }

  function resetSearch() {
    selectedDev.clear(); DEV_LIST.forEach(function (u) { selectedDev.add(u); });
    selectedMetrics.clear(); METRICS.forEach(function (m) { selectedMetrics.add(m.key); });
    renderDevPanel(); renderMetricPanel();
    sortKey = 'time'; sortDir = 'desc'; currentPage = 1;
    applyPreset('7d');
  }

  // ---- 초기화 ----
  renderDevPanel();
  renderMetricPanel();
  applyPreset('7d');

  window.mselToggle = mselToggle;
  window.mselDevToggleAll = mselDevToggleAll;
  window.mselDevToggleOne = mselDevToggleOne;
  window.mselMetricToggleAll = mselMetricToggleAll;
  window.mselMetricToggleOne = mselMetricToggleOne;
  window.applyPreset = applyPreset;
  window.onSort = onSort;
  window.gotoPage = gotoPage;
  window.renderGrid = renderGrid;
  window.resetSearch = resetSearch;

  document.getElementById('fFrom').addEventListener('change', function () { clearPresetActive(); currentPage = 1; renderGrid(); });
  document.getElementById('fTo').addEventListener('change', function () { clearPresetActive(); currentPage = 1; renderGrid(); });

})();
