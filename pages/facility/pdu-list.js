// PDU 관리 페이지 스크립트 (목업 데이터) — UPS 관리와 동일 패턴
(function () {

  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];
  const VENDORS   = ['APC', 'Vertiv', 'Raritan', 'LS ELECTRIC'];
  const GWS       = ['GW-IDC-01', 'GW-IDC-02', 'GW-DR-01'];
  const COMMS     = ['SNMP', 'Modbus'];
  const KINDS     = ['미터드', '미터드-아웃렛', '스위치드', '모니터드'];
  const SOURCES   = ['UPS-1F-A', 'UPS-1F-B', 'UPS-2F-A', 'UPS-DR-1', 'PDU-1F-01', 'PDU-DR-01'];

  const DATA = [
    { no: 1, name: 'PDU-1F-01', loc: '본사 IDC-1F', vendor: 'APC',    model: 'AP8853',  sn: 'AP8853-2211001', kind: '미터드-아웃렛', phase: '3상', outlet: 24, amp: 32, volt: 380, comm: 'SNMP',   gw: 'GW-IDC-01', link: 'on',  op: 'ok',    src: 'UPS-1F-A', date: '2023-05-10', ip: '10.10.1.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:07', alarms: [] },
    { no: 2, name: 'PDU-1F-02', loc: '본사 IDC-1F', vendor: 'Vertiv', model: 'MPH2',    sn: 'MPH2-1902204',   kind: '스위치드',       phase: '3상', outlet: 24, amp: 32, volt: 380, comm: 'SNMP',   gw: 'GW-IDC-01', link: 'on',  op: 'warn',  src: 'UPS-1F-B', date: '2023-05-10', ip: '10.10.1.32', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:02', alarms: [{ time: '2026-09-03 08:55', text: '분기전류 정격 90% 초과 (경고)' }] },
    { no: 3, name: 'PDU-2F-01', loc: '본사 IDC-2F', vendor: 'Raritan', model: 'PX3-5190R', sn: 'PX3-2005511',  kind: '미터드',         phase: '단상', outlet: 20, amp: 16, volt: 220, comm: 'SNMP',   gw: 'GW-IDC-02', link: 'on',  op: 'ok',    src: 'UPS-2F-A', date: '2022-12-01', ip: '10.10.2.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:40:58', alarms: [] },
    { no: 4, name: 'PDU-2F-02', loc: '본사 IDC-2F', vendor: 'Raritan', model: 'PX3-5190R', sn: 'PX3-2005512',  kind: '미터드',         phase: '단상', outlet: 20, amp: 16, volt: 220, comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', src: 'UPS-2F-A', date: '2022-12-01', ip: '10.10.2.32', port: 502, community: '-',      memo: '', last: '2026-09-03 08:05:11', alarms: [{ time: '2026-09-03 08:05', text: '통신 두절' }] },
    { no: 5, name: 'PDU-DR-01', loc: '판교 DR센터', vendor: 'APC',    model: 'AP8858',  sn: 'AP8858-2401007', kind: '모니터드',       phase: '3상', outlet: 42, amp: 32, volt: 380, comm: 'SNMP',   gw: 'GW-DR-01',  link: 'on',  op: 'ok',    src: 'UPS-DR-1', date: '2024-02-08', ip: '10.20.1.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:11', alarms: [] },
    { no: 6, name: 'PDU-DR-02', loc: '판교 DR센터', vendor: 'APC',    model: 'AP8858',  sn: 'AP8858-2401008', kind: '미터드-아웃렛', phase: '3상', outlet: 42, amp: 32, volt: 380, comm: 'SNMP',   gw: 'GW-DR-01',  link: 'on',  op: 'ok',    src: 'PDU-DR-01', date: '2024-02-08', ip: '10.20.1.32', port: 161, community: 'public', memo: '2차 분전', last: '2026-09-03 09:41:05', alarms: [] },
  ];

  const LINK_BADGE = { on: ['badge-on', '온라인'], off: ['badge-off', '오프라인'] };
  const OP_BADGE   = { ok: ['badge-ok', '정상'], warn: ['badge-warn', '경고'], major: ['badge-major', 'Major'], crit: ['badge-crit', 'Critical'] };
  function badge(map, key) { const p = map[key] || ['badge-off', key]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }
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

  function pduRender() {
    const kw   = (document.getElementById('q').value || '').trim();
    const fLoc = document.getElementById('fLoc').value;
    const fVen = document.getElementById('fVendor').value;
    const fCm  = document.getElementById('fComm').value;
    const fLk  = document.getElementById('fLink').value;
    const fOp  = document.getElementById('fOp').value;

    const rows = DATA.filter(function (r) {
      return (!kw || r.name.indexOf(kw) >= 0 || r.sn.indexOf(kw) >= 0 || r.model.indexOf(kw) >= 0)
        && (!fLoc || r.loc === fLoc) && (!fVen || r.vendor === fVen)
        && (!fCm || r.comm === fCm) && (!fLk || r.link === fLk) && (!fOp || r.op === fOp);
    });

    document.getElementById('gridBody').innerHTML = rows.length ? rows.map(function (r) {
      return '<tr data-no="' + r.no + '" onclick="pduRowClick(' + r.no + ')">'
        + '<td>' + r.no + '</td>'
        + '<td>' + r.name + '</td>'
        + '<td>' + r.loc + '</td>'
        + '<td>' + r.vendor + '</td>'
        + '<td>' + r.model + '</td>'
        + '<td>' + r.sn + '</td>'
        + '<td>' + r.kind + '</td>'
        + '<td>' + r.phase + '</td>'
        + '<td>' + r.outlet + '</td>'
        + '<td>' + r.amp + '</td>'
        + '<td>' + r.volt + '</td>'
        + '<td>' + r.comm + '</td>'
        + '<td>' + r.gw + '</td>'
        + '<td>' + badge(LINK_BADGE, r.link) + '</td>'
        + '<td>' + badge(OP_BADGE, r.op) + '</td>'
        + '<td>' + r.src + '</td>'
        + '<td>' + r.date + '</td>'
        + '<td><span class="col-act">'
        +   '<button class="icon-btn" title="수정" onclick="event.stopPropagation();pduOpen(' + r.no + ')">&#9998;</button>'
        +   '<button class="icon-btn del" title="삭제" onclick="event.stopPropagation();pduAskDelete(' + r.no + ')">&#128465;</button>'
        + '</span></td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="18" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('pduCount').textContent = rows.length;
  }

  function pduReset() {
    ['fLoc', 'fVendor', 'fComm', 'fLink', 'fOp'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('q').value = '';
    pduRender();
  }

  let detailNo = null;
  function pduRowClick(no) {
    document.querySelectorAll('#gridBody tr').forEach(function (tr) { tr.classList.toggle('selected', Number(tr.dataset.no) === no); });
    pduDetailOpen(no);
  }

  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }

  function pduDetailOpen(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    detailNo = no;
    document.getElementById('dTitle').textContent = r.name + ' 상세';
    document.getElementById('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model) + dvRow('S/N', r.sn)
          + dvRow('유형', r.kind) + dvRow('상', r.phase) + dvRow('아웃렛 수', r.outlet)
          + dvRow('정격전류', r.amp + ' A') + dvRow('정격전압', r.volt + ' V')
          + dvRow('상위전원', r.src) + dvRow('설치일자', r.date))
      + dvGroup(
          dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port)
          + dvRow('Community', r.community) + dvRow('연결 G/W', r.gw)
          + dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last))
      + dvGroup(
          dvRow('운영상태', badge(OP_BADGE, r.op))
          + dvRow('활성 알람', alarmsHtml(r.alarms), true))
      + dvGroup(dvRow('비고', r.memo || '<span style="color:#8a97a5;">-</span>', true))
      + '</div>';
    document.getElementById('pduMask').classList.add('show');
    document.getElementById('pduDrawer').classList.add('show');
  }
  function pduDetailClose() {
    document.getElementById('pduMask').classList.remove('show');
    document.getElementById('pduDrawer').classList.remove('show');
  }
  function pduEditFromDetail() { const no = detailNo; pduDetailClose(); pduOpen(no); }

  function pduOpen(no) {
    const r = (no == null) ? null : DATA.filter(function (x) { return x.no === no; })[0];
    document.getElementById('mTitle').textContent = r ? 'PDU 수정' : 'PDU 등록';
    document.getElementById('m-name').value      = r ? r.name : '';
    document.getElementById('m-loc').value       = r ? r.loc : LOCATIONS[0];
    document.getElementById('m-vendor').value    = r ? r.vendor : VENDORS[0];
    document.getElementById('m-model').value     = r ? r.model : '';
    document.getElementById('m-sn').value        = r ? r.sn : '';
    document.getElementById('m-kind').value      = r ? r.kind : KINDS[0];
    document.getElementById('m-outlet').value    = r ? r.outlet : '';
    document.getElementById('m-amp').value       = r ? r.amp : '';
    document.getElementById('m-volt').value      = r ? r.volt : '';
    document.getElementById('m-gw').value        = r ? r.gw : GWS[0];
    document.getElementById('m-src').value       = r ? r.src : SOURCES[0];
    document.getElementById('m-date').value      = r ? r.date : '';
    document.getElementById('m-ip').value        = '';
    document.getElementById('m-port').value      = '';
    document.getElementById('m-community').value = '';
    document.getElementById('m-memo').value      = '';
    const phase = r ? r.phase : '단상';
    document.querySelectorAll('input[name=m-phase]').forEach(function (el) { el.checked = (el.value === phase); });
    const comm = r ? r.comm : 'SNMP';
    document.querySelectorAll('input[name=m-comm]').forEach(function (el) { el.checked = (el.value === comm); });
    show('pduModal');
  }

  function pduSave()        { hide('pduModal'); pduRender(); umsToast('저장되었습니다.'); }
  function pduAskDelete(no) { pduRowClick(no); show('delModal'); }
  function pduDelete()      { hide('delModal'); umsToast('삭제되었습니다.'); }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 엑셀 임포트 (목업 - 실제 파싱/등록 없음) ----
  function pduImportOpen() {
    document.getElementById('pduImportFile').value = '';
    const nm = document.getElementById('pduImportFileName');
    nm.textContent = '선택된 파일 없음';
    nm.classList.remove('picked');
    document.querySelector('input[name="pduImportMode"][value="merge"]').checked = true;
    show('pduImportModal');
  }
  function pduImportClose() { hide('pduImportModal'); }
  function pduImportPick(el) {
    const f = el.files && el.files[0];
    const nm = document.getElementById('pduImportFileName');
    if (f && !/\.(xlsx|xls|csv)$/i.test(f.name)) {
      umsToast('지원하지 않는 파일 형식입니다. (.xlsx/.xls/.csv)');
      el.value = '';
      nm.textContent = '선택된 파일 없음';
      nm.classList.remove('picked');
      return;
    }
    nm.textContent = f ? f.name : '선택된 파일 없음';
    nm.classList.toggle('picked', !!f);
  }
  function pduImportRun() {
    const f = document.getElementById('pduImportFile').files[0];
    if (!f) { umsToast('파일을 선택하세요.'); return; }
    const mode = document.querySelector('input[name="pduImportMode"]:checked').value;
    hide('pduImportModal');
    umsToast(mode === 'replace' ? '전체 삭제 후 신규 등록했습니다. (목업)' : '기존 데이터에 업데이트했습니다. (목업)');
  }

  // ---- init ----
  fillSelect('fLoc', LOCATIONS, true);
  fillSelect('fVendor', VENDORS, true);
  fillSelect('fComm', COMMS, true);
  fillSelect('m-loc', LOCATIONS, false);
  fillSelect('m-vendor', VENDORS, false);
  fillSelect('m-kind', KINDS, false);
  fillSelect('m-gw', GWS, false);
  fillSelect('m-src', SOURCES, false);
  pduRender();

  window.pduRender      = pduRender;
  window.pduReset       = pduReset;
  window.pduRowClick    = pduRowClick;
  window.pduOpen        = pduOpen;
  window.pduSave        = pduSave;
  window.pduAskDelete   = pduAskDelete;
  window.pduDelete      = pduDelete;
  window.pduModalClose  = function () { hide('pduModal'); };
  window.delModalClose  = function () { hide('delModal'); };
  window.pduDetailClose = pduDetailClose;
  window.pduEditFromDetail = pduEditFromDetail;
  window.pduImportOpen  = pduImportOpen;
  window.pduImportClose = pduImportClose;
  window.pduImportPick  = pduImportPick;
  window.pduImportRun   = pduImportRun;

})();
