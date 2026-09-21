// UMS 홈 대시보드 (목업). window.umsRole (host/customer) 로 위젯 세트를 분기.
// 레이아웃 편집: 우상단 토글 → 위젯 드래그 재배치 / ✕ 로 빼기 / 하단 목록에서 다시 넣기.
// 저장은 localStorage(ums.dash.v2.<role>). 차트는 라이브러리 없이 인라인 SVG.
(function () {

  const ROLE = window.umsRole || 'host';
  const dash = document.getElementById('dash');
  const LS_KEY = 'ums.dash.v4.' + ROLE;  // 위젯 구성 변경(4:2 나란히 배치) 시 버전 올려 옛 저장본 폐기

  // ===== 유틸 =====
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function elx(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function dGo(key) { const h = 'pages/' + key + '.html'; location.href = (window.umsLink ? window.umsLink(h) : h); }
  window.dGo = dGo;

  function countUp(node, to, unit) {
    const uc = node.classList.contains('kpi-card-value') ? 'unit' : 'u';
    const dur = 600, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      node.innerHTML = Math.round(to * (1 - Math.pow(1 - p, 3))) + (unit ? '<span class="' + uc + '">' + unit + '</span>' : '');
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  // ===== SVG 차트 =====
  function donut(segs, centerV, centerL) {
    const R = 52, r = 34, cx = 60, cy = 60;
    const total = segs.reduce(function (a, s) { return a + s.value; }, 0);
    const nz = segs.filter(function (s) { return s.value > 0; });
    let body = '';
    if (total === 0) body = '<circle cx="60" cy="60" r="43" fill="none" stroke="#eef1f4" stroke-width="18"/>';
    else if (nz.length === 1) body = '<circle cx="60" cy="60" r="43" fill="none" stroke="' + nz[0].color + '" stroke-width="18"/>';
    else {
      let a0 = -Math.PI / 2;
      segs.forEach(function (s) {
        if (s.value <= 0) return;
        const a1 = a0 + (s.value / total) * Math.PI * 2;
        const lg = (a1 - a0) > Math.PI ? 1 : 0;
        const x1 = cx + R * Math.cos(a0), y1 = cy + R * Math.sin(a0), x2 = cx + R * Math.cos(a1), y2 = cy + R * Math.sin(a1);
        const x3 = cx + r * Math.cos(a1), y3 = cy + r * Math.sin(a1), x4 = cx + r * Math.cos(a0), y4 = cy + r * Math.sin(a0);
        body += '<path d="M' + x1 + ' ' + y1 + ' A' + R + ' ' + R + ' 0 ' + lg + ' 1 ' + x2 + ' ' + y2
          + ' L' + x3 + ' ' + y3 + ' A' + r + ' ' + r + ' 0 ' + lg + ' 0 ' + x4 + ' ' + y4 + ' Z" fill="' + s.color + '"/>';
        a0 = a1;
      });
    }
    return '<svg viewBox="0 0 120 120">' + body
      + '<text x="60" y="' + (centerL ? 56 : 64) + '" text-anchor="middle" font-size="22" font-weight="bold" fill="#14213d">' + centerV + '</text>'
      + (centerL ? '<text x="60" y="72" text-anchor="middle" font-size="10" fill="#8a929c">' + centerL + '</text>' : '') + '</svg>';
  }
  function legend(segs) {
    return '<div class="d-legend">' + segs.map(function (s) {
      return '<div class="li"><span class="sw" style="background:' + s.color + '"></span>' + s.label + '<span class="n">' + s.value + '</span></div>';
    }).join('') + '</div>';
  }
  function spark(vals, color) {
    const W = 100, H = 30, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), sp = (mx - mn) || 1;
    const pts = vals.map(function (v, i) { return [(W * i) / (vals.length - 1), H - 3 - (H - 6) * (v - mn) / sp]; });
    const line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 100 30" preserveAspectRatio="none">'
      + '<path d="' + line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z" fill="' + color + '" opacity="0.12"/>'
      + '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function bars(labels, series) {
    const W = 320, H = 130, padL = 6, padB = 18, padT = 6, n = labels.length, groups = series.length;
    const all = []; series.forEach(function (s) { s.vals.forEach(function (v) { all.push(v); }); });
    const mx = Math.max.apply(null, all) || 1, gw = (W - padL * 2) / n, bw = Math.min(14, (gw - 6) / groups);
    let body = '';
    for (let g = 0; g < 4; g++) { const y = padT + (H - padT - padB) * g / 3; body += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padL) + '" y2="' + y + '" stroke="#eef1f4"/>'; }
    labels.forEach(function (lb, i) {
      const gx = padL + gw * i + (gw - bw * groups) / 2;
      series.forEach(function (s, si) {
        const h = (H - padT - padB) * s.vals[i] / mx;
        body += '<rect x="' + (gx + bw * si) + '" y="' + (H - padB - h) + '" width="' + (bw - 2) + '" height="' + Math.max(0, h) + '" rx="2" fill="' + s.color + '"/>';
      });
      body += '<text x="' + (padL + gw * i + gw / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="9" fill="#98a2b3">' + lb + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '">' + body + '</svg>';
  }
  function stackBar(parts) {
    return '<div class="d-stack-bar">' + parts.filter(function (p) { return p.value > 0; }).map(function (p) {
      return '<span style="flex:' + p.value + ';background:' + p.color + '" title="' + p.label + ' ' + p.value + '"></span>';
    }).join('') + '</div>';
  }

  const SC = { ok: '#27ae60', warn: '#e08a1e', major: '#e74c3c', crit: '#c0392b', off: '#98a2b3', unknown: '#c7ccd3' };

  // ===== 카드 조각 =====
  function cardEl(col, html) { return elx('div', 'd-card ' + col, html); }
  // 카드 안 '제목 글자' 만 클릭 링크로 (카드 전체가 아님). 편집 모드에선 dNav 가 이동을 막음.
  function tLink(title, key) {
    return key ? '<span class="d-t-lnk" onclick="dNav(\'' + key + '\')">' + title + '</span>' : title;
  }
  // 카드 '전체' 가 클릭되는 경우 (한 카드=한 숫자인 KPI 류). 테두리/그림자 강조 없이 커서만.
  function clickCard(col, html, key) {
    const c = cardEl(col + ' d-linkable', html);
    c.setAttribute('onclick', "dNav('" + key + "')");
    return c;
  }
  function kpiHtml(label, value, unit, deltaTxt, deltaCls, sparkVals, sparkColor, key) {
    return '<div class="d-card-t">' + tLink(label, key) + '</div>'
      + '<div class="d-kpi-row"><div class="d-kpi-val" data-to="' + value + '" data-u="' + (unit || '') + '">0</div>'
      + (deltaTxt ? '<span class="d-delta ' + deltaCls + '">' + deltaTxt + '</span>' : '') + '</div>'
      + '<div class="d-spark">' + spark(sparkVals, sparkColor) + '</div>';
  }
  function donutHtml(title, segs, cv, cl, key) {
    return '<div class="d-card-t">' + tLink(title, key) + '</div><div class="d-donut-wrap"><div class="d-donut">' + donut(segs, cv, cl) + '</div>' + legend(segs) + '</div>';
  }
  // KPI 셀 묶음 — N개 셀을 한 줄에 균등 배치.
  // cells: [{ l:라벨, v:값, p:퍼센트(문자열, 없으면 생략), tone:개념 톤, key:클릭 이동 }]
  //   tone: open(중심·무겁게) / unassigned(경고성) / assigned(차분·중립) / progress(활기) / done(마무리) / overdue(생뚱맞게 튐) / gwoff·gwwarn(GW 이상)
  function tkCellsHtml(cells) {
    return '<div class="d-tk-strip">' + cells.map(function (c) {
      return '<div class="d-tk-cell tk-' + c.tone + (c.key ? ' d-linkable" onclick="dNav(\'' + c.key + '\')' : '') + '">'
        + '<div class="tv">' + c.v + (c.p != null ? '<span class="tp"> (' + c.p + '%)</span>' : '') + '</div>'
        + '<div class="tl">' + c.l + '</div></div>';
    }).join('') + '</div>';
  }
  // 헤딩 없이 셀만 (카드 하나 = 한 dg-item, 레이아웃에서 통째로 이동)
  function tkStrip(cells) { return cardEl('col-12 d-tk-card', tkCellsHtml(cells)); }
  // 헤딩 + 셀을 한 위젯으로 묶음 (섹션 제목까지 같이 레이아웃에서 이동)
  function tkSection(title, titleKey, cells) {
    const head = '<span class="dash-sec-bar"></span><span class="dash-sec-title' + (titleKey ? ' d-t-lnk' : '') + '"'
      + (titleKey ? ' onclick="dNav(\'' + titleKey + '\')"' : '') + '>' + title + '</span>';
    return elx('div', 'col-12 d-tk-card', '<div class="dg-header" style="padding:4px 0 10px;">' + head + '</div>' + tkCellsHtml(cells));
  }
  // 헤딩 + 심각도(sev) 카드들을 한 위젯으로 묶음 (알람 현황용). sevs: [{sev,label,val,key}]
  function sevSection(title, titleKey, sevs) {
    const head = '<span class="dash-sec-bar"></span><span class="dash-sec-title' + (titleKey ? ' d-t-lnk' : '') + '"'
      + (titleKey ? ' onclick="dNav(\'' + titleKey + '\')"' : '') + '>' + title + '</span>';
    const wrap = elx('div', 'col-12 d-tk-card', '<div class="dg-header" style="padding:4px 0 10px;">' + head + '</div><div class="d-sev-row"></div>');
    const row = wrap.querySelector('.d-sev-row');
    sevs.forEach(function (s) {
      const c = sevCard(s.sev, s.label, s.val, s.key);
      c.classList.remove('col-3');
      row.appendChild(c);
    });
    return wrap;
  }
  function chartHtml(title, svg, key) { return '<div class="d-card-t">' + tLink(title, key) + '</div><div class="d-chart">' + svg + '</div>'; }
  function listHtml(title, rows, key) {
    return '<div class="d-card-t">' + tLink(title, key) + '</div>'
      + '<div class="d-list">' + (rows.length ? rows.join('') : '<div class="d-list-empty">해당 항목 없음</div>') + '</div>';
  }
  // key 가 있으면 섹션 '제목 글자' 만 클릭 이동 (헤더 전체 아님, 별도 '더보기' 글자 없음)
  function headerEl(title, key) {
    return elx('div', 'col-12 dg-header',
      '<span class="dash-sec-bar"></span><span class="dash-sec-title' + (key ? ' d-t-lnk' : '') + '"'
      + (key ? ' onclick="dNav(\'' + key + '\')"' : '') + '>' + title + '</span>');
  }

  // ============================================================
  //  위젯 레지스트리
  // ============================================================
  // --- 호스트 목업 ---
  const H = {
    // 오픈 = 미할당 + 진행대기 + 진행중 (종료 제외). open 은 아래에서 계산.
    // 기한초과: 종료건은 완료시각 기준(CompletedAt > DueDate), 미종료건은 현재시각 기준(now > DueDate). 목업은 합계만.
    TK: { unassigned: 5, pending: 3, progress: 4, done: 12, overdue: 3 },
    unassigned: [
      { t: 'GW-DR-02 서버 응답 없음', ten: '대한IDC', pri: 'critical', ago: '12분' },
      { t: 'UPS-2F-B 통신 두절', ten: '세종클라우드', pri: 'major', ago: '38분' },
      { t: 'PDU-1F-C 출력 전류 이상', ten: '한빛전산', pri: 'minor', ago: '1시간' },
      { t: 'CH-2F-02 냉수 유량 저하', ten: '세종클라우드', pri: 'warning', ago: '2시간' },
      { t: 'BAT-1F-01 셀 온도 상승', ten: '미래테크', pri: 'major', ago: '3시간' },
    ],
    GW: [
      { ten: '세종클라우드', name: 'GW-IDC-01', on: true, cpu: 41, mem: 62, disk: 55, buf: 0, last: '방금' },
      { ten: '세종클라우드', name: 'GW-IDC-02', on: true, cpu: 88, mem: 74, disk: 91, buf: 320, last: '방금' },
      { ten: '세종클라우드', name: 'GW-DR-01', on: true, cpu: 33, mem: 48, disk: 40, buf: 0, last: '1분 전' },
      { ten: '대한IDC', name: 'GW-DR-02', on: false, cpu: 0, mem: 0, disk: 0, buf: 0, last: '12분 전' },
      { ten: '대한IDC', name: 'GW-A-01', on: true, cpu: 52, mem: 55, disk: 63, buf: 0, last: '방금' },
      { ten: '한빛전산', name: 'GW-01', on: true, cpu: 47, mem: 91, disk: 72, buf: 1400, last: '방금' },
      { ten: '한빛전산', name: 'GW-02', on: false, cpu: 0, mem: 0, disk: 0, buf: 0, last: '2시간 전' },
      { ten: '미래테크', name: 'GW-MAIN', on: true, cpu: 29, mem: 44, disk: 38, buf: 0, last: '방금' },
      { ten: '미래테크', name: 'GW-SUB', on: false, cpu: 0, mem: 0, disk: 0, buf: 0, last: '5분 전' },
    ],
    TEN: { active: 12, newThisMonth: 2, expiringSoon: 3, pendingReq: 4 },
    edSeg: [{ label: 'Basic', value: 5, color: '#98a2b3' }, { label: 'Standard', value: 6, color: '#1a6ed8' }, { label: 'Pro', value: 3, color: '#7c4dff' }],
    expiring: [{ name: '한빛전산', ed: 'Standard', d: 8 }, { name: '미래테크', ed: 'Pro', d: 19 }, { name: '가온데이터', ed: 'Basic', d: 27 }],
    HAL: [
      { sev: 'crit', ten: '대한IDC', fac: 'GW-DR-02', name: 'GW 서버 응답 없음 (SYSTEM)', at: '2026-09-09 09:41:12', h: '미확인' },
      { sev: 'crit', ten: '세종클라우드', fac: 'UPS-2F-B', name: '출력전압 상하한 초과', at: '2026-09-09 09:33:40', h: '미확인' },
      { sev: 'major', ten: '한빛전산', fac: 'PDU-1F-01', name: '분기전류 정격 90% 초과', at: '2026-09-09 09:18:47', h: '확인' },
      { sev: 'major', ten: '세종클라우드', fac: 'CH-2F-01', name: '압축기 트립', at: '2026-09-09 08:57:03', h: '미확인' },
      { sev: 'minor', ten: '미래테크', fac: 'BAT-1F-01', name: '셀 온도 상승', at: '2026-09-09 08:41:20', h: '조치완료' },
      { sev: 'major', ten: '세종클라우드', fac: 'UPS-2F-B', name: 'On Battery (DEVICE)', at: '2026-09-09 08:12:22', h: '확인' },
      { sev: 'warn', ten: '한빛전산', fac: 'UPS-1F-A', name: '출력 부하율 85% 초과', at: '2026-09-09 07:55:31', h: '미확인' },
      { sev: 'minor', ten: '대한IDC', fac: 'PDU-A-03', name: '입력전압 변동', at: '2026-09-09 07:20:10', h: '조치완료' },
      { sev: 'major', ten: '미래테크', fac: 'CH-MAIN', name: '냉수 유량 저하', at: '2026-09-09 06:48:55', h: '확인' },
      { sev: 'crit', ten: '세종클라우드', fac: 'BAT-1F-A-01', name: '셀 온도 임계 초과', at: '2026-09-09 06:15:02', h: '조치완료' },
      { sev: 'warn', ten: '한빛전산', fac: 'CH-01', name: '냉수 출구온도 12℃ 초과', at: '2026-09-09 05:40:18', h: '조치완료' },
      { sev: 'minor', ten: '세종클라우드', fac: 'PDU-1F-02', name: '분기전류 경고', at: '2026-09-09 04:33:47', h: '확인' },
      { sev: 'major', ten: '대한IDC', fac: 'UPS-DR-1', name: 'Bypass 전환 (DEVICE)', at: '2026-09-09 03:11:29', h: '조치완료' },
      { sev: 'warn', ten: '미래테크', fac: 'GW-SUB', name: 'HEARTBEAT 지연', at: '2026-09-09 02:50:40', h: '미확인' },
      { sev: 'minor', ten: '한빛전산', fac: 'BAT-2F-01', name: 'SOH 80% 미만', at: '2026-09-08 23:18:05', h: '조치완료' },
      { sev: 'major', ten: '세종클라우드', fac: 'CH-1F-01', name: '응축기 압력 경고', at: '2026-09-08 21:02:14', h: '확인' },
      { sev: 'crit', ten: '대한IDC', fac: 'BAT-DR-02', name: '배터리 스트링 전압 저하', at: '2026-09-08 19:44:37', h: '조치완료' },
      { sev: 'minor', ten: '미래테크', fac: 'PDU-MAIN-01', name: '온도 센서 이상', at: '2026-09-08 17:33:51', h: '조치완료' },
      { sev: 'warn', ten: '세종클라우드', fac: 'UPS-1F-B', name: '출력 부하율 경고', at: '2026-09-08 15:10:26', h: '조치완료' },
      { sev: 'major', ten: '한빛전산', fac: 'GW-01', name: '미전송 버퍼 적체', at: '2026-09-08 13:05:09', h: '확인' },
    ],
  };
  H.TK.open = H.TK.unassigned + H.TK.pending + H.TK.progress;
  H.gwOn = H.GW.filter(function (g) { return g.on; }).length;
  H.gwOff = H.GW.length - H.gwOn;
  H.resHigh = H.GW.filter(function (g) { return g.on && (g.cpu >= 85 || g.mem >= 85 || g.disk >= 85 || g.buf >= 1000); });
  H.offGW = H.GW.filter(function (g) { return !g.on; });

  // --- 고객 목업 ---
  const C = {
    TK: { unassigned: 2, pending: 4, progress: 5, done: 9, overdue: 1 },
    FAC: [
      { type: 'UPS', ok: 5, warn: 1, major: 0, crit: 1, off: 0, unk: 0 },
      { type: 'PDU', ok: 4, warn: 1, major: 0, crit: 0, off: 1, unk: 0 },
      { type: '칠러', ok: 3, warn: 1, major: 1, crit: 0, off: 0, unk: 1 },
      { type: '배터리', ok: 9, warn: 2, major: 0, crit: 1, off: 0, unk: 2 },
    ],
    AL: { critical: 1, major: 2, minor: 1, warning: 0 },
    alRecent: [
      { sev: 'crit', fac: 'UPS-2F-B', name: '출력전압 상하한 초과', ago: '8분' },
      { sev: 'major', fac: 'CH-2F-01', name: '압축기 트립', ago: '25분' },
      { sev: 'major', fac: 'BAT-1F-A-01', name: '셀 온도 초과', ago: '41분' },
      { sev: 'minor', fac: 'PDU-1F-01', name: '분기전류 경고', ago: '1시간' },
    ],
    al7: [2, 1, 3, 0, 2, 4, 3],
    upsLoad: 62, upsLoad7: [58, 60, 63, 61, 64, 62, 62],
    batMinSoh: 78, batReplace: 1, chwOut: 7.2, chwAbn: false,
    gwOn: 4, gwOff: 1, gwResHigh: 1,
  };
  C.facTotal = C.FAC.reduce(function (a, f) { return a + f.ok + f.warn + f.major + f.crit + f.off + f.unk; }, 0);
  C.facOff = C.FAC.reduce(function (a, f) { return a + f.off; }, 0);
  C.facUnknown = C.FAC.reduce(function (a, f) { return a + f.unk; }, 0);  // GW 다운 등으로 상태 확인 불가
  const D7 = ['월', '화', '수', '목', '금', '토', '일'];
  const TENANT = window.umsTenantName || '세종클라우드';

  function priBadge(p) { return '<span class="pri-badge pri-' + p + '">' + p.slice(0, 3).toUpperCase() + '</span>'; }
  function alBadge(sev) { return sev === 'crit' ? 'badge-crit' : sev === 'major' ? 'badge-major' : sev === 'minor' ? 'badge-minor' : 'badge-warn'; }
  function alLabel(sev) { return sev === 'crit' ? 'Critical' : sev === 'major' ? 'Major' : sev === 'minor' ? 'Minor' : 'Warning'; }
  function stByH(h) { return h === '미확인' ? 'status-pending' : h === '확인' ? 'status-progress' : 'status-done'; }

  // 각 위젯: { title, col, el() -> DOM }
  const WIDGETS = {
    // ---------- 호스트 ----------
    'h-tk-kpis': {
      host: 1, title: '─ 티켓 현황 + KPI (헤딩+5칸 묶음, 4:2 중 4)', col: 8, el: function () {
        const t = H.TK, base = t.open || 1;
        const pc = function (v) { return (v / base * 100).toFixed(1); };
        return tkSection('티켓 현황', 'ticket/ticket-all', [
          { l: '오픈 티켓', v: t.open, p: pc(t.open), tone: 'open', key: 'ticket/ticket-all' },
          { l: '할당되지 않은 티켓', v: t.unassigned, p: pc(t.unassigned), tone: 'unassigned', key: 'ticket/ticket-all' },
          { l: '진행 대기 중 티켓', v: t.pending, p: pc(t.pending), tone: 'assigned', key: 'ticket/ticket-all' },
          { l: '진행 중 티켓', v: t.progress, p: pc(t.progress), tone: 'progress', key: 'ticket/ticket-all' },
          { l: '기한이 지난 티켓', v: t.overdue, tone: 'overdue', key: 'ticket/ticket-all' },
        ]);
      }
    },
    'h-gw-quick': {
      host: 1, title: '─ GW 현황 (헤딩+2칸 묶음, 4:2 중 2)', col: 4, el: function () {
        return tkSection('GW 현황', null, [
          { l: 'GW 단절', v: H.gwOff, tone: 'gwoff', key: 'gw/gw-status-host' },
          { l: 'GW 서버 경고', v: H.resHigh.length, tone: 'gwwarn', key: 'gw/gw-server-host' },
        ]);
      }
    },
    'h-tk-donut': {
      host: 1, title: '티켓 상태 분포', col: 6, el: function () {
        return cardEl('col-6', donutHtml('티켓 상태 분포',
          [{ label: '대기중', value: H.TK.open - H.TK.progress, color: '#8a929c' }, { label: '진행중', value: H.TK.progress, color: '#1a6ed8' }, { label: '완료', value: H.TK.done, color: '#27ae60' }],
          H.TK.open + H.TK.done, '전체'));
      }
    },
    'h-tk-unassigned-list': {
      host: 1, title: '미할당 티켓 목록', col: 6, el: function () {
        return cardEl('col-6', listHtml('미할당 티켓', H.unassigned.map(function (r) {
          return '<div class="d-list-row">' + priBadge(r.pri) + '<span class="grow">' + esc(r.t) + '</span><span class="d-tenant">' + r.ten + '</span><span class="muted">' + r.ago + ' 전</span></div>';
        }), 'ticket/ticket-unassigned'));
      }
    },
    'h-hd-gw': { host: 1, title: '─ GW 헬스 (제목)', col: 12, el: function () { return headerEl('GW 헬스', 'gw/gw-status-host'); } },
    'h-gw-donut': {
      host: 1, title: 'GW 연결 상태', col: 4, el: function () {
        return cardEl('col-4', donutHtml('GW 연결 상태', [{ label: '온라인', value: H.gwOn, color: '#27ae60' }, { label: '오프라인', value: H.gwOff, color: '#c0392b' }], H.GW.length, 'GW', 'gw/gw-status-host'));
      }
    },
    'h-gw-offline': {
      host: 1, title: '오프라인 GW', col: 4, el: function () {
        return cardEl('col-4', listHtml('오프라인 GW', H.offGW.map(function (g) {
          return '<div class="d-list-row"><span class="dot dot-bad" style="width:8px;height:8px;border-radius:50%"></span><span class="grow">' + g.name + '</span><span class="d-tenant">' + g.ten + '</span><span class="muted">' + g.last + '</span></div>';
        }), 'gw/gw-status-host'));
      }
    },
    'h-gw-res': {
      host: 1, title: '리소스 경고 GW', col: 4, el: function () {
        return cardEl('col-4', listHtml('리소스 경고 GW', H.resHigh.map(function (g) {
          const w = Math.max(g.cpu, g.mem, g.disk), lb = g.cpu === w ? 'CPU' : g.mem === w ? 'MEM' : 'DISK', col = w >= 90 ? SC.crit : SC.warn;
          return '<div class="d-list-row"><span class="grow">' + g.name + '</span><span class="d-tenant">' + g.ten + '</span><span class="muted" style="color:' + col + ';font-weight:bold">' + lb + ' ' + w + '%</span></div>';
        }), 'gw/gw-server-host'));
      }
    },
    'h-hd-tenant': { host: 1, title: '─ 테넌트/구독 (제목)', col: 12, el: function () { return headerEl('테넌트 / 구독', 'saas/tenant'); } },
    'h-tn-active': { host: 1, title: '활성 테넌트(KPI)', col: 3, el: function () { return clickCard('col-3 d-kpi', kpiHtml('활성 테넌트', H.TEN.active, '', '▲ 2', 'up', [9, 10, 10, 11, 11, 12, 12], '#1a6ed8'), 'saas/tenant'); } },
    'h-tn-new': { host: 1, title: '이번 달 신규(KPI)', col: 3, el: function () { return clickCard('col-3 d-kpi', kpiHtml('이번 달 신규', H.TEN.newThisMonth, '', '', 'flat', [0, 1, 1, 1, 2, 2, 2], '#27ae60'), 'saas/tenant'); } },
    'h-tn-expiring': { host: 1, title: '만료 임박(KPI)', col: 3, el: function () { return clickCard('col-3 d-kpi', kpiHtml('만료 임박(30일)', H.TEN.expiringSoon, '', '▲ 1', 'up', [1, 1, 2, 2, 2, 3, 3], '#e08a1e'), 'saas/tenant'); } },
    'h-tn-req': { host: 1, title: '미처리 구독요청(KPI)', col: 3, el: function () { return clickCard('col-3 d-kpi', kpiHtml('미처리 구독요청', H.TEN.pendingReq, '', '▲ 2', 'up', [1, 2, 2, 3, 3, 3, 4], '#c0392b'), 'saas/subscribe-request'); } },
    'h-tn-edition': { host: 1, title: '에디션 분포', col: 6, el: function () { return cardEl('col-6', donutHtml('에디션 분포', H.edSeg, H.edSeg.reduce(function (a, s) { return a + s.value; }, 0), '테넌트')); } },
    'h-tn-expiring-list': {
      host: 1, title: '구독 만료 임박 목록', col: 6, el: function () {
        return cardEl('col-6', listHtml('구독 만료 임박', H.expiring.map(function (t) {
          const col = t.d <= 10 ? SC.crit : t.d <= 20 ? SC.warn : '#8a929c';
          return '<div class="d-list-row"><span class="grow">' + t.name + '</span><span class="d-tenant">' + t.ed + '</span><span class="muted" style="color:' + col + ';font-weight:bold">D-' + t.d + '</span></div>';
        }), 'saas/tenant'));
      }
    },
    'h-alarm-table': { host: 1, title: '─ 알람 목록 + 표 (헤딩 묶음)', col: 12, el: buildAlarmTable },

    // ---------- 고객 ----------
    'c-al-summary': {
      cust: 1, title: '─ 알람 현황 + 심각도 4칸 (헤딩 묶음, 4:2 중 4)', col: 8, el: function () {
        return sevSection('알람 현황', 'alarm/alarm-manage', [
          { sev: 'critical', label: 'Critical', val: C.AL.critical, key: 'alarm/alarm-manage' },
          { sev: 'major', label: 'Major', val: C.AL.major, key: 'alarm/alarm-manage' },
          { sev: 'minor', label: 'Minor', val: C.AL.minor, key: 'alarm/alarm-manage' },
          { sev: 'warning', label: 'Warning', val: C.AL.warning, key: 'alarm/alarm-manage' },
        ]);
      }
    },
    'c-gw-quick': {
      cust: 1, title: '─ GW 현황 (헤딩+2칸 묶음, 4:2 중 2)', col: 4, el: function () {
        return tkSection('GW 현황', null, [
          { l: 'GW 단절', v: C.gwOff, tone: 'gwoff', key: 'gw/gw-status' },
          { l: 'GW 서버 경고', v: C.gwResHigh, tone: 'gwwarn', key: 'gw/gw-server' },
        ]);
      }
    },
    'c-al-donut': {
      cust: 1, title: '심각도 분포', col: 4, el: function () {
        return cardEl('col-4', donutHtml('심각도 분포',
          [{ label: 'Critical', value: C.AL.critical, color: SC.crit }, { label: 'Major', value: C.AL.major, color: SC.major }, { label: 'Minor', value: C.AL.minor, color: SC.warn }, { label: 'Warning', value: C.AL.warning, color: '#ecc94b' }],
          C.AL.critical + C.AL.major + C.AL.minor + C.AL.warning, '활성'));
      }
    },
    'c-al-7d': { cust: 1, title: '최근 7일 알람 발생', col: 4, el: function () { return cardEl('col-4', chartHtml('최근 7일 알람 발생', bars(D7, [{ name: '발생', color: '#e74c3c', vals: C.al7 }]), 'alarm/alarm-manage')); } },
    'c-al-recent': {
      cust: 1, title: '최근 활성 알람', col: 4, el: function () {
        return cardEl('col-4', listHtml('최근 활성 알람', C.alRecent.map(function (a) {
          return '<div class="d-list-row"><span class="badge ' + alBadge(a.sev) + '">' + (a.sev === 'crit' ? 'CRT' : a.sev === 'major' ? 'MAJ' : 'MIN') + '</span><span class="grow">' + a.fac + ' · ' + esc(a.name) + '</span><span class="muted">' + a.ago + ' 전</span></div>';
        }), 'alarm/alarm-manage'));
      }
    },
    'c-hd-metric': { cust: 1, title: '─ 핵심 지표 (제목)', col: 12, el: function () { return headerEl('핵심 지표'); } },
    'c-m-ups': {
      cust: 1, title: 'UPS 평균 부하율', col: 4, el: function () {
        return cardEl('col-4', '<div class="d-card-t">' + tLink('UPS 평균 부하율', 'data/ups-trend') + '</div>'
          + '<div class="d-gauge"><div class="d-gauge-top"><span class="d-gauge-v">' + C.upsLoad + '%</span><span class="muted">권장 &lt; 80%</span></div>'
          + '<div class="d-gauge-track"><div class="d-gauge-fill" style="width:' + C.upsLoad + '%;background:' + (C.upsLoad >= 80 ? SC.crit : C.upsLoad >= 70 ? SC.warn : SC.ok) + '"></div></div></div>'
          + '<div class="d-spark">' + spark(C.upsLoad7, '#1a6ed8') + '</div>');
      }
    },
    'c-m-bat': {
      cust: 1, title: '배터리 최저 SOH', col: 4, el: function () {
        return cardEl('col-4', '<div class="d-card-t">' + tLink('배터리 최저 SOH', 'data/battery-trend') + '</div>'
          + '<div class="d-gauge"><div class="d-gauge-top"><span class="d-gauge-v">' + C.batMinSoh + '%</span><span class="muted">교체필요 ' + C.batReplace + '대</span></div>'
          + '<div class="d-gauge-track"><div class="d-gauge-fill" style="width:' + C.batMinSoh + '%;background:' + (C.batMinSoh < 80 ? SC.warn : SC.ok) + '"></div></div></div>');
      }
    },
    'c-m-chw': {
      cust: 1, title: '칠러 냉수 공급온도', col: 4, el: function () {
        return cardEl('col-4', '<div class="d-card-t">' + tLink('칠러 냉수 공급온도', 'data/chiller-trend') + '</div><div class="d-big"><span class="d-big-v" style="color:' + (C.chwAbn ? SC.crit : SC.ok) + '">' + C.chwOut + '℃</span><span class="d-big-l">' + (C.chwAbn ? '이상' : '정상 범위') + '</span></div>');
      }
    },
    'c-tk-kpis': {
      cust: 1, title: '─ 티켓 현황 + KPI (헤딩+5칸 묶음)', col: 12, el: function () {
        const t = C.TK, base = (t.unassigned + t.pending + t.progress + t.done) || 1;
        const pc = function (v) { return (v / base * 100).toFixed(1); };
        return tkSection('티켓 현황', 'ticket/ticket-my', [
          { l: '할당되지 않은 티켓', v: t.unassigned, p: pc(t.unassigned), tone: 'unassigned', key: 'ticket/ticket-my' },
          { l: '진행 대기 중 티켓', v: t.pending, p: pc(t.pending), tone: 'assigned', key: 'ticket/ticket-my' },
          { l: '진행 중 티켓', v: t.progress, p: pc(t.progress), tone: 'progress', key: 'ticket/ticket-my' },
          { l: '종료된 티켓', v: t.done, p: pc(t.done), tone: 'done', key: 'ticket/ticket-my' },
          { l: '기한이 지난 티켓', v: t.overdue, tone: 'overdue', key: 'ticket/ticket-my' },
        ]);
      }
    },
    'c-hd-infra': { cust: 1, title: '─ 인프라 헬스 (제목)', col: 12, el: function () { return headerEl('인프라 헬스', 'facility/ups-list'); } },
    'c-infra-stack': {
      cust: 1, title: '설비 유형별 상태', col: 6, el: function () {
        const FAC_PAGE = { UPS: 'facility/ups-list', PDU: 'facility/pdu-list', '칠러': 'facility/chiller-list', '배터리': 'facility/battery-list' };
        const rows = C.FAC.map(function (f) {
          const tot = f.ok + f.warn + f.major + f.crit + f.off + f.unk;
          const pg = FAC_PAGE[f.type];
          return '<div class="d-stack-row' + (pg ? ' d-linkable" onclick="dNav(\'' + pg + '\')' : '') + '"><span class="d-stack-label">' + f.type + '</span>'
            + stackBar([{ label: '정상', value: f.ok, color: SC.ok }, { label: '경고', value: f.warn, color: SC.warn }, { label: 'Major', value: f.major, color: SC.major }, { label: 'Critical', value: f.crit, color: SC.crit }, { label: '오프라인', value: f.off, color: SC.off }, { label: '확인 불가', value: f.unk, color: SC.unknown }])
            + '<span class="d-stack-total">' + tot + '</span></div>';
        });
        return cardEl('col-6', '<div class="d-card-t">설비 유형별 상태</div>' + rows.join('')
          + '<div class="d-legend" style="flex-direction:row;flex-wrap:wrap;gap:12px;margin-top:2px">'
          + [['정상', SC.ok], ['경고', SC.warn], ['Major', SC.major], ['Critical', SC.crit], ['오프라인', SC.off], ['확인 불가', SC.unknown]].map(function (x) { return '<span class="li"><span class="sw" style="background:' + x[1] + '"></span>' + x[0] + '</span>'; }).join('') + '</div>');
      }
    },
    'c-infra-comm': { cust: 1, title: '설비 통신', col: 3, el: function () { return cardEl('col-3', donutHtml('설비 통신', [{ label: '온라인', value: C.facTotal - C.facOff - C.facUnknown, color: '#27ae60' }, { label: '오프라인', value: C.facOff, color: '#c0392b' }, { label: '확인 불가', value: C.facUnknown, color: SC.unknown }], C.facTotal, '설비')); } },
    'c-infra-gw': { cust: 1, title: 'GW 연결', col: 3, el: function () { return cardEl('col-3', donutHtml('GW 연결', [{ label: '온라인', value: C.gwOn, color: '#27ae60' }, { label: '오프라인', value: C.gwOff, color: '#c0392b' }], C.gwOn + C.gwOff, 'GW', 'gw/gw-status')); } },
  };

  function sevCard(sev, label, val, key) {
    const c = elx('div', 'kpi-card sev-' + sev + ' col-3' + (key ? ' d-linkable' : ''));
    c.innerHTML = '<div class="kpi-card-label">' + label + '</div><div class="kpi-card-value" data-to="' + val + '" data-u="건">0</div>';
    if (key) c.setAttribute('onclick', "dNav('" + key + "')");
    return c;
  }

  // 알람 표 위젯 (자체 페이징)
  function buildAlarmTable() {
    const SIZE = 8;
    let page = 1;
    const card = cardEl('col-12', '<div class="dg-header" style="padding:4px 0 10px;"><span class="dash-sec-bar"></span>'
      + '<span class="dash-sec-title d-t-lnk" onclick="dNav(\'alarm/alarm-overview-host\')">알람 목록</span></div>'
      + '<div class="d-card-t">발생시각 최신순 · 전체 ' + H.HAL.length + '건</div>'
      + '<div class="grid-scroll"><table class="grid-table"><thead><tr>'
      + '<th style="width:48px">No</th><th style="width:82px">심각도</th><th style="width:110px">고객사</th>'
      + '<th style="width:120px">설비</th><th>알람명</th><th style="width:158px">발생시각</th><th style="width:88px">처리상태</th>'
      + '</tr></thead><tbody></tbody></table></div><div class="paging"></div>');
    const tbody = card.querySelector('tbody'), pg = card.querySelector('.paging');
    function render() {
      const total = Math.max(1, Math.ceil(H.HAL.length / SIZE));
      page = Math.min(Math.max(1, page), total);
      tbody.innerHTML = H.HAL.slice((page - 1) * SIZE, page * SIZE).map(function (a, i) {
        return '<tr><td>' + ((page - 1) * SIZE + i + 1) + '</td>'
          + '<td><span class="badge ' + alBadge(a.sev) + '">' + alLabel(a.sev) + '</span></td>'
          + '<td>' + a.ten + '</td><td>' + a.fac + '</td><td style="text-align:left">' + esc(a.name) + '</td>'
          + '<td>' + a.at + '</td><td><span class="status-badge ' + stByH(a.h) + '">' + a.h + '</span></td></tr>';
      }).join('');
      let s = '<button class="page-btn"' + (page === 1 ? ' disabled' : '') + '>&#9664;</button>';
      for (let p = 1; p <= total; p++) s += '<button class="page-btn' + (p === page ? ' active' : '') + '" data-p="' + p + '">' + p + '</button>';
      s += '<button class="page-btn"' + (page === total ? ' disabled' : '') + ' data-p="' + (page + 1) + '">&#9654;</button>';
      pg.innerHTML = s;
    }
    pg.addEventListener('click', function (e) {
      const b = e.target.closest('.page-btn'); if (!b) return;
      if (b.dataset.p) { page = Number(b.dataset.p); render(); }
      else if (!b.disabled) { page = (b.textContent === '◀' ? page - 1 : page + 1); render(); }
    });
    render();
    return card;
  }

  // ============================================================
  //  레이아웃 + 편집
  // ============================================================
  function allIds() { return Object.keys(WIDGETS).filter(function (k) { return ROLE === 'customer' ? WIDGETS[k].cust : WIDGETS[k].host; }); }
  const DEFAULT_LAYOUT = allIds();

  function loadLayout() {
    try { const j = JSON.parse(localStorage.getItem(LS_KEY)); if (Array.isArray(j) && j.length) return j.filter(function (id) { return WIDGETS[id]; }); } catch (e) { /* noop */ }
    return DEFAULT_LAYOUT.slice();
  }
  function saveLayout() { try { localStorage.setItem(LS_KEY, JSON.stringify(layout)); umsToast('대시보드 레이아웃을 저장했습니다.'); } catch (e) { umsToast('저장 실패'); } }

  let layout = loadLayout();
  let editing = false;

  // 위젯 클릭 → 페이지 이동. 편집 모드에선 이동을 막는다(드래그 중 오이동 방지).
  function dNav(key) { if (editing) return; dGo(key); }
  window.dNav = dNav;

  function render() {
    dash.innerHTML = '';

    // 상단 바 (토글 + 편집 도구)
    const top = elx('div', 'dash-editbar');
    top.innerHTML =
      (editing ? '<button class="btn btn-primary" id="dbSave">저장</button>'
        + '<button class="btn" id="dbReset">초기화</button>'
        + '<button class="btn btn-danger" id="dbClear">전체 빼기</button>' : '')
      + '<label class="dash-edit-toggle"><input type="checkbox" id="dbToggle"' + (editing ? ' checked' : '') + '> 레이아웃 변경</label>';
    dash.appendChild(top);

    // 위젯 그리드
    const grid = elx('div', 'dash-grid dg' + (editing ? ' dg-edit' : ''));
    layout.forEach(function (id) {
      const w = WIDGETS[id]; if (!w) return;
      const wrap = elx('div', 'dg-item ' + (w.col === 12 ? 'col-12' : 'col-' + w.col));
      wrap.dataset.wid = id;
      const inner = w.el();
      inner.classList.remove('col-3', 'col-4', 'col-6', 'col-12');  // 크기는 wrap 이 담당
      wrap.appendChild(inner);
      if (editing) {
        wrap.appendChild(elx('span', 'dg-handle', '&#10021;'));
        const x = elx('button', 'dg-remove', '&#10005;');
        x.title = '빼기';
        x.onclick = function (ev) { ev.stopPropagation(); layout = layout.filter(function (v) { return v !== id; }); render(); };
        wrap.appendChild(x);
      }
      grid.appendChild(wrap);
    });
    dash.appendChild(grid);

    // 편집 모드: 빠진 위젯 목록
    if (editing) {
      const hidden = DEFAULT_LAYOUT.filter(function (id) { return layout.indexOf(id) < 0; })
        .concat(allIds().filter(function (id) { return DEFAULT_LAYOUT.indexOf(id) < 0 && layout.indexOf(id) < 0; }));
      const tray = elx('div', 'dash-tray');
      tray.innerHTML = '<div class="dash-tray-t">빠진 위젯 <span class="muted">(클릭하면 맨 아래에 추가)</span></div>'
        + (hidden.length ? '<div class="dash-tray-list">' + hidden.map(function (id) {
            return '<button class="dash-tray-chip" data-add="' + id + '">+ ' + WIDGETS[id].title + '</button>';
          }).join('') + '</div>' : '<div class="d-list-empty" style="padding:8px 2px">모든 위젯이 표시 중입니다.</div>');
      dash.appendChild(tray);
      tray.addEventListener('click', function (e) {
        const b = e.target.closest('[data-add]'); if (!b) return;
        layout.push(b.dataset.add); render();
      });
    }

    // 이벤트 배선
    document.getElementById('dbToggle').addEventListener('change', function () { editing = this.checked; render(); });
    if (editing) {
      document.getElementById('dbSave').onclick = saveLayout;
      document.getElementById('dbReset').onclick = function () {
        try { localStorage.removeItem(LS_KEY); } catch (e) { /* noop */ }
        layout = DEFAULT_LAYOUT.slice(); render(); umsToast('기본 레이아웃으로 초기화했습니다.');
      };
      document.getElementById('dbClear').onclick = function () { layout = []; render(); };
      if (window.Sortable) {
        Sortable.create(grid, {
          animation: 150,
          ghostClass: 'dg-ghost',
          chosenClass: 'dg-chosen',
          draggable: '.dg-item',
          filter: '.dg-remove, .dash-sec-more, .page-btn',
          onEnd: function (evt) {
            if (evt.oldIndex === evt.newIndex) return;
            const m = layout.splice(evt.oldIndex, 1)[0];
            layout.splice(evt.newIndex, 0, m);
            // Sortable 이 DOM 은 이미 옮김 — 배열만 동기화 (재렌더 안 함)
          },
        });
      }
    }

    // 숫자 카운트업
    dash.querySelectorAll('[data-to]').forEach(function (n) { countUp(n, Number(n.dataset.to), n.dataset.u || ''); });
  }

  render();

})();
