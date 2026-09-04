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

  function crEditRule() { /* 목업 — 동작 없음 */ }

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
  let crmActs = [];         // 추가된 Action 목록 [{kind, channels[], targets[], pri}]
  let crmActEditIdx = null; // 수정 중인 Action 목록 인덱스 (null = 신규 추가 모드)

  function el(id) { return document.getElementById(id); }

  function crAddRule(facNo) {
    const f = FAC.filter(function (x) { return x.no === facNo; })[0];
    if (!f) return;
    crmFacNo = facNo;
    crmExtra = [];
    crmActs = [];

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
    // 조건식 초기화
    el('crmExpr').value = '';
    // Action 초기화: 대상 옵션 채우고, 입력영역/목록 리셋
    el('crmActTargets').innerHTML = NOTIFY_TARGETS.map(function (t) { return '<option>' + t + '</option>'; }).join('');
    crmActResetEdit();
    crmActRenderList();
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

  // ---- Action : 입력영역 1벌 + 아래 추가된 목록 ----
  function crmActKindChange() {
    const kind = el('crmActKind').value;
    document.querySelectorAll('.cr-act-edit .cr-act-sub').forEach(function (s) {
      s.hidden = (s.dataset.sub !== kind);
    });
  }
  function crmActResetEdit() {
    crmActEditIdx = null;
    el('crmActKind').value = 'notify';
    el('crmChEmail').checked = true;
    el('crmChSms').checked = false;
    el('crmChKakao').checked = false;
    Array.prototype.forEach.call(el('crmActTargets').options, function (o) { o.selected = false; });
    el('crmActPri').value = '보통';
    el('crmActApplyBtn').textContent = '+ 추가';
    el('crmActCancelBtn').hidden = true;
    crmActKindChange();
  }
  function crmActReadEdit() {
    const kind = el('crmActKind').value;
    if (kind === 'ticket') return { kind: 'ticket', channels: [], targets: [], pri: el('crmActPri').value };
    const channels = [];
    if (el('crmChEmail').checked) channels.push('이메일');
    if (el('crmChSms').checked) channels.push('SMS');
    if (el('crmChKakao').checked) channels.push('카카오');
    const targets = Array.prototype.map.call(
      Array.prototype.filter.call(el('crmActTargets').options, function (o) { return o.selected; }),
      function (o) { return o.value; }
    );
    return { kind: 'notify', channels: channels, targets: targets, pri: '' };
  }
  function crmActApply() {
    const a = crmActReadEdit();
    if (a.kind === 'notify' && !a.channels.length) { umsToast('알림 채널을 하나 이상 선택하세요.'); return; }
    if (crmActEditIdx != null && crmActs[crmActEditIdx]) {
      crmActs[crmActEditIdx] = a;          // 기존 줄 갱신
    } else {
      crmActs.push(a);                     // 신규 추가
    }
    crmActResetEdit();
    crmActRenderList();
  }
  function crmActEdit(i) {
    const a = crmActs[i];
    if (!a) return;
    crmActEditIdx = i;                     // 줄은 목록에 그대로 두고 편집 표시
    el('crmActKind').value = a.kind;
    crmActKindChange();
    if (a.kind === 'notify') {
      el('crmChEmail').checked = a.channels.indexOf('이메일') >= 0;
      el('crmChSms').checked = a.channels.indexOf('SMS') >= 0;
      el('crmChKakao').checked = a.channels.indexOf('카카오') >= 0;
      Array.prototype.forEach.call(el('crmActTargets').options, function (o) {
        o.selected = a.targets.indexOf(o.value) >= 0;
      });
    } else {
      el('crmActPri').value = a.pri || '보통';
    }
    el('crmActApplyBtn').textContent = '수정 반영';
    el('crmActCancelBtn').hidden = false;
    crmActRenderList();
  }
  function crmActCancelEdit() { crmActResetEdit(); crmActRenderList(); }
  function crmActDel(i) {
    crmActs.splice(i, 1);
    if (crmActEditIdx != null) {           // 편집 중이던 인덱스 보정
      if (crmActEditIdx === i) crmActResetEdit();
      else if (crmActEditIdx > i) crmActEditIdx--;
    }
    crmActRenderList();
  }

  function actDesc(a) {
    if (a.kind === 'ticket') return '우선순위: ' + (a.pri || '보통');
    return (a.channels.join(', ') || '채널 없음')
      + ' · 대상: ' + (a.targets.join(', ') || '없음');
  }
  function crmActRenderList() {
    if (!crmActs.length) {
      el('crmActList').innerHTML = '<div class="cr-act-empty">추가된 Action이 없습니다.</div>';
      return;
    }
    el('crmActList').innerHTML = crmActs.map(function (a, i) {
      return '<div class="cr-act-item' + (i === crmActEditIdx ? ' editing' : '') + '">'
        + '<span class="cr-act-tag">' + (a.kind === 'notify' ? '알림' : '티켓생성') + '</span>'
        + '<span class="cr-act-desc">' + actDesc(a) + '</span>'
        + '<span class="cr-act-item-btns">'
        +   '<button type="button" class="icon-btn" title="수정" onclick="crmActEdit(' + i + ')">&#9998;</button>'
        +   '<button type="button" class="icon-btn del" title="삭제" onclick="crmActDel(' + i + ')">&#128465;</button>'
        + '</span></div>';
    }).join('');
  }
  function actionSummary() {
    return crmActs.map(function (a) {
      return a.kind === 'notify'
        ? '알림(' + (a.channels.join(', ') || '채널없음') + ')'
        : '티켓생성';
    }).join(' · ');
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

  // ---- 기존 룰에서 복사 ----
  let crCopyList = [];   // [{facNo, facName, rule}]

  function crmCopyExisting() {
    crCopyList = [];
    FAC.forEach(function (f) {
      if (f.no === crmFacNo) return;   // 다른 설비의 룰만
      f.rules.forEach(function (r) { crCopyList.push({ facNo: f.no, facName: f.name, rule: r }); });
    });
    el('crCopyQ').value = '';
    crCopyRender();
    el('crCopyModal').classList.add('show');
  }
  function crCopyClose() { el('crCopyModal').classList.remove('show'); }

  function crCopyRender() {
    const kw = (el('crCopyQ').value || '').trim();
    const rows = crCopyList.filter(function (x) {
      return !kw || x.facName.indexOf(kw) >= 0 || x.rule.expr.indexOf(kw) >= 0;
    });
    el('crCopyBody').innerHTML = rows.length ? rows.map(function (x) {
      return '<tr>'
        + '<td>' + x.facName + '</td>'
        + '<td>' + levelBadge(x.rule.level) + '</td>'
        + '<td class="expr">' + x.rule.expr + '</td>'
        + '<td>' + x.rule.action + '</td>'
        + '<td><button type="button" class="cr-copy-pick" onclick="crCopyPick(' + x.facNo + ',' + x.rule.id + ')">선택</button></td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="5"><div class="cr-copy-empty">복사할 룰이 없습니다.</div></td></tr>';
  }

  function parseActionSummary(str) {
    if (!str || str === '-') return [];
    return str.split(' · ').map(function (p) {
      p = p.trim();
      if (p.indexOf('알림(') === 0) {
        const inside = p.slice(3, -1);
        const channels = (inside ? inside.split(',') : [])
          .map(function (s) { return s.trim(); })
          .filter(function (s) { return s && s !== '채널없음'; });
        return { kind: 'notify', channels: channels, targets: [], pri: '' };
      }
      if (p.indexOf('티켓생성') === 0) return { kind: 'ticket', channels: [], targets: [], pri: '보통' };
      return null;
    }).filter(Boolean);
  }

  function crCopyPick(facNo, ruleId) {
    const f = FAC.filter(function (x) { return x.no === facNo; })[0];
    const r = f && f.rules.filter(function (x) { return x.id === ruleId; })[0];
    if (!r) return;
    document.querySelectorAll('input[name=crLevel]').forEach(function (rd) { rd.checked = (rd.value === r.level); });
    el('crmExpr').value = r.expr;
    crmActs = parseActionSummary(r.action);
    crmActResetEdit();
    crmActRenderList();
    crCopyClose();
    umsToast('룰 내용을 불러왔습니다.');
  }

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
  window.crmClose        = crmClose;
  window.crmInsertParam  = crmInsertParam;
  window.crmInsertOp     = crmInsertOp;
  window.crmActKindChange = crmActKindChange;
  window.crmActApply      = crmActApply;
  window.crmActEdit       = crmActEdit;
  window.crmActDel        = crmActDel;
  window.crmActCancelEdit = crmActCancelEdit;
  window.crmExtraRemove  = crmExtraRemove;
  window.crmValidateDup = crmValidateDup;
  window.crmCopyExisting = crmCopyExisting;
  window.crCopyRender   = crCopyRender;
  window.crCopyPick     = crCopyPick;
  window.crCopyClose    = crCopyClose;
  window.crmSave        = crmSave;

})();
