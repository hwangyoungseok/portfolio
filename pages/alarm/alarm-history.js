// 알람 이력 조회 — 발생한 모든 알람 조회 (Active 포함), read-only
// 화면: 알람 > 알람 이력 조회   참고: UMS개발요구사항.md 1.7 , ums_sequences.md #8
(function () {

  const SEV = {
    warn: ['badge-warn', 'Warning'], minor: ['badge-minor', 'Minor'],
    major: ['badge-major', 'Major'], crit: ['badge-crit', 'Critical'],
  };
  const STAT = { new: ['st-new', '미확인'], ack: ['st-ack', '확인'], done: ['st-done', '조치완료'] };
  function sevBadge(k) { const p = SEV[k] || ['badge-off', k]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }
  function statBadge(k) { const p = STAT[k] || ['st-ack', k]; return '<span class="st ' + p[0] + '">' + p[1] + '</span>'; }
  function srcBadge(s) { return '<span class="src src-' + s + '">' + s + '</span>'; }
  function stateBadge(cleared) {
    return cleared
      ? '<span class="hs hs-cleared">Cleared</span>'
      : '<span class="hs hs-active">Active</span>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function dash(v) { return v ? v : '<span style="color:#c9ced4;">-</span>'; }

  // ---- 목업: 발생한 알람 (Active = cleared 없음 / Cleared = cleared 있음) ----
  const ALARMS = [
    { no: 1, src: 'RULE', sev: 'crit', at: '2026-09-04 08:12:40', cleared: '', clearType: '', clearBy: '',
      fac: 'UPS-2F-B', type: 'UPS', loc: '본사 IDC-2F', name: '출력전압 상하한 초과',
      desc: '출력전압이 상한(260V)을 초과했습니다.\nRule  : @outv > 260 OR @outv < 200\nValue : @outv = 274 V',
      hstat: 'new', by: '', byAt: '', ticket: 'T-2026-0042' },
    { no: 2, src: 'DEVICE', sev: 'major', at: '2026-09-04 08:12:22', cleared: '', clearType: '', clearBy: '',
      fac: 'UPS-2F-B', type: 'UPS', loc: '본사 IDC-2F', name: 'On Battery',
      desc: '설비 Trap 수신: On Battery Power\nOID     : 1.3.6.1.4.1.318.0.5\nvarbind : upsAdvStateOnBattery = 1',
      hstat: 'ack', by: '관리자', byAt: '2026-09-04 08:45:02', ticket: 'T-2026-0042' },
    { no: 3, src: 'RULE', sev: 'warn', at: '2026-09-04 09:02:33', cleared: '', clearType: '', clearBy: '',
      fac: 'UPS-1F-B', type: 'UPS', loc: '본사 IDC-1F', name: '출력 부하율 초과',
      desc: '출력 부하율이 85%를 초과했습니다.\nRule  : @loadpct >= 85\nValue : @loadpct = 88 %',
      hstat: 'new', by: '', byAt: '', ticket: '' },
    { no: 4, src: 'RULE', sev: 'crit', at: '2026-09-04 07:20:05', cleared: '2026-09-04 08:55:10', clearType: '수동', clearBy: '이엔지',
      fac: 'BAT-1F-A-01', type: '배터리', loc: '본사 IDC-1F', name: '셀 온도 초과',
      desc: '배터리 셀 온도가 임계치를 초과했습니다. (공조 점검 완료)\nRule  : @cellt > 55\nValue : @cellt = 58.2 ℃',
      hstat: 'done', by: '이엔지', byAt: '2026-09-04 08:30:44', ticket: 'T-2026-0039' },
    { no: 5, src: 'SYSTEM', sev: 'major', at: '2026-09-04 09:23:47', cleared: '', clearType: '', clearBy: '',
      fac: 'CH-1', type: '칠러', loc: '본사 IDC-2F', name: '계측값 수집 중단',
      desc: '설비 online 상태에서 5분 이상 계측값이 수신되지 않았습니다.\n원인      : NO_DATA\nLast recv : 2026-09-04 09:18:31',
      hstat: 'new', by: '', byAt: '', ticket: '' },
    { no: 6, src: 'RULE', sev: 'minor', at: '2026-09-04 09:18:47', cleared: '', clearType: '', clearBy: '',
      fac: 'PDU-1F-01', type: 'PDU', loc: '본사 IDC-1F', name: '분기전류 경고',
      desc: '분기전류가 정격 대비 75%를 초과했습니다.\nRule  : @brcpct > 75\nValue : @brcpct = 78 %',
      hstat: 'ack', by: '관리자', byAt: '2026-09-04 09:25:10', ticket: '' },
    { no: 7, src: 'SYSTEM', sev: 'warn', at: '2026-09-04 09:33:02', cleared: '', clearType: '', clearBy: '',
      fac: 'GW-DR-01', type: 'GW', loc: '판교 DR센터', name: 'HEARTBEAT 지연',
      desc: 'GW HEARTBEAT 수신 지연이 90초를 초과했습니다.\n원인  : HB_DELAY\nDelay : 128 s',
      hstat: 'new', by: '', byAt: '', ticket: '' },
    { no: 8, src: 'RULE', sev: 'major', at: '2026-09-03 22:14:10', cleared: '2026-09-03 23:40:02', clearType: '자동', clearBy: '',
      fac: 'UPS-1F-A', type: 'UPS', loc: '본사 IDC-1F', name: '출력전압 상하한 초과',
      desc: '출력전압이 상한(260V)을 초과했습니다.\nRule  : @outv > 260 OR @outv < 200\nValue : @outv = 263 V',
      hstat: 'ack', by: '관리자', byAt: '2026-09-03 22:30:01', ticket: '' },
    { no: 9, src: 'DEVICE', sev: 'crit', at: '2026-09-03 14:05:33', cleared: '2026-09-03 15:10:20', clearType: '수동', clearBy: '박당직',
      fac: 'UPS-DR-1', type: 'UPS', loc: '판교 DR센터', name: 'Bypass 전환',
      desc: '설비 Trap 수신: On Bypass\nOID     : 1.3.6.1.4.1.318.0.7\nvarbind : upsAdvStateOnBypass = 1',
      hstat: 'done', by: '박당직', byAt: '2026-09-03 14:20:44', ticket: 'T-2026-0031' },
    { no: 10, src: 'RULE', sev: 'warn', at: '2026-09-02 11:20:00', cleared: '2026-09-02 12:05:41', clearType: '자동', clearBy: '',
      fac: 'PDU-1F-01', type: 'PDU', loc: '본사 IDC-1F', name: '분기전류 경고',
      desc: '분기전류가 정격 대비 75%를 초과했습니다.\nRule  : @brcpct > 75\nValue : @brcpct = 76 %',
      hstat: 'new', by: '', byAt: '', ticket: '' },
    { no: 11, src: 'SYSTEM', sev: 'major', at: '2026-09-01 03:44:12', cleared: '2026-09-01 06:20:30', clearType: '자동', clearBy: '',
      fac: 'CH-1', type: '칠러', loc: '본사 IDC-2F', name: '계측값 수집 중단',
      desc: '설비 online 상태에서 5분 이상 계측값이 수신되지 않았습니다.\n원인      : NO_DATA\nLast recv : 2026-09-01 03:39:05',
      hstat: 'done', by: '관리자', byAt: '2026-09-01 04:10:11', ticket: '' },
    { no: 12, src: 'RULE', sev: 'minor', at: '2026-08-29 09:10:00', cleared: '2026-08-29 18:22:15', clearType: '수동', clearBy: '이엔지',
      fac: 'BAT-1F-A-01', type: '배터리', loc: '본사 IDC-1F', name: 'SOH 저하',
      desc: '배터리 SOH가 80% 미만입니다.\nRule  : @soh < 80\nValue : @soh = 78 %',
      hstat: 'done', by: '이엔지', byAt: '2026-08-29 10:02:30', ticket: 'T-2026-0018' },
  ];
  const TODAY = '2026-09-04';

  function el(id) { return document.getElementById(id); }
  function dateOf(dt) { return (dt || '').slice(0, 10); }
  function shift(days) {
    const p = TODAY.split('-');
    const d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
  }

  function locList() {
    const s = []; ALARMS.forEach(function (a) { if (s.indexOf(a.loc) < 0) s.push(a.loc); });
    return s;
  }

  function ahPreset(kind) {
    if (kind === 'today') { el('fFrom').value = TODAY; el('fTo').value = TODAY; }
    else if (kind === '7d') { el('fFrom').value = shift(6); el('fTo').value = TODAY; }
    else if (kind === '30d') { el('fFrom').value = shift(29); el('fTo').value = TODAY; }
    ahRender();
  }

  function filtered() {
    const from = el('fFrom').value, to = el('fTo').value;
    const sev = el('fSev').value, src = el('fSrc').value, type = el('fType').value;
    const loc = el('fLoc').value, hs = el('fHstat').value, state = el('fState').value;
    const kw = (el('q').value || '').trim();
    return ALARMS.filter(function (a) {
      const d = dateOf(a.at);
      const st = a.cleared ? 'cleared' : 'active';
      return (!from || d >= from) && (!to || d <= to)
        && (!sev || a.sev === sev) && (!src || a.src === src) && (!type || a.type === type)
        && (!loc || a.loc === loc) && (!hs || a.hstat === hs) && (!state || st === state)
        && (!kw || a.fac.indexOf(kw) >= 0 || a.name.indexOf(kw) >= 0);
    });
  }

  function ahRender() {
    const list = filtered();
    el('ahBody').innerHTML = list.length ? list.map(function (a) {
      return '<tr data-no="' + a.no + '" onclick="ahRowClick(' + a.no + ')">'
        + '<td>' + a.no + '</td>'
        + '<td>' + srcBadge(a.src) + '</td>'
        + '<td>' + sevBadge(a.sev) + '</td>'
        + '<td>' + a.at + '</td>'
        + '<td>' + dash(a.cleared) + '</td>'
        + '<td>' + stateBadge(a.cleared) + '</td>'
        + '<td class="cell-l">' + a.fac + '</td>'
        + '<td>' + a.type + '</td>'
        + '<td class="cell-l">' + a.loc + '</td>'
        + '<td class="cell-l">' + a.name + '</td>'
        + '<td>' + statBadge(a.hstat) + '</td>'
        + '<td>' + dash(a.by) + '</td>'
        + '<td>' + (a.ticket
            ? '<span class="ah-ticket-link" onclick="event.stopPropagation();ahGotoTicket(\'' + a.ticket + '\')">' + a.ticket + '</span>'
            : '<span style="color:#c9ced4;">-</span>') + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="13" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';
    el('ahCount').textContent = list.length;
  }

  function ahReset() {
    ['fSev', 'fSrc', 'fType', 'fLoc', 'fHstat', 'fState'].forEach(function (id) { el(id).value = ''; });
    el('q').value = '';
    ahPreset('7d');
  }

  function ahRowClick(no) {
    document.querySelectorAll('#ahBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
    ahDetailOpen(no);
  }

  function dvRow(label, val, multi, cls) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + (cls ? ' ' + cls : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }

  function ahDetailOpen(no) {
    const a = ALARMS.filter(function (x) { return x.no === no; })[0];
    if (!a) return;
    el('ahdTitle').textContent = a.name;
    el('ahdBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('Source', srcBadge(a.src)) + dvRow('심각도', sevBadge(a.sev)) + dvRow('상태', stateBadge(a.cleared))
          + dvRow('발생시각', a.at) + dvRow('해제시각', dash(a.cleared))
          + dvRow('해제구분', dash(a.clearType)) + dvRow('해제자', dash(a.clearBy)))
      + dvGroup(
          dvRow('대상 설비', a.fac) + dvRow('유형', a.type) + dvRow('위치', a.loc))
      + dvGroup(
          dvRow('알람명', a.name) + dvRow('Description', esc(a.desc), true, 'am-desc'))
      + dvGroup(
          dvRow('처리상태', statBadge(a.hstat))
          + (a.by ? dvRow('확인자', a.by) + dvRow('확인시각', a.byAt) : ''))
      + dvGroup(dvRow('연계 티켓', a.ticket
          ? '<span class="ah-ticket-link" onclick="ahGotoTicket(\'' + a.ticket + '\')">' + a.ticket + '</span>'
          : '<span style="color:#8a97a5;">없음</span>'))
      + '</div>';
    el('ahMask').classList.add('show');
    el('ahDrawer').classList.add('show');
  }
  function ahDetailClose() {
    el('ahMask').classList.remove('show');
    el('ahDrawer').classList.remove('show');
  }
  function ahGotoTicket(id) { umsToast('티켓 상세로 이동: ' + id + ' (목업)'); }

  // ---- init ----
  el('fLoc').innerHTML = '<option value="">전체</option>'
    + locList().map(function (v) { return '<option>' + v + '</option>'; }).join('');
  ahPreset('7d');   // 기본: 최근 7일

  window.ahRender      = ahRender;
  window.ahReset       = ahReset;
  window.ahPreset      = ahPreset;
  window.ahRowClick    = ahRowClick;
  window.ahDetailClose = ahDetailClose;
  window.ahGotoTicket  = ahGotoTicket;

})();
