// 알람 관리 — 현재 Active 알람 목록 + 우측 상세(처리상태 저장 / 알람 해제)
// 화면: 알람 > 알람 관리   참고: ums_sequences.md #8
// 알람 컬럼: AlarmNo·FacilityId·Source·OccurTime·Name·Description·Severity
//           ·Status·AckBy·AckAt·TicketNo·ClearedTime·ClearType·ClearedBy
(function () {

  const SEV = {
    warn:  ['badge-warn',  'Warning'],
    minor: ['badge-minor', 'Minor'],
    major: ['badge-major', 'Major'],
    crit:  ['badge-crit',  'Critical'],
  };
  const STAT = {
    new:  ['st-new',  '미확인'],
    ack:  ['st-ack',  '확인'],
    done: ['st-done', '조치완료'],
  };
  function sevBadge(k) { const p = SEV[k] || ['badge-off', k]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }
  function statBadge(k) { const p = STAT[k] || ['st-ack', k]; return '<span class="st ' + p[0] + '">' + p[1] + '</span>'; }
  function srcBadge(s) { return '<span class="src src-' + s + '">' + s + '</span>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  // ---- 목업: 현재 Active 알람 (설비 유형/위치는 설비에서 조인해 표시) ----
  const ALARMS = [
    { no: 1, src: 'RULE', at: '2026-09-04 08:12:40', elapsed: '1시간 33분',
      fac: 'UPS-2F-B', type: 'UPS', loc: '본사 IDC-2F', sev: 'crit',
      name: '출력전압 상하한 초과',
      desc: '출력전압이 상한(260V)을 초과했습니다.\nRule  : @outv > 260 OR @outv < 200\nValue : @outv = 274 V',
      stat: 'new', by: '', byAt: '', ticket: 'T-2026-0042' },

    { no: 2, src: 'DEVICE', at: '2026-09-04 08:12:22', elapsed: '1시간 33분',
      fac: 'UPS-2F-B', type: 'UPS', loc: '본사 IDC-2F', sev: 'major',
      name: 'On Battery',
      desc: '설비 Trap 수신: On Battery Power\nOID     : 1.3.6.1.4.1.318.0.5\nvarbind : upsAdvStateOnBattery = 1',
      stat: 'ack', by: '관리자', byAt: '2026-09-04 08:45:02', ticket: 'T-2026-0042' },

    { no: 3, src: 'RULE', at: '2026-09-04 09:02:33', elapsed: '42분',
      fac: 'UPS-1F-B', type: 'UPS', loc: '본사 IDC-1F', sev: 'warn',
      name: '출력 부하율 초과',
      desc: '출력 부하율이 85%를 초과했습니다.\nRule  : @loadpct >= 85\nValue : @loadpct = 88 %',
      stat: 'new', by: '', byAt: '', ticket: '' },

    { no: 4, src: 'RULE', at: '2026-09-04 07:20:05', elapsed: '2시간 25분',
      fac: 'BAT-1F-A-01', type: '배터리', loc: '본사 IDC-1F', sev: 'crit',
      name: '셀 온도 초과',
      desc: '배터리 셀 온도가 임계치를 초과했습니다. (공조 점검 완료)\nRule  : @cellt > 55\nValue : @cellt = 58.2 ℃',
      stat: 'done', by: '이엔지', byAt: '2026-09-04 08:30:44', ticket: 'T-2026-0039' },

    { no: 5, src: 'SYSTEM', at: '2026-09-04 09:23:47', elapsed: '21분',
      fac: 'CH-1', type: '칠러', loc: '본사 IDC-2F', sev: 'major',
      name: '계측값 수집 중단',
      desc: '설비 online 상태에서 5분 이상 계측값이 수신되지 않았습니다.\n원인      : NO_DATA\nLast recv : 2026-09-04 09:18:31',
      stat: 'new', by: '', byAt: '', ticket: '' },

    { no: 6, src: 'RULE', at: '2026-09-04 09:18:47', elapsed: '26분',
      fac: 'PDU-1F-01', type: 'PDU', loc: '본사 IDC-1F', sev: 'minor',
      name: '분기전류 경고',
      desc: '분기전류가 정격 대비 75%를 초과했습니다.\nRule  : @brcpct > 75\nValue : @brcpct = 78 %',
      stat: 'ack', by: '관리자', byAt: '2026-09-04 09:25:10', ticket: '' },

    { no: 7, src: 'SYSTEM', at: '2026-09-04 09:33:02', elapsed: '11분',
      fac: 'GW-DR-01', type: 'GW', loc: '판교 DR센터', sev: 'warn',
      name: 'HEARTBEAT 지연',
      desc: 'GW HEARTBEAT 수신 지연이 90초를 초과했습니다.\n원인  : HB_DELAY\nDelay : 128 s',
      stat: 'new', by: '', byAt: '', ticket: '' },
  ];
  const NOW = '2026-09-04 09:45:00';

  let curNo = null;
  function el(id) { return document.getElementById(id); }

  function locList() {
    const s = []; ALARMS.forEach(function (a) { if (s.indexOf(a.loc) < 0) s.push(a.loc); });
    return s;
  }

  function filtered() {
    const sev = el('fSev').value, src = el('fSrc').value, type = el('fType').value;
    const loc = el('fLoc').value, st = el('fStat').value;
    const kw = (el('q').value || '').trim();
    return ALARMS.filter(function (a) {
      return (!sev || a.sev === sev) && (!src || a.src === src) && (!type || a.type === type)
        && (!loc || a.loc === loc) && (!st || a.stat === st)
        && (!kw || a.fac.indexOf(kw) >= 0 || a.name.indexOf(kw) >= 0);
    });
  }

  function amRender() {
    const list = filtered();
    el('amBody').innerHTML = list.length ? list.map(function (a) {
      return '<tr data-no="' + a.no + '" onclick="amRowClick(' + a.no + ')">'
        + '<td>' + a.no + '</td>'
        + '<td>' + srcBadge(a.src) + '</td>'
        + '<td>' + sevBadge(a.sev) + '</td>'
        + '<td>' + a.at + '</td>'
        + '<td class="cell-l">' + a.fac + '</td>'
        + '<td>' + a.type + '</td>'
        + '<td class="cell-l">' + a.loc + '</td>'
        + '<td class="cell-l">' + a.name + '</td>'
        + '<td>' + statBadge(a.stat) + '</td>'
        + '<td>' + (a.ticket
            ? '<span class="am-ticket-link" onclick="event.stopPropagation();amGotoTicket(\'' + a.ticket + '\')">' + a.ticket + '</span>'
            : '<span style="color:#c9ced4;">-</span>') + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="10" style="padding:30px;color:#98a2b3;">Active 알람이 없습니다.</td></tr>';

    el('amCount').textContent = list.length;
    el('amNew').textContent = list.filter(function (a) { return a.stat === 'new'; }).length;
  }

  function amReset() {
    ['fSev', 'fSrc', 'fType', 'fLoc', 'fStat'].forEach(function (id) { el(id).value = ''; });
    el('q').value = '';
    amRender();
  }

  function amRowClick(no) {
    curNo = no;
    document.querySelectorAll('#amBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
    amDetailOpen(no);
  }

  function dvRow(label, val, multi, cls) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + (cls ? ' ' + cls : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }

  function statOptions(cur) {
    return Object.keys(STAT).map(function (k) {
      return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + STAT[k][1] + '</option>';
    }).join('');
  }

  function amDetailOpen(no) {
    const a = ALARMS.filter(function (x) { return x.no === no; })[0];
    if (!a) return;
    curNo = no;
    el('amdTitle').textContent = a.name;
    el('amdBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('Source', srcBadge(a.src)) + dvRow('심각도', sevBadge(a.sev))
          + dvRow('발생시각', a.at) + dvRow('경과', a.elapsed)
          + dvRow('대상 설비', a.fac) + dvRow('유형', a.type) + dvRow('위치', a.loc))
      + dvGroup(
          dvRow('알람명', a.name)
          + dvRow('Description', esc(a.desc), true, 'am-desc'))
      + dvGroup(
          dvRow('처리상태', '<select class="form-select" id="amdStat">' + statOptions(a.stat) + '</select>')
          + (a.by ? dvRow('확인자', a.by) + dvRow('확인시각', a.byAt) : ''))
      + dvGroup(dvRow('연계 티켓', a.ticket
          ? '<span class="am-ticket-link" onclick="amGotoTicket(\'' + a.ticket + '\')">' + a.ticket + '</span>'
          : '<button class="btn" type="button" onclick="amCreateTicket()">티켓 생성</button>'))
      + '</div>';
    el('amMask').classList.add('show');
    el('amDrawer').classList.add('show');
  }

  function amDetailClose() {
    el('amMask').classList.remove('show');
    el('amDrawer').classList.remove('show');
  }

  function amSaveStatus() {
    const a = ALARMS.filter(function (x) { return x.no === curNo; })[0];
    if (!a) return;
    const v = el('amdStat').value;
    if (v === a.stat) { umsToast('변경된 내용이 없습니다.'); return; }
    a.stat = v;
    if ((v === 'ack' || v === 'done') && !a.by) { a.by = '관리자'; a.byAt = NOW; }
    amRender();
    amDetailOpen(curNo);
    umsToast('저장되었습니다.');
  }

  function amAskClear() {
    const a = ALARMS.filter(function (x) { return x.no === curNo; })[0];
    if (!a) return;
    el('amClearName').textContent = a.fac + ' / ' + a.name;
    el('amClearModal').classList.add('show');
  }
  function amClearClose() { el('amClearModal').classList.remove('show'); }
  function amClear() {
    const i = ALARMS.findIndex(function (x) { return x.no === curNo; });
    if (i >= 0) ALARMS.splice(i, 1);  // ClearedTime/ClearType=수동/ClearedBy 기록 후 Active에서 제거 → 이력으로
    amClearClose();
    amDetailClose();
    amRender();
    umsToast('알람을 해제했습니다.');
  }

  function amGotoTicket(id) { umsToast('티켓 상세로 이동: ' + id + ' (목업)'); }
  function amCreateTicket() {
    const a = ALARMS.filter(function (x) { return x.no === curNo; })[0];
    if (!a) return;
    a.ticket = 'T-2026-' + (9000 + a.no);
    amRender();
    amDetailOpen(curNo);
    umsToast('티켓을 생성했습니다: ' + a.ticket);
  }

  // ---- init ----
  el('fLoc').innerHTML = '<option value="">전체</option>'
    + locList().map(function (v) { return '<option>' + v + '</option>'; }).join('');
  amRender();

  window.amRender       = amRender;
  window.amReset        = amReset;
  window.amRowClick     = amRowClick;
  window.amDetailClose  = amDetailClose;
  window.amSaveStatus   = amSaveStatus;
  window.amAskClear     = amAskClear;
  window.amClearClose   = amClearClose;
  window.amClear        = amClear;
  window.amGotoTicket   = amGotoTicket;
  window.amCreateTicket = amCreateTicket;

})();
