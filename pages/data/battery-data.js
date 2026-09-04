// 배터리 데이터 조회 페이지 스크립트 (목업 데이터)
// 화면: 데이터 조회 > 배터리 데이터 조회
(function () {

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
  const BAT_IDS = BATTERIES.map(function (b) { return b.id; });
  const BAT_MAP = {}; BATTERIES.forEach(function (b) { BAT_MAP[b.id] = b; });

  const METRICS = [
    { key: 'volt', label: '전압',     unit: 'V' },
    { key: 'curr', label: '전류',     unit: 'A' },
    { key: 'temp', label: '온도',     unit: '℃' },
    { key: 'soc',  label: 'SOC',      unit: '%' },
    { key: 'soh',  label: 'SOH',      unit: '%' },
    { key: 'ir',   label: '내부저항', unit: 'mΩ' },
  ];

  const PAGE_SIZE = 20;
  const INTERVAL_HOURS = 8;
  const DAYS = 30;

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmt(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function dateOnly(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function jitter(range) { return (Math.random() - 0.5) * 2 * range; }
  function round(v, digits) { const p = Math.pow(10, digits); return Math.round(v * p) / p; }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // ---- 목업 데이터 생성: 최근 30일, 배터리별 8시간 간격 ----
  const DATA = [];
  (function gen() {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const totalPoints = Math.floor((DAYS * 24) / INTERVAL_HOURS);
    BATTERIES.forEach(function (b, idx) {
      const baseTemp = 24 + (idx % 4) * 1.5;
      const baseSoh = 96 - idx * 0.4;
      const baseIr = 26 + (idx % 3) * 3;
      for (let i = 0; i < totalPoints; i++) {
        const t = new Date(now.getTime() - i * INTERVAL_HOURS * 60 * 60 * 1000);
        DATA.push({
          time: fmt(t), date: dateOnly(t), bat: b.id, ups: b.ups,
          volt: round(53.5 + jitter(0.6), 2),
          curr: round(0.4 + jitter(1.2), 2),
          temp: round(baseTemp + jitter(2), 1),
          soc: Math.round(clamp(92 + jitter(4), 60, 100)),
          soh: round(clamp(baseSoh + jitter(1), 80, 100), 1),
          ir: round(clamp(baseIr + jitter(3), 10, 60), 1),
        });
      }
    });
    DATA.sort(function (a, b) { return a.time < b.time ? 1 : (a.time > b.time ? -1 : 0); });
  })();

  // ---- 상태 ----
  const selectedBat = new Set(BAT_IDS);
  const selectedMetrics = new Set(METRICS.map(function (m) { return m.key; }));
  let sortKey = 'time';
  let sortDir = 'desc';
  let currentPage = 1;

  // ---- 다중 선택 드롭다운 (대상 배터리/소속UPS) ----
  function renderBatPanel() {
    const allChecked = selectedBat.size === BAT_IDS.length;
    document.getElementById('mselBatPanel').innerHTML =
      '<label class="msel-all"><input type="checkbox" ' + (allChecked ? 'checked' : '') + ' onchange="mselBatToggleAll(this.checked)">전체</label>'
      + BATTERIES.map(function (b) {
          return '<label><input type="checkbox" ' + (selectedBat.has(b.id) ? 'checked' : '') + ' onchange="mselBatToggleOne(\'' + b.id + '\', this.checked)">' + b.id + ' <span style="color:#98a2b3;">(' + b.ups + ')</span></label>';
        }).join('');
    const label = selectedBat.size === BAT_IDS.length ? '전체'
      : (selectedBat.size === 0 ? '선택 안함' : selectedBat.size + '개 선택');
    document.getElementById('mselBatLabel').textContent = label;
  }
  function mselBatToggleAll(checked) {
    selectedBat.clear();
    if (checked) BAT_IDS.forEach(function (id) { selectedBat.add(id); });
    renderBatPanel();
  }
  function mselBatToggleOne(id, checked) {
    if (checked) selectedBat.add(id); else selectedBat.delete(id);
    renderBatPanel();
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
    const cols = [{ key: 'time', label: '수집시각' }, { key: 'bat', label: '배터리 ID' }, { key: 'ups', label: '소속 UPS' }]
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
      return selectedBat.has(r.bat)
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
          return '<tr><td>' + r.time + '</td><td>' + r.bat + '</td><td>' + r.ups + '</td>'
            + metrics.map(function (m) { return '<td>' + r[m.key] + '</td>'; }).join('')
            + '</tr>';
        }).join('')
      : '<tr><td colspan="' + (3 + metrics.length) + '" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

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
    selectedBat.clear();
    BAT_IDS.forEach(function (id) { selectedBat.add(id); });
    selectedMetrics.clear();
    METRICS.forEach(function (m) { selectedMetrics.add(m.key); });
    renderBatPanel();
    renderMetricPanel();
    sortKey = 'time'; sortDir = 'desc'; currentPage = 1;
    applyPreset('7d');
  }

  // ---- 초기화 ----
  renderBatPanel();
  renderMetricPanel();
  applyPreset('7d');

  window.mselToggle = mselToggle;
  window.mselBatToggleAll = mselBatToggleAll;
  window.mselBatToggleOne = mselBatToggleOne;
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
