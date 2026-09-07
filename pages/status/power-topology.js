// 전력계통 페이지 스크립트 (목업 데이터, 읽기 전용)
// 화면: 설비현황 > 전력계통
// 구조 변경(소속 UPS 등)은 각 설비 등록화면에서 이루어지고, 이 화면은 그 관계를 트리 +
// (계통정보/배치정보/상세정보) 3단 패널로 보여주기만 한다.
(function () {

  const UPS_LOC = {
    'UPS-1F-A': '본사 IDC-1F', 'UPS-1F-B': '본사 IDC-1F', 'UPS-1F-C': '본사 IDC-1F',
    'UPS-2F-A': '본사 IDC-2F', 'UPS-2F-B': '본사 IDC-2F',
    'UPS-DR-1': '판교 DR센터', 'UPS-DR-2': '판교 DR센터',
  };
  const UPS_LIST = Object.keys(UPS_LOC);

  // 위치 관리(location-manage.js) 트리와 동일한 경로로 맞춘 위치별 breadcrumb
  const LOC_BREADCRUMB = {
    '본사 IDC-1F': ['본사', 'IDC동', '1F 전산실'],
    '본사 IDC-2F': ['본사', 'IDC동', '2F 전산실'],
    '판교 DR센터': ['판교 DR센터', 'DR 전산실'],
  };

  // UPS 관리(ups-list.js) DATA 전체(7건)와 운영상태(op)·알람을 한 건도 빠짐없이 동일하게 맞춤
  const UPS_STATUS = { 'UPS-1F-B': 'warn', 'UPS-2F-B': 'major', 'UPS-DR-2': 'crit' };
  const UPS_ALARMS = {
    'UPS-1F-B': ['출력 부하율 85% 초과 (경고)'],
    'UPS-2F-B': ['통신 두절', '배터리 스트링 전압 저하 (Major)'],
    'UPS-DR-2': ['배터리 룸 과온 (Critical)', 'UPS 바이패스 전환'],
  };

  // 전력분배장치(PDU): 위치당 여러 개. UPS/칠러는 이중화 등을 위해 PDU를 1개 이상 물 수 있다(다대다).
  const PDU_LIST = ['PDU-1F-1', 'PDU-1F-2', 'PDU-2F-1', 'PDU-2F-2', 'PDU-DR-1', 'PDU-DR-2'];
  const PDU_LOC = {
    'PDU-1F-1': '본사 IDC-1F', 'PDU-1F-2': '본사 IDC-1F',
    'PDU-2F-1': '본사 IDC-2F', 'PDU-2F-2': '본사 IDC-2F',
    'PDU-DR-1': '판교 DR센터', 'PDU-DR-2': '판교 DR센터',
  };
  // PDU 자체 상태(하위 UPS/칠러 상태와는 무관한 장치 자체 고장/과부하 등).
  const PDU_STATUS = { 'PDU-DR-2': 'warn', 'PDU-2F-2': 'crit' };
  const PDU_ALARMS = {
    'PDU-DR-2': ['주회로 차단기 과부하 경고'],
    'PDU-2F-2': ['주 차단기 과부하 트립 - 전원 공급 중단'],
  };
  // 설비(UPS/칠러) id -> 연결된 PDU id 배열. 2개면 이중화(양쪽 PDU에서 동시 수전).
  const UNIT_PDU = {
    'UPS-1F-A': ['PDU-1F-1'],
    'UPS-1F-B': ['PDU-1F-1', 'PDU-1F-2'],
    'UPS-1F-C': ['PDU-1F-2'],
    'UPS-2F-A': ['PDU-2F-1'],
    'UPS-2F-B': ['PDU-2F-1', 'PDU-2F-2'],
    'UPS-DR-1': ['PDU-DR-1'],
    'UPS-DR-2': ['PDU-DR-1', 'PDU-DR-2'],
    'CH-1F-01': ['PDU-1F-1'],
    'CH-1F-02': ['PDU-1F-2'],
    'CH-2F-01': ['PDU-2F-2'],
    'CH-DR-01': ['PDU-DR-2'],
  };

  const BATTERIES = [
    { id: 'BAT-1F-A-1', ups: 'UPS-1F-A' },
    { id: 'BAT-1F-B-1', ups: 'UPS-1F-B' },
    { id: 'BAT-1F-B-2', ups: 'UPS-1F-B' },
    { id: 'BAT-1F-C-1', ups: 'UPS-1F-C' },
    { id: 'BAT-2F-A-1', ups: 'UPS-2F-A' },
    { id: 'BAT-2F-B-1', ups: 'UPS-2F-B' },
    { id: 'BAT-2F-B-2', ups: 'UPS-2F-B' },
    { id: 'BAT-DR-1-1', ups: 'UPS-DR-1' },
    { id: 'BAT-DR-2-1', ups: 'UPS-DR-2' },
  ];
  // 배터리 관리(battery-list.js) 목업과 동일하게 SOH 기준 상태 맞춤
  const BAT_STATUS = { 'BAT-1F-B-2': 'warn', 'BAT-2F-B-2': 'crit' };
  const BAT_ALARMS = {
    'BAT-1F-B-2': ['방전 이력 잦음, 모니터링 필요 (경고)'],
    'BAT-2F-B-2': ['SOH 76.5% 저하 - 교체 필요 (위험)'],
  };

  const CHILLERS = [
    { id: 'CH-1F-01', loc: '본사 IDC-1F' },
    { id: 'CH-1F-02', loc: '본사 IDC-1F' },
    { id: 'CH-2F-01', loc: '본사 IDC-2F' },
    { id: 'CH-DR-01', loc: '판교 DR센터' },
  ];
  // 티켓(ticket-all.js)의 'CH-1F-01 응축기 압력 경고' 건과 동일하게 맞춤
  const CH_STATUS = { 'CH-1F-01': 'warn', 'CH-2F-01': 'crit' };
  const CH_ALARMS = {
    'CH-1F-01': ['응축기 압력 경고'],
    'CH-2F-01': ['냉각 시스템 정지 - 즉시 점검 필요'],
  };

  // 설비 종류마다 상태 단계 수·명칭이 다르다. UPS·배터리는 각 관리 화면(ups-list.js /
  // battery-list.js)의 실제 표기와 완전히 동일하게 맞췄다. PDU·칠러는 아직 별도 관리 화면이
  // 없어 그 화면이 생기기 전까지 쓸 잠정값이다 — 화면이 생기면 그 표기에 맞춰 갱신할 것.
  const STATUS_LABELS = {
    UPS:  { ok: '정상', warn: '경고', major: 'Major', crit: 'Critical' },  // ups-list.js OP_BADGE 그대로
    배터리: { ok: '정상', warn: '경고', crit: '교체필요' },                   // battery-list.js STATUS_LABEL 그대로
    PDU:  { ok: '정상', warn: '경고', crit: '심각' },                       // 잠정 — PDU 관리 화면 생기면 맞출 것
    칠러:  { ok: '정상', warn: '경고', crit: '심각' },                       // 잠정 — 칠러 관리 화면 생기면 맞출 것
  };
  function statusLabel(type, s) {
    const map = STATUS_LABELS[type] || STATUS_LABELS.PDU;
    return map[s] || s;
  }
  // 화면에 보여줄 설비 종류 이름. PDU는 "분전반"이 아니라 "전력분배장치"가 맞는 명칭이다.
  const TYPE_LABEL = { UPS: 'UPS', PDU: '전력분배장치', 칠러: '칠러', 배터리: '배터리' };
  function statusColor(s) {
    return s === 'crit' ? '#c62828' : s === 'major' ? '#d84315' : s === 'warn' ? '#b76e00' : '#1e7e34';
  }

  // ---- 노드 상세/관리화면 링크 조회용 인덱스 ----
  const NODE_INDEX = {};
  function registerNode(id, data) { NODE_INDEX[id] = data; }

  function dot(status) { return status ? '<span class="topo-dot ' + status + '"></span>' : ''; }

  // ================= KPI =================
  function renderKpi() {
    const groups = [
      { label: '전력분배장치(PDU)', type: 'PDU', ids: PDU_LIST, statusOf: function (id) { return PDU_STATUS[id] || 'ok'; } },
      { label: 'UPS', type: 'UPS', ids: UPS_LIST, statusOf: function (id) { return UPS_STATUS[id] || 'ok'; } },
      { label: '배터리', type: '배터리', ids: BATTERIES.map(function (b) { return b.id; }), statusOf: function (id) { return BAT_STATUS[id] || 'ok'; } },
      { label: '칠러', type: '칠러', ids: CHILLERS.map(function (c) { return c.id; }), statusOf: function (id) { return CH_STATUS[id] || 'ok'; } },
    ];
    document.getElementById('topoKpiGrid').innerHTML = groups.map(function (g) {
      const counts = {};
      g.ids.forEach(function (id) { const s = g.statusOf(id); counts[s] = (counts[s] || 0) + 1; });
      let acc = 0;
      const gradientParts = [];
      const rows = ['ok', 'warn', 'major', 'crit'].filter(function (s) { return counts[s]; }).map(function (s) {
        const pct = (counts[s] / g.ids.length) * 100;
        gradientParts.push(statusColor(s) + ' ' + acc + '% ' + (acc + pct) + '%');
        acc += pct;
        return '<div class="topo-kpi-stat">' + dot(s) + '<span>' + statusLabel(g.type, s) + '</span><b>' + counts[s] + '</b></div>';
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
    const status = (isUps ? UPS_STATUS[u] : CH_STATUS[u]) || 'ok';
    const dual = pduCount > 1;
    const sub = kind + (dual ? ' · 급전 ' + pduIdx + '/' + pduCount : '');

    if (!NODE_INDEX[id]) {
      registerNode(id, {
        type: kind, label: u, loc: loc, status: status,
        mgmt: isUps ? '../facility/ups-list.html' : '../facility/chiller-list.html',
        alarms: (isUps ? UPS_ALARMS[u] : CH_ALARMS[u]) || [],
      });
    }

    let children = [];
    if (isUps) {
      children = BATTERIES.filter(function (b) { return b.ups === u; }).map(function (b) {
        const bid = 'bat:' + b.id;
        const bst = BAT_STATUS[b.id] || 'ok';
        registerNode(bid, { type: '배터리', label: b.id, loc: loc, status: bst, mgmt: '../facility/battery-list.html', alarms: BAT_ALARMS[b.id] || [] });
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
      const pduStatus = PDU_STATUS[pduId] || 'ok';
      registerNode('pdu:' + pduId, { type: 'PDU', label: pduId, loc: PDU_LOC[pduId], status: pduStatus, mgmt: '../facility/pdu-list.html', alarms: PDU_ALARMS[pduId] || [] });
      return { id: 'pdu:' + pduId, label: pduId, sub: '전력분배장치', status: pduStatus, clickable: true, children: children };
    });

    document.getElementById('topoTreeBody').innerHTML = pduNodes.map(function (n) { return renderRow(n, 0); }).join('');

    if (!currentId || !NODE_INDEX[currentId]) {
      selectEntity(Object.keys(NODE_INDEX)[0]);
    } else {
      selectEntity(currentId);
    }
  }

  // ================= 계통정보 (선택 설비 주변 미니 다이어그램) =================
  function pduBox(pduId) { return { id: 'pdu:' + pduId, label: pduId, status: PDU_STATUS[pduId] || 'ok' }; }
  function upsBox(u) { return { id: 'ups:' + u, label: u, status: UPS_STATUS[u] || 'ok' }; }
  function chBox(c) { return { id: 'ch:' + c, label: c, status: CH_STATUS[c] || 'ok' }; }
  function batBox(b) { return { id: 'bat:' + b, label: b, status: BAT_STATUS[b] || 'ok' }; }

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
    html += '<svg class="topo-diagram-svg" id="topoDiagramSvg"></svg>';
    inner.innerHTML = html;

    const svg = document.getElementById('topoDiagramSvg');
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
    svg.innerHTML = lines;
    svg.setAttribute('width', inner.scrollWidth);
    svg.setAttribute('height', inner.scrollHeight);
  }

  // ================= 배치정보 (위치 breadcrumb) =================
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
  function renderInfo(id, n) {
    document.getElementById('topoInfoTitle').textContent = n.label;
    const badge = document.getElementById('topoInfoStatus');
    badge.textContent = statusLabel(n.type, n.status);
    badge.className = 'topo-status-badge ' + n.status;

    const rows = [['구분', TYPE_LABEL[n.type] || n.type], ['위치', n.loc]];
    if (n.type === 'UPS') {
      const pduIds = UNIT_PDU[n.label] || [];
      rows.push(['연결 전력분배장치', pduIds.join(', ') + (pduIds.length > 1 ? ' (이중수전)' : ' (단독수전)')]);
    } else if (n.type === 'PDU') {
      const connected = UPS_LIST.filter(function (u) { return (UNIT_PDU[u] || []).indexOf(n.label) >= 0; })
        .concat(CHILLERS.filter(function (c) { return (UNIT_PDU[c.id] || []).indexOf(n.label) >= 0; }).map(function (c) { return c.id; }));
      rows.push(['연결 설비 수', connected.length + '개']);
      rows.push(['연결 설비', connected.join(', ') || '-']);
    } else if (n.type === '칠러') {
      rows.push(['연결 전력분배장치', (UNIT_PDU[n.label] || []).join(', ') || '-']);
    } else { // 배터리
      const b = BATTERIES.filter(function (x) { return x.id === n.label; })[0];
      rows.push(['소속 UPS', b ? b.ups : '-']);
    }

    const alarms = n.alarms || [];
    document.getElementById('topoInfoRows').innerHTML = rows.map(function (r) {
      return '<div class="topo-info-row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join('')
      + '<div class="topo-alarm-block"><p class="topo-loc-label">활성 알람</p>'
      + (alarms.length ? '<ul>' + alarms.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>' : '<span style="color:#98a2b3;font-size:12px;">없음</span>')
      + '</div>';

    const battEl = document.getElementById('topoBatterySection');
    if (n.type === 'UPS') {
      const batts = BATTERIES.filter(function (b) { return b.ups === n.label; });
      battEl.innerHTML = '<p class="topo-loc-label" style="margin-top:12px;">배터리 구성 (' + batts.length + '개)</p>'
        + '<div class="topo-batt-grid">' + batts.map(function (b) {
            const st = BAT_STATUS[b.id] || 'ok';
            return '<div class="topo-batt-card ' + st + '"><p class="topo-batt-name">' + b.id + '</p>'
              + '<div class="topo-batt-val"><span>상태</span><span>' + statusLabel('배터리', st) + '</span></div></div>';
          }).join('') + '</div>';
    } else {
      battEl.innerHTML = '';
    }

    document.getElementById('topoMgmtLink').href = n.mgmt || '#';
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
  }

  // ---- 초기화 ----
  renderKpi();
  initTreeEvents();
  renderTopology();

})();
