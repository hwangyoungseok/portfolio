// 맵 (상태 모니터링) 페이지 스크립트
// 화면: 설비현황 > 맵
// 맵 관리(ums.maps)에서 등록한 맵을 선택 → 배경 위 설비 아이콘을 운영상태 색으로 표시.
// 자동갱신 시 목업 상태가 주기적으로 변함. 아이콘 클릭 → 우측 상태 카드(read-only).
(function () {

  const STORE_KEY = 'ums.maps';
  const REFRESH_MS = 5000;
  const LEVELS = ['ok', 'warn', 'major', 'crit'];
  const OP_LABEL = { ok: '정상', warn: '경고', major: 'Major', crit: 'Critical' };
  const OP_BADGE = { ok: 'badge-ok', warn: 'badge-warn', major: 'badge-major', crit: 'badge-crit' };
  const SHAPE = { 'UPS': 'shape-ups', 'PDU': 'shape-pdu', '칠러': 'shape-chl', '배터리': 'shape-bat' };
  const GLYPH = { 'UPS': 'U', 'PDU': 'P', '칠러': 'C', '배터리': 'B' };

  const $ = function (id) { return document.getElementById(id); };

  // ---- 샘플 도면 (맵 관리와 동일) ----
  function room(x, y, w, h, label) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#f4f6f9" stroke="#9aa5b1" stroke-width="2"/>'
      + '<text x="' + (x + 12) + '" y="' + (y + 22) + '" font-size="15" font-weight="bold" fill="#7b8794">' + label + '</text>';
  }
  function racks(x, y, cols, rows) {
    let s = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      s += '<rect x="' + (x + c * 66) + '" y="' + (y + r * 46) + '" width="52" height="20" rx="2" fill="#dbe3ec" stroke="#b6c1cd" stroke-width="1"/>';
    }
    return s;
  }
  function door(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#fbfcfd"/>'; }
  function sampleSvg() {
    return '<svg viewBox="0 0 1000 640" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'
      + '<rect x="18" y="18" width="964" height="604" fill="#fbfcfd" stroke="#8a95a3" stroke-width="3"/>'
      + room(40, 40, 440, 235, '전산실 A') + room(520, 40, 440, 235, '전산실 B')
      + racks(70, 78, 5, 3) + racks(552, 78, 5, 3)
      + '<rect x="40" y="298" width="920" height="64" fill="#eef1f5" stroke="#c7cfd8" stroke-width="1.5"/>'
      + '<text x="500" y="336" text-anchor="middle" font-size="14" letter-spacing="4" fill="#98a2b3">복 도</text>'
      + room(40, 384, 280, 224, 'UPS실') + room(360, 384, 264, 224, '배터리실') + room(664, 384, 296, 224, '공조기계실')
      + door(250, 275, 30, 23) + door(600, 275, 30, 23)
      + door(168, 362, 30, 22) + door(478, 362, 30, 22) + door(796, 362, 30, 22)
      + '</svg>';
  }

  // ---- 맵 로드 ----
  function loadMaps() {
    try { const m = JSON.parse(localStorage.getItem(STORE_KEY)); if (m && m.length) return m; } catch (e) { /* noop */ }
    try {
      const old = JSON.parse(localStorage.getItem('ums.map'));
      if (old && old.nodes) return [{ id: 'legacy', name: old.name || '맵 1', bg: old.bg || { type: 'sample' }, nodes: old.nodes }];
    } catch (e) { /* noop */ }
    return [];
  }
  const maps = loadMaps();
  let cur = 0;

  // ---- 목업 상태 ----
  function locOf(id) {
    if (id.indexOf('1F') >= 0) return '본사 IDC-1F';
    if (id.indexOf('2F') >= 0) return '본사 IDC-2F';
    if (id.indexOf('DR') >= 0) return '판교 DR센터';
    return '-';
  }
  function nowT() {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function alarmsFor(id, op) {
    if (op === 'crit') return [id + ' 심각 알람 발생 (Critical)', id + ' 관련 임계치 초과'];
    if (op === 'major') return [id + ' 주요 알람 발생 (Major)'];
    if (op === 'warn') return Math.random() < 0.6 ? [id + ' 경고 (Warning)'] : [];
    return [];
  }

  const STATUS = {};   // id -> { op, link, last, alarms }
  function seedStatus() {
    const allIds = {};
    maps.forEach(function (m) { (m.nodes || []).forEach(function (n) { allIds[n.id] = true; }); });
    Object.keys(allIds).forEach(function (id) {
      const r = Math.random();
      const op = r < 0.7 ? 'ok' : (r < 0.86 ? 'warn' : (r < 0.95 ? 'major' : 'crit'));
      const link = Math.random() < 0.06 ? 'off' : 'on';
      STATUS[id] = { op: op, link: link, last: nowT(), alarms: alarmsFor(id, op) };
    });
  }
  seedStatus();

  // 자동갱신 시: 1~2개 설비 상태를 한 단계씩 흔들기 + 최근수신 갱신
  function jitter() {
    const ids = Object.keys(STATUS);
    if (!ids.length) return;
    const n = 1 + Math.floor(Math.random() * 2);
    for (let k = 0; k < n; k++) {
      const id = ids[Math.floor(Math.random() * ids.length)];
      const s = STATUS[id];
      const r = Math.random();
      let li = LEVELS.indexOf(s.op);
      if (r < 0.5) li = Math.max(0, li - 1);        // 호전
      else if (r < 0.85) li = Math.min(3, li + 1);  // 악화
      s.op = LEVELS[li];
      if (Math.random() < 0.05) s.link = (s.link === 'on' ? 'off' : 'on');
      else if (s.link === 'off' && Math.random() < 0.4) s.link = 'on';
      s.alarms = s.link === 'off' ? [id + ' 통신 두절'] : alarmsFor(id, s.op);
    }
    ids.forEach(function (id) { if (STATUS[id].link === 'on') STATUS[id].last = nowT(); });
  }

  function bucketOf(id) {
    const s = STATUS[id];
    if (!s || s.link === 'off') return 'off';
    if (s.op === 'crit' || s.op === 'major') return 'danger';
    if (s.op === 'warn') return 'warn';
    return 'ok';
  }
  function statusClass(id) {
    const s = STATUS[id];
    if (!s || s.link === 'off') return 's-off';
    return 's-' + s.op;
  }

  // ---- 렌더 ----
  const canvas = $('mvCanvas');
  let selId = null;

  function renderMapSel() {
    $('mvMapSel').innerHTML = maps.map(function (m, i) {
      return '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>' + (m.name || ('맵 ' + (i + 1))) + '</option>';
    }).join('');
  }

  function renderBg() {
    const bg = $('mvBg');
    const b = (maps[cur] && maps[cur].bg) || { type: 'sample' };
    bg.innerHTML = (b.type === 'image' && b.data) ? '<img src="' + b.data + '" alt="">' : sampleSvg();
  }

  function renderNodes() {
    Array.prototype.forEach.call(canvas.querySelectorAll('.mv-node'), function (n) { n.remove(); });
    const nodes = (maps[cur] && maps[cur].nodes) || [];
    nodes.forEach(function (n) {
      const s = STATUS[n.id] || {};
      const el = document.createElement('div');
      el.className = 'mv-node ' + statusClass(n.id) + (n.id === selId ? ' selected' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.dataset.id = n.id;
      const badge = (s.alarms && s.alarms.length) ? '<span class="mv-node-badge">' + s.alarms.length + '</span>' : '';
      el.innerHTML = '<span class="mv-node-ic ' + (SHAPE[n.type] || 'shape-ups') + '"><span>' + (GLYPH[n.type] || '?') + '</span>' + badge + '</span>'
        + '<span class="mv-node-lb">' + (n.label || n.id) + '</span>';
      el.addEventListener('click', function () { selectNode(n.id); });
      canvas.appendChild(el);
    });
  }

  function renderSummary() {
    const nodes = (maps[cur] && maps[cur].nodes) || [];
    const c = { ok: 0, warn: 0, danger: 0, off: 0 };
    nodes.forEach(function (n) { c[bucketOf(n.id)]++; });
    $('mvSummary').innerHTML =
      '<span class="mv-chip c-ok">정상 <b>' + c.ok + '</b></span>'
      + '<span class="mv-chip c-warn">경고 <b>' + c.warn + '</b></span>'
      + '<span class="mv-chip c-danger">위험 <b>' + c.danger + '</b></span>'
      + '<span class="mv-chip c-off">오프라인 <b>' + c.off + '</b></span>';
  }

  function badge(cls, text) { return '<span class="badge ' + cls + '">' + text + '</span>'; }

  function renderCard() {
    if (!selId) { $('mvSideEmpty').hidden = false; $('mvCard').hidden = true; return; }
    const nodes = (maps[cur] && maps[cur].nodes) || [];
    const node = nodes.filter(function (n) { return n.id === selId; })[0];
    if (!node) { selId = null; renderCard(); return; }
    const s = STATUS[selId] || { op: 'ok', link: 'on', last: '-', alarms: [] };
    $('mvSideEmpty').hidden = true;
    const card = $('mvCard');
    card.hidden = false;
    card.innerHTML =
      '<div class="mv-card-head"><span class="mv-card-title">' + (node.label || node.id) + '</span>'
      + '<span class="mv-card-type">' + node.type + '</span></div>'
      + '<div class="mv-row"><span class="k">설비 ID</span><span class="v">' + node.id + '</span></div>'
      + '<div class="mv-row"><span class="k">위치</span><span class="v">' + locOf(node.id) + '</span></div>'
      + '<div class="mv-row"><span class="k">운영상태</span><span class="v">' + badge(OP_BADGE[s.op], OP_LABEL[s.op]) + '</span></div>'
      + '<div class="mv-row"><span class="k">통신상태</span><span class="v">' + (s.link === 'off' ? badge('badge-off', '오프라인') : badge('badge-on', '온라인')) + '</span></div>'
      + '<div class="mv-row"><span class="k">최근 수신</span><span class="v">' + s.last + '</span></div>'
      + '<div class="mv-alarms"><div class="mv-alarms-t">활성 알람</div>'
      + (s.alarms && s.alarms.length
          ? '<ul>' + s.alarms.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>'
          : '<div class="none">없음</div>')
      + '</div>';
  }

  function renderAll() {
    renderNodes();
    renderSummary();
    renderCard();
    $('mvUpdated').textContent = nowT();
  }

  function selectNode(id) {
    selId = (selId === id) ? null : id;
    renderNodes();
    renderCard();
  }

  function mvSelectMap() {
    cur = Number($('mvMapSel').value) || 0;
    selId = null;
    renderBg();
    renderAll();
  }

  // ---- 자동갱신 ----
  let timer = null;
  function startAuto() { stopAuto(); timer = setInterval(function () { jitter(); renderAll(); }, REFRESH_MS); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
  function mvToggleAuto() { if ($('mvAuto').checked) startAuto(); else stopAuto(); }
  function mvRefresh(manual) { jitter(); renderAll(); }

  // ---- init ----
  if (!maps.length) {
    $('mvTop').hidden = true;
    $('mvWrap').hidden = true;
    $('mvNoMap').hidden = false;
    if (window.umsLink) $('mvGoManage').setAttribute('href', window.umsLink('map-manage.html'));
    return;
  }
  renderMapSel();
  renderBg();
  renderAll();
  if ($('mvAuto').checked) startAuto();

  window.mvSelectMap = mvSelectMap;
  window.mvToggleAuto = mvToggleAuto;
  window.mvRefresh = mvRefresh;

})();
