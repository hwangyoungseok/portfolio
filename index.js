// UMS 홈 화면 스크립트 (목업 데이터)
// 티켓 > 전체 티켓(ticket-all.js)에 있던 KPI 카드를 홈 화면으로 옮겨왔다. 카드 값 집계에
// 필요한 DATA는 ticket-all.js의 DATA를 그대로 옮긴 것 — 티켓 목업 데이터가 바뀌면 여기도 같이 맞출 것.
(function () {

  const DATA = [
    { no: 1, ticketNo: 'TCK-20260903-002', title: 'UPS-2F-B 통신 두절', target: 'UPS-2F-B', targetType: 'UPS', loc: '본사 IDC-2F',
      pri: 'major', status: 'pending', reg: '2026-09-03', due: '2026-09-04', updated: '2026-09-03 08:20', assignee: null },
    { no: 2, ticketNo: 'TCK-20260903-001', title: 'GW-DR-02 서버 응답 없음', target: 'GW-DR-02', targetType: 'GW', loc: '판교 DR센터',
      pri: 'critical', status: 'pending', reg: '2026-09-03', due: '2026-09-03', updated: '2026-09-03 07:55', assignee: null },
    { no: 3, ticketNo: 'TCK-20260902-030', title: 'PDU-1F-C 출력 전류 이상', target: 'PDU-1F-C', targetType: 'PDU', loc: '본사 IDC-1F',
      pri: 'minor', status: 'pending', reg: '2026-09-02', due: '2026-09-06', updated: '2026-09-02 19:41', assignee: null },
    { no: 4, ticketNo: 'TCK-20260902-027', title: 'CH-2F-02 냉수 유량 저하', target: 'CH-2F-02', targetType: '칠러', loc: '본사 IDC-2F',
      pri: 'warning', status: 'pending', reg: '2026-09-02', due: '2026-09-08', updated: '2026-09-02 15:10', assignee: null },
    { no: 5, ticketNo: 'TCK-20260901-019', title: 'BAT-1F-01 셀 온도 상승', target: 'BAT-1F-01', targetType: '배터리', loc: '본사 IDC-1F',
      pri: 'major', status: 'pending', reg: '2026-09-01', due: '2026-09-05', updated: '2026-09-01 21:03', assignee: null },
    { no: 6, ticketNo: 'TCK-20260901-014', title: 'UPS-1F-B 출력 부하율 85% 초과', target: 'UPS-1F-B', targetType: 'UPS', loc: '본사 IDC-1F',
      pri: 'minor', status: 'progress', reg: '2026-09-01', due: '2026-09-03', updated: '2026-09-02 10:20', assignee: '관리자' },
    { no: 7, ticketNo: 'TCK-20260902-021', title: 'GW-IDC-02 통신 두절', target: 'GW-IDC-02', targetType: 'GW', loc: '본사 IDC-2F',
      pri: 'major', status: 'pending', reg: '2026-09-02', due: '2026-09-02', updated: '2026-09-02 08:15', assignee: '관리자' },
    { no: 8, ticketNo: 'TCK-20260830-005', title: 'CH-1F-01 응축기 압력 경고', target: 'CH-1F-01', targetType: '칠러', loc: '본사 IDC-1F',
      pri: 'warning', status: 'pending', reg: '2026-08-30', due: '2026-09-05', updated: '2026-08-30 14:02', assignee: '관리자' },
    { no: 9, ticketNo: 'TCK-20260825-002', title: 'BAT-DR-02 배터리 스트링 전압 저하', target: 'BAT-DR-02', targetType: '배터리', loc: '판교 DR센터',
      pri: 'critical', status: 'done', reg: '2026-08-25', due: '2026-08-27', updated: '2026-08-28 16:40', assignee: '관리자' },
    { no: 10, ticketNo: 'TCK-20260828-009', title: 'PDU-2F-A 회로 과부하', target: 'PDU-2F-A', targetType: 'PDU', loc: '본사 IDC-2F',
      pri: 'minor', status: 'progress', reg: '2026-08-28', due: '2026-09-01', updated: '2026-08-29 13:11', assignee: '관리자' },
    { no: 11, ticketNo: 'TCK-20260829-011', title: 'UPS-DR-1 배터리 자가진단 실패', target: 'UPS-DR-1', targetType: 'UPS', loc: '판교 DR센터',
      pri: 'major', status: 'progress', reg: '2026-08-29', due: '2026-09-02', updated: '2026-08-30 09:00', assignee: '김민준' },
    { no: 12, ticketNo: 'TCK-20260827-006', title: 'GW-IDC-01 인증서 만료 임박', target: 'GW-IDC-01', targetType: 'GW', loc: '본사 IDC-1F',
      pri: 'warning', status: 'done', reg: '2026-08-27', due: '2026-08-30', updated: '2026-08-29 11:00', assignee: '이서연' },
    { no: 13, ticketNo: 'TCK-20260826-004', title: 'PDU-DR-01 온도 센서 이상', target: 'PDU-DR-01', targetType: 'PDU', loc: '판교 DR센터',
      pri: 'critical', status: 'progress', reg: '2026-08-26', due: '2026-08-29', updated: '2026-08-27 14:30', assignee: '박지훈' },
  ];

  function today() { return new Date().toISOString().slice(0, 10); }
  function isOverdue(r) { return r.status !== 'done' && r.due < today(); }

  // 카드 자체는 host-only/customer-only(shared/common.css)로 모드별로 숨겨지지만, 값 채우는
  // 로직은 모드 구분 없이 다 채워둔다 — 숨겨진 카드는 그냥 안 보일 뿐 계산엔 문제 없다.
  function renderKpi() {
    document.getElementById('kpiOpen').innerHTML       = DATA.filter(function (r) { return r.status !== 'done'; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiUnassigned').innerHTML = DATA.filter(function (r) { return !r.assignee; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiPending').innerHTML    = DATA.filter(function (r) { return r.status === 'pending'; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiProgress').innerHTML   = DATA.filter(function (r) { return r.status === 'progress'; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiClosed').innerHTML     = DATA.filter(function (r) { return r.status === 'done'; }).length + '<span class="unit">건</span>';
    document.getElementById('kpiOverdue').innerHTML    = DATA.filter(isOverdue).length + '<span class="unit">건</span>';
  }

  renderKpi();

})();
