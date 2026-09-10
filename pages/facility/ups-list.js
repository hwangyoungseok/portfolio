// UPS 관리 페이지 스크립트 (목업 데이터)
(function () {

  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];
  const VENDORS   = ['APC', 'Vertiv', 'LS ELECTRIC', '삼성'];
  const GWS       = ['GW-IDC-01', 'GW-IDC-02', 'GW-DR-01'];
  const COMMS     = ['SNMP', 'Modbus'];

  const DATA = [
    { no: 1, name: 'UPS-1F-A', loc: '본사 IDC-1F', vendor: 'APC',         model: 'Smart-UPS SRT 10K', sn: 'AS1934110021', kva: 10, comm: 'SNMP',   gw: 'GW-IDC-01', link: 'on',  op: 'ok',    date: '2023-04-12', ip: '10.10.1.11', port: 161, community: 'public', memo: '',                 last: '2026-09-03 09:41:07', alarms: [] },
    { no: 2, name: 'UPS-1F-B', loc: '본사 IDC-1F', vendor: 'APC',         model: 'Smart-UPS SRT 10K', sn: 'AS1934110022', kva: 10, comm: 'SNMP',   gw: 'GW-IDC-01', link: 'on',  op: 'warn',  date: '2023-04-12', ip: '10.10.1.12', port: 161, community: 'public', memo: '',                 last: '2026-09-03 09:41:03', alarms: ['출력 부하율 85% 초과 (경고)'] },
    { no: 3, name: 'UPS-2F-A', loc: '본사 IDC-2F', vendor: 'Vertiv',      model: 'Liebert APM 30K',   sn: 'VT21008847',   kva: 30, comm: 'SNMP',   gw: 'GW-IDC-02', link: 'on',  op: 'ok',    date: '2022-11-30', ip: '10.10.2.11', port: 161, community: 'public', memo: '2023년 배터리 교체', last: '2026-09-03 09:40:58', alarms: [] },
    { no: 4, name: 'UPS-2F-B', loc: '본사 IDC-2F', vendor: 'Vertiv',      model: 'Liebert APM 30K',   sn: 'VT21008848',   kva: 30, comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', date: '2022-11-30', ip: '10.10.2.12', port: 502, community: '-',      memo: '',                 last: '2026-09-03 08:12:20', alarms: ['통신 두절', '배터리 스트링 전압 저하 (Major)'] },
    { no: 5, name: 'UPS-DR-1', loc: '판교 DR센터', vendor: 'LS ELECTRIC', model: 'LSUPS-0020B',       sn: 'LS200347711',  kva: 20, comm: 'SNMP',   gw: 'GW-DR-01',  link: 'on',  op: 'ok',    date: '2024-02-08', ip: '10.20.1.11', port: 161, community: 'public', memo: '',                 last: '2026-09-03 09:41:11', alarms: [] },
    { no: 6, name: 'UPS-DR-2', loc: '판교 DR센터', vendor: '삼성',        model: 'SUP-0100',          sn: 'SS99281120',   kva: 10, comm: 'SNMP',   gw: 'GW-DR-01',  link: 'on',  op: 'crit',  date: '2024-02-08', ip: '10.20.1.12', port: 161, community: 'public', memo: '',                 last: '2026-09-03 09:41:09', alarms: ['배터리 룸 과온 (Critical)', 'UPS 바이패스 전환'] },
    { no: 7, name: 'UPS-1F-C', loc: '본사 IDC-1F', vendor: 'APC',         model: 'Smart-UPS SRT 15K', sn: 'AS2011550310', kva: 15, comm: 'SNMP',   gw: 'GW-IDC-01', link: 'on',  op: 'ok',    date: '2024-06-21', ip: '10.10.1.13', port: 161, community: 'public', memo: '',                 last: '2026-09-03 09:41:05', alarms: [] },
  ];

  const LINK_BADGE = { on: ['badge-on', '온라인'], off: ['badge-off', '오프라인'] };
  const OP_BADGE   = { ok: ['badge-ok', '정상'], warn: ['badge-warn', '경고'], major: ['badge-major', 'Major'], crit: ['badge-crit', 'Critical'] };

  function badge(map, key) {
    const pair = map[key] || ['badge-off', key];
    return '<span class="badge ' + pair[0] + '">' + pair[1] + '</span>';
  }

  function fillSelect(id, arr, withAll) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  function renderGrid() {
    const kw     = (document.getElementById('q').value || '').trim();
    const fLoc   = document.getElementById('fLoc').value;
    const fVen   = document.getElementById('fVendor').value;
    const fComm  = document.getElementById('fComm').value;
    const fLink  = document.getElementById('fLink').value;
    const fOp    = document.getElementById('fOp').value;

    const rows = DATA.filter(function (r) {
      return (!kw || r.name.indexOf(kw) >= 0 || r.sn.indexOf(kw) >= 0 || r.model.indexOf(kw) >= 0)
        && (!fLoc  || r.loc === fLoc)
        && (!fVen  || r.vendor === fVen)
        && (!fComm || r.comm === fComm)
        && (!fLink || r.link === fLink)
        && (!fOp   || r.op === fOp);
    });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr data-no="' + r.no + '" onclick="upsRowClick(' + r.no + ')">'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.name + '</td>'
            + '<td>' + r.loc + '</td>'
            + '<td>' + r.vendor + '</td>'
            + '<td>' + r.model + '</td>'
            + '<td>' + r.sn + '</td>'
            + '<td>' + r.kva + '</td>'
            + '<td>' + r.comm + '</td>'
            + '<td>' + r.gw + '</td>'
            + '<td>' + badge(LINK_BADGE, r.link) + '</td>'
            + '<td>' + badge(OP_BADGE, r.op) + '</td>'
            + '<td>' + r.date + '</td>'
            + '<td><span class="col-act">'
            +   '<button class="icon-btn" title="수정" onclick="event.stopPropagation();upsOpen(' + r.no + ')">&#9998;</button>'
            +   '<button class="icon-btn del" title="삭제" onclick="event.stopPropagation();upsAskDelete(' + r.no + ')">&#128465;</button>'
            + '</span></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="13" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = rows.length;
  }

  function resetSearch() {
    ['fLoc', 'fVendor', 'fComm', 'fLink', 'fOp'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('q').value = '';
    renderGrid();
  }

  let detailNo = null;

  function upsRowClick(no) {
    document.querySelectorAll('#gridBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
    upsDetailOpen(no);
  }

  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }

  function upsDetailOpen(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    detailNo = no;
    document.getElementById('dTitle').textContent = r.name + ' 상세';
    document.getElementById('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model)
          + dvRow('S/N', r.sn) + dvRow('용량', r.kva + ' kVA') + dvRow('설치일자', r.date))
      + dvGroup(
          dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port)
          + dvRow('Community', r.community) + dvRow('연결 G/W', r.gw)
          + dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last))
      + dvGroup(
          dvRow('운영상태', badge(OP_BADGE, r.op))
          + dvRow('활성 알람', r.alarms.length
              ? '<ul>' + r.alarms.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>'
              : '<span style="color:#8a97a5;">없음</span>', true))
      + dvGroup(
          dvRow('비고', r.memo || '<span style="color:#8a97a5;">-</span>', true))
      + '</div>';
    document.getElementById('upsMask').classList.add('show');
    document.getElementById('upsDrawer').classList.add('show');
  }

  function upsDetailClose() {
    document.getElementById('upsMask').classList.remove('show');
    document.getElementById('upsDrawer').classList.remove('show');
  }

  function upsEditFromDetail() {
    const no = detailNo;
    upsDetailClose();
    upsOpen(no);
  }

  function upsOpen(no) {
    const r = (no == null) ? null : DATA.filter(function (x) { return x.no === no; })[0];
    document.getElementById('mTitle').textContent = r ? 'UPS 수정' : 'UPS 등록';
    document.getElementById('m-name').value      = r ? r.name : '';
    document.getElementById('m-loc').value       = r ? r.loc : '';
    document.getElementById('m-vendor').value    = r ? r.vendor : VENDORS[0];
    document.getElementById('m-model').value     = r ? r.model : '';
    document.getElementById('m-sn').value        = r ? r.sn : '';
    document.getElementById('m-kva').value       = r ? r.kva : '';
    document.getElementById('m-gw').value        = r ? r.gw : GWS[0];
    document.getElementById('m-date').value      = r ? r.date : '';
    document.getElementById('m-ip').value        = '';
    document.getElementById('m-port').value      = '';
    document.getElementById('m-community').value = '';
    document.getElementById('m-memo').value      = '';
    const comm = r ? r.comm : 'SNMP';
    document.querySelectorAll('input[name=m-comm]').forEach(function (el) { el.checked = (el.value === comm); });
    show('upsModal');
  }

  function upsSave()        { hide('upsModal'); renderGrid(); umsToast('저장되었습니다.'); }
  function upsAskDelete(no) { upsRowClick(no); show('delModal'); }
  function upsDelete()      { hide('delModal'); umsToast('삭제되었습니다.'); }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  fillSelect('fLoc', LOCATIONS, true);
  fillSelect('fVendor', VENDORS, true);
  fillSelect('fComm', COMMS, true);
  fillSelect('m-loc', LOCATIONS, false);
  document.getElementById('m-loc').insertAdjacentHTML('afterbegin', '<option value=""></option>');
  fillSelect('m-vendor', VENDORS, false);
  fillSelect('m-gw', GWS, false);
  renderGrid();

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid    = renderGrid;
  window.resetSearch   = resetSearch;
  window.upsRowClick   = upsRowClick;
  window.upsOpen       = upsOpen;
  window.upsSave       = upsSave;
  window.upsAskDelete  = upsAskDelete;
  window.upsDelete     = upsDelete;
  window.upsModalClose = function () { hide('upsModal'); };
  window.delModalClose = function () { hide('delModal'); };
  window.upsDetailClose = upsDetailClose;
  window.upsEditFromDetail = upsEditFromDetail;

})();
