// 배터리 관리 페이지 스크립트 (목업 데이터)
// 화면: 설비관리 > 배터리 관리
(function () {

  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];
  const UPS_LOC = {
    'UPS-1F-A': '본사 IDC-1F', 'UPS-1F-B': '본사 IDC-1F', 'UPS-1F-C': '본사 IDC-1F',
    'UPS-2F-A': '본사 IDC-2F', 'UPS-2F-B': '본사 IDC-2F',
    'UPS-DR-1': '판교 DR센터', 'UPS-DR-2': '판교 DR센터',
  };
  const UPS_LIST = Object.keys(UPS_LOC);

  // 활성 알람 문구는 설비현황 > 전력계통(power-topology.js)의 BAT_ALARMS 와 완전히 동일하게 맞춘다.
  const DATA = [
    { no: 1, id: 'BAT-1F-A-1', ups: 'UPS-1F-A', maker: '삼성SDI',          type: '리튬이온', cap: 100, date: '2023-04-12', soh: 96.4, memo: '', alarms: [] },
    { no: 2, id: 'BAT-1F-B-1', ups: 'UPS-1F-B', maker: '삼성SDI',          type: '리튬이온', cap: 100, date: '2023-04-12', soh: 96.5, memo: '', alarms: [] },
    { no: 3, id: 'BAT-1F-B-2', ups: 'UPS-1F-B', maker: '삼성SDI',          type: '리튬이온', cap: 100, date: '2023-04-12', soh: 82.1, memo: '', alarms: [{ time: '2026-09-02 14:20', text: '방전 이력 잦음, 모니터링 필요 (경고)' }] },
    { no: 4, id: 'BAT-1F-C-1', ups: 'UPS-1F-C', maker: 'LG에너지솔루션',    type: '리튬이온', cap: 150, date: '2024-06-21', soh: 93.8, memo: '', alarms: [] },
    { no: 5, id: 'BAT-2F-A-1', ups: 'UPS-2F-A', maker: 'CSB',              type: '납축',     cap: 200, date: '2022-11-30', soh: 93.3, memo: '2023년 일부 셀 점검', alarms: [] },
    { no: 6, id: 'BAT-2F-B-1', ups: 'UPS-2F-B', maker: 'CSB',              type: '납축',     cap: 200, date: '2022-11-30', soh: 94.0, memo: '', alarms: [] },
    { no: 7, id: 'BAT-2F-B-2', ups: 'UPS-2F-B', maker: 'CSB',              type: '납축',     cap: 200, date: '2022-11-30', soh: 76.5, memo: '', alarms: [{ time: '2026-09-01 09:00', text: 'SOH 76.5% 저하 - 교체 필요 (위험)' }] },
    { no: 8, id: 'BAT-DR-1-1', ups: 'UPS-DR-1', maker: 'Vertiv',           type: '리튬이온', cap: 120, date: '2024-02-08', soh: 93.4, memo: '', alarms: [] },
    { no: 9, id: 'BAT-DR-2-1', ups: 'UPS-DR-2', maker: 'Vertiv',           type: '리튬이온', cap: 120, date: '2024-02-08', soh: 92.1, memo: '', alarms: [] },
  ];
  let seq = DATA.length;
  const PAGE_SIZE = 10;
  let currentPage = 1;

  function statusOf(soh) {
    if (soh < 80) return 'crit';
    if (soh < 90) return 'warn';
    return 'ok';
  }
  const STATUS_LABEL = { ok: '정상', warn: '경고', crit: '교체필요' };
  const STATUS_BADGE = { ok: 'badge-ok', warn: 'badge-warn', crit: 'badge-major' };

  function statusBadge(soh) {
    const st = statusOf(soh);
    return '<span class="badge ' + STATUS_BADGE[st] + '">' + STATUS_LABEL[st] + '</span>';
  }

  function alarmsHtml(alarms) {
    return (alarms && alarms.length)
      ? '<ul>' + alarms.map(function (a) { return '<li>' + a.text + ' <span style="color:#98a2b3;font-size:11px;">(' + a.time + ')</span></li>'; }).join('') + '</ul>'
      : '<span style="color:#8a97a5;">없음</span>';
  }

  function fillSelect(id, arr, withAll) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  function currentRows() {
    const kw    = (document.getElementById('q').value || '').trim();
    const fUps  = document.getElementById('fUps').value;
    const fLoc  = document.getElementById('fLoc').value;
    const fType = document.getElementById('fType').value;

    return DATA.filter(function (r) {
      return (!kw || r.id.indexOf(kw) >= 0 || r.maker.indexOf(kw) >= 0)
        && (!fUps  || r.ups === fUps)
        && (!fLoc  || UPS_LOC[r.ups] === fLoc)
        && (!fType || r.type === fType);
    });
  }

  function renderGrid() {
    const rows = currentRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    document.getElementById('gridBody').innerHTML = pageRows.length
      ? pageRows.map(function (r) {
          return '<tr data-no="' + r.no + '" onclick="batRowClick(' + r.no + ')">'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.id + '</td>'
            + '<td>' + r.ups + '</td>'
            + '<td>' + r.maker + '</td>'
            + '<td>' + r.type + '</td>'
            + '<td>' + r.cap + '</td>'
            + '<td>' + r.date + '</td>'
            + '<td>' + r.soh + '</td>'
            + '<td>' + statusBadge(r.soh) + '</td>'
            + '<td><span class="col-act">'
            +   '<button class="icon-btn" title="수정" onclick="event.stopPropagation();batOpen(' + r.no + ')">&#9998;</button>'
            +   '<button class="icon-btn del" title="삭제" onclick="event.stopPropagation();batAskDelete(' + r.no + ')">&#128465;</button>'
            + '</span></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="10" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = rows.length;
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
    document.getElementById('fUps').value = '';
    document.getElementById('fLoc').value = '';
    document.getElementById('fType').value = '';
    document.getElementById('q').value = '';
    currentPage = 1;
    renderGrid();
  }

  let detailNo = null;

  function batRowClick(no) {
    document.querySelectorAll('#gridBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
    batDetailOpen(no);
  }

  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }

  function batDetailOpen(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    detailNo = no;
    document.getElementById('dTitle').textContent = r.id + ' 상세';
    document.getElementById('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('소속 UPS', r.ups) + dvRow('위치', UPS_LOC[r.ups]) + dvRow('제조사', r.maker)
          + dvRow('종류', r.type) + dvRow('용량', r.cap + ' Ah') + dvRow('설치일자', r.date))
      + dvGroup(
          dvRow('SOH', r.soh + '%') + dvRow('상태', statusBadge(r.soh)))
      + dvGroup(
          dvRow('활성 알람', alarmsHtml(r.alarms), true))
      + dvGroup(
          dvRow('비고', r.memo || '<span style="color:#8a97a5;">-</span>', true))
      + '</div>';
    document.getElementById('batMask').classList.add('show');
    document.getElementById('batDrawer').classList.add('show');
  }

  function batDetailClose() {
    document.getElementById('batMask').classList.remove('show');
    document.getElementById('batDrawer').classList.remove('show');
  }

  function batEditFromDetail() {
    const no = detailNo;
    batDetailClose();
    batOpen(no);
  }

  let editingNo = null;

  function batOpen(no) {
    const r = (no == null) ? null : DATA.filter(function (x) { return x.no === no; })[0];
    editingNo = no;
    document.getElementById('mTitle').textContent = r ? '배터리 수정' : '배터리 등록';
    document.getElementById('m-ups').value  = r ? r.ups   : '';
    document.getElementById('m-id').value   = r ? r.id    : '';
    document.getElementById('m-maker').value = r ? r.maker : '';
    document.getElementById('m-cap').value  = r ? r.cap   : '';
    document.getElementById('m-date').value = r ? r.date  : '';
    document.getElementById('m-memo').value = r ? r.memo  : '';
    const type = r ? r.type : '리튬이온';
    document.querySelectorAll('input[name=m-type]').forEach(function (el) { el.checked = (el.value === type); });
    show('batModal');
  }

  function batSave() {
    const id = document.getElementById('m-id').value.trim();
    if (!id) { umsToast('배터리 ID/S/N을 입력하세요.'); return; }

    const ups   = document.getElementById('m-ups').value;
    const maker = document.getElementById('m-maker').value.trim();
    const cap   = Number(document.getElementById('m-cap').value) || 0;
    const date  = document.getElementById('m-date').value;
    const memo  = document.getElementById('m-memo').value.trim();
    const type  = (document.querySelector('input[name=m-type]:checked') || {}).value || '리튬이온';

    if (editingNo == null) {
      seq += 1;
      DATA.unshift({ no: seq, id: id, ups: ups, maker: maker, type: type, cap: cap, date: date, soh: 100, memo: memo });
    } else {
      const r = DATA.filter(function (x) { return x.no === editingNo; })[0];
      if (r) { r.id = id; r.ups = ups; r.maker = maker; r.type = type; r.cap = cap; r.date = date; r.memo = memo; }
    }

    hide('batModal');
    renderGrid();
    umsToast('저장되었습니다.');
  }

  let deleteNo = null;

  function batAskDelete(no) { deleteNo = no; show('delModal'); }
  function batDelete() {
    const idx = DATA.findIndex(function (x) { return x.no === deleteNo; });
    if (idx >= 0) DATA.splice(idx, 1);
    hide('delModal');
    if (detailNo === deleteNo) batDetailClose();
    deleteNo = null;
    renderGrid();
    umsToast('삭제되었습니다.');
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  fillSelect('fUps', UPS_LIST, true);
  fillSelect('fLoc', LOCATIONS, true);
  fillSelect('m-ups', UPS_LIST, false);
  document.getElementById('m-ups').insertAdjacentHTML('afterbegin', '<option value=""></option>');
  renderGrid();

  window.renderGrid   = renderGrid;
  window.resetSearch  = resetSearch;
  window.gotoPage     = gotoPage;
  window.batRowClick  = batRowClick;
  window.batOpen       = batOpen;
  window.batSave       = batSave;
  window.batAskDelete  = batAskDelete;
  window.batDelete     = batDelete;
  window.batModalClose = function () { hide('batModal'); };
  window.delModalClose = function () { hide('delModal'); };
  window.batDetailClose = batDetailClose;
  window.batEditFromDetail = batEditFromDetail;

})();
