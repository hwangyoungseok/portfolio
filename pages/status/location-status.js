// 위치계통 페이지 스크립트 (목업 데이터, 읽기 전용)
// 화면: 설비현황 > 위치계통
// 전력계통(status/power-topology.js)과 같은 패턴이지만 좌측 트리의 기준 축이 전력계통이 아니라
// 위치 계층(location-manage.js 트리)이다. 사이트>건물>전산실 아래에 그 위치에 설치된 PDU/UPS/
// 칠러가 형제로, UPS 아래에 배터리가 자식으로 붙는다. 단, 위치 노드는 클릭할 수 없고 설비
// (PDU/UPS/칠러/배터리)만 클릭 가능하다. 설비를 클릭하면 우측 3단 패널이 채워지는데, 전력계통정보는
// 위치 트리와 무관하게 그 설비의 실제 전력 연결관계(PDU↔UPS/칠러↔배터리, 전력계통 페이지와 동일한
// UNIT_PDU 데이터 기준)를 보여주고, 위치정보는 그 안에 나온 설비들 각각의 실제 설치 위치
// breadcrumb을, 상세정보는 각 설비관리 페이지의 상세와 동일한 내용을 보여준다.
(function () {

  // ---- 위치 관리(location-manage.js) TREE 그대로 옮김. canInstall인 room에 locKey를 붙여
  // 아래 설비 DATA의 loc 값과 연결한다(그 room에 설치된 설비를 자식으로 붙이기 위함). ----
  const LOC_TREE = [
    { name: '본사', type: 'site', code: 'HQ', canInstall: false, memo: '', children: [
      { name: 'IDC동', type: 'building', code: 'HQ-IDC', canInstall: false, memo: '', children: [
        { name: '1F 전산실', type: 'room', code: 'HQ-IDC-1F', canInstall: true, memo: '주 전산실', locKey: '본사 IDC-1F', children: [] },
        { name: '2F 전산실', type: 'room', code: 'HQ-IDC-2F', canInstall: true, memo: '', locKey: '본사 IDC-2F', children: [] },
      ] },
      { name: '관제동', type: 'building', code: 'HQ-OPS', canInstall: false, memo: '', children: [
        { name: '상황실', type: 'etc', code: '', canInstall: false, memo: '', children: [] },
      ] },
    ] },
    { name: '판교 DR센터', type: 'site', code: 'DR', canInstall: false, memo: '', children: [
      { name: 'DR 전산실', type: 'room', code: 'DR-1F', canInstall: true, memo: '', locKey: '판교 DR센터', children: [] },
    ] },
  ];
  const TYPE_ICON = { site: '🏢', building: '🏬', room: '🖥️', etc: '📁' };

  // ---- UPS 관리(ups-list.js) DATA 전체(7건) ----
  const UPS_DATA = {
    'UPS-1F-A': { loc: '본사 IDC-1F', vendor: 'APC', model: 'Smart-UPS SRT 10K', sn: 'AS1934110021', kva: 10, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'ok', date: '2023-04-12', ip: '10.10.1.11', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:07', alarms: [] },
    'UPS-1F-B': { loc: '본사 IDC-1F', vendor: 'APC', model: 'Smart-UPS SRT 10K', sn: 'AS1934110022', kva: 10, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'warn', date: '2023-04-12', ip: '10.10.1.12', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:03', alarms: ['출력 부하율 85% 초과 (경고)'] },
    'UPS-2F-A': { loc: '본사 IDC-2F', vendor: 'Vertiv', model: 'Liebert APM 30K', sn: 'VT21008847', kva: 30, comm: 'SNMP', gw: 'GW-IDC-02', link: 'on', op: 'ok', date: '2022-11-30', ip: '10.10.2.11', port: 161, community: 'public', memo: '2023년 배터리 교체', last: '2026-09-03 09:40:58', alarms: [] },
    'UPS-2F-B': { loc: '본사 IDC-2F', vendor: 'Vertiv', model: 'Liebert APM 30K', sn: 'VT21008848', kva: 30, comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', date: '2022-11-30', ip: '10.10.2.12', port: 502, community: '-', memo: '', last: '2026-09-03 08:12:20', alarms: ['통신 두절', '배터리 스트링 전압 저하 (Major)'] },
    'UPS-DR-1': { loc: '판교 DR센터', vendor: 'LS ELECTRIC', model: 'LSUPS-0020B', sn: 'LS200347711', kva: 20, comm: 'SNMP', gw: 'GW-DR-01', link: 'on', op: 'ok', date: '2024-02-08', ip: '10.20.1.11', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:11', alarms: [] },
    'UPS-DR-2': { loc: '판교 DR센터', vendor: '삼성', model: 'SUP-0100', sn: 'SS99281120', kva: 10, comm: 'SNMP', gw: 'GW-DR-01', link: 'on', op: 'crit', date: '2024-02-08', ip: '10.20.1.12', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:09', alarms: ['배터리 룸 과온 (Critical)', 'UPS 바이패스 전환'] },
    'UPS-1F-C': { loc: '본사 IDC-1F', vendor: 'APC', model: 'Smart-UPS SRT 15K', sn: 'AS2011550310', kva: 15, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'ok', date: '2024-06-21', ip: '10.10.1.13', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:05', alarms: [] },
  };
  const UPS_LIST = Object.keys(UPS_DATA);

  // ---- PDU 관리(pdu-list.js) DATA 전체(6건) ----
  const PDU_DATA = {
    'PDU-1F-01': { loc: '본사 IDC-1F', vendor: 'APC', model: 'AP8853', sn: 'AP8853-2211001', kind: '미터드-아웃렛', phase: '3상', outlet: 24, amp: 32, volt: 380, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'ok', src: 'UPS-1F-A', date: '2023-05-10', ip: '10.10.1.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:07', alarms: [] },
    'PDU-1F-02': { loc: '본사 IDC-1F', vendor: 'Vertiv', model: 'MPH2', sn: 'MPH2-1902204', kind: '스위치드', phase: '3상', outlet: 24, amp: 32, volt: 380, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'warn', src: 'UPS-1F-B', date: '2023-05-10', ip: '10.10.1.32', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:02', alarms: ['분기전류 정격 90% 초과 (경고)'] },
    'PDU-2F-01': { loc: '본사 IDC-2F', vendor: 'Raritan', model: 'PX3-5190R', sn: 'PX3-2005511', kind: '미터드', phase: '단상', outlet: 20, amp: 16, volt: 220, comm: 'SNMP', gw: 'GW-IDC-02', link: 'on', op: 'ok', src: 'UPS-2F-A', date: '2022-12-01', ip: '10.10.2.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:40:58', alarms: [] },
    'PDU-2F-02': { loc: '본사 IDC-2F', vendor: 'Raritan', model: 'PX3-5190R', sn: 'PX3-2005512', kind: '미터드', phase: '단상', outlet: 20, amp: 16, volt: 220, comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', src: 'UPS-2F-A', date: '2022-12-01', ip: '10.10.2.32', port: 502, community: '-', memo: '', last: '2026-09-03 08:05:11', alarms: ['통신 두절'] },
    'PDU-DR-01': { loc: '판교 DR센터', vendor: 'APC', model: 'AP8858', sn: 'AP8858-2401007', kind: '모니터드', phase: '3상', outlet: 42, amp: 32, volt: 380, comm: 'SNMP', gw: 'GW-DR-01', link: 'on', op: 'ok', src: 'UPS-DR-1', date: '2024-02-08', ip: '10.20.1.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:11', alarms: [] },
    'PDU-DR-02': { loc: '판교 DR센터', vendor: 'APC', model: 'AP8858', sn: 'AP8858-2401008', kind: '미터드-아웃렛', phase: '3상', outlet: 42, amp: 32, volt: 380, comm: 'SNMP', gw: 'GW-DR-01', link: 'on', op: 'ok', src: 'PDU-DR-01', date: '2024-02-08', ip: '10.20.1.32', port: 161, community: 'public', memo: '2차 분전', last: '2026-09-03 09:41:05', alarms: [] },
  };
  const PDU_LIST = Object.keys(PDU_DATA);

  // 설비(UPS/칠러) id -> 연결된 PDU id 배열. 2개면 이중화(양쪽 PDU에서 동시 수전).
  // 전력계통정보(오른쪽 패널)는 위치 트리와 무관하게 이 실제 전력 연결 관계를 그대로 보여준다.
  const UNIT_PDU = {
    'UPS-1F-A': ['PDU-1F-01'],
    'UPS-1F-B': ['PDU-1F-01', 'PDU-1F-02'],
    'UPS-1F-C': ['PDU-1F-02'],
    'UPS-2F-A': ['PDU-2F-01'],
    'UPS-2F-B': ['PDU-2F-01', 'PDU-2F-02'],
    'UPS-DR-1': ['PDU-DR-01'],
    'UPS-DR-2': ['PDU-DR-01', 'PDU-DR-02'],
    'CH-1F-01': ['PDU-1F-01'],
    'CH-1F-02': ['PDU-1F-02'],
    'CH-2F-01': ['PDU-2F-02'],
    'CH-2F-02': ['PDU-2F-01'],
    'CH-DR-01': ['PDU-DR-02'],
  };

  // ---- 배터리 관리(battery-list.js) DATA 전체(9건) ----
  const BAT_DATA = {
    'BAT-1F-A-1': { ups: 'UPS-1F-A', maker: '삼성SDI', type: '리튬이온', cap: 100, date: '2023-04-12', soh: 96.4, memo: '', alarms: [] },
    'BAT-1F-B-1': { ups: 'UPS-1F-B', maker: '삼성SDI', type: '리튬이온', cap: 100, date: '2023-04-12', soh: 96.5, memo: '', alarms: [] },
    'BAT-1F-B-2': { ups: 'UPS-1F-B', maker: '삼성SDI', type: '리튬이온', cap: 100, date: '2023-04-12', soh: 82.1, memo: '', alarms: ['방전 이력 잦음, 모니터링 필요 (경고)'] },
    'BAT-1F-C-1': { ups: 'UPS-1F-C', maker: 'LG에너지솔루션', type: '리튬이온', cap: 150, date: '2024-06-21', soh: 93.8, memo: '', alarms: [] },
    'BAT-2F-A-1': { ups: 'UPS-2F-A', maker: 'CSB', type: '납축', cap: 200, date: '2022-11-30', soh: 93.3, memo: '2023년 일부 셀 점검', alarms: [] },
    'BAT-2F-B-1': { ups: 'UPS-2F-B', maker: 'CSB', type: '납축', cap: 200, date: '2022-11-30', soh: 94.0, memo: '', alarms: [] },
    'BAT-2F-B-2': { ups: 'UPS-2F-B', maker: 'CSB', type: '납축', cap: 200, date: '2022-11-30', soh: 76.5, memo: '', alarms: ['SOH 76.5% 저하 - 교체 필요 (위험)'] },
    'BAT-DR-1-1': { ups: 'UPS-DR-1', maker: 'Vertiv', type: '리튬이온', cap: 120, date: '2024-02-08', soh: 93.4, memo: '', alarms: [] },
    'BAT-DR-2-1': { ups: 'UPS-DR-2', maker: 'Vertiv', type: '리튬이온', cap: 120, date: '2024-02-08', soh: 92.1, memo: '', alarms: [] },
  };
  const BATTERIES = Object.keys(BAT_DATA).map(function (id) { return { id: id, ups: BAT_DATA[id].ups }; });
  function batStatusOf(soh) { if (soh < 80) return 'crit'; if (soh < 90) return 'warn'; return 'ok'; }

  // ---- 칠러 관리(chiller-list.js) DATA 전체(5건) ----
  const CH_DATA = {
    'CH-1F-01': { loc: '본사 IDC-1F', vendor: 'Carrier', model: '30XA-1002', sn: 'CR30XA-210011', rt: 300, ref: 'R-134a', comm: 'BACnet', gw: 'GW-IDC-01', link: 'on', op: 'ok', date: '2022-08-20', ip: '10.10.1.41', port: 47808, memo: '', last: '2026-09-03 09:41:07', alarms: [] },
    'CH-1F-02': { loc: '본사 IDC-1F', vendor: 'Trane', model: 'RTAC-300', sn: 'TR-RTAC-200544', rt: 300, ref: 'R-513A', comm: 'BACnet', gw: 'GW-IDC-01', link: 'on', op: 'ok', date: '2022-08-20', ip: '10.10.1.42', port: 47808, memo: '예비기', last: '2026-09-03 09:41:03', alarms: [] },
    'CH-2F-01': { loc: '본사 IDC-2F', vendor: 'York', model: 'YVAA-0250', sn: 'YK-YVAA-199877', rt: 250, ref: 'R-1234ze', comm: 'Modbus', gw: 'GW-IDC-02', link: 'on', op: 'warn', date: '2021-11-05', ip: '10.10.2.41', port: 502, memo: '', last: '2026-09-03 09:40:58', alarms: ['냉수 출구온도 12℃ 초과 (경고)'] },
    'CH-2F-02': { loc: '본사 IDC-2F', vendor: 'York', model: 'YVAA-0250', sn: 'YK-YVAA-199878', rt: 250, ref: 'R-1234ze', comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', date: '2021-11-05', ip: '10.10.2.42', port: 502, memo: '', last: '2026-09-03 07:55:20', alarms: ['통신 두절', '압축기 트립 (Major)'] },
    'CH-DR-01': { loc: '판교 DR센터', vendor: 'LG', model: 'RCUW-0200', sn: 'LG-RCUW-240033', rt: 200, ref: 'R-134a', comm: 'BACnet', gw: 'GW-DR-01', link: 'on', op: 'ok', date: '2024-02-08', ip: '10.20.1.41', port: 47808, memo: '', last: '2026-09-03 09:41:11', alarms: [] },
  };
  const CH_LIST = Object.keys(CH_DATA);

  // 설비 종류마다 상태 단계 수·명칭이 다르다. UPS·PDU·칠러는 각 관리 화면의 검색바 "운영상태"
  // 옵션과 동일하게 4단계(정상/경고/Major/Critical)다. 배터리만 3단계(정상/경고/교체필요).
  const STATUS_LABELS = {
    UPS:  { ok: '정상', warn: '경고', major: 'Major', crit: 'Critical' },
    배터리: { ok: '정상', warn: '경고', crit: '교체필요' },
    PDU:  { ok: '정상', warn: '경고', major: 'Major', crit: 'Critical' },
    칠러:  { ok: '정상', warn: '경고', major: 'Major', crit: 'Critical' },
  };
  function statusLabel(type, s) {
    const map = STATUS_LABELS[type] || STATUS_LABELS.PDU;
    return map[s] || s;
  }
  function statusColor(s) {
    return s === 'crit' ? '#c62828' : s === 'major' ? '#d84315' : s === 'warn' ? '#b76e00' : '#1e7e34';
  }

  // ---- 상세정보 렌더용 배지/행 — 각 설비관리 페이지(ups-list.js 등)와 완전히 동일한 방식 ----
  const LINK_BADGE = { on: ['badge-on', '온라인'], off: ['badge-off', '오프라인'] };
  const OP_BADGE = { ok: ['badge-ok', '정상'], warn: ['badge-warn', '경고'], major: ['badge-major', 'Major'], crit: ['badge-crit', 'Critical'] };
  const BAT_BADGE = { ok: 'badge-ok', warn: 'badge-warn', crit: 'badge-major' };
  function badge(map, key) { const p = map[key] || ['badge-off', key]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }
  function alarmsHtml(alarms) {
    return (alarms && alarms.length) ? '<ul>' + alarms.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>' : '<span style="color:#8a97a5;">없음</span>';
  }
  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }
  const DASH = '<span style="color:#8a97a5;">-</span>';

  // ---- 노드 인덱스: id -> {type,label,status,...} ----
  const NODE_INDEX = {};
  function registerNode(id, data) { NODE_INDEX[id] = data; }

  function dot(status) { return status ? '<span class="loc-dot ' + status + '"></span>' : ''; }

  // ================= KPI (전력계통 페이지와 동일한 4개 카드) =================
  function renderKpi() {
    const groups = [
      { label: 'PDU', type: 'PDU', ids: PDU_LIST, statusOf: function (id) { return PDU_DATA[id].op; } },
      { label: 'UPS', type: 'UPS', ids: UPS_LIST, statusOf: function (id) { return UPS_DATA[id].op; } },
      { label: '배터리', type: '배터리', ids: BATTERIES.map(function (b) { return b.id; }), statusOf: function (id) { return batStatusOf(BAT_DATA[id].soh); } },
      { label: '칠러', type: '칠러', ids: CH_LIST, statusOf: function (id) { return CH_DATA[id].op; } },
    ];
    document.getElementById('locKpiGrid').innerHTML = groups.map(function (g) {
      const counts = {};
      g.ids.forEach(function (id) { const s = g.statusOf(id); counts[s] = (counts[s] || 0) + 1; });
      let acc = 0;
      const gradientParts = [];
      const rows = Object.keys(STATUS_LABELS[g.type] || STATUS_LABELS.PDU).map(function (s) {
        const count = counts[s] || 0;
        if (count) {
          const pct = (count / g.ids.length) * 100;
          gradientParts.push(statusColor(s) + ' ' + acc + '% ' + (acc + pct) + '%');
          acc += pct;
        }
        return '<div class="loc-kpi-stat">' + dot(s) + '<span>' + statusLabel(g.type, s) + '</span><b>' + count + '</b></div>';
      });
      return '<div class="loc-kpi-card">'
        + '<div class="loc-kpi-top">'
        +   '<div><p class="loc-kpi-label">' + g.label + '</p><p class="loc-kpi-total">총 ' + g.ids.length + '대</p></div>'
        +   '<div class="loc-kpi-pie" style="background:conic-gradient(' + gradientParts.join(', ') + ')"></div>'
        + '</div>'
        + rows.join('')
        + '</div>';
    }).join('');
  }

  // ================= 트리 =================
  const collapsed = new Set(); // 기본은 전부 펼침. 여기 담긴 id 만 접힘.

  function renderRow(n, depth) {
    const hasKids = n.children && n.children.length > 0;
    const isOpen = !collapsed.has(n.id);
    const caret = hasKids
      ? '<span class="loc-caret" data-caret="' + n.id + '">' + (isOpen ? '&#9662;' : '&#9656;') + '</span>'
      : '<span class="loc-caret leaf">&#9656;</span>';
    const cls = ['loc-row'];
    if (n.status) cls.push(n.status);
    if (n.clickable === false) cls.push('static');
    const dataNode = n.clickable === false ? '' : ' data-node="' + n.id + '"';
    let html = '<div class="' + cls.join(' ') + '"' + dataNode + ' style="padding-left:' + (10 + depth * 20) + 'px">'
      + caret
      + (n.icon ? '<span class="loc-type-icon">' + n.icon + '</span>' : '')
      + dot(n.status)
      + '<span class="loc-name">' + n.label + '</span>'
      + (n.sub ? '<span class="loc-sub">' + n.sub + '</span>' : '')
      + '</div>';
    if (hasKids && isOpen) {
      html += n.children.map(function (c) { return renderRow(c, depth + 1); }).join('');
    }
    return html;
  }

  // locKey 위치에 설치된 PDU/UPS/칠러를 형제로, UPS 아래에 배터리를 자식으로 등록/구성한다.
  // 심각도(상태)는 설비/배터리에만 표시한다 — 위치 노드는 클릭도, 상태 표시도 하지 않는다.
  // locPath는 그 설비가 물리적으로 있는 위치(위치정보 breadcrumb용)이지 전력 연결관계와는 무관하다.
  function buildEquipmentAt(locKey, path) {
    const nodes = [];

    PDU_LIST.filter(function (id) { return PDU_DATA[id].loc === locKey; }).forEach(function (id) {
      const st = PDU_DATA[id].op;
      registerNode('pdu:' + id, { type: 'PDU', label: id, status: st, locPath: path });
      nodes.push({ id: 'pdu:' + id, label: id, sub: 'PDU', status: st, children: [] });
    });

    UPS_LIST.filter(function (u) { return UPS_DATA[u].loc === locKey; }).forEach(function (u) {
      const st = UPS_DATA[u].op;
      const uId = 'ups:' + u;
      registerNode(uId, { type: 'UPS', label: u, status: st, locPath: path });
      const battChildren = BATTERIES.filter(function (b) { return b.ups === u; }).map(function (b) {
        const bst = batStatusOf(BAT_DATA[b.id].soh);
        registerNode('bat:' + b.id, { type: '배터리', label: b.id, status: bst, locPath: path });
        return { id: 'bat:' + b.id, label: b.id, sub: '배터리', status: bst, children: [] };
      });
      nodes.push({ id: uId, label: u, sub: 'UPS', status: st, children: battChildren });
    });

    CH_LIST.filter(function (c) { return CH_DATA[c].loc === locKey; }).forEach(function (c) {
      const st = CH_DATA[c].op;
      registerNode('ch:' + c, { type: '칠러', label: c, status: st, locPath: path });
      nodes.push({ id: 'ch:' + c, label: c, sub: '칠러', status: st, children: [] });
    });

    return nodes;
  }

  // 위치 노드 하나(와 그 하위 전체)를 등록하고 트리 렌더용 노드를 만든다. 위치 노드는 클릭
  // 불가(clickable:false)로 표시하고 상태 dot도 없다 — 심각도는 설비/배터리에만 있다.
  function buildLocNode(node, pathArr) {
    const path = pathArr.concat([node.name]);
    const id = 'loc:' + path.join('>');

    let children = [];
    if (node.locKey) {
      children = children.concat(buildEquipmentAt(node.locKey, path));
    }
    (node.children || []).forEach(function (c) {
      children.push(buildLocNode(c, path));
    });

    return { id: id, label: node.name, icon: TYPE_ICON[node.type], clickable: false, children: children };
  }

  function renderTree() {
    for (const k in NODE_INDEX) delete NODE_INDEX[k];

    const roots = LOC_TREE.map(function (n) { return buildLocNode(n, []); });
    document.getElementById('locTreeBody').innerHTML = roots.map(function (r) { return renderRow(r, 0); }).join('');

    if (!currentId || !NODE_INDEX[currentId]) {
      selectEntity(Object.keys(NODE_INDEX)[0]);
    } else {
      selectEntity(currentId);
    }
  }

  // ================= 전력계통정보 (선택 설비의 실제 전력 연결 — 전력계통 페이지와 동일) =================
  // 위치 트리와는 별개로, PDU/UPS/칠러/배터리 사이의 실제 전력 연결관계(UNIT_PDU)를 그대로 보여준다.
  function boxFor(id) { const n = NODE_INDEX[id]; return { id: id, label: n.label, status: n.status }; }

  // 선택한 설비의 상위(PDU 등)/하위(배터리 등) 전력 연결 id만 뽑는다 — 계통정보·위치정보가 공유.
  function relatedIds(id) {
    const n = NODE_INDEX[id];
    if (n.type === 'UPS') {
      return {
        parents: (UNIT_PDU[n.label] || []).map(function (p) { return 'pdu:' + p; }),
        children: BATTERIES.filter(function (b) { return b.ups === n.label; }).map(function (b) { return 'bat:' + b.id; }),
      };
    }
    if (n.type === 'PDU') {
      const connectedUps = UPS_LIST.filter(function (u) { return (UNIT_PDU[u] || []).indexOf(n.label) >= 0; }).map(function (u) { return 'ups:' + u; });
      const connectedCh = CH_LIST.filter(function (c) { return (UNIT_PDU[c] || []).indexOf(n.label) >= 0; }).map(function (c) { return 'ch:' + c; });
      return { parents: [], children: connectedUps.concat(connectedCh) };
    }
    if (n.type === '칠러') {
      return { parents: (UNIT_PDU[n.label] || []).map(function (p) { return 'pdu:' + p; }), children: [] };
    }
    // 배터리
    const b = BATTERIES.filter(function (x) { return x.id === n.label; })[0];
    return { parents: b ? ['ups:' + b.ups] : [], children: [] };
  }

  function buildLevels(id) {
    const rel = relatedIds(id);
    const rows = [];
    if (rel.parents.length) rows.push(rel.parents.map(boxFor));
    const self = Object.assign(boxFor(id), { selected: true });
    if (rel.parents.length) self.parents = rel.parents.map(function (_, i) { return i; });
    rows.push([self]);
    if (rel.children.length) rows.push(rel.children.map(function (cid) { return Object.assign(boxFor(cid), { parent: 0 }); }));
    return rows;
  }

  function renderDiagram(levels) {
    const inner = document.getElementById('locDiagramInner');
    let html = '';
    levels.forEach(function (row, l) {
      if (!row.length) return;
      html += '<div class="loc-diagram-row" data-level="' + l + '">';
      row.forEach(function (item, b) {
        html += '<div class="loc-diagram-box' + (item.selected ? ' selected' : '') + '" id="ldbox-' + l + '-' + b + '">'
          + dot(item.status) + item.label + '</div>';
      });
      html += '</div>';
    });
    // 박스(행)만 먼저 넣고 크기를 잰다 — <svg>를 미리 넣어두면 width/height 속성이 없는 동안
    // 브라우저 기본 크기(300x150)를 차지해 아직 없는 콘텐츠 기준으로 크기를 잘못 잴 수 있다.
    inner.innerHTML = html;
    const w = inner.scrollWidth;
    const h = inner.scrollHeight;

    let lines = '';
    for (let l = 1; l < levels.length; l++) {
      levels[l].forEach(function (item, b) {
        const parentIdxs = item.parents ? item.parents : (item.parent == null ? [] : [item.parent]);
        if (!parentIdxs.length) return;
        const childBox = document.getElementById('ldbox-' + l + '-' + b);
        if (!childBox) return;
        const cx = childBox.offsetLeft + childBox.offsetWidth / 2;
        const cy = childBox.offsetTop;
        parentIdxs.forEach(function (pi) {
          const parentBox = document.getElementById('ldbox-' + (l - 1) + '-' + pi);
          if (!parentBox) return;
          const px = parentBox.offsetLeft + parentBox.offsetWidth / 2;
          const py = parentBox.offsetTop + parentBox.offsetHeight;
          lines += '<line x1="' + px + '" y1="' + py + '" x2="' + cx + '" y2="' + cy + '"></line>';
        });
      });
    }
    // width/height를 처음부터 지정해서 넣는다 — 뒤늦게 setAttribute 하면 그 사이에 잰 크기가 어긋난다.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'loc-diagram-svg');
    svg.setAttribute('id', 'locDiagramSvg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.innerHTML = lines;
    inner.appendChild(svg);
  }

  // ================= 위치정보 (전력계통정보에 나온 항목 전부의 위치 breadcrumb) =================
  function crumbHtml(list) {
    return list.map(function (c, i) { return (i > 0 ? '<span class="loc-crumb-sep">&rsaquo;</span>' : '') + '<span class="loc-crumb">' + c + '</span>'; }).join('');
  }
  function locRow(label, pathArr) {
    return '<div class="loc-loc-row"><p class="loc-loc-label">' + label + '</p><div class="loc-crumbs">' + crumbHtml(pathArr || []) + '</div></div>';
  }
  function renderZone(id) {
    const rel = relatedIds(id);
    const ids = rel.parents.concat([id]).concat(rel.children);
    document.getElementById('locZoneContent').innerHTML = ids.map(function (cid) {
      return locRow(NODE_INDEX[cid].label + ' 위치', NODE_INDEX[cid].locPath);
    }).join('');
  }

  // ================= 상세정보 =================
  // 위치 노드는 클릭 자체가 안 되므로 여기서 다룰 일이 없다. 설비 노드는 각 설비관리 페이지에서
  // row를 클릭했을 때 나오는 상세 드로어와 완전히 동일한 그룹/행 구성을 그대로 재현한다.
  function renderInfoUPS(r) {
    return dvGroup(
        dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model)
        + dvRow('S/N', r.sn) + dvRow('용량', r.kva + ' kVA') + dvRow('설치일자', r.date))
      + dvGroup(
          dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port)
          + dvRow('Community', r.community) + dvRow('연결 G/W', r.gw)
          + dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last))
      + dvGroup(
          dvRow('운영상태', badge(OP_BADGE, r.op)) + dvRow('활성 알람', alarmsHtml(r.alarms), true))
      + dvGroup(dvRow('비고', r.memo || DASH, true));
  }
  function renderInfoPDU(r) {
    return dvGroup(
        dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model) + dvRow('S/N', r.sn)
        + dvRow('유형', r.kind) + dvRow('상', r.phase) + dvRow('아웃렛 수', r.outlet)
        + dvRow('정격전류', r.amp + ' A') + dvRow('정격전압', r.volt + ' V')
        + dvRow('상위전원', r.src) + dvRow('설치일자', r.date))
      + dvGroup(
          dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port)
          + dvRow('Community', r.community) + dvRow('연결 G/W', r.gw)
          + dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last))
      + dvGroup(
          dvRow('운영상태', badge(OP_BADGE, r.op)) + dvRow('활성 알람', alarmsHtml(r.alarms), true))
      + dvGroup(dvRow('비고', r.memo || DASH, true));
  }
  function renderInfoCH(r) {
    return dvGroup(
        dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model) + dvRow('S/N', r.sn)
        + dvRow('냉각능력', r.rt + ' RT') + dvRow('냉매종류', r.ref) + dvRow('설치일자', r.date))
      + dvGroup(
          dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port) + dvRow('연결 G/W', r.gw)
          + dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last))
      + dvGroup(
          dvRow('운영상태', badge(OP_BADGE, r.op)) + dvRow('활성 알람', alarmsHtml(r.alarms), true))
      + dvGroup(dvRow('비고', r.memo || DASH, true));
  }
  function renderInfoBAT(r) {
    const st = batStatusOf(r.soh);
    return dvGroup(
        dvRow('소속 UPS', r.ups) + dvRow('위치', UPS_DATA[r.ups].loc) + dvRow('제조사', r.maker)
        + dvRow('종류', r.type) + dvRow('용량', r.cap + ' Ah') + dvRow('설치일자', r.date))
      + dvGroup(
          dvRow('SOH', r.soh + '%') + dvRow('상태', '<span class="badge ' + BAT_BADGE[st] + '">' + statusLabel('배터리', st) + '</span>'))
      + dvGroup(dvRow('활성 알람', alarmsHtml(r.alarms), true))
      + dvGroup(dvRow('비고', r.memo || DASH, true));
  }

  function renderInfo(id) {
    const n = NODE_INDEX[id];
    document.getElementById('locInfoTitle').textContent = n.label + ' 상세';
    let body;
    if (n.type === 'UPS') body = renderInfoUPS(UPS_DATA[n.label]);
    else if (n.type === 'PDU') body = renderInfoPDU(PDU_DATA[n.label]);
    else if (n.type === '칠러') body = renderInfoCH(CH_DATA[n.label]);
    else body = renderInfoBAT(BAT_DATA[n.label]);
    document.getElementById('locInfoRows').innerHTML = '<div class="dv">' + body + '</div>';
  }

  // ================= 선택 =================
  let currentId = null;

  function selectEntity(id) {
    const n = NODE_INDEX[id];
    if (!n) return;
    currentId = id;
    const prev = document.querySelector('.loc-row.picked');
    if (prev) prev.classList.remove('picked');
    const row = document.querySelector('.loc-row[data-node="' + id + '"]');
    if (row) row.classList.add('picked');
    renderDiagram(buildLevels(id));
    renderZone(id);
    renderInfo(id);
  }

  // 캐럿 클릭 → 접기/펼치기, 행 클릭 → 우측 패널 갱신 (이벤트 위임, location-manage.js 와 동일한 방식)
  function initTreeEvents() {
    document.getElementById('locTreeBody').addEventListener('click', function (e) {
      const caret = e.target.closest('.loc-caret[data-caret]');
      if (caret) {
        const id = caret.getAttribute('data-caret');
        if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
        renderTree();
        return;
      }
      const row = e.target.closest('.loc-row[data-node]');
      if (row) selectEntity(row.getAttribute('data-node'));
    });
  }

  // ---- 초기화 ----
  renderKpi();
  initTreeEvents();
  renderTree();

})();
