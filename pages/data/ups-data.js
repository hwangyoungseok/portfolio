// UPS 데이터 조회 페이지 스크립트 (목업 데이터)
// 화면: 데이터 조회 > UPS 데이터 조회
(function () {

  const UPS_LIST = ['UPS-1F-A', 'UPS-1F-B', 'UPS-1F-C', 'UPS-2F-A', 'UPS-2F-B', 'UPS-DR-1', 'UPS-DR-2'];
  const METRICS = [
    { key: 'inV',  label: '입력전압', unit: 'V' },
    { key: 'outV', label: '출력전압', unit: 'V' },
    { key: 'load', label: '부하율',   unit: '%' },
    { key: 'freq', label: '주파수',   unit: 'Hz' },
    { key: 'temp', label: '온도',     unit: '℃' },
  ];
  const PAGE_SIZE = 20;
  const INTERVAL_HOURS = 6;
  const DAYS = 30;

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmt(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function dateOnly(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function jitter(range) { return (Math.random() - 0.5) * 2 * range; }
  function round(v, digits) { const p = Math.pow(10, digits); return Math.round(v * p) / p; }

  // ---- 목업 데이터 생성: 최근 30일, UPS별 2시간 간격 ----
  const DATA = [];
  (function gen() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const totalPoints = Math.floor((DAYS * 24) / INTERVAL_HOURS);
    UPS_LIST.forEach(function (name, idx) {
      const baseIn = 220 + (idx % 3) * 2;
      const baseLoad = 20 + (idx * 7) % 50;
      const baseTemp = 24 + (idx % 4) * 2;
      for (let i = 0; i < totalPoints; i++) {
        const t = new Date(now.getTime() - i * INTERVAL_HOURS * 60 * 60 * 1000);
        const inV  = round(baseIn + jitter(3), 1);
        DATA.push({
          time: fmt(t), date: dateOnly(t), ups: name,
          inV: inV,
          outV: round(inV - 1 + jitter(1), 1),
          load: Math.max(1, Math.min(99, round(baseLoad + jitter(8), 1))),
          freq: round(60 + jitter(0.2), 2),
          temp: round(baseTemp + jitter(2.5), 1),
        });
      }
    });
    DATA.sort(function (a, b) { return a.time < b.time ? 1 : (a.time > b.time ? -1 : 0); });
  })();

  // ---- 상태 ----
  const selectedUps = new Set(UPS_LIST);
  const selectedMetrics = new Set(METRICS.map(function (m) { return m.key; }));
  let sortKey = 'time';
  let sortDir = 'desc';
  let currentPage = 1;

  // ---- 다중 선택 드롭다운 (대상 UPS) ----
  function renderUpsPanel() {
    const allChecked = selectedUps.size === UPS_LIST.length;
    document.getElementById('mselUpsPanel').innerHTML =
      '<label class="msel-all"><input type="checkbox" ' + (allChecked ? 'checked' : '') + ' onchange="mselUpsToggleAll(this.checked)">전체</label>'
      + UPS_LIST.map(function (u) {
          return '<label><input type="checkbox" ' + (selectedUps.has(u) ? 'checked' : '') + ' onchange="mselUpsToggleOne(\'' + u + '\', this.checked)">' + u + '</label>';
        }).join('');
    const label = selectedUps.size === UPS_LIST.length ? '전체'
      : (selectedUps.size === 0 ? '선택 안함' : selectedUps.size + '개 선택');
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
    const cols = [{ key: 'time', label: '수집시각' }, { key: 'ups', label: 'UPS명' }]
      .concat(metrics.map(function (m) { return { key: m.key, label: m.label + ' (' + m.unit + ')' }; }));
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
      return selectedUps.has(r.ups)
        && (!fFrom || r.date >= fFrom)
        && (!fTo   || r.date <= fTo);
    });

    const sorted = sortRows(filtered);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    renderHead();

    document.getElementById('gridBody').innerHTML = pageRows.length
      ? pageRows.map(function (r) {
          return '<tr><td>' + r.time + '</td><td>' + r.ups + '</td>'
            + metrics.map(function (m) { return '<td>' + r[m.key] + '</td>'; }).join('')
            + '</tr>';
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
    selectedUps.clear();
    UPS_LIST.forEach(function (u) { selectedUps.add(u); });
    selectedMetrics.clear();
    METRICS.forEach(function (m) { selectedMetrics.add(m.key); });
    renderUpsPanel();
    renderMetricPanel();
    sortKey = 'time'; sortDir = 'desc'; currentPage = 1;
    applyPreset('7d');
  }

  // ---- 초기화 ----
  renderUpsPanel();
  renderMetricPanel();
  applyPreset('7d');

  window.mselToggle = mselToggle;
  window.mselUpsToggleAll = mselUpsToggleAll;
  window.mselUpsToggleOne = mselUpsToggleOne;
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
