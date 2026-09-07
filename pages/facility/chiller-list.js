// 칠러 관리 페이지 스크립트 (목업 데이터) — UPS 관리와 동일 패턴
(function () {

  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];
  const VENDORS   = ['Carrier', 'Trane', 'York', 'LG', '삼성'];
  const GWS       = ['GW-IDC-01', 'GW-IDC-02', 'GW-DR-01'];
  const COMMS     = ['BACnet', 'Modbus'];
  const REFRIG    = ['R-134a', 'R-513A', 'R-1234ze', '암모니아(R-717)'];

  const DATA = [
    { no: 1, name: 'CH-1F-01', loc: '본사 IDC-1F', vendor: 'Carrier', model: '30XA-1002', sn: 'CR30XA-210011', rt: 300, ref: 'R-134a',  comm: 'BACnet', gw: 'GW-IDC-01', link: 'on',  op: 'ok',    date: '2022-08-20', ip: '10.10.1.41', port: 47808, memo: '', last: '2026-09-03 09:41:07', alarms: [] },
    { no: 2, name: 'CH-1F-02', loc: '본사 IDC-1F', vendor: 'Trane',   model: 'RTAC-300',  sn: 'TR-RTAC-200544', rt: 300, ref: 'R-513A',  comm: 'BACnet', gw: 'GW-IDC-01', link: 'on',  op: 'ok',    date: '2022-08-20', ip: '10.10.1.42', port: 47808, memo: '예비기', last: '2026-09-03 09:41:03', alarms: [] },
    { no: 3, name: 'CH-2F-01', loc: '본사 IDC-2F', vendor: 'York',    model: 'YVAA-0250', sn: 'YK-YVAA-199877', rt: 250, ref: 'R-1234ze', comm: 'Modbus', gw: 'GW-IDC-02', link: 'on',  op: 'warn',  date: '2021-11-05', ip: '10.10.2.41', port: 502,   memo: '', last: '2026-09-03 09:40:58', alarms: ['냉수 출구온도 12℃ 초과 (경고)'] },
    { no: 4, name: 'CH-2F-02', loc: '본사 IDC-2F', vendor: 'York',    model: 'YVAA-0250', sn: 'YK-YVAA-199878', rt: 250, ref: 'R-1234ze', comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', date: '2021-11-05', ip: '10.10.2.42', port: 502,   memo: '', last: '2026-09-03 07:55:20', alarms: ['통신 두절', '압축기 트립 (Major)'] },
    { no: 5, name: 'CH-DR-01', loc: '판교 DR센터', vendor: 'LG',      model: 'RCUW-0200', sn: 'LG-RCUW-240033', rt: 200, ref: 'R-134a',  comm: 'BACnet', gw: 'GW-DR-01',  link: 'on',  op: 'ok',    date: '2024-02-08', ip: '10.20.1.41', port: 47808, memo: '', last: '2026-09-03 09:41:11', alarms: [] },
  ];

  const LINK_BADGE = { on: ['badge-on', '온라인'], off: ['badge-off', '오프라인'] };
  const OP_BADGE   = { ok: ['badge-ok', '정상'], warn: ['badge-warn', '경고'], major: ['badge-major', 'Major'], crit: ['badge-crit', 'Critical'] };
  function badge(map, key) { const p = map[key] || ['badge-off', key]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }

  function fillSelect(id, arr, withAll) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  function chlRender() {
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
      return '<tr data-no="' + r.no + '" onclick="chlRowClick(' + r.no + ')">'
        + '<td>' + r.no + '</td>'
        + '<td>' + r.name + '</td>'
        + '<td>' + r.loc + '</td>'
        + '<td>' + r.vendor + '</td>'
        + '<td>' + r.model + '</td>'
        + '<td>' + r.sn + '</td>'
        + '<td>' + r.rt + '</td>'
        + '<td>' + r.ref + '</td>'
        + '<td>' + r.comm + '</td>'
        + '<td>' + r.gw + '</td>'
        + '<td>' + badge(LINK_BADGE, r.link) + '</td>'
        + '<td>' + badge(OP_BADGE, r.op) + '</td>'
        + '<td>' + r.date + '</td>'
        + '<td><span class="col-act">'
        +   '<button class="icon-btn" title="수정" onclick="event.stopPropagation();chlOpen(' + r.no + ')">&#9998;</button>'
        +   '<button class="icon-btn del" title="삭제" onclick="event.stopPropagation();chlAskDelete(' + r.no + ')">&#128465;</button>'
        + '</span></td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="14" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('chlCount').textContent = rows.length;
  }

  function chlReset() {
    ['fLoc', 'fVendor', 'fComm', 'fLink', 'fOp'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('q').value = '';
    chlRender();
  }

  let detailNo = null;
  function chlRowClick(no) {
    document.querySelectorAll('#gridBody tr').forEach(function (tr) { tr.classList.toggle('selected', Number(tr.dataset.no) === no); });
    chlDetailOpen(no);
  }

  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }

  function chlDetailOpen(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    detailNo = no;
    document.getElementById('dTitle').textContent = r.name + ' 상세';
    document.getElementById('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model) + dvRow('S/N', r.sn)
          + dvRow('냉각능력', r.rt + ' RT') + dvRow('냉매종류', r.ref) + dvRow('설치일자', r.date))
      + dvGroup(
          dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port) + dvRow('연결 G/W', r.gw)
          + dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last))
      + dvGroup(
          dvRow('운영상태', badge(OP_BADGE, r.op))
          + dvRow('활성 알람', r.alarms.length
              ? '<ul>' + r.alarms.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>'
              : '<span style="color:#8a97a5;">없음</span>', true))
      + dvGroup(dvRow('비고', r.memo || '<span style="color:#8a97a5;">-</span>', true))
      + '</div>';
    document.getElementById('chlMask').classList.add('show');
    document.getElementById('chlDrawer').classList.add('show');
  }
  function chlDetailClose() {
    document.getElementById('chlMask').classList.remove('show');
    document.getElementById('chlDrawer').classList.remove('show');
  }
  function chlEditFromDetail() { const no = detailNo; chlDetailClose(); chlOpen(no); }

  function chlOpen(no) {
    const r = (no == null) ? null : DATA.filter(function (x) { return x.no === no; })[0];
    document.getElementById('mTitle').textContent = r ? '칠러 수정' : '칠러 등록';
    document.getElementById('m-name').value   = r ? r.name : '';
    document.getElementById('m-loc').value    = r ? r.loc : LOCATIONS[0];
    document.getElementById('m-vendor').value = r ? r.vendor : VENDORS[0];
    document.getElementById('m-model').value  = r ? r.model : '';
    document.getElementById('m-sn').value     = r ? r.sn : '';
    document.getElementById('m-rt').value     = r ? r.rt : '';
    document.getElementById('m-ref').value    = r ? r.ref : REFRIG[0];
    document.getElementById('m-gw').value     = r ? r.gw : GWS[0];
    document.getElementById('m-date').value   = r ? r.date : '';
    document.getElementById('m-ip').value     = '';
    document.getElementById('m-port').value   = '';
    document.getElementById('m-memo').value   = '';
    const comm = r ? r.comm : 'BACnet';
    document.querySelectorAll('input[name=m-comm]').forEach(function (el) { el.checked = (el.value === comm); });
    show('chlModal');
  }

  function chlSave()        { hide('chlModal'); chlRender(); umsToast('저장되었습니다.'); }
  function chlAskDelete(no) { chlRowClick(no); show('delModal'); }
  function chlDelete()      { hide('delModal'); umsToast('삭제되었습니다.'); }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- init ----
  fillSelect('fLoc', LOCATIONS, true);
  fillSelect('fVendor', VENDORS, true);
  fillSelect('fComm', COMMS, true);
  fillSelect('m-loc', LOCATIONS, false);
  fillSelect('m-vendor', VENDORS, false);
  fillSelect('m-ref', REFRIG, false);
  fillSelect('m-gw', GWS, false);
  chlRender();

  window.chlRender      = chlRender;
  window.chlReset       = chlReset;
  window.chlRowClick    = chlRowClick;
  window.chlOpen        = chlOpen;
  window.chlSave        = chlSave;
  window.chlAskDelete   = chlAskDelete;
  window.chlDelete      = chlDelete;
  window.chlModalClose  = function () { hide('chlModal'); };
  window.delModalClose  = function () { hide('delModal'); };
  window.chlDetailClose = chlDetailClose;
  window.chlEditFromDetail = chlEditFromDetail;

})();
