// 미할당 티켓 페이지 스크립트 (목업 데이터)
// 화면: 티켓 > 미할당 티켓
(function () {

  const DATA = [
    { no: 1, ticketNo: 'TCK-20260903-002', title: 'UPS-2F-B 통신 두절', target: 'UPS-2F-B', targetType: 'UPS',
      pri: 'major', status: 'pending', reg: '2026-09-03', due: '2026-09-04', updated: '2026-09-03 08:20' },
    { no: 2, ticketNo: 'TCK-20260903-001', title: 'GW-DR-02 서버 응답 없음', target: 'GW-DR-02', targetType: 'GW',
      pri: 'critical', status: 'pending', reg: '2026-09-03', due: '2026-09-03', updated: '2026-09-03 07:55' },
    { no: 3, ticketNo: 'TCK-20260902-030', title: 'PDU-1F-C 출력 전류 이상', target: 'PDU-1F-C', targetType: 'PDU',
      pri: 'minor', status: 'pending', reg: '2026-09-02', due: '2026-09-06', updated: '2026-09-02 19:41' },
    { no: 4, ticketNo: 'TCK-20260902-027', title: 'CH-2F-02 냉수 유량 저하', target: 'CH-2F-02', targetType: '칠러',
      pri: 'warning', status: 'pending', reg: '2026-09-02', due: '2026-09-08', updated: '2026-09-02 15:10' },
    { no: 5, ticketNo: 'TCK-20260901-019', title: 'BAT-1F-01 셀 온도 상승', target: 'BAT-1F-01', targetType: '배터리',
      pri: 'major', status: 'pending', reg: '2026-09-01', due: '2026-09-05', updated: '2026-09-01 21:03' },
  ];

  const PRI_LABEL = { warning: 'Warning', minor: 'Minor', major: 'Major', critical: 'Critical' };
  const STATUS_LABEL = { pending: '대기중', progress: '진행중', done: '완료' };

  function priBadge(pri) { return '<span class="pri-badge pri-' + pri + '">' + PRI_LABEL[pri] + '</span>'; }
  function statusBadge(st) {
    const cls = st === 'pending' ? 'status-pending' : (st === 'progress' ? 'status-progress' : 'status-done');
    return '<span class="status-badge ' + cls + '">' + STATUS_LABEL[st] + '</span>';
  }

  const selected = new Set();

  function currentRows() {
    const fPri  = document.getElementById('fPri').value;
    const fType = document.getElementById('fType').value;
    const fFrom = document.getElementById('fFrom').value;
    const fTo   = document.getElementById('fTo').value;
    return DATA.filter(function (r) {
      return (!fPri || r.pri === fPri)
        && (!fType || r.targetType === fType)
        && (!fFrom || r.reg >= fFrom)
        && (!fTo   || r.reg <= fTo);
    });
  }

  function renderGrid() {
    const rows = currentRows();
    const visibleNos = rows.map(function (r) { return r.no; });
    Array.from(selected).forEach(function (no) { if (visibleNos.indexOf(no) < 0) selected.delete(no); });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr data-no="' + r.no + '">'
            + '<td class="chk-cell"><input type="checkbox" ' + (selected.has(r.no) ? 'checked' : '') + ' onchange="tkToggleOne(' + r.no + ', this.checked)"></td>'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.ticketNo + '</td>'
            + '<td style="text-align:left;">' + r.title + '</td>'
            + '<td>' + r.target + '</td>'
            + '<td>' + priBadge(r.pri) + '</td>'
            + '<td>' + statusBadge(r.status) + '</td>'
            + '<td>' + r.reg + '</td>'
            + '<td>' + r.due + '</td>'
            + '<td>' + r.updated + '</td>'
            + '<td><button class="btn" onclick="tkOpenAssign(' + r.no + ')">담당자 지정</button></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="11" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = rows.length;
    document.getElementById('chkAll').checked = rows.length > 0 && selected.size === rows.length;
    updateSelCount();
  }

  function updateSelCount() {
    document.getElementById('selCount').textContent = selected.size;
    document.getElementById('bulkBtn').disabled = selected.size === 0;
  }

  function tkToggleAll(checked) {
    const rows = currentRows();
    rows.forEach(function (r) { if (checked) selected.add(r.no); else selected.delete(r.no); });
    renderGrid();
  }

  function tkToggleOne(no, checked) {
    if (checked) selected.add(no); else selected.delete(no);
    document.getElementById('chkAll').checked = selected.size === currentRows().length;
    updateSelCount();
  }

  function resetSearch() {
    document.getElementById('fPri').value = '';
    document.getElementById('fType').value = '';
    document.getElementById('fFrom').value = '';
    document.getElementById('fTo').value = '';
    renderGrid();
  }

  let pendingNos = [];

  function tkOpenAssign(no) {
    pendingNos = no == null ? Array.from(selected) : [no];
    if (!pendingNos.length) return;
    document.getElementById('assignMsg').innerHTML = no == null
      ? '선택한 <b>' + pendingNos.length + '건</b>을 일괄 할당합니다.'
      : '<b>' + DATA.filter(function (r) { return r.no === no; })[0].ticketNo + '</b> 티켓의 담당자를 선택하세요.';
    show('assignModal');
  }

  function tkAssignConfirm() {
    const assignee = document.getElementById('assignee').value;
    pendingNos.forEach(function (no) {
      const idx = DATA.findIndex(function (x) { return x.no === no; });
      if (idx >= 0) DATA.splice(idx, 1);
      selected.delete(no);
    });
    hide('assignModal');
    renderGrid();
    umsToast(assignee + '님에게 ' + pendingNos.length + '건 할당되었습니다. 담당자의 \'내 티켓\'으로 이동합니다.');
    pendingNos = [];
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  renderGrid();

  window.renderGrid     = renderGrid;
  window.resetSearch    = resetSearch;
  window.tkToggleAll    = tkToggleAll;
  window.tkToggleOne    = tkToggleOne;
  window.tkOpenAssign   = tkOpenAssign;
  window.assignModalClose = function () { hide('assignModal'); };
  window.tkAssignConfirm = tkAssignConfirm;

})();
