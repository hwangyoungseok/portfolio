// 알림 보기 페이지 스크립트
// 화면: (헤더 사용자 메뉴) > 알림 보기   /   헤더 [알림] > 전체 보기
// ※ 목록은 shared/layout.js 가 노출한 window.umsNotis 를 그대로 쓴다.
//    같은 배열을 참조하므로 여기서 읽음 처리하면 헤더 배지도 함께 갱신된다.
(function () {

  const DATA = window.umsNotis || [];
  const rel  = window.umsNotiRel || function (t) { return t; };
  const sync = window.umsNotiSync || function () {};

  const SEV_LABEL = { crit: '긴급', warn: '주의', info: '정보' };

  let sortKey = 'time';
  let sortAsc = false;    // 최신순이 기본
  let page    = 1;

  function el(id) { return document.getElementById(id); }
  function row(id) { return DATA.filter(function (n) { return n.id === id; })[0]; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  // ---- 조회 ----
  function filtered() {
    const fRead = el('fRead').value;
    const fKind = el('fKind').value;
    const fSev  = el('fSev').value;
    const from  = el('fFrom').value;
    const to    = el('fTo').value;
    const kw    = (el('q').value || '').trim().toLowerCase();

    const rows = DATA.filter(function (n) {
      if (fRead === 'unread' && !n.unread) return false;
      if (fRead === 'read'   &&  n.unread) return false;
      if (fKind && n.kind !== fKind) return false;
      if (fSev  && n.sev  !== fSev)  return false;
      const day = n.time.slice(0, 10);
      if (from && day < from) return false;
      if (to   && day > to)   return false;
      if (kw && (n.title + ' ' + n.desc).toLowerCase().indexOf(kw) < 0) return false;
      return true;
    });

    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });
    return rows;
  }

  function renderGrid() {
    const rows  = filtered();
    const size  = Number(el('pSize').value);
    const total = rows.length;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (page > maxPage) page = maxPage;
    const from = (page - 1) * size;
    const cur  = rows.slice(from, from + size);

    el('gridBody').innerHTML = cur.length
      ? cur.map(function (n) {
          return '<tr class="' + (n.unread ? 'nt-unread' : '') + '">'
            + '<td><span class="nt-sev ' + n.sev + '">' + SEV_LABEL[n.sev] + '</span></td>'
            + '<td><span class="nt-kind">' + esc(n.kind) + '</span></td>'
            + '<td><span class="nt-body">'
            +   '<span class="nt-title">' + esc(n.title) + '</span>'
            +   '<span class="nt-desc" title="' + esc(n.desc) + '">' + esc(n.desc) + '</span>'
            + '</span></td>'
            + '<td>' + esc(n.time) + '<br><span class="hint">' + rel(n.time) + '</span></td>'
            + '<td><span class="nt-state ' + (n.unread ? 'unread' : 'read') + '">'
            +   (n.unread ? '읽지 않음' : '읽음') + '</span></td>'
            + '<td>'
            +   (n.unread ? '<button class="nt-btn" onclick="markRead(' + n.id + ')">읽음</button>' : '')
            +   (n.page ? '<button class="nt-btn" onclick="openTarget(' + n.id + ')">바로가기</button>' : '')
            + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="6" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    el('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    el('pNo').textContent = page;

    const unread = DATA.filter(function (n) { return n.unread; }).length;
    el('ntTotal').textContent  = DATA.length;
    el('ntUnread').textContent = unread;
    el('ntReadAll').disabled = (unread === 0);

    document.querySelectorAll('#ntTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  // ---- 읽음 처리 ----
  function markRead(id) {
    const n = row(id);
    if (!n || !n.unread) return;
    n.unread = false;
    renderGrid();
    sync();                      // 헤더 배지 갱신
  }

  function readAll() {
    const cnt = DATA.filter(function (n) { return n.unread; }).length;
    if (!cnt) { umsToast('읽지 않은 알림이 없습니다.'); return; }
    DATA.forEach(function (n) { n.unread = false; });
    renderGrid();
    sync();
    umsToast(cnt + '건을 읽음 처리했습니다.');
  }

  // 읽음 처리 후 관련 화면으로 이동
  function openTarget(id) {
    const n = row(id);
    if (!n || !n.page) return;
    n.unread = false;
    sync();
    const href = '../' + n.page + '.html';
    location.href = window.umsLink ? window.umsLink(href) : href;
  }

  // ---- 검색/정렬/페이징 ----
  function search() { page = 1; renderGrid(); }

  function resetSearch() {
    ['fRead', 'fKind', 'fSev', 'fFrom', 'fTo', 'q'].forEach(function (id) { el(id).value = ''; });
    sortKey = 'time'; sortAsc = false; page = 1;
    renderGrid();
  }

  function sortBy(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = false; }
    page = 1;
    renderGrid();
  }

  function go(dir) {
    if (dir === 'size') { page = 1; renderGrid(); return; }
    const size = Number(el('pSize').value);
    const maxPage = Math.max(1, Math.ceil(filtered().length / size));
    if (dir === 'first') page = 1;
    if (dir === 'prev')  page = Math.max(1, page - 1);
    if (dir === 'next')  page = Math.min(maxPage, page + 1);
    if (dir === 'last')  page = maxPage;
    renderGrid();
  }

  // ---- 초기화 ----
  // 분류 목록은 데이터에서 뽑는다 (모드에 따라 다르다)
  const kinds = [];
  DATA.forEach(function (n) { if (kinds.indexOf(n.kind) < 0) kinds.push(n.kind); });
  el('fKind').innerHTML = '<option value="">전체</option>'
    + kinds.map(function (k) { return '<option>' + k + '</option>'; }).join('');

  renderGrid();

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.search      = search;
  window.resetSearch = resetSearch;
  window.sortBy      = sortBy;
  window.go          = go;
  window.markRead    = markRead;
  window.readAll     = readAll;
  window.openTarget  = openTarget;

})();
