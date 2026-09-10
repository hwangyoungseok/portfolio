// 전력계통 페이지 스크립트 (목업 데이터, 읽기 전용)
// 화면: 설비현황 > 전력계통
// 구조 변경(소속 UPS 등)은 각 설비 등록화면에서 이루어지고, 이 화면은 그 관계를 트리 +
// (전력계통정보/위치정보/상세정보) 3단 패널로 보여주기만 한다.
// 상세정보 카드는 각 설비관리 페이지(ups-list.js 등)에서 row 클릭 시 나오는 상세와 완전히
// 동일한 내용을 보여준다 — 그래서 그 페이지들의 DATA를 그대로 옮겨와 둔다(같은 값 유지 필수).
(function () {

  // ---- UPS 관리(ups-list.js) DATA 전체(7건) ----
  const UPS_DATA = {
    'UPS-1F-A': { loc: '본사 IDC-1F', vendor: 'APC', model: 'Smart-UPS SRT 10K', sn: 'AS1934110021', kva: 10, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'ok', date: '2023-04-12', ip: '10.10.1.11', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:07', alarms: [] },
    'UPS-1F-B': { loc: '본사 IDC-1F', vendor: 'APC', model: 'Smart-UPS SRT 10K', sn: 'AS1934110022', kva: 10, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'warn', date: '2023-04-12', ip: '10.10.1.12', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:03', alarms: [{ time: '2026-09-03 07:15', text: '출력 부하율 85% 초과 (경고)' }] },
    'UPS-2F-A': { loc: '본사 IDC-2F', vendor: 'Vertiv', model: 'Liebert APM 30K', sn: 'VT21008847', kva: 30, comm: 'SNMP', gw: 'GW-IDC-02', link: 'on', op: 'ok', date: '2022-11-30', ip: '10.10.2.11', port: 161, community: 'public', memo: '2023년 배터리 교체', last: '2026-09-03 09:40:58', alarms: [] },
    'UPS-2F-B': { loc: '본사 IDC-2F', vendor: 'Vertiv', model: 'Liebert APM 30K', sn: 'VT21008848', kva: 30, comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', date: '2022-11-30', ip: '10.10.2.12', port: 502, community: '-', memo: '', last: '2026-09-03 08:12:20', alarms: [{ time: '2026-09-03 08:10', text: '통신 두절' }, { time: '2026-09-02 22:40', text: '배터리 스트링 전압 저하 (Major)' }] },
    'UPS-DR-1': { loc: '판교 DR센터', vendor: 'LS ELECTRIC', model: 'LSUPS-0020B', sn: 'LS200347711', kva: 20, comm: 'SNMP', gw: 'GW-DR-01', link: 'on', op: 'ok', date: '2024-02-08', ip: '10.20.1.11', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:11', alarms: [] },
    'UPS-DR-2': { loc: '판교 DR센터', vendor: '삼성', model: 'SUP-0100', sn: 'SS99281120', kva: 10, comm: 'SNMP', gw: 'GW-DR-01', link: 'on', op: 'crit', date: '2024-02-08', ip: '10.20.1.12', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:09', alarms: [{ time: '2026-09-03 03:20', text: '배터리 룸 과온 (Critical)' }, { time: '2026-09-03 03:22', text: 'UPS 바이패스 전환' }] },
    'UPS-1F-C': { loc: '본사 IDC-1F', vendor: 'APC', model: 'Smart-UPS SRT 15K', sn: 'AS2011550310', kva: 15, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'ok', date: '2024-06-21', ip: '10.10.1.13', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:05', alarms: [] },
  };
  const UPS_LIST = Object.keys(UPS_DATA);
  const UPS_LOC = {};
  UPS_LIST.forEach(function (u) { UPS_LOC[u] = UPS_DATA[u].loc; });

  // 위치 관리(location-manage.js) 트리와 동일한 경로로 맞춘 위치별 breadcrumb
  const LOC_BREADCRUMB = {
    '본사 IDC-1F': ['본사', 'IDC동', '1F 전산실'],
    '본사 IDC-2F': ['본사', 'IDC동', '2F 전산실'],
    '판교 DR센터': ['판교 DR센터', 'DR 전산실'],
  };

  // ---- PDU 관리(pdu-list.js) DATA 전체(6건) ----
  const PDU_DATA = {
    'PDU-1F-01': { loc: '본사 IDC-1F', vendor: 'APC', model: 'AP8853', sn: 'AP8853-2211001', kind: '미터드-아웃렛', phase: '3상', outlet: 24, amp: 32, volt: 380, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'ok', src: 'UPS-1F-A', date: '2023-05-10', ip: '10.10.1.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:07', alarms: [] },
    'PDU-1F-02': { loc: '본사 IDC-1F', vendor: 'Vertiv', model: 'MPH2', sn: 'MPH2-1902204', kind: '스위치드', phase: '3상', outlet: 24, amp: 32, volt: 380, comm: 'SNMP', gw: 'GW-IDC-01', link: 'on', op: 'warn', src: 'UPS-1F-B', date: '2023-05-10', ip: '10.10.1.32', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:02', alarms: [{ time: '2026-09-03 08:55', text: '분기전류 정격 90% 초과 (경고)' }] },
    'PDU-2F-01': { loc: '본사 IDC-2F', vendor: 'Raritan', model: 'PX3-5190R', sn: 'PX3-2005511', kind: '미터드', phase: '단상', outlet: 20, amp: 16, volt: 220, comm: 'SNMP', gw: 'GW-IDC-02', link: 'on', op: 'ok', src: 'UPS-2F-A', date: '2022-12-01', ip: '10.10.2.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:40:58', alarms: [] },
    'PDU-2F-02': { loc: '본사 IDC-2F', vendor: 'Raritan', model: 'PX3-5190R', sn: 'PX3-2005512', kind: '미터드', phase: '단상', outlet: 20, amp: 16, volt: 220, comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', src: 'UPS-2F-A', date: '2022-12-01', ip: '10.10.2.32', port: 502, community: '-', memo: '', last: '2026-09-03 08:05:11', alarms: [{ time: '2026-09-03 08:05', text: '통신 두절' }] },
    'PDU-DR-01': { loc: '판교 DR센터', vendor: 'APC', model: 'AP8858', sn: 'AP8858-2401007', kind: '모니터드', phase: '3상', outlet: 42, amp: 32, volt: 380, comm: 'SNMP', gw: 'GW-DR-01', link: 'on', op: 'ok', src: 'UPS-DR-1', date: '2024-02-08', ip: '10.20.1.31', port: 161, community: 'public', memo: '', last: '2026-09-03 09:41:11', alarms: [] },
    'PDU-DR-02': { loc: '판교 DR센터', vendor: 'APC', model: 'AP8858', sn: 'AP8858-2401008', kind: '미터드-아웃렛', phase: '3상', outlet: 42, amp: 32, volt: 380, comm: 'SNMP', gw: 'GW-DR-01', link: 'on', op: 'ok', src: 'PDU-DR-01', date: '2024-02-08', ip: '10.20.1.32', port: 161, community: 'public', memo: '2차 분전', last: '2026-09-03 09:41:05', alarms: [] },
  };
  const PDU_LIST = Object.keys(PDU_DATA);
  const PDU_LOC = {};
  PDU_LIST.forEach(function (p) { PDU_LOC[p] = PDU_DATA[p].loc; });

  // 설비(UPS/칠러) id -> 연결된 PDU id 배열. 2개면 이중화(양쪽 PDU에서 동시 수전).
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
    'BAT-1F-B-2': { ups: 'UPS-1F-B', maker: '삼성SDI', type: '리튬이온', cap: 100, date: '2023-04-12', soh: 82.1, memo: '', alarms: [{ time: '2026-09-02 14:20', text: '방전 이력 잦음, 모니터링 필요 (경고)' }] },
    'BAT-1F-C-1': { ups: 'UPS-1F-C', maker: 'LG에너지솔루션', type: '리튬이온', cap: 150, date: '2024-06-21', soh: 93.8, memo: '', alarms: [] },
    'BAT-2F-A-1': { ups: 'UPS-2F-A', maker: 'CSB', type: '납축', cap: 200, date: '2022-11-30', soh: 93.3, memo: '2023년 일부 셀 점검', alarms: [] },
    'BAT-2F-B-1': { ups: 'UPS-2F-B', maker: 'CSB', type: '납축', cap: 200, date: '2022-11-30', soh: 94.0, memo: '', alarms: [] },
    'BAT-2F-B-2': { ups: 'UPS-2F-B', maker: 'CSB', type: '납축', cap: 200, date: '2022-11-30', soh: 76.5, memo: '', alarms: [{ time: '2026-09-01 09:00', text: 'SOH 76.5% 저하 - 교체 필요 (위험)' }] },
    'BAT-DR-1-1': { ups: 'UPS-DR-1', maker: 'Vertiv', type: '리튬이온', cap: 120, date: '2024-02-08', soh: 93.4, memo: '', alarms: [] },
    'BAT-DR-2-1': { ups: 'UPS-DR-2', maker: 'Vertiv', type: '리튬이온', cap: 120, date: '2024-02-08', soh: 92.1, memo: '', alarms: [] },
  };
  const BATTERIES = Object.keys(BAT_DATA).map(function (id) { return { id: id, ups: BAT_DATA[id].ups }; });
  function batStatusOf(soh) { if (soh < 80) return 'crit'; if (soh < 90) return 'warn'; return 'ok'; }

  // ---- 칠러 관리(chiller-list.js) DATA 전체(5건) ----
  const CH_DATA = {
    'CH-1F-01': { loc: '본사 IDC-1F', vendor: 'Carrier', model: '30XA-1002', sn: 'CR30XA-210011', rt: 300, ref: 'R-134a', comm: 'BACnet', gw: 'GW-IDC-01', link: 'on', op: 'ok', date: '2022-08-20', ip: '10.10.1.41', port: 47808, memo: '', last: '2026-09-03 09:41:07', alarms: [] },
    'CH-1F-02': { loc: '본사 IDC-1F', vendor: 'Trane', model: 'RTAC-300', sn: 'TR-RTAC-200544', rt: 300, ref: 'R-513A', comm: 'BACnet', gw: 'GW-IDC-01', link: 'on', op: 'ok', date: '2022-08-20', ip: '10.10.1.42', port: 47808, memo: '예비기', last: '2026-09-03 09:41:03', alarms: [] },
    'CH-2F-01': { loc: '본사 IDC-2F', vendor: 'York', model: 'YVAA-0250', sn: 'YK-YVAA-199877', rt: 250, ref: 'R-1234ze', comm: 'Modbus', gw: 'GW-IDC-02', link: 'on', op: 'warn', date: '2021-11-05', ip: '10.10.2.41', port: 502, memo: '', last: '2026-09-03 09:40:58', alarms: [{ time: '2026-09-03 06:30', text: '냉수 출구온도 12℃ 초과 (경고)' }] },
    'CH-2F-02': { loc: '본사 IDC-2F', vendor: 'York', model: 'YVAA-0250', sn: 'YK-YVAA-199878', rt: 250, ref: 'R-1234ze', comm: 'Modbus', gw: 'GW-IDC-02', link: 'off', op: 'major', date: '2021-11-05', ip: '10.10.2.42', port: 502, memo: '', last: '2026-09-03 07:55:20', alarms: [{ time: '2026-09-03 07:50', text: '통신 두절' }, { time: '2026-09-03 02:15', text: '압축기 트립 (Major)' }] },
    'CH-DR-01': { loc: '판교 DR센터', vendor: 'LG', model: 'RCUW-0200', sn: 'LG-RCUW-240033', rt: 200, ref: 'R-134a', comm: 'BACnet', gw: 'GW-DR-01', link: 'on', op: 'ok', date: '2024-02-08', ip: '10.20.1.41', port: 47808, memo: '', last: '2026-09-03 09:41:11', alarms: [] },
  };
  const CHILLERS = Object.keys(CH_DATA).map(function (id) { return { id: id, loc: CH_DATA[id].loc }; });

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
    return (alarms && alarms.length)
      ? '<ul>' + alarms.map(function (a) { return '<li>' + a.text + ' <span style="color:#98a2b3;font-size:11px;">(' + a.time + ')</span></li>'; }).join('') + '</ul>'
      : '<span style="color:#8a97a5;">없음</span>';
  }
  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }
  const DASH = '<span style="color:#8a97a5;">-</span>';

  // ---- 노드 상세/트리 조회용 인덱스 ----
  const NODE_INDEX = {};
  function registerNode(id, data) { NODE_INDEX[id] = data; }

  function dot(status) { return status ? '<span class="topo-dot ' + status + '"></span>' : ''; }

  // ================= KPI =================
  function renderKpi() {
    const groups = [
      { label: 'PDU', type: 'PDU', ids: PDU_LIST, statusOf: function (id) { return PDU_DATA[id].op; } },
      { label: 'UPS', type: 'UPS', ids: UPS_LIST, statusOf: function (id) { return UPS_DATA[id].op; } },
      { label: '배터리', type: '배터리', ids: BATTERIES.map(function (b) { return b.id; }), statusOf: function (id) { return batStatusOf(BAT_DATA[id].soh); } },
      { label: '칠러', type: '칠러', ids: CHILLERS.map(function (c) { return c.id; }), statusOf: function (id) { return CH_DATA[id].op; } },
    ];
    document.getElementById('topoKpiGrid').innerHTML = groups.map(function (g) {
      const counts = {};
      g.ids.forEach(function (id) { const s = g.statusOf(id); counts[s] = (counts[s] || 0) + 1; });
      let acc = 0;
      const gradientParts = [];
      // 단계는 해당 설비 종류의 상태 체계(STATUS_LABELS) 전부를 항상 보여준다 — 건수 0이어도 레이블은 표시.
      const rows = Object.keys(STATUS_LABELS[g.type] || STATUS_LABELS.PDU).map(function (s) {
        const count = counts[s] || 0;
        if (count) {
          const pct = (count / g.ids.length) * 100;
          gradientParts.push(statusColor(s) + ' ' + acc + '% ' + (acc + pct) + '%');
          acc += pct;
        }
        return '<div class="topo-kpi-stat">' + dot(s) + '<span>' + statusLabel(g.type, s) + '</span><b>' + count + '</b></div>';
      });
      return '<div class="topo-kpi-card">'
        + '<div class="topo-kpi-top">'
        +   '<div><p class="topo-kpi-label">' + g.label + '</p><p class="topo-kpi-total">총 ' + g.ids.length + '대</p></div>'
        +   '<div class="topo-kpi-pie" style="background:conic-gradient(' + gradientParts.join(', ') + ')"></div>'
        + '</div>'
        + rows.join('')
        + '</div>';
    }).join('');
  }

  // ================= 트리 (location-manage.js 위치 트리와 동일한 패턴) =================
  const collapsed = new Set(); // 기본은 전부 펼침. 여기 담긴 id 만 접힘.
  let lastTreeRoots = []; // renderTopology()가 매번 갱신 — topoSearchGo()가 이걸 훑는다.
  let lastSearchKw = null;   // 같은 검색어로 Enter를 다시 누르면 "다음 일치 항목"으로 이동하기 위한 상태.
  let lastMatchIndex = -1;   // id로 찾으면 이중수전처럼 같은 id가 여러 행에 나오는 경우 헷갈리므로 인덱스로 추적.

  // 루트부터 차례로(위→아래, 부모 먼저) 훑어 이름이 일치하는 모든 노드를 그 순서 그대로 모은다.
  function findAllMatches(nodes, kw, path) {
    let out = [];
    nodes.forEach(function (n) {
      if (n.label.toLowerCase().indexOf(kw) >= 0) out.push({ node: n, path: path.slice() });
      if (n.children && n.children.length) {
        out = out.concat(findAllMatches(n.children, kw, path.concat([n.id])));
      }
    });
    return out;
  }

  // 검색: 트리를 걸러내지 않는다. 같은 검색어로 다시 실행하면 직전에 찾은 항목 "다음"으로
  // 넘어가고(끝까지 가면 맨 위로 순환), 검색어가 바뀌면 다시 맨 위(첫 일치)부터 찾는다.
  function topoSearchGo() {
    const kw = (document.getElementById('topoSearch').value || '').trim().toLowerCase();
    if (!kw) return;
    const matches = findAllMatches(lastTreeRoots, kw, []);
    if (!matches.length) { umsToast('일치하는 항목이 없습니다.'); lastSearchKw = null; lastMatchIndex = -1; return; }

    const idx = (kw === lastSearchKw) ? (lastMatchIndex + 1) % matches.length : 0;
    const found = matches[idx];
    lastSearchKw = kw;
    lastMatchIndex = idx;

    found.path.forEach(function (id) { collapsed.delete(id); });
    renderTopology();
    selectEntity(found.node.id);
    const row = document.querySelector('.topo-row[data-node="' + found.node.id + '"]');
    if (row) row.scrollIntoView({ block: 'center' });
  }

  function renderRow(n, depth) {
    const hasKids = n.children && n.children.length > 0;
    const isOpen = !collapsed.has(n.id);
    const caret = hasKids
      ? '<span class="topo-caret" data-caret="' + n.id + '">' + (isOpen ? '&#9662;' : '&#9656;') + '</span>'
      : '<span class="topo-caret leaf">&#9656;</span>';
    const cls = ['topo-row'];
    if (n.status) cls.push(n.status);
    const dataNode = n.clickable === false ? '' : ' data-node="' + n.id + '"';
    let html = '<div class="' + cls.join(' ') + '"' + dataNode + ' style="padding-left:' + (10 + depth * 20) + 'px">'
      + caret
      + dot(n.status)
      + '<span class="topo-name">' + n.label + '</span>'
      + (n.sub ? '<span class="topo-sub">' + n.sub + '</span>' : '')
      + '</div>';
    if (hasKids && isOpen) {
      html += n.children.map(function (c) { return renderRow(c, depth + 1); }).join('');
    }
    return html;
  }

  // UPS/칠러 노드 하나 만들기. 같은 설비가 PDU를 여러 개 물면 각 PDU 아래에 똑같이
  // (중복) 나타나며, 몇 번째 연결인지 sub 라벨에 표시해 "같은 설비의 다른 급전선"임을 알려준다.
  function buildUnitNode(kind, u, loc, pduId, pduIdx, pduCount) {
    const isUps = kind === 'UPS';
    const id = (isUps ? 'ups:' : 'ch:') + u;
    const status = isUps ? UPS_DATA[u].op : CH_DATA[u].op;
    const dual = pduCount > 1;
    const sub = kind + (dual ? ' · 급전 ' + pduIdx + '/' + pduCount : '');

    if (!NODE_INDEX[id]) {
      registerNode(id, { type: kind, label: u, loc: loc, status: status });
    }

    let children = [];
    if (isUps) {
      children = BATTERIES.filter(function (b) { return b.ups === u; }).map(function (b) {
        const bid = 'bat:' + b.id;
        const bst = batStatusOf(BAT_DATA[b.id].soh);
        registerNode(bid, { type: '배터리', label: b.id, loc: loc, status: bst });
        return { id: bid, label: b.id, sub: '배터리', status: bst };
      });
    }

    return { id: id, label: u + (dual ? ' (' + pduIdx + '/' + pduCount + ')' : ''), sub: sub, status: status, children: children };
  }

  function renderTopology() {
    for (const k in NODE_INDEX) delete NODE_INDEX[k];

    // 이 화면이 다루는 건 PDU/UPS/칠러/배터리뿐이므로 위치 구분 없이 등록된 전체를 보여준다.
    // PDU가 최상위(형제로 여러 개), 그 아래 UPS/칠러가 형제, UPS 아래에 배터리가 자식으로 붙는다.
    const units = UPS_LIST.map(function (u) { return { kind: 'UPS', id: u, loc: UPS_LOC[u] }; })
      .concat(CHILLERS.map(function (c) { return { kind: '칠러', id: c.id, loc: c.loc }; }));

    const pduNodes = PDU_LIST.map(function (pduId) {
      const connected = units.filter(function (un) { return (UNIT_PDU[un.id] || []).indexOf(pduId) >= 0; });
      const children = connected.map(function (un) {
        const conns = UNIT_PDU[un.id] || [];
        const idx = conns.indexOf(pduId) + 1;
        return buildUnitNode(un.kind, un.id, un.loc, pduId, idx, conns.length);
      });
      const pduStatus = PDU_DATA[pduId].op;
      registerNode('pdu:' + pduId, { type: 'PDU', label: pduId, loc: PDU_LOC[pduId], status: pduStatus });
      return { id: 'pdu:' + pduId, label: pduId, sub: 'PDU', status: pduStatus, clickable: true, children: children };
    });

    lastTreeRoots = pduNodes; // 검색(topoSearchGo)이 훑을 원본 트리 — 항상 전체 트리 기준.
    document.getElementById('topoTreeBody').innerHTML = pduNodes.map(function (n) { return renderRow(n, 0); }).join('');

    if (!currentId || !NODE_INDEX[currentId]) {
      selectEntity(Object.keys(NODE_INDEX)[0]);
    } else {
      selectEntity(currentId);
    }
  }

  // ================= 전력계통정보 (선택 설비 주변 미니 다이어그램) =================
  function pduBox(pduId) { return { id: 'pdu:' + pduId, label: pduId, status: PDU_DATA[pduId].op }; }
  function upsBox(u) { return { id: 'ups:' + u, label: u, status: UPS_DATA[u].op }; }
  function chBox(c) { return { id: 'ch:' + c, label: c, status: CH_DATA[c].op }; }
  function batBox(b) { return { id: 'bat:' + b, label: b, status: batStatusOf(BAT_DATA[b].soh) }; }

  function buildLevels(type, key) {
    if (type === 'UPS') {
      const pduIds = UNIT_PDU[key] || [];
      const parents = pduIds.map(pduBox);
      const selfRow = [Object.assign(upsBox(key), { parents: parents.map(function (_, i) { return i; }), selected: true })];
      const battRow = BATTERIES.filter(function (b) { return b.ups === key; }).map(function (b) {
        return Object.assign(batBox(b.id), { parent: 0 });
      });
      const rows = [parents, selfRow];
      if (battRow.length) rows.push(battRow);
      return rows;
    }
    if (type === 'PDU') {
      // PDU가 이 화면에서 다루는 계통의 최상위이므로 위로 이어질 부모가 없다.
      const connectedUps = UPS_LIST.filter(function (u) { return (UNIT_PDU[u] || []).indexOf(key) >= 0; });
      const connectedCh = CHILLERS.filter(function (c) { return (UNIT_PDU[c.id] || []).indexOf(key) >= 0; }).map(function (c) { return c.id; });
      const selfRow = [Object.assign(pduBox(key), { selected: true })];
      const children = connectedUps.map(function (u) { return Object.assign(upsBox(u), { parent: 0 }); })
        .concat(connectedCh.map(function (c) { return Object.assign(chBox(c), { parent: 0 }); }));
      return [selfRow, children];
    }
    if (type === '칠러') {
      const pduIds = UNIT_PDU[key] || [];
      const parents = pduIds.map(pduBox);
      const selfRow = [Object.assign(chBox(key), { parents: parents.map(function (_, i) { return i; }), selected: true })];
      return [parents, selfRow];
    }
    // 배터리
    const b = BATTERIES.filter(function (x) { return x.id === key; })[0];
    const parents = b ? [upsBox(b.ups)] : [];
    const selfRow = [Object.assign(batBox(key), { parent: 0, selected: true })];
    return [parents, selfRow];
  }

  function renderDiagram(levels) {
    const inner = document.getElementById('topoDiagramInner');
    let html = '';
    levels.forEach(function (row, l) {
      if (!row.length) return;
      html += '<div class="topo-diagram-row" data-level="' + l + '">';
      row.forEach(function (item, b) {
        html += '<div class="topo-diagram-box' + (item.selected ? ' selected' : '') + '" id="tdbox-' + l + '-' + b + '">'
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
        const childBox = document.getElementById('tdbox-' + l + '-' + b);
        if (!childBox) return;
        const cx = childBox.offsetLeft + childBox.offsetWidth / 2;
        const cy = childBox.offsetTop;
        parentIdxs.forEach(function (pi) {
          const parentBox = document.getElementById('tdbox-' + (l - 1) + '-' + pi);
          if (!parentBox) return;
          const px = parentBox.offsetLeft + parentBox.offsetWidth / 2;
          const py = parentBox.offsetTop + parentBox.offsetHeight;
          lines += '<line x1="' + px + '" y1="' + py + '" x2="' + cx + '" y2="' + cy + '"></line>';
        });
      });
    }
    // width/height를 처음부터 지정해서 넣는다 — 뒤늦게 setAttribute 하면 그 사이에 잰 크기가 어긋난다.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'topo-diagram-svg');
    svg.setAttribute('id', 'topoDiagramSvg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.innerHTML = lines;
    inner.appendChild(svg);
  }

  // ================= 위치정보 (위치 breadcrumb) =================
  function crumbHtml(list) {
    return list.map(function (c, i) { return (i > 0 ? '<span class="topo-crumb-sep">&rsaquo;</span>' : '') + '<span class="topo-crumb">' + c + '</span>'; }).join('');
  }
  function locRow(label, locName) {
    return '<div class="topo-loc-row"><p class="topo-loc-label">' + label + '</p><div class="topo-crumbs">' + crumbHtml(LOC_BREADCRUMB[locName] || [locName]) + '</div></div>';
  }

  function renderZone(n) {
    let html = locRow(n.label + ' 위치', n.loc);
    if (n.type === 'UPS') {
      (UNIT_PDU[n.label] || []).forEach(function (p) { html += locRow(p + ' 위치', PDU_LOC[p]); });
      BATTERIES.filter(function (b) { return b.ups === n.label; }).forEach(function (b) { html += locRow(b.id + ' 위치', n.loc); });
    } else if (n.type === 'PDU') {
      UPS_LIST.filter(function (u) { return (UNIT_PDU[u] || []).indexOf(n.label) >= 0; }).forEach(function (u) { html += locRow(u + ' 위치', UPS_LOC[u]); });
      CHILLERS.filter(function (c) { return (UNIT_PDU[c.id] || []).indexOf(n.label) >= 0; }).forEach(function (c) { html += locRow(c.id + ' 위치', c.loc); });
    } else if (n.type === '칠러') {
      (UNIT_PDU[n.label] || []).forEach(function (p) { html += locRow(p + ' 위치', PDU_LOC[p]); });
    } else { // 배터리
      const b = BATTERIES.filter(function (x) { return x.id === n.label; })[0];
      if (b) html += locRow(b.ups + ' 위치', UPS_LOC[b.ups]);
    }
    document.getElementById('topoZoneContent').innerHTML = html;
  }

  // ================= 상세정보 =================
  // 각 설비관리 페이지(ups-list.js/pdu-list.js/chiller-list.js/battery-list.js)의 상세와
  // 필드 구성은 완전히 동일하되, 좌우 두 열로 나눠 보여준다 — 왼쪽은 기본정보(등록해 두면
  // 거의 안 바뀌는 스펙/설정값), 오른쪽은 변동정보(통신·운영상태처럼 실시간으로 바뀌는 값).
  function infoCols(basicHtml, liveHtml) {
    return '<div class="topo-info-cols"><div class="topo-info-col">' + basicHtml + '</div><div class="topo-info-col">' + liveHtml + '</div></div>';
  }
  function renderInfoUPS(r) {
    return infoCols(
      dvGroup(
          dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model)
          + dvRow('S/N', r.sn) + dvRow('용량', r.kva + ' kVA') + dvRow('설치일자', r.date)
          + dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port)
          + dvRow('Community', r.community) + dvRow('연결 G/W', r.gw)
          + dvRow('비고', r.memo || DASH, true)),
      dvGroup(
          dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last)
          + dvRow('운영상태', badge(OP_BADGE, r.op)) + dvRow('활성 알람', alarmsHtml(r.alarms), true)));
  }
  function renderInfoPDU(r) {
    return infoCols(
      dvGroup(
          dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model) + dvRow('S/N', r.sn)
          + dvRow('유형', r.kind) + dvRow('상', r.phase) + dvRow('아웃렛 수', r.outlet)
          + dvRow('정격전류', r.amp + ' A') + dvRow('정격전압', r.volt + ' V')
          + dvRow('상위전원', r.src) + dvRow('설치일자', r.date)
          + dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port)
          + dvRow('Community', r.community) + dvRow('연결 G/W', r.gw)
          + dvRow('비고', r.memo || DASH, true)),
      dvGroup(
          dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last)
          + dvRow('운영상태', badge(OP_BADGE, r.op)) + dvRow('활성 알람', alarmsHtml(r.alarms), true)));
  }
  function renderInfoCH(r) {
    return infoCols(
      dvGroup(
          dvRow('위치', r.loc) + dvRow('Vendor', r.vendor) + dvRow('모델명', r.model) + dvRow('S/N', r.sn)
          + dvRow('냉각능력', r.rt + ' RT') + dvRow('냉매종류', r.ref) + dvRow('설치일자', r.date)
          + dvRow('통신방식', r.comm) + dvRow('IP', r.ip) + dvRow('Port', r.port) + dvRow('연결 G/W', r.gw)
          + dvRow('비고', r.memo || DASH, true)),
      dvGroup(
          dvRow('통신상태', badge(LINK_BADGE, r.link)) + dvRow('최근 수신', r.last)
          + dvRow('운영상태', badge(OP_BADGE, r.op)) + dvRow('활성 알람', alarmsHtml(r.alarms), true)));
  }
  function renderInfoBAT(r) {
    const st = batStatusOf(r.soh);
    return infoCols(
      dvGroup(
          dvRow('소속 UPS', r.ups) + dvRow('위치', UPS_LOC[r.ups]) + dvRow('제조사', r.maker)
          + dvRow('종류', r.type) + dvRow('용량', r.cap + ' Ah') + dvRow('설치일자', r.date)
          + dvRow('비고', r.memo || DASH, true)),
      dvGroup(
          dvRow('SOH', r.soh + '%') + dvRow('상태', '<span class="badge ' + BAT_BADGE[st] + '">' + statusLabel('배터리', st) + '</span>')
          + dvRow('활성 알람', alarmsHtml(r.alarms), true)));
  }

  function renderInfo(id, n) {
    document.getElementById('topoInfoTitle').textContent = n.label + ' 상세';
    let body;
    if (n.type === 'UPS') body = renderInfoUPS(UPS_DATA[n.label]);
    else if (n.type === 'PDU') body = renderInfoPDU(PDU_DATA[n.label]);
    else if (n.type === '칠러') body = renderInfoCH(CH_DATA[n.label]);
    else body = renderInfoBAT(BAT_DATA[n.label]);
    document.getElementById('topoInfoRows').innerHTML = '<div class="dv">' + body + '</div>';
  }

  // ================= 선택 =================
  let currentId = null;

  function selectEntity(id) {
    const n = NODE_INDEX[id];
    if (!n) return;
    currentId = id;
    document.querySelectorAll('.topo-row.picked').forEach(function (el) { el.classList.remove('picked'); });
    document.querySelectorAll('.topo-row[data-node="' + id + '"]').forEach(function (el) { el.classList.add('picked'); });
    renderDiagram(buildLevels(n.type, n.label));
    renderZone(n);
    renderInfo(id, n);
  }

  // 캐럿 클릭 → 접기/펼치기, 행 클릭 → 우측 패널 갱신 (이벤트 위임, location-manage.js 와 동일한 방식)
  function initTreeEvents() {
    document.getElementById('topoTreeBody').addEventListener('click', function (e) {
      const caret = e.target.closest('.topo-caret[data-caret]');
      if (caret) {
        const id = caret.getAttribute('data-caret');
        if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
        renderTopology();
        return;
      }
      const row = e.target.closest('.topo-row[data-node]');
      if (row) selectEntity(row.getAttribute('data-node'));
    });
    document.getElementById('topoSearchBtn').addEventListener('click', topoSearchGo);
    document.getElementById('topoSearch').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') topoSearchGo();
    });
  }

  // ---- 초기화 ----
  renderKpi();
  initTreeEvents();
  renderTopology();

})();
