// 알람(체크) 룰 관리
//  A: 메인 목록 (설비 기준 1행 + 룰 개수 펼침 서브테이블)
//  B: 체크 룰 등록 모달 (레벨 + 조건식 빌더 + Action 리스트 + 추가 적용 설비)
//  C(예정): 중복 검증 결과별 포함/제외   D(예정): 수정 모달 / 기존 룰에서 복사
// 화면: 알람 > 알람 룰 관리   참고: 화면상세설계.txt , ums_sequences.md #5
(function () {

  // ---- 목업: 설비 기준. 각 설비가 자기 체크 룰 목록(rules)을 가짐 ----
  const FAC = [
    { no: 1, name: 'UPS-1F-A', type: 'UPS', loc: '본사 IDC-1F', rules: [
      { id: 11, level: 'major', expr: '@outv > 260 OR @outv < 200', action: '알림(이메일, SMS) · 티켓생성', on: true },
      { id: 12, level: 'warn',  expr: '@loadpct >= 85', action: '알림(이메일)', on: true },
    ]},
    { no: 2, name: 'UPS-1F-B', type: 'UPS', loc: '본사 IDC-1F', rules: [
      { id: 21, level: 'crit', expr: "@dischg = 'Y' AND @inv < 180", action: '알림(이메일, SMS, 카카오) · 티켓생성', on: true },
    ]},
    { no: 3, name: 'UPS-2F-A', type: 'UPS', loc: '본사 IDC-2F', rules: [] },
    { no: 4, name: 'PDU-1F-01', type: 'PDU', loc: '본사 IDC-1F', rules: [
      { id: 41, level: 'major', expr: '@brcpct > 90', action: '알림(이메일) · 티켓생성', on: true },
      { id: 42, level: 'minor', expr: '@brcpct > 75', action: '알림(이메일)', on: false },
    ]},
    { no: 5, name: 'CH-1', type: '칠러', loc: '본사 IDC-2F', rules: [
      { id: 51, level: 'major', expr: '@chwout > 12', action: '알림(이메일, SMS)', on: true },
    ]},
    { no: 6, name: 'BAT-1F-A-01', type: '배터리', loc: '본사 IDC-1F', rules: [
      { id: 61, level: 'warn', expr: '@soh < 80', action: '알림(이메일)', on: true },
      { id: 62, level: 'crit', expr: '@cellt > 55', action: '알림(이메일, SMS) · 티켓생성', on: true },
    ]},
    { no: 7, name: 'GW-IDC-01', type: 'GW', loc: '본사 IDC-1F', rules: [] },
    { no: 8, name: 'UPS-DR-1', type: 'UPS', loc: '판교 DR센터', rules: [
      { id: 81, level: 'none', expr: "@maint = 'Y'", action: '알림(이메일)', on: false },
    ]},
  ];

  const LEVEL_BADGE = {
    none:  ['badge-off',   'None'],
    warn:  ['badge-warn',  'Warning'],
    minor: ['badge-minor', 'Minor'],
    major: ['badge-major', 'Major'],
    crit:  ['badge-crit',  'Critical'],
  };
  function levelBadge(k) {
    const p = LEVEL_BADGE[k] || ['badge-off', k];
    return '<span class="badge ' + p[0] + '">' + p[1] + '</span>';
  }

  const expanded = new Set();

  function locList() {
    const s = []; FAC.forEach(function (f) { if (s.indexOf(f.loc) < 0) s.push(f.loc); });
    return s;
  }

  function filtered() {
    const t = document.getElementById('fType').value;
    const l = document.getElementById('fLoc').value;
    const kw = (document.getElementById('q').value || '').trim();
    return FAC.filter(function (f) {
      return (!t || f.type === t) && (!l || f.loc === l) && (!kw || f.name.indexOf(kw) >= 0);
    });
  }

  function subTable(f) {
    if (!f.rules.length) {
      return '<div class="sub-empty">등록된 체크 룰이 없습니다.'
        + '<button class="cr-add" onclick="crAddRule(' + f.no + ')">+ 룰 추가</button></div>';
    }
    const rows = f.rules.map(function (r) {
      return '<tr>'
        + '<td>' + levelBadge(r.level) + '</td>'
        + '<td class="expr">' + r.expr + '</td>'
        + '<td>' + r.action + '</td>'
        + '<td><span class="toggle-pill ' + (r.on ? 'on' : 'off') + '" onclick="crToggle(' + f.no + ',' + r.id + ')">'
        +   (r.on ? '사용' : '미사용') + '</span></td>'
        + '<td><button class="icon-btn" title="수정" onclick="crEditRule(' + f.no + ',' + r.id + ')">&#9998;</button></td>'
        + '</tr>';
    }).join('');
    return '<div class="sub-wrap"><table class="sub-table">'
      + '<thead><tr><th style="width:90px;">레벨</th><th>조건식</th><th style="width:34%;">Action</th>'
      +   '<th style="width:80px;">사용여부</th><th style="width:56px;">수정</th></tr></thead>'
      + '<tbody>' + rows + '</tbody></table></div>';
  }

  function crRender() {
    const list = filtered();
    const body = document.getElementById('crBody');
    body.innerHTML = list.map(function (f) {
      const isOpen = expanded.has(f.no);
      const cnt = '<span class="rulecount' + (f.rules.length ? '' : ' zero') + '" onclick="event.stopPropagation();crToggleRow(' + f.no + ')">'
        + f.rules.length + '<span class="caret">' + (isOpen ? '▾' : '▸') + '</span></span>';
      let html = '<tr class="facrow' + (isOpen ? ' open' : '') + '" data-no="' + f.no + '" onclick="crToggleRow(' + f.no + ')">'
        + '<td>' + f.no + '</td>'
        + '<td class="cell-l">' + f.name + '</td>'
        + '<td>' + f.type + '</td>'
        + '<td class="cell-l">' + f.loc + '</td>'
        + '<td>' + cnt + '</td>'
        + '<td><button class="cr-add" title="이 설비에 룰 추가" onclick="event.stopPropagation();crAddRule(' + f.no + ')">+ 룰</button></td>'
        + '</tr>';
      if (isOpen) html += '<tr class="subrow"><td colspan="6">' + subTable(f) + '</td></tr>';
      return html;
    }).join('');

    document.getElementById('facCount').textContent = list.length;
    document.getElementById('ruleCount').textContent = list.reduce(function (a, f) { return a + f.rules.length; }, 0);
  }

  function crToggleRow(no) {
    if (expanded.has(no)) expanded.delete(no); else expanded.add(no);
    crRender();
  }
  function crReset() {
    document.getElementById('fType').value = '';
    document.getElementById('fLoc').value = '';
    document.getElementById('q').value = '';
    crRender();
  }
  function crToggle(facNo, ruleId) {
    const f = FAC.filter(function (x) { return x.no === facNo; })[0];
    const r = f && f.rules.filter(function (x) { return x.id === ruleId; })[0];
    if (!r) return;
    r.on = !r.on;
    crRender();
    umsToast(r.on ? '룰을 사용으로 전환했습니다.' : '룰을 미사용으로 전환했습니다.');
  }

  function crEditRule() { umsToast('룰 수정 모달 — D단계에서 구현 예정'); }

  // ===================================================================
  //  B단계: 체크 룰 등록 모달
  // ===================================================================

  // 설비 유형별 파라미터 목록 (목업). [토큰, 표시명]
  const PARAMS = {
    UPS: [
      ['@outv', '출력전압'], ['@inv', '입력전압'], ['@loadpct', '출력 부하율(%)'],
      ['@freq', '출력 주파수'], ['@battv', '배터리 전압'], ['@dischg', "방전여부"],
      ['@runtime', '예상 백업시간(분)'], ['@temp', '내부온도'], ['@maint', '점검모드여부'],
    ],
    PDU: [
      ['@brcpct', '분기전류(정격%)'], ['@totcur', '총 전류'], ['@volt', '입력전압'],
      ['@kw', '유효전력(kW)'], ['@pf', '역률'], ['@outlet_st', '아웃렛 상태'],
    ],
    '칠러': [
      ['@chwout', '냉수 출구온도'], ['@chwin', '냉수 입구온도'], ['@flow', '냉수 유량'],
      ['@loadpct', '부하율(%)'], ['@comp_st', '압축기 상태'], ['@almflag', '장비 알람여부'],
    ],
    '배터리': [
      ['@soc', 'SOC(%)'], ['@soh', 'SOH(%)'], ['@cellv', '셀 전압'],
      ['@cellt', '셀 온도'], ['@ir', '내부저항'], ['@chg_st', '충전상태'],
    ],
    GW: [
      ['@conn', '연결상태'], ['@hb_delay', 'HEARTBEAT 지연(초)'],
      ['@cpu', 'CPU 사용률(%)'], ['@mem', '메모리 사용률(%)'], ['@disk', '디스크 사용률(%)'],
    ],
  };
  const OPS = ['>', '<', '>=', '<=', '=', '!=', 'AND', 'OR', '( )'];
  const NOTIFY_TARGETS = ['운영팀(그룹)', '시설관리팀(그룹)', '당직조(그룹)', '김진호', '이엔지', '박당직'];

  let crmFacNo = null;      // 대상 설비 no
  let crmExtra = [];        // 추가 적용 설비 no[]
  let crmActSeq = 0;

  function el(id) { return document.getElementById(id); }

  function crAddRule(facNo) {
    const f = FAC.filter(function (x) { return x.no === facNo; })[0];
    if (!f) return;
    crmFacNo = facNo;
    crmExtra = [];
    crmActSeq = 0;

    el('crmTitle').textContent = '체크 룰 등록';
    el('crmTarget').textContent = f.name + '  (' + f.type + ' · ' + f.loc + ')';
    // 레벨 기본값
    document.querySelectorAll('input[name=crLevel]').forEach(function (r) { r.checked = (r.value === 'warn'); });
    // 파라미터 콤보 (대상 설비 유형 기준)
    const ps = PARAMS[f.type] || [];
    el('crmParam').innerHTML = ps.map(function (p) {
      return '<option value="' + p[0] + '">' + p[0] + '  ·  ' + p[1] + '</option>';
    }).join('');
    // 연산자 버튼
    el('crmOps').innerHTML = OPS.map(function (o) {
      return '<button type="button" class="cr-op" onclick="crmInsertOp(\'' + o + '\')">' + o + '</button>';
    }).join('');
    // 조건식 / Action 초기화
    el('crmExpr').value = '';
    el('crmActList').innerHTML = '';
    crmAddAction();
    // 추가 적용 설비 콤보 (같은 유형, 자기 제외)
    el('crmExtra').innerHTML = '<option value="">설비 선택…</option>'
      + FAC.filter(function (x) { return x.type === f.type && x.no !== facNo; })
           .map(function (x) { return '<option value="' + x.no + '">' + x.name + ' (' + x.loc + ')</option>'; }).join('');
    renderExtraChips();

    el('crModal').classList.add('show');
  }

  function crmClose() { el('crModal').classList.remove('show'); }

  // ---- 조건식 빌더 : 커서 위치 삽입 ----
  function insertAtCursor(ta, text) {
    const s = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
    const e = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    const pos = s + text.length;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = pos;
  }
  function crmInsertParam() {
    insertAtCursor(el('crmExpr'), el('crmParam').value + ' ');
  }
  function crmInsertOp(op) {
    insertAtCursor(el('crmExpr'), op === '( )' ? '()' : ' ' + op + ' ');
  }

  // ---- Action 리스트 ----
  function crmAddAction() {
    const idx = ++crmActSeq;
    const wrap = document.createElement('div');
    wrap.className = 'cr-act-row';
    wrap.dataset.idx = idx;
    wrap.innerHTML =
      '<select class="form-select cr-act-kind" onchange="crmActKind(' + idx + ')">'
      +   '<option value="notify">알림</option><option value="ticket">티켓생성</option>'
      + '</select>'
      + '<span class="cr-act-sub" data-sub="notify">'
      +   '채널 '
      +   '<label><input type="checkbox" class="ch-email" checked> 이메일</label>'
      +   '<label><input type="checkbox" class="ch-sms"> SMS</label>'
      +   '<label><input type="checkbox" class="ch-kakao"> 카카오</label>'
      +   '&nbsp; 대상 <select class="form-select cr-act-tg" multiple size="3">'
      +     NOTIFY_TARGETS.map(function (t) { return '<option>' + t + '</option>'; }).join('')
      +   '</select>'
      + '</span>'
      + '<span class="cr-act-sub" data-sub="ticket" hidden>'
      +   '우선순위 <select class="form-select cr-act-pri"><option>낮음</option><option selected>보통</option><option>높음</option></select>'
      + '</span>'
      + '<button type="button" class="btn btn-danger cr-act-del" onclick="crmDelAction(' + idx + ')">삭제</button>';
    el('crmActList').appendChild(wrap);
  }
  function crmActKind(idx) {
    const row = el('crmActList').querySelector('.cr-act-row[data-idx="' + idx + '"]');
    const kind = row.querySelector('.cr-act-kind').value;
    row.querySelectorAll('.cr-act-sub').forEach(function (s) { s.hidden = (s.dataset.sub !== kind); });
  }
  function crmDelAction(idx) {
    const row = el('crmActList').querySelector('.cr-act-row[data-idx="' + idx + '"]');
    if (row) row.remove();
  }
  function actionSummary() {
    const parts = [];
    el('crmActList').querySelectorAll('.cr-act-row').forEach(function (row) {
      const kind = row.querySelector('.cr-act-kind').value;
      if (kind === 'notify') {
        const ch = [];
        if (row.querySelector('.ch-email').checked) ch.push('이메일');
        if (row.querySelector('.ch-sms').checked) ch.push('SMS');
        if (row.querySelector('.ch-kakao').checked) ch.push('카카오');
        parts.push('알림(' + (ch.join(', ') || '채널없음') + ')');
      } else {
        parts.push('티켓생성');
      }
    });
    return parts.join(' · ');
  }

  // ---- 추가 적용 설비 ----
  function crmExtraPick() {
    const v = el('crmExtra').value;
    if (v && crmExtra.indexOf(+v) < 0) crmExtra.push(+v);
    el('crmExtra').value = '';
    renderExtraChips();
  }
  function crmExtraRemove(no) {
    crmExtra = crmExtra.filter(function (x) { return x !== no; });
    renderExtraChips();
  }
  function renderExtraChips() {
    el('crmExtraChips').innerHTML = crmExtra.map(function (no) {
      const f = FAC.filter(function (x) { return x.no === no; })[0];
      return '<span class="cr-chip">' + (f ? f.name : no)
        + '<button type="button" onclick="crmExtraRemove(' + no + ')">&times;</button></span>';
    }).join('');
  }

  // ---- 중복 검증 (C단계에서 설비별 포함/제외 UI로 확장) ----
  function crmValidateDup() {
    if (!crmExtra.length) { umsToast('추가 적용 설비가 없습니다.'); return; }
    umsToast('중복 검증 완료 — ' + crmExtra.length + '개 설비 중 겹치는 룰 없음 (목업)');
  }

  function crmCopyExisting() { umsToast('기존 룰에서 복사 — D단계에서 구현 예정'); }

  // ---- 저장 : 대상 + 추가 적용 설비마다 독립 룰 생성 ----
  function crmSave() {
    const lvEl = document.querySelector('input[name=crLevel]:checked');
    const expr = (el('crmExpr').value || '').trim();
    if (!lvEl) { umsToast('레벨을 선택하세요.'); return; }
    if (!expr) { umsToast('조건식을 입력하세요.'); el('crmExpr').focus(); return; }

    // 저장 시에도 중복 재검증 (로직상) — 목업에서는 통과 처리
    const level = lvEl.value;
    const action = actionSummary() || '-';
    const targets = [crmFacNo].concat(crmExtra);
    targets.forEach(function (no) {
      const f = FAC.filter(function (x) { return x.no === no; })[0];
      if (!f) return;
      f.rules.push({ id: Date.now() % 100000 + f.rules.length, level: level, expr: expr, action: action, on: true });
      expanded.add(no);
    });
    crmClose();
    crRender();
    umsToast('저장되었습니다. (' + targets.length + '건 생성)');
  }

  // ---- init ----
  el('fLoc').innerHTML = '<option value="">전체</option>'
    + locList().map(function (v) { return '<option>' + v + '</option>'; }).join('');
  el('crmExtra').addEventListener('change', crmExtraPick);
  crRender();

  window.crRender       = crRender;
  window.crReset        = crReset;
  window.crToggleRow    = crToggleRow;
  window.crToggle       = crToggle;
  window.crAddRule      = crAddRule;
  window.crEditRule     = crEditRule;
  window.crmClose       = crmClose;
  window.crmInsertParam = crmInsertParam;
  window.crmInsertOp    = crmInsertOp;
  window.crmAddAction   = crmAddAction;
  window.crmActKind     = crmActKind;
  window.crmDelAction   = crmDelAction;
  window.crmExtraRemove = crmExtraRemove;
  window.crmValidateDup = crmValidateDup;
  window.crmCopyExisting = crmCopyExisting;
  window.crmSave        = crmSave;

})();
