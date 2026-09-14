// 내 티켓 페이지 스크립트 (목업 데이터)
// 화면: 티켓 > 내 티켓
(function () {

  // 호스트/고객 모드 구분. layout.js가 buildChrome()에서 <body data-role="host|customer">를
  // 이 스크립트가 실행되기 전에 이미 붙여 놓는다(같은 </body> 앞에서 layout.js가 먼저 로드됨).
  const IS_CUSTOMER = document.body.getAttribute('data-role') === 'customer';
  // 이 목업 티켓들의 실제 담당자(호스트 쪽 사람) — 보는 사람의 모드와 무관하게 항상 고정.
  const ASSIGNEE = '관리자';
  // 코멘트 작성자 이름은 "지금 이 화면을 보고 있는 사람"이라 모드에 따라 달라진다.
  const ME = IS_CUSTOMER ? '고객사' : '관리자';

  // 티켓 생성 모달의 "대상 설비" select용 — 각 설비관리 페이지(ups-list.js 등)에 등록된
  // 실제 설비명 그대로. 그쪽 DATA가 바뀌면 여기도 같이 맞출 것.
  const EQUIPMENT_BY_TYPE = {
    UPS: ['UPS-1F-A', 'UPS-1F-B', 'UPS-1F-C', 'UPS-2F-A', 'UPS-2F-B', 'UPS-DR-1', 'UPS-DR-2'],
    PDU: ['PDU-1F-01', 'PDU-1F-02', 'PDU-2F-01', 'PDU-2F-02', 'PDU-DR-01', 'PDU-DR-02'],
    칠러: ['CH-1F-01', 'CH-1F-02', 'CH-2F-01', 'CH-2F-02', 'CH-DR-01'],
    배터리: ['BAT-1F-A-1', 'BAT-1F-B-1', 'BAT-1F-B-2', 'BAT-1F-C-1', 'BAT-2F-A-1', 'BAT-2F-B-1', 'BAT-2F-B-2', 'BAT-DR-1-1', 'BAT-DR-2-1'],
    GW: ['GW-IDC-01', 'GW-IDC-02', 'GW-DR-01', 'GW-DR-02'],
  };

  const DATA = [
    { no: 1, ticketNo: 'TCK-20260901-014', title: 'UPS-1F-B 출력 부하율 85% 초과', target: 'UPS-1F-B', targetType: 'UPS',
      pri: 'minor', status: 'progress', reg: '2026-09-01', due: '2026-09-03', updated: '2026-09-02 10:20',
      assignee: ASSIGNEE, desc: 'UPS-1F-B의 출력 부하율이 85%를 초과하여 경고 알람이 발생했습니다. 부하 분산 여부 확인이 필요합니다.',
      history: [
        { time: '2026-09-01 09:12', text: '알람 기반 티켓 자동 생성' },
        { time: '2026-09-01 09:30', text: '담당자(관리자)에게 할당' },
        { time: '2026-09-02 10:20', text: '상태 변경: 대기중 → 진행중' },
      ],
      comments: [
        { author: '관리자', time: '2026-09-02 10:21', text: '현장 점검 예정. 부하 분산 작업 진행하겠습니다.' },
        { author: '김설비', time: '2026-09-02 11:05', text: '부하 분산 전 배전반 차단기 상태도 같이 확인 부탁드립니다.' },
      ] },
    { no: 2, ticketNo: 'TCK-20260902-021', title: 'GW-IDC-02 통신 두절', target: 'GW-IDC-02', targetType: 'GW',
      pri: 'major', status: 'pending', reg: '2026-09-02', due: '2026-09-02', updated: '2026-09-02 08:15',
      assignee: ASSIGNEE, desc: 'GW-IDC-02와의 통신이 두절되었습니다. 네트워크 상태 및 GW 전원 확인이 필요합니다.',
      history: [
        { time: '2026-09-02 08:15', text: '알람 기반 티켓 자동 생성' },
        { time: '2026-09-02 08:20', text: '담당자(관리자)에게 할당' },
      ],
      comments: [] },
    { no: 3, ticketNo: 'TCK-20260830-005', title: 'CH-1F-01 응축기 압력 경고', target: 'CH-1F-01', targetType: '칠러',
      pri: 'warning', status: 'pending', reg: '2026-08-30', due: '2026-09-05', updated: '2026-08-30 14:02',
      assignee: ASSIGNEE, desc: '칠러 CH-1F-01의 응축기 압력이 임계치에 근접했습니다. 정기 점검 시 확인 바랍니다.',
      history: [
        { time: '2026-08-30 14:02', text: '알람 기반 티켓 자동 생성' },
        { time: '2026-08-30 14:10', text: '담당자(관리자)에게 할당' },
      ],
      comments: [] },
    { no: 4, ticketNo: 'TCK-20260825-002', title: 'BAT-DR-02 배터리 스트링 전압 저하', target: 'BAT-DR-02', targetType: '배터리',
      pri: 'critical', status: 'done', reg: '2026-08-25', due: '2026-08-27', updated: '2026-08-28 16:40',
      assignee: ASSIGNEE, desc: '배터리 BAT-DR-02의 스트링 전압이 기준치 이하로 저하되었습니다.',
      history: [
        { time: '2026-08-25 11:03', text: '알람 기반 티켓 자동 생성' },
        { time: '2026-08-25 11:10', text: '담당자(관리자)에게 할당' },
        { time: '2026-08-26 09:00', text: '상태 변경: 대기중 → 진행중' },
        { time: '2026-08-28 16:40', text: '상태 변경: 진행중 → 완료 (배터리 스트링 교체 완료)' },
      ],
      comments: [
        { author: '관리자', time: '2026-08-26 09:05', text: '배터리 스트링 3번 채널 이상 확인, 교체 부품 발주.' },
        { author: '관리자', time: '2026-08-28 16:38', text: '교체 작업 완료, 전압 정상 범위 복귀 확인.' },
      ] },
    { no: 5, ticketNo: 'TCK-20260828-009', title: 'PDU-2F-A 회로 과부하', target: 'PDU-2F-A', targetType: 'PDU',
      pri: 'minor', status: 'progress', reg: '2026-08-28', due: '2026-09-01', updated: '2026-08-29 13:11',
      assignee: ASSIGNEE, desc: 'PDU-2F-A 3번 회로의 부하가 정격 대비 90%를 초과했습니다.',
      history: [
        { time: '2026-08-28 09:40', text: '알람 기반 티켓 자동 생성' },
        { time: '2026-08-28 09:50', text: '담당자(관리자)에게 할당' },
        { time: '2026-08-29 13:11', text: '상태 변경: 대기중 → 진행중' },
      ],
      comments: [] },
    // 고객이 직접 등록한 티켓 예시 — tkCreateSubmit()으로 방금 만든 것처럼 새로고침해도
    // 남아있도록 처음부터 목업 데이터에 심어 둔다(자동생성 티켓과 달리 attachments 필드가 있음).
    { no: 6, ticketNo: 'TCK-20260904-011', title: 'PDU-1F-01 전원 표시등 깜빡임', target: 'PDU-1F-01', targetType: 'PDU',
      pri: 'minor', status: 'pending', reg: '2026-09-04', due: '2026-09-07', updated: '2026-09-04 10:05',
      assignee: ASSIGNEE, desc: 'PDU-1F-01 전면 전원 표시등이 간헐적으로 깜빡입니다. 확인 부탁드립니다.',
      attachments: ['pdu_led_photo.jpg'],
      history: [
        { time: '2026-09-04 10:05', text: '고객사가 티켓을 직접 등록' },
        { time: '2026-09-04 10:10', text: '담당자(관리자)에게 할당' },
      ],
      comments: [] },
  ];

  const PRI_LABEL = { warning: 'Warning', minor: 'Minor', major: 'Major', critical: 'Critical' };
  const STATUS_LABEL = { pending: '대기중', progress: '진행중', done: '완료' };

  function priBadge(pri) { return '<span class="pri-badge pri-' + pri + '">' + PRI_LABEL[pri] + '</span>'; }

  function today() { return new Date().toISOString().slice(0, 10); }
  function isOverdue(r) {
    if (r.status === 'done') return r.updated.slice(0, 10) > r.due;  // 완료건: 완료시각(=최근 업데이트) > 기한
    return r.due < today();                                          // 미완료건: 현재시각 > 기한
  }

  function statusBadge(st) {
    const cls = st === 'pending' ? 'status-pending' : (st === 'progress' ? 'status-progress' : 'status-done');
    return '<span class="status-badge ' + cls + '">' + STATUS_LABEL[st] + '</span>';
  }

  // 고객 모드는 상태를 읽기만 가능하다(변경 불가) — 그리드도 인라인 select 대신 배지만 보여준다.
  function statusSelect(r) {
    const overdue = isOverdue(r) ? '<span class="status-badge status-overdue">기한초과</span>' : '';
    if (IS_CUSTOMER) return statusBadge(r.status) + overdue;
    return '<select class="inline-status" onclick="event.stopPropagation();" onchange="tkStatusChange(' + r.no + ', this.value)">'
      + Object.keys(STATUS_LABEL).map(function (k) {
          return '<option value="' + k + '"' + (r.status === k ? ' selected' : '') + '>' + STATUS_LABEL[k] + '</option>';
        }).join('')
      + '</select>' + overdue;
  }

  function renderGrid() {
    const kw     = (document.getElementById('q').value || '').trim();
    const fStat  = document.getElementById('fStatus').value;
    const fOverdue = document.getElementById('fOverdue').checked;
    const fPri   = document.getElementById('fPri').value;
    const fFrom  = document.getElementById('fFrom').value;
    const fTo    = document.getElementById('fTo').value;

    // 내 티켓은 전부 담당자 배정된 상태라 pending = "진행 대기". open = 완료 아님.
    function statusMatch(r) {
      if (!fStat) return true;
      if (fStat === 'open') return r.status !== 'done';
      if (fStat === 'assigned') return r.status === 'pending';
      return r.status === fStat;
    }

    const rows = DATA.filter(function (r) {
      return (!kw || r.title.indexOf(kw) >= 0 || r.ticketNo.indexOf(kw) >= 0 || r.target.indexOf(kw) >= 0)
        && statusMatch(r)
        && (!fOverdue || isOverdue(r))
        && (!fPri  || r.pri === fPri)
        && (!fFrom || r.reg >= fFrom)
        && (!fTo   || r.reg <= fTo);
    });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr data-no="' + r.no + '" onclick="tkRowClick(' + r.no + ')">'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.ticketNo + '</td>'
            + '<td style="text-align:left;">' + r.title + '</td>'
            + '<td>' + r.target + '</td>'
            + '<td>' + priBadge(r.pri) + '</td>'
            + '<td>' + statusSelect(r) + '</td>'
            + '<td>' + r.reg + '</td>'
            + '<td>' + r.due + '</td>'
            + '<td>' + r.updated + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="9" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = rows.length;
  }

  function resetSearch() {
    document.getElementById('fStatus').value = '';
    document.getElementById('fOverdue').checked = false;
    document.getElementById('fPri').value = '';
    document.getElementById('fFrom').value = '';
    document.getElementById('fTo').value = '';
    document.getElementById('q').value = '';
    renderGrid();
  }

  function tkStatusChange(no, status) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    const from = STATUS_LABEL[r.status];
    r.status = status;
    r.updated = nowStr();
    r.history.push({ time: r.updated, text: '상태 변경: ' + from + ' → ' + STATUS_LABEL[status] });
    renderGrid();
    umsToast('상태가 변경되었습니다.');
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function nowStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // ================= 티켓 생성 (고객 전용) =================
  function tkCreateFillTarget() {
    const type = document.getElementById('tc-type').value;
    document.getElementById('tc-target').innerHTML = (EQUIPMENT_BY_TYPE[type] || [])
      .map(function (name) { return '<option>' + name + '</option>'; }).join('');
  }

  // 티켓 생성 시 첨부하는 파일 목록. 상세 모달의 코멘트 첨부(pendingFiles)와는 별개 —
  // 코멘트는 티켓이 이미 있는 상태에서 나중에 덧붙이는 것이고, 이건 최초 등록 시점에
  // 티켓 본문에 딸리는 첨부라 서로 다른 상태로 관리한다.
  let createPendingFiles = [];

  function renderCreateAttachChips() {
    document.getElementById('tcAttachChips').innerHTML = createPendingFiles.map(function (name, i) {
      return '<span class="tk-file-chip">&#128206; ' + name + ' <button type="button" onclick="tkCreateRemoveFile(' + i + ')">&times;</button></span>';
    }).join('');
  }

  function tkCreateFilePick(e) {
    Array.from(e.target.files || []).forEach(function (f) { createPendingFiles.push(f.name); });
    e.target.value = '';
    renderCreateAttachChips();
  }

  function tkCreateRemoveFile(i) {
    createPendingFiles.splice(i, 1);
    renderCreateAttachChips();
  }

  function tkCreateOpen() {
    document.getElementById('tc-title').value = '';
    document.getElementById('tc-type').value = 'UPS';
    tkCreateFillTarget();
    document.getElementById('tc-pri').value = 'minor';
    document.getElementById('tc-desc').value = '';
    createPendingFiles = [];
    renderCreateAttachChips();
    document.getElementById('tkCreateModal').classList.add('show');
  }

  function tkCreateClose() {
    document.getElementById('tkCreateModal').classList.remove('show');
  }

  function tkCreateSubmit() {
    const title      = document.getElementById('tc-title').value.trim();
    const targetType = document.getElementById('tc-type').value;
    const target     = document.getElementById('tc-target').value;
    const pri        = document.getElementById('tc-pri').value;
    const desc       = document.getElementById('tc-desc').value.trim();
    if (!title) { umsToast('제목을 입력하세요.'); return; }
    if (!desc)  { umsToast('상세 내용을 입력하세요.'); return; }

    const no = Math.max.apply(null, DATA.map(function (r) { return r.no; }).concat([0])) + 1;
    const now = nowStr();
    const today = now.slice(0, 10);
    const ticketNo = 'TCK-' + today.replace(/-/g, '') + '-' + String(no).padStart(3, '0');

    DATA.unshift({
      no: no, ticketNo: ticketNo, title: title, target: target, targetType: targetType,
      pri: pri, status: 'pending', reg: today, due: addDays(today, 3), updated: now,
      assignee: ASSIGNEE, desc: desc, attachments: createPendingFiles.slice(),
      history: [{ time: now, text: ME + '가 티켓을 직접 등록' }],
      comments: [],
    });

    document.getElementById('tkCreateModal').classList.remove('show');
    createPendingFiles = [];
    renderGrid();
    umsToast('티켓이 등록되었습니다.');
  }

  let detailNo = null;
  let pendingFiles = []; // 코멘트 작성창에서 첨부 대기 중인 파일명 목록

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
    pendingFiles = [];
    tkDetailOpen(no);
  }

  function tkDetailOpen(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    // 상태변경 저장/코멘트 등록 뒤에도 dBody를 다시 그리므로, 그 사이 입력해 둔 코멘트 초안은 남겨둔다.
    const prevInput = detailNo === no ? (document.getElementById('tk-cmt-input') || {}).value || '' : '';
    detailNo = no;
    document.getElementById('dTitle').textContent = r.ticketNo + ' 상세';

    const historyHtml = r.history.length
      ? '<div class="tl">' + r.history.slice().reverse().map(function (h) {
          return '<div class="tl-item"><span class="tl-time">' + h.time + '</span><span class="tl-text">' + h.text + '</span></div>';
        }).join('') + '</div>'
      : '<span style="color:#8a97a5;">이력이 없습니다.</span>';

    const commentsHtml = r.comments.length
      ? '<div class="cmt-list">' + r.comments.map(function (c) {
          const files = (c.attachments && c.attachments.length)
            ? '<div class="cmt-attachments">' + c.attachments.map(function (f) { return '<span class="cmt-file-chip">&#128206; ' + f + '</span>'; }).join('') + '</div>'
            : '';
          return '<div class="cmt-item"><div class="cmt-head"><span class="cmt-author">' + c.author + '</span><span>' + c.time + '</span></div><div class="cmt-text">' + c.text + '</div>' + files + '</div>';
        }).join('') + '</div>'
      : '<div class="cmt-list"><span style="color:#8a97a5;">등록된 코멘트가 없습니다.</span></div>';

    // 코멘트 작성창은 "코멘트" dv-box 안, 목록 바로 아래에 함께 들어간다(처리이력과 같은 라벨-박스
    // 구조를 쓰되, 그 박스 자체에 목록 + 작성창을 같이 담는다).
    const composerHtml = '<div class="tk-cmt-composer">'
      + '<textarea class="form-textarea" id="tk-cmt-input" rows="2" placeholder="코멘트를 입력하세요."></textarea>'
      + '<div class="tk-cmt-composer-row">'
      +   '<label class="btn tk-attach-btn">&#128206; 첨부파일<input type="file" id="tk-cmt-file" multiple hidden onchange="tkFilePick(event)"></label>'
      +   '<div class="tk-attach-chips" id="tkAttachChips"></div>'
      +   '<span class="toolbar-spacer"></span>'
      +   '<button class="btn btn-primary" onclick="tkAddComment()">등록</button>'
      + '</div></div>';

    // 고객 모드는 상태를 읽기만 가능하다 — 상태변경 컨트롤 대신 읽기 전용 배지 행을 보여준다.
    const statusRowHtml = IS_CUSTOMER
      ? dvRow('상태', statusBadge(r.status) + (isOverdue(r) ? ' <span class="status-badge status-overdue">기한초과</span>' : ''))
      : dvRow('상태변경', '<div class="status-change-row"><select class="form-select" id="tk-status-sel" style="width:140px;">'
          + Object.keys(STATUS_LABEL).map(function (k) { return '<option value="' + k + '"' + (r.status === k ? ' selected' : '') + '>' + STATUS_LABEL[k] + '</option>'; }).join('')
          + '</select><button class="btn btn-primary" onclick="tkStatusChangeFromModal(' + r.no + ')">저장</button></div>');

    document.getElementById('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('제목', r.title, true)
          + dvRow('대상', r.targetType + ' · ' + r.target) + dvRow('우선순위', priBadge(r.pri))
          + dvRow('등록일', r.reg) + dvRow('처리기한', r.due + (isOverdue(r) ? ' <span class="status-badge status-overdue">기한초과</span>' : ''))
          + dvRow('최근 업데이트', r.updated))
      + dvGroup(
          dvRow('설명', r.desc, true)
          + (r.attachments !== undefined
              ? dvRow('첨부파일', r.attachments.length
                  ? r.attachments.map(function (f) { return '<span class="cmt-file-chip">&#128206; ' + f + '</span>'; }).join('')
                  : '<span style="color:#8a97a5;">첨부된 파일이 없습니다.</span>', true)
              : ''))
      + dvGroup(statusRowHtml)
      + dvGroup(
          dvRow('처리이력', historyHtml, true))
      + dvGroup(
          dvRow('코멘트', '<div class="tk-cmt-block">' + commentsHtml + composerHtml + '</div>', true))
      + '</div>';

    document.getElementById('tk-cmt-input').value = prevInput;
    renderAttachChips();

    document.getElementById('tkModal').classList.add('show');
  }

  function tkDetailClose() {
    document.getElementById('tkModal').classList.remove('show');
  }

  function tkStatusChangeFromModal(no) {
    const sel = document.getElementById('tk-status-sel');
    tkStatusChange(no, sel.value);
    tkDetailOpen(no);
  }

  function renderAttachChips() {
    document.getElementById('tkAttachChips').innerHTML = pendingFiles.map(function (name, i) {
      return '<span class="tk-file-chip">&#128206; ' + name + ' <button type="button" onclick="tkRemoveFile(' + i + ')">&times;</button></span>';
    }).join('');
  }

  function tkFilePick(e) {
    Array.from(e.target.files || []).forEach(function (f) { pendingFiles.push(f.name); });
    e.target.value = '';
    renderAttachChips();
  }

  function tkRemoveFile(i) {
    pendingFiles.splice(i, 1);
    renderAttachChips();
  }

  function tkAddComment() {
    const r = DATA.filter(function (x) { return x.no === detailNo; })[0];
    if (!r) return;
    const input = document.getElementById('tk-cmt-input');
    const text = input.value.trim();
    if (!text && !pendingFiles.length) { umsToast('코멘트 내용을 입력하거나 첨부파일을 추가하세요.'); return; }
    r.comments.push({ author: ME, time: nowStr(), text: text, attachments: pendingFiles.slice() });
    input.value = '';
    pendingFiles = [];
    tkDetailOpen(detailNo);
    umsToast('코멘트가 등록되었습니다.');
  }

  // ---- 초기화 ----
  renderGrid();

  window.renderGrid  = renderGrid;
  window.resetSearch = resetSearch;
  window.tkRowClick  = tkRowClick;
  window.tkStatusChange = tkStatusChange;
  window.tkStatusChangeFromModal = tkStatusChangeFromModal;
  window.tkAddComment = tkAddComment;
  window.tkFilePick = tkFilePick;
  window.tkRemoveFile = tkRemoveFile;
  window.tkDetailClose = tkDetailClose;
  window.tkCreateOpen = tkCreateOpen;
  window.tkCreateClose = tkCreateClose;
  window.tkCreateSubmit = tkCreateSubmit;
  window.tkCreateFilePick = tkCreateFilePick;
  window.tkCreateRemoveFile = tkCreateRemoveFile;
  window.tkCreateFillTarget = tkCreateFillTarget;

})();
