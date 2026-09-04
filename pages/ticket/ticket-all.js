// 전체 티켓 페이지 스크립트 (목업 데이터, 관리자용)
// 화면: 티켓 > 전체 티켓
(function () {

  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];
  const ASSIGNEES = ['김민준', '이서연', '박지훈', '관리자'];

  const DATA = [
    { no: 1, ticketNo: 'TCK-20260903-002', title: 'UPS-2F-B 통신 두절', target: 'UPS-2F-B', targetType: 'UPS', loc: '본사 IDC-2F',
      pri: 'major', status: 'pending', reg: '2026-09-03', due: '2026-09-04', updated: '2026-09-03 08:20', assignee: null,
      desc: 'UPS-2F-B와의 통신이 두절되었습니다.', history: [{ time: '2026-09-03 08:20', text: '알람 기반 티켓 자동 생성' }] },
    { no: 2, ticketNo: 'TCK-20260903-001', title: 'GW-DR-02 서버 응답 없음', target: 'GW-DR-02', targetType: 'GW', loc: '판교 DR센터',
      pri: 'critical', status: 'pending', reg: '2026-09-03', due: '2026-09-03', updated: '2026-09-03 07:55', assignee: null,
      desc: 'GW-DR-02가 설치된 서버가 응답하지 않습니다.', history: [{ time: '2026-09-03 07:55', text: '알람 기반 티켓 자동 생성' }] },
    { no: 3, ticketNo: 'TCK-20260902-030', title: 'PDU-1F-C 출력 전류 이상', target: 'PDU-1F-C', targetType: 'PDU', loc: '본사 IDC-1F',
      pri: 'minor', status: 'pending', reg: '2026-09-02', due: '2026-09-06', updated: '2026-09-02 19:41', assignee: null,
      desc: 'PDU-1F-C 출력 전류가 평소 대비 비정상적으로 변동하고 있습니다.', history: [{ time: '2026-09-02 19:41', text: '알람 기반 티켓 자동 생성' }] },
    { no: 4, ticketNo: 'TCK-20260902-027', title: 'CH-2F-02 냉수 유량 저하', target: 'CH-2F-02', targetType: '칠러', loc: '본사 IDC-2F',
      pri: 'warning', status: 'pending', reg: '2026-09-02', due: '2026-09-08', updated: '2026-09-02 15:10', assignee: null,
      desc: '칠러 CH-2F-02의 냉수 유량이 기준치보다 낮게 측정되고 있습니다.', history: [{ time: '2026-09-02 15:10', text: '알람 기반 티켓 자동 생성' }] },
    { no: 5, ticketNo: 'TCK-20260901-019', title: 'BAT-1F-01 셀 온도 상승', target: 'BAT-1F-01', targetType: '배터리', loc: '본사 IDC-1F',
      pri: 'major', status: 'pending', reg: '2026-09-01', due: '2026-09-05', updated: '2026-09-01 21:03', assignee: null,
      desc: '배터리 BAT-1F-01의 셀 온도가 상승 추세입니다.', history: [{ time: '2026-09-01 21:03', text: '알람 기반 티켓 자동 생성' }] },
    { no: 6, ticketNo: 'TCK-20260901-014', title: 'UPS-1F-B 출력 부하율 85% 초과', target: 'UPS-1F-B', targetType: 'UPS', loc: '본사 IDC-1F',
      pri: 'minor', status: 'progress', reg: '2026-09-01', due: '2026-09-03', updated: '2026-09-02 10:20', assignee: '관리자',
      desc: 'UPS-1F-B의 출력 부하율이 85%를 초과하여 경고 알람이 발생했습니다.',
      history: [{ time: '2026-09-01 09:12', text: '알람 기반 티켓 자동 생성' }, { time: '2026-09-02 10:20', text: '상태 변경: 대기중 → 진행중' }] },
    { no: 7, ticketNo: 'TCK-20260902-021', title: 'GW-IDC-02 통신 두절', target: 'GW-IDC-02', targetType: 'GW', loc: '본사 IDC-2F',
      pri: 'major', status: 'pending', reg: '2026-09-02', due: '2026-09-02', updated: '2026-09-02 08:15', assignee: '관리자',
      desc: 'GW-IDC-02와의 통신이 두절되었습니다.', history: [{ time: '2026-09-02 08:15', text: '알람 기반 티켓 자동 생성' }] },
    { no: 8, ticketNo: 'TCK-20260830-005', title: 'CH-1F-01 응축기 압력 경고', target: 'CH-1F-01', targetType: '칠러', loc: '본사 IDC-1F',
      pri: 'warning', status: 'pending', reg: '2026-08-30', due: '2026-09-05', updated: '2026-08-30 14:02', assignee: '관리자',
      desc: '칠러 CH-1F-01의 응축기 압력이 임계치에 근접했습니다.', history: [{ time: '2026-08-30 14:02', text: '알람 기반 티켓 자동 생성' }] },
    { no: 9, ticketNo: 'TCK-20260825-002', title: 'BAT-DR-02 배터리 스트링 전압 저하', target: 'BAT-DR-02', targetType: '배터리', loc: '판교 DR센터',
      pri: 'critical', status: 'done', reg: '2026-08-25', due: '2026-08-27', updated: '2026-08-28 16:40', assignee: '관리자',
      desc: '배터리 BAT-DR-02의 스트링 전압이 기준치 이하로 저하되었습니다.',
      history: [{ time: '2026-08-25 11:03', text: '알람 기반 티켓 자동 생성' }, { time: '2026-08-28 16:40', text: '상태 변경: 진행중 → 완료 (배터리 스트링 교체 완료)' }] },
    { no: 10, ticketNo: 'TCK-20260828-009', title: 'PDU-2F-A 회로 과부하', target: 'PDU-2F-A', targetType: 'PDU', loc: '본사 IDC-2F',
      pri: 'minor', status: 'progress', reg: '2026-08-28', due: '2026-09-01', updated: '2026-08-29 13:11', assignee: '관리자',
      desc: 'PDU-2F-A 3번 회로의 부하가 정격 대비 90%를 초과했습니다.', history: [{ time: '2026-08-28 09:40', text: '알람 기반 티켓 자동 생성' }] },
    { no: 11, ticketNo: 'TCK-20260829-011', title: 'UPS-DR-1 배터리 자가진단 실패', target: 'UPS-DR-1', targetType: 'UPS', loc: '판교 DR센터',
      pri: 'major', status: 'progress', reg: '2026-08-29', due: '2026-09-02', updated: '2026-08-30 09:00', assignee: '김민준',
      desc: 'UPS-DR-1의 배터리 자가진단이 실패했습니다. 배터리 상태 점검이 필요합니다.', history: [{ time: '2026-08-29 06:22', text: '알람 기반 티켓 자동 생성' }] },
    { no: 12, ticketNo: 'TCK-20260827-006', title: 'GW-IDC-01 인증서 만료 임박', target: 'GW-IDC-01', targetType: 'GW', loc: '본사 IDC-1F',
      pri: 'warning', status: 'done', reg: '2026-08-27', due: '2026-08-30', updated: '2026-08-29 11:00', assignee: '이서연',
      desc: 'GW-IDC-01의 인증서 만료가 임박했습니다.', history: [{ time: '2026-08-27 10:00', text: '알람 기반 티켓 자동 생성' }, { time: '2026-08-29 11:00', text: '상태 변경: 진행중 → 완료 (인증서 갱신 완료)' }] },
    { no: 13, ticketNo: 'TCK-20260826-004', title: 'PDU-DR-01 온도 센서 이상', target: 'PDU-DR-01', targetType: 'PDU', loc: '판교 DR센터',
      pri: 'critical', status: 'progress', reg: '2026-08-26', due: '2026-08-29', updated: '2026-08-27 14:30', assignee: '박지훈',
      desc: 'PDU-DR-01의 온도 센서 값이 비정상적으로 튀는 현상이 발생하고 있습니다.', history: [{ time: '2026-08-26 08:11', text: '알람 기반 티켓 자동 생성' }] },
  ];

  const PRI_LABEL = { warning: 'Warning', minor: 'Minor', major: 'Major', critical: 'Critical' };
  const STATUS_LABEL = { pending: '대기중', progress: '진행중', done: '완료' };

  function priBadge(pri) { return '<span class="pri-badge pri-' + pri + '">' + PRI_LABEL[pri] + '</span>'; }
  function statusBadge(st) {
    const cls = st === 'pending' ? 'status-pending' : (st === 'progress' ? 'status-progress' : 'status-done');
    return '<span class="status-badge ' + cls + '">' + STATUS_LABEL[st] + '</span>';
  }

  function fillSelect(id, arr, withAll) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  function today() { return new Date().toISOString().slice(0, 10); }
  function isOverdue(r) { return r.status !== 'done' && r.due < today(); }

  function renderKpi() {
    document.getElementById('kpiOpen').innerHTML       = DATA.filter(function (r) { return r.status !== 'done'; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiUnassigned').innerHTML = DATA.filter(function (r) { return !r.assignee; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiPending').innerHTML    = DATA.filter(function (r) { return r.status === 'pending'; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiProgress').innerHTML   = DATA.filter(function (r) { return r.status === 'progress'; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiOverdue').innerHTML    = DATA.filter(isOverdue).length + '<span class="unit">건</span>';
    document.getElementById('kpiTotal').innerHTML      = DATA.length + '<span class="unit">건</span>';

    ['warning', 'minor', 'major', 'critical'].forEach(function (p) {
      document.getElementById('kpi' + p.charAt(0).toUpperCase() + p.slice(1)).innerHTML =
        DATA.filter(function (r) { return r.pri === p; }).length + '<span class="unit">건</span>';
    });
  }

  function renderGrid() {
    const fAssignee = document.getElementById('fAssignee').value;
    const fStatus   = document.getElementById('fStatus').value;
    const fPri      = document.getElementById('fPri').value;
    const fLoc      = document.getElementById('fLoc').value;
    const fFrom     = document.getElementById('fFrom').value;
    const fTo       = document.getElementById('fTo').value;

    const rows = DATA.filter(function (r) {
      return (!fAssignee || r.assignee === fAssignee)
        && (!fStatus || r.status === fStatus)
        && (!fPri    || r.pri === fPri)
        && (!fLoc    || r.loc === fLoc)
        && (!fFrom   || r.reg >= fFrom)
        && (!fTo     || r.reg <= fTo);
    });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr data-no="' + r.no + '" onclick="tkRowClick(' + r.no + ')">'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.ticketNo + '</td>'
            + '<td style="text-align:left;">' + r.title + '</td>'
            + '<td>' + r.target + '</td>'
            + '<td>' + priBadge(r.pri) + '</td>'
            + '<td>' + statusBadge(r.status) + (isOverdue(r) ? '<span class="status-badge status-overdue">기한초과</span>' : '') + '</td>'
            + '<td>' + r.reg + '</td>'
            + '<td>' + r.due + '</td>'
            + '<td>' + r.updated + '</td>'
            + '<td>' + (r.assignee || '<span style="color:#98a2b3;">미할당</span>') + '</td>'
            + '<td><button class="btn" onclick="event.stopPropagation();tkOpenAssign(' + r.no + ')">담당자 지정</button></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="11" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = rows.length;
    renderKpi();
  }

  function resetSearch() {
    document.getElementById('fAssignee').value = '';
    document.getElementById('fStatus').value = '';
    document.getElementById('fPri').value = '';
    document.getElementById('fLoc').value = '';
    document.getElementById('fFrom').value = '';
    document.getElementById('fTo').value = '';
    renderGrid();
  }

  let pendingNo = null;

  function tkOpenAssign(no) {
    pendingNo = no;
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    document.getElementById('assignMsg').innerHTML = '<b>' + r.ticketNo + '</b> 티켓의 담당자를 재할당합니다.';
    document.getElementById('assignee').value = r.assignee || ASSIGNEES[0];
    show('assignModal');
  }

  function tkAssignConfirm() {
    const r = DATA.filter(function (x) { return x.no === pendingNo; })[0];
    if (r) {
      const assignee = document.getElementById('assignee').value;
      r.assignee = assignee;
      r.updated = nowStr();
      r.history.push({ time: r.updated, text: '담당자 재할당: ' + assignee });
      umsToast(r.ticketNo + ' 담당자가 ' + assignee + '(으)로 재할당되었습니다.');
    }
    hide('assignModal');
    renderGrid();
    pendingNo = null;
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function nowStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }

  function tkRowClick(no) {
    document.querySelectorAll('#gridBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
    tkDetailOpen(no);
  }

  function tkDetailOpen(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    document.getElementById('dTitle').textContent = r.ticketNo + ' 상세';

    const historyHtml = r.history.length
      ? '<div class="tl">' + r.history.slice().reverse().map(function (h) {
          return '<div class="tl-item"><span class="tl-time">' + h.time + '</span><span class="tl-text">' + h.text + '</span></div>';
        }).join('') + '</div>'
      : '<span style="color:#8a97a5;">이력이 없습니다.</span>';

    document.getElementById('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('제목', r.title, true)
          + dvRow('대상', r.targetType + ' · ' + r.target) + dvRow('위치', r.loc)
          + dvRow('우선순위', priBadge(r.pri))
          + dvRow('상태', statusBadge(r.status) + (isOverdue(r) ? ' <span class="status-badge status-overdue">기한초과</span>' : ''))
          + dvRow('담당자', r.assignee || '<span style="color:#98a2b3;">미할당</span>')
          + dvRow('등록일', r.reg) + dvRow('처리기한', r.due) + dvRow('최근 업데이트', r.updated))
      + dvGroup(
          dvRow('설명', r.desc, true))
      + dvGroup(
          dvRow('처리이력', historyHtml, true))
      + '</div>';

    document.getElementById('tkMask').classList.add('show');
    document.getElementById('tkDrawer').classList.add('show');
  }

  function tkDetailClose() {
    document.getElementById('tkMask').classList.remove('show');
    document.getElementById('tkDrawer').classList.remove('show');
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  fillSelect('fAssignee', ASSIGNEES, true);
  fillSelect('fLoc', LOCATIONS, true);
  renderGrid();

  window.renderGrid      = renderGrid;
  window.resetSearch     = resetSearch;
  window.tkOpenAssign    = tkOpenAssign;
  window.tkAssignConfirm = tkAssignConfirm;
  window.assignModalClose = function () { hide('assignModal'); };
  window.tkRowClick      = tkRowClick;
  window.tkDetailClose   = tkDetailClose;

})();
