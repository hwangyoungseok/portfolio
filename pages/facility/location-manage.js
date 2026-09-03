// 위치 관리 페이지 스크립트 (목업 데이터 — 트리 인메모리 편집)
(function () {

  const TYPES = [
    ['site',     '사이트',   '🏢'],
    ['building', '건물',     '🏬'],
    ['floor',    '층',       '▦'],
    ['room',     '전산실',   '🖥️'],
    ['etc',      '기타',     '📁'],
  ];
  const TYPE_ICON = {}; const TYPE_LABEL = {};
  TYPES.forEach(function (t) { TYPE_ICON[t[0]] = t[2]; TYPE_LABEL[t[0]] = t[1]; });

  let SEQ = 100;
  const TREE = [
    { id: 1, name: '본사', type: 'site', code: 'HQ', canInstall: false, memo: '', facCount: 0, children: [
      { id: 2, name: 'IDC동', type: 'building', code: 'HQ-IDC', canInstall: false, memo: '', facCount: 0, children: [
        { id: 3, name: '1F 전산실', type: 'room', code: 'HQ-IDC-1F', canInstall: true, memo: '주 전산실', facCount: 4, children: [] },
        { id: 4, name: '2F 전산실', type: 'room', code: 'HQ-IDC-2F', canInstall: true, memo: '', facCount: 3, children: [] },
      ]},
      { id: 5, name: '관제동', type: 'building', code: 'HQ-OPS', canInstall: false, memo: '', facCount: 0, children: [
        { id: 6, name: '상황실', type: 'etc', code: '', canInstall: false, memo: '', facCount: 0, children: [] },
      ]},
    ]},
    { id: 7, name: '판교 DR센터', type: 'site', code: 'DR', canInstall: false, memo: '', facCount: 0, children: [
      { id: 8, name: 'DR 전산실', type: 'room', code: 'DR-1F', canInstall: true, memo: '', facCount: 2, children: [] },
    ]},
  ];
  const expanded = new Set([1, 2, 5, 7]);

  // mode: 'empty' | 'new-root' | 'new-child' | 'edit'
  let mode = 'empty';
  let currentId = null;   // edit 대상 / new-child 부모
  let pendingDelId = null;

  // ---- 트리 유틸 ----
  function walk(nodes, fn, parent) {
    nodes.forEach(function (n) { fn(n, parent); walk(n.children || [], fn, n); });
  }
  function findNode(id) { let r = null; walk(TREE, function (n) { if (n.id === id) r = n; }); return r; }
  function findParent(id) { let r = null; walk(TREE, function (n, p) { if (n.id === id) r = p || null; }); return r; }
  function pathNames(id) {
    const arr = []; let n = findNode(id);
    while (n) { arr.unshift(n.name); n = findParent(n.id); }
    return arr;
  }

  // ---- 트리 렌더 ----
  function treeHtml(nodes, depth) {
    return nodes.map(function (n) {
      const hasKids = (n.children || []).length > 0;
      const open = expanded.has(n.id);
      const caret = hasKids
        ? '<span class="tree-caret" data-caret="' + n.id + '">' + (open ? '▾' : '▸') + '</span>'
        : '<span class="tree-caret leaf">▸</span>';
      const row = '<div class="tree-row' + (n.id === currentId && mode === 'edit' ? ' active' : '') + '"'
        + ' data-id="' + n.id + '" style="padding-left:' + (12 + depth * 16) + 'px">'
        + caret
        + '<span class="tree-icon">' + (TYPE_ICON[n.type] || '') + '</span>'
        + '<span class="tree-name">' + n.name + '</span>'
        + '<span class="tree-badge' + (n.facCount ? '' : ' zero') + '" title="연결 설비 수">' + n.facCount + '</span>'
        + '</div>';
      const kids = (hasKids && open) ? treeHtml(n.children, depth + 1) : '';
      return row + kids;
    }).join('');
  }
  function renderTree() { document.getElementById('locTree').innerHTML = treeHtml(TREE, 0); }

  // ---- 폼 렌더 ----
  function typeOptions(sel) {
    return TYPES.map(function (t) {
      return '<option value="' + t[0] + '"' + (t[0] === sel ? ' selected' : '') + '>' + t[1] + '</option>';
    }).join('');
  }
  function pathBar() {
    if (mode === 'new-root') return '<div class="loc-form-path"><span class="cur">(최상위 위치)</span></div>';
    if (mode === 'new-child') {
      return '<div class="loc-form-path">' + pathNames(currentId).join(' › ') + ' › <span class="cur">(새 하위 위치)</span></div>';
    }
    const p = pathNames(currentId);
    const last = p.pop();
    return '<div class="loc-form-path">' + (p.length ? p.join(' › ') + ' › ' : '') + '<span class="cur">' + last + '</span></div>';
  }
  function renderForm() {
    const box = document.getElementById('locForm');
    if (mode === 'empty') {
      box.innerHTML = '<div class="loc-empty">좌측 트리에서 위치를 선택하면 정보가 표시됩니다.<br>새 위치는 [+ 최상위 노드] 또는 선택 후 [하위 노드 추가] 로 만듭니다.</div>';
      return;
    }
    const n = (mode === 'edit') ? findNode(currentId) : { name: '', type: 'room', code: '', canInstall: false, memo: '' };
    let actions = '';
    if (mode === 'edit') {
      actions = '<button class="btn btn-primary" onclick="locSave()">저장</button>'
        + '<button class="btn" onclick="locNewChild()">하위 노드 추가</button>'
        + '<button class="btn" onclick="locCancel()">취소</button>'
        + '<span class="spacer"></span>'
        + '<button class="btn btn-danger" onclick="locAskDelete()">삭제</button>';
    } else {
      actions = '<button class="btn btn-primary" onclick="locSave()">저장</button>'
        + '<button class="btn" onclick="locCancel()">취소</button>';
    }
    box.innerHTML = pathBar()
      + '<div class="form-grid">'
      +   '<div class="form-label req">위치명</div><input class="form-input" id="loc-name" value="' + esc(n.name) + '">'
      +   '<div class="form-label">위치 유형</div><select class="form-select" id="loc-type">' + typeOptions(n.type) + '</select>'
      +   '<div class="form-label">위치 코드</div><input class="form-input" id="loc-code" value="' + esc(n.code) + '">'
      +   '<div class="form-label">설비 설치 가능</div><label class="loc-check"><input type="checkbox" id="loc-install"' + (n.canInstall ? ' checked' : '') + '> 이 위치에 UPS/PDU/칠러를 설치할 수 있음</label>'
      +   '<div class="form-label">비고</div><textarea class="form-textarea" id="loc-memo" rows="3">' + esc(n.memo) + '</textarea>'
      + '</div>'
      + '<div class="loc-form-actions">' + actions + '</div>';
    document.getElementById('loc-name').focus();
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function render() { renderTree(); renderForm(); }

  // ---- 액션 ----
  function selectNode(id) { mode = 'edit'; currentId = id; render(); }
  function locNewRoot() { mode = 'new-root'; currentId = null; renderTree(); renderForm(); }
  function locNewChild() {
    if (mode === 'edit' && currentId != null) { expanded.add(currentId); mode = 'new-child'; render(); }
  }
  function locCancel() {
    if (mode === 'edit') { render(); return; }        // 값 되돌리기
    mode = currentId != null ? 'edit' : 'empty';
    render();
  }
  function locSave() {
    const name = (document.getElementById('loc-name').value || '').trim();
    if (!name) { umsToast('위치명을 입력하세요.'); document.getElementById('loc-name').focus(); return; }
    const vals = {
      name: name,
      type: document.getElementById('loc-type').value,
      code: (document.getElementById('loc-code').value || '').trim(),
      canInstall: document.getElementById('loc-install').checked,
      memo: (document.getElementById('loc-memo').value || '').trim(),
    };
    if (mode === 'edit') {
      Object.assign(findNode(currentId), vals);
    } else {
      const node = { id: ++SEQ, children: [], facCount: 0 };
      Object.assign(node, vals);
      if (mode === 'new-root') { TREE.push(node); }
      else { const p = findNode(currentId); p.children.push(node); expanded.add(p.id); }
      currentId = node.id;
    }
    mode = 'edit';
    render();
    umsToast('저장되었습니다.');
  }
  function locAskDelete() {
    const n = findNode(currentId);
    if (!n) return;
    if ((n.children || []).length) { umsToast('하위 노드가 있어 삭제할 수 없습니다.'); return; }
    if (n.facCount > 0) { umsToast('연결된 설비가 있어 삭제할 수 없습니다.'); return; }
    pendingDelId = currentId;
    document.getElementById('locDelName').textContent = n.name;
    document.getElementById('locDelModal').classList.add('show');
  }
  function locDelete() {
    const p = findParent(pendingDelId);
    const list = p ? p.children : TREE;
    const i = list.findIndex(function (x) { return x.id === pendingDelId; });
    if (i >= 0) list.splice(i, 1);
    locDelClose();
    mode = 'empty'; currentId = null; pendingDelId = null;
    render();
    umsToast('삭제되었습니다.');
  }
  function locDelClose() { document.getElementById('locDelModal').classList.remove('show'); }

  // ---- 트리 이벤트 (위임) ----
  document.getElementById('locTree').addEventListener('click', function (e) {
    const c = e.target.closest('.tree-caret[data-caret]');
    if (c) {
      const id = Number(c.getAttribute('data-caret'));
      if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
      renderTree();
      return;
    }
    const row = e.target.closest('.tree-row');
    if (row) selectNode(Number(row.getAttribute('data-id')));
  });

  // ---- 초기화 ----
  render();

  window.locNewRoot   = locNewRoot;
  window.locNewChild  = locNewChild;
  window.locCancel    = locCancel;
  window.locSave      = locSave;
  window.locAskDelete = locAskDelete;
  window.locDelete    = locDelete;
  window.locDelClose  = locDelClose;

})();
