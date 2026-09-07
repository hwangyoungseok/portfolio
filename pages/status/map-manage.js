// 맵 관리 페이지 스크립트
// 화면: 설비현황 > 맵 관리
// 여러 맵을 등록: 각 맵 = 배경 도면(샘플 SVG / 업로드·붙여넣기 이미지) + 설비 배치.
// 저장은 localStorage(ums.maps 배열). 맵 화면(status/map-view)이 이 데이터로 상태 모니터링.
// 실제 백엔드 전환 시 umsMapLayout(도면) / umsMapInfo(설비 배치좌표·표시명).
(function () {

  const STORE_KEY = 'ums.maps';
  const OLD_KEY = 'ums.map';

  // ---- 설비 마스터 (설비관리 목업과 동일한 이름) ----
  const EQUIP = [
    { id: 'UPS-1F-A', type: 'UPS' }, { id: 'UPS-1F-B', type: 'UPS' }, { id: 'UPS-1F-C', type: 'UPS' },
    { id: 'UPS-2F-A', type: 'UPS' }, { id: 'UPS-2F-B', type: 'UPS' },
    { id: 'UPS-DR-1', type: 'UPS' }, { id: 'UPS-DR-2', type: 'UPS' },
    { id: 'PDU-1F-01', type: 'PDU' }, { id: 'PDU-1F-02', type: 'PDU' },
    { id: 'PDU-2F-01', type: 'PDU' }, { id: 'PDU-2F-02', type: 'PDU' },
    { id: 'PDU-DR-01', type: 'PDU' }, { id: 'PDU-DR-02', type: 'PDU' },
    { id: 'CH-1F-01', type: '칠러' }, { id: 'CH-1F-02', type: '칠러' },
    { id: 'CH-2F-01', type: '칠러' }, { id: 'CH-2F-02', type: '칠러' }, { id: 'CH-DR-01', type: '칠러' },
    { id: 'BAT-1F-A-01', type: '배터리' }, { id: 'BAT-1F-B-01', type: '배터리' },
    { id: 'BAT-2F-A-01', type: '배터리' }, { id: 'BAT-DR-1-01', type: '배터리' },
  ];
  const TYPE = {
    'UPS':   { cls: 'ic-ups', ch: 'U' },
    'PDU':   { cls: 'ic-pdu', ch: 'P' },
    '칠러':  { cls: 'ic-chl', ch: 'C' },
    '배터리': { cls: 'ic-bat', ch: 'B' },
  };
  function typeOf(id) { const e = EQUIP.filter(function (x) { return x.id === id; })[0]; return e ? e.type : 'UPS'; }
  function iconHtml(type, cls) { const t = TYPE[type] || TYPE.UPS; return '<span class="' + cls + ' ' + t.cls + '"><span>' + t.ch + '</span></span>'; }

  // ---- 샘플 도면 (인라인 SVG) ----
  function room(x, y, w, h, label) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#f4f6f9" stroke="#9aa5b1" stroke-width="2"/>'
      + '<text x="' + (x + 12) + '" y="' + (y + 22) + '" font-size="15" font-weight="bold" fill="#7b8794">' + label + '</text>';
  }
  function racks(x, y, cols, rows) {
    let s = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        s += '<rect x="' + (x + c * 66) + '" y="' + (y + r * 46) + '" width="52" height="20" rx="2" fill="#dbe3ec" stroke="#b6c1cd" stroke-width="1"/>';
      }
    }
    return s;
  }
  function door(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#fbfcfd"/>'; }
  function sampleSvg() {
    return '<svg viewBox="0 0 1000 640" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'
      + '<rect x="18" y="18" width="964" height="604" fill="#fbfcfd" stroke="#8a95a3" stroke-width="3"/>'
      + room(40, 40, 440, 235, '전산실 A')
      + room(520, 40, 440, 235, '전산실 B')
      + racks(70, 78, 5, 3) + racks(552, 78, 5, 3)
      + '<rect x="40" y="298" width="920" height="64" fill="#eef1f5" stroke="#c7cfd8" stroke-width="1.5"/>'
      + '<text x="500" y="336" text-anchor="middle" font-size="14" letter-spacing="4" fill="#98a2b3">복 도</text>'
      + room(40, 384, 280, 224, 'UPS실')
      + room(360, 384, 264, 224, '배터리실')
      + room(664, 384, 296, 224, '공조기계실')
      + door(250, 275, 30, 23) + door(600, 275, 30, 23)
      + door(168, 362, 30, 22) + door(478, 362, 30, 22) + door(796, 362, 30, 22)
      + '</svg>';
  }

  // ---- 저장/로드 (ums.maps = [{id,name,bg,nodes}]) ----
  function uid() { return 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1000); }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (raw && raw.length) return raw;
    } catch (e) { /* noop */ }
    // 구버전 단일 맵 마이그레이션
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY));
      if (old && old.nodes) return [{ id: uid(), name: old.name || '맵 1', bg: old.bg || { type: 'sample' }, nodes: old.nodes }];
    } catch (e) { /* noop */ }
    return null;
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(maps)); }
    catch (e) { umsToast('저장 공간이 부족합니다. 이미지 크기를 줄여 주세요.'); }
  }

  let maps = load() || [{ id: uid(), name: '맵 1', bg: { type: 'sample' }, nodes: [] }];
  let cur = 0;
  function map() { return maps[cur]; }

  let selId = null;
  const $ = function (id) { return document.getElementById(id); };
  const canvas = $('mmCanvas');

  // ---- 맵 선택 콤보 ----
  function renderMapSel() {
    $('mmMapSel').innerHTML = maps.map(function (m, i) {
      return '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>' + (m.name || ('맵 ' + (i + 1))) + '</option>';
    }).join('');
  }
  function mmSelectMap() {
    cur = Number($('mmMapSel').value) || 0;
    selId = null;
    $('mmName').value = map().name || '';
    renderBg();
    mmRenderPalette();
    renderNodes();
  }
  function mmNewMap() {
    maps.push({ id: uid(), name: '맵 ' + (maps.length + 1), bg: { type: 'sample' }, nodes: [] });
    cur = maps.length - 1;
    selId = null;
    renderMapSel();
    $('mmName').value = map().name;
    renderBg();
    mmRenderPalette();
    renderNodes();
  }
  function mmDeleteMap() {
    if (maps.length <= 1) { umsToast('맵이 하나뿐이라 삭제할 수 없습니다.'); return; }
    maps.splice(cur, 1);
    cur = Math.max(0, cur - 1);
    selId = null;
    renderMapSel();
    $('mmName').value = map().name || '';
    renderBg();
    mmRenderPalette();
    renderNodes();
    persist();
    umsToast('맵을 삭제했습니다.');
  }
  function onNameInput() {
    map().name = $('mmName').value;
    const opt = $('mmMapSel').options[cur];
    if (opt) opt.textContent = map().name || ('맵 ' + (cur + 1));
  }

  // ---- 배경 ----
  function renderBg() {
    const bg = $('mmBg');
    const b = map().bg || { type: 'sample' };
    if (b.type === 'image' && b.data) {
      bg.classList.add('img');
      bg.style.backgroundImage = 'url(' + b.data + ')';
      bg.innerHTML = '';
    } else {
      bg.classList.remove('img');
      bg.style.backgroundImage = 'none';
      bg.innerHTML = sampleSvg();
    }
  }
  function mmUseSample() { map().bg = { type: 'sample' }; renderBg(); }

  // 파일 → 축소 → dataURL 배경. (버튼 / 캔버스에 파일 드롭 / Ctrl+V 붙여넣기 공용)
  function useImageFile(f) {
    if (!f || !/^image\//.test(f.type || '')) return;
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        const maxW = 1400;
        const sc = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sc);
        c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        map().bg = { type: 'image', data: c.toDataURL('image/jpeg', 0.82) };
        renderBg();
        umsToast('배경 도면을 불러왔습니다. (저장하면 유지됩니다)');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  }
  function onFile(e) { useImageFile(e.target.files[0]); e.target.value = ''; }

  document.addEventListener('paste', function (e) {
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type)) {
        useImageFile(items[i].getAsFile());
        e.preventDefault();
        return;
      }
    }
  });

  // ---- 팔레트 ----
  function mmRenderPalette() {
    const t = $('mmPalType').value;
    const placed = {};
    map().nodes.forEach(function (n) { placed[n.id] = true; });
    $('mmPalette').innerHTML = EQUIP.filter(function (e) { return !t || e.type === t; }).map(function (e) {
      const on = !!placed[e.id];
      return '<div class="mm-pal-item' + (on ? ' placed' : '') + '" draggable="' + (on ? 'false' : 'true') + '" data-id="' + e.id + '">'
        + iconHtml(e.type, 'mm-pal-ic')
        + '<span class="mm-pal-name">' + e.id + '</span>'
        + (on ? '<span class="mm-pal-tag">배치됨</span>' : '') + '</div>';
    }).join('');
    Array.prototype.forEach.call($('mmPalette').querySelectorAll('.mm-pal-item[draggable=true]'), function (el) {
      el.addEventListener('dragstart', function (ev) {
        ev.dataTransfer.setData('text/plain', el.dataset.id);
        ev.dataTransfer.effectAllowed = 'copy';
      });
    });
  }

  // ---- 캔버스 드롭 ----
  canvas.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; canvas.classList.add('drag-over'); });
  canvas.addEventListener('dragleave', function (e) { if (e.target === canvas) canvas.classList.remove('drag-over'); });
  canvas.addEventListener('drop', function (e) {
    e.preventDefault();
    canvas.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length) { useImageFile(e.dataTransfer.files[0]); return; }
    const id = e.dataTransfer.getData('text/plain');
    if (!id || map().nodes.some(function (n) { return n.id === id; })) return;
    const r = canvas.getBoundingClientRect();
    const x = clampPct((e.clientX - r.left) / r.width * 100);
    const y = clampPct((e.clientY - r.top) / r.height * 100);
    map().nodes.push({ id: id, type: typeOf(id), label: id, x: x, y: y });
    renderNodes();
    mmRenderPalette();
  });
  function clampPct(v) { return v < 1.5 ? 1.5 : (v > 98.5 ? 98.5 : v); }

  // ---- 노드 렌더 ----
  function renderNodes() {
    Array.prototype.forEach.call(canvas.querySelectorAll('.mm-node'), function (n) { n.remove(); });
    map().nodes.forEach(function (n) {
      const el = document.createElement('div');
      el.className = 'mm-node' + (n.id === selId ? ' selected' : '');
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.dataset.id = n.id;
      el.innerHTML = iconHtml(n.type, 'mm-node-ic') + '<span class="mm-node-lb">' + (n.label || n.id) + '</span>';
      bindNodeDrag(el, n);
      canvas.appendChild(el);
    });
    $('mmCount').textContent = map().nodes.length;
  }

  // ---- 노드 이동 / 클릭(편집) ----
  function bindNodeDrag(el, node) {
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY;
      let moved = false;
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      function move(ev) {
        if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) moved = true;
        node.x = clampPct((ev.clientX - r.left) / r.width * 100);
        node.y = clampPct((ev.clientY - r.top) / r.height * 100);
        el.style.left = node.x + '%';
        el.style.top = node.y + '%';
      }
      function up() {
        el.releasePointerCapture(e.pointerId);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.classList.remove('dragging');
        if (moved) { selId = null; renderNodes(); }
        else { openPop(node, el); }
      }
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
    });
  }

  // ---- 편집 팝오버 ----
  let popNode = null;
  function openPop(node, el) {
    popNode = node;
    selId = node.id;
    renderNodes();
    const pop = $('mmPop');
    $('mmPopLabel').value = node.label || node.id;
    pop.hidden = false;
    const er = el.getBoundingClientRect();
    let left = er.left + er.width / 2 - 110;
    let top = er.bottom + 8;
    left = Math.max(8, Math.min(window.innerWidth - 236, left));
    if (top + 110 > window.innerHeight) top = er.top - 118;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    setTimeout(function () { $('mmPopLabel').focus(); $('mmPopLabel').select(); }, 0);
  }
  function closePop() { $('mmPop').hidden = true; popNode = null; selId = null; renderNodes(); }
  function mmApplyNode() {
    if (popNode) { popNode.label = ($('mmPopLabel').value || '').trim() || popNode.id; }
    closePop();
  }
  function mmDeleteNode() {
    if (popNode) { map().nodes = map().nodes.filter(function (n) { return n.id !== popNode.id; }); }
    closePop();
    mmRenderPalette();
  }
  document.addEventListener('pointerdown', function (e) {
    if (!$('mmPop').hidden && !e.target.closest('#mmPop') && !e.target.closest('.mm-node')) closePop();
  });

  // ---- 저장 / 초기화 ----
  function mmSave() {
    map().name = ($('mmName').value || '').trim() || ('맵 ' + (cur + 1));
    renderMapSel();
    persist();
    umsToast('맵을 저장했습니다.');
  }
  function mmAskReset() { $('mmResetModal').classList.add('show'); }
  function mmResetClose() { $('mmResetModal').classList.remove('show'); }
  function mmReset() {
    map().nodes = [];
    selId = null;
    renderNodes();
    mmRenderPalette();
    mmResetClose();
  }

  // ---- init ----
  renderMapSel();
  $('mmName').value = map().name || '';
  $('mmName').addEventListener('input', onNameInput);
  $('mmFile').addEventListener('change', onFile);
  renderBg();
  mmRenderPalette();
  renderNodes();

  window.mmSelectMap = mmSelectMap;
  window.mmNewMap = mmNewMap;
  window.mmDeleteMap = mmDeleteMap;
  window.mmUseSample = mmUseSample;
  window.mmRenderPalette = mmRenderPalette;
  window.mmSave = mmSave;
  window.mmAskReset = mmAskReset;
  window.mmReset = mmReset;
  window.mmResetClose = mmResetClose;
  window.mmApplyNode = mmApplyNode;
  window.mmDeleteNode = mmDeleteNode;

})();
