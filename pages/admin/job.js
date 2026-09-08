// 작업 페이지 스크립트 (목업 데이터)
// 화면: 관리 > 작업   (호스트 모드 전용)
(function () {

  // kind: 'interval'(주기) | 'cron' | 'manual'(수동)
  // state: 'wait'(대기) | 'run'(실행 중) | 'pause'(일시중지) | 'err'(오류)
  const DATA = [
    { no: 1,  name: 'Eteverse.Abp.Alerting.AlertEvaluationWorker',                  group: 'DEFAULT',
      kind: 'interval', sched: '00:01:00',   state: 'wait', next: '2026-09-04 14:51', last: '2026-09-04 14:50' },
    { no: 2,  name: 'Ums.Collect.GatewayPollingWorker',                             group: 'DEFAULT',
      kind: 'cron',     sched: '0 0/5 * * * ?', state: 'run', next: '2026-09-04 14:55', last: '2026-09-04 14:50' },
    { no: 3,  name: 'Ums.Data.TrendAggregationWorker',                              group: 'DEFAULT',
      kind: 'cron',     sched: '0 0/10 * * * ?', state: 'wait', next: '2026-09-04 15:00', last: '2026-09-04 14:50' },
    { no: 4,  name: 'Volo.Abp.JobManagement.JobExecutionCleanupWorker',             group: 'DEFAULT',
      kind: 'interval', sched: '01:00:00',   state: 'wait', next: '2026-09-04 15:50', last: '2026-09-04 14:50' },
    { no: 5,  name: 'Volo.Abp.Identity.Session.IdentitySessionCleanupBackgroundWorker', group: 'DEFAULT',
      kind: 'interval', sched: '01:00:00',   state: 'wait', next: '2026-09-04 15:50', last: '2026-09-04 14:50' },
    { no: 6,  name: 'Volo.Abp.OpenIddict.Tokens.TokenCleanupBackgroundWorker',      group: 'DEFAULT',
      kind: 'interval', sched: '01:00:00',   state: 'wait', next: '2026-09-04 15:50', last: '2026-09-04 14:50' },
    { no: 7,  name: 'Eteverse.Abp.AuditLogging.ExpiredAuditLogDeleterWorker',       group: 'DEFAULT',
      kind: 'interval', sched: '1.00:00:00', state: 'wait', next: '2026-09-05 14:50', last: '2026-09-04 14:50' },
    { no: 8,  name: 'Ums.Mail.OutboxSenderWorker',                                  group: 'DEFAULT',
      kind: 'interval', sched: '00:00:30',   state: 'wait', next: '2026-09-04 14:51', last: '2026-09-04 14:50' },
    { no: 9,  name: 'Ums.Ticket.SlaEscalationWorker',                               group: 'DEFAULT',
      kind: 'interval', sched: '00:15:00',   state: 'pause', next: '-',              last: '2026-09-04 11:30' },
    { no: 10, name: 'Ums.Facility.BatteryHealthCheckWorker',                        group: 'DEFAULT',
      kind: 'cron',     sched: '0 0 3 * * ?', state: 'err',  next: '2026-09-05 03:00', last: '2026-09-04 03:00' },
    { no: 11, name: 'Ums.Report.MonthlyUsageReportWorker',                          group: 'DEFAULT',
      kind: 'cron',     sched: '0 0 6 1 * ?', state: 'wait', next: '2026-10-01 06:00', last: '2026-09-01 06:00' },
    { no: 12, name: 'Ums.Subscription.ExpiryWorker',                                 group: 'DEFAULT',
      kind: 'cron',     sched: '0 30 0 * * ?', state: 'wait', next: '2026-09-05 00:30', last: '2026-09-04 00:30' },
    { no: 13, name: 'manual',                                                       group: 'demo',
      kind: 'manual',   sched: '',           state: 'wait', next: '-',              last: '-' },
  ];

  const STATE_BADGE = {
    wait:  ['badge-wait',  '대기'],
    run:   ['badge-run',   '실행 중'],
    pause: ['badge-pause', '일시중지'],
    err:   ['badge-err',   '오류'],
  };

  // 실행 이력 (작업번호 -> 목록). 없으면 생성 규칙으로 만든다.
  const HIST = {
    10: [
      { at: '2026-09-04 03:00:02', dur: '00:00:41', ok: 0, msg: 'BatteryHealthCheck 실패: GW-DR-01 응답 없음 (timeout 30s)' },
      { at: '2026-09-03 03:00:01', dur: '00:01:12', ok: 1, msg: '점검 대상 배터리 48개 / 이상 2개' },
      { at: '2026-09-02 03:00:03', dur: '00:01:08', ok: 1, msg: '점검 대상 배터리 48개 / 이상 1개' },
    ],
    9: [
      { at: '2026-09-04 11:30:00', dur: '00:00:06', ok: 1, msg: 'SLA 임박 티켓 3건 에스컬레이션' },
      { at: '2026-09-04 11:15:00', dur: '00:00:04', ok: 1, msg: 'SLA 임박 티켓 없음' },
    ],
    12: [
      { at: '2026-09-04 00:30:01', dur: '00:00:02', ok: 1, msg: '만료 전환 0건 / 만료 임박(D-7 이내) 고지 1건: 세종클라우드' },
      { at: '2026-09-03 00:30:01', dur: '00:00:02', ok: 1, msg: '만료 전환 0건 / 만료 임박 고지 0건' },
      { at: '2026-08-16 00:30:02', dur: '00:00:03', ok: 1, msg: '만료 전환 1건: 미래네트웍스 — 기능 차단 적용' },
    ],
  };

  function defaultHist(r) {
    if (r.last === '-') return [];
    return [
      { at: r.last + ':00', dur: '00:00:0' + (2 + (r.no % 7)), ok: 1, msg: '정상 처리' },
      { at: r.last.replace(/(\d\d):(\d\d)$/, function (m, h, mi) {
          const t = (Number(h) * 60 + Number(mi) - 60 + 1440) % 1440;
          return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
        }) + ':00', dur: '00:00:0' + (1 + (r.no % 5)), ok: 1, msg: '정상 처리' },
    ];
  }

  let sortKey = 'name';
  let sortAsc = true;
  let page    = 1;
  let menuNo  = null;

  function row(no) { return DATA.filter(function (r) { return r.no === no; })[0]; }

  function schedCell(r) {
    if (r.kind === 'manual') return '<span class="sched-kind">수동</span>';
    if (r.kind === 'cron')   return '<span class="sched-kind">cron</span><span class="sched-cron">' + r.sched + '</span>';
    return '<span class="sched-kind">주기</span><span class="sched-val">' + r.sched + '</span>';
  }

  function badge(state) {
    const p = STATE_BADGE[state] || STATE_BADGE.wait;
    return '<span class="badge ' + p[0] + '">' + p[1] + '</span>';
  }

  function dash(v) { return v === '-' ? '<span class="sched-none">-</span>' : v; }

  // ---- 목록 ----
  function filtered() {
    const kw = (document.getElementById('q').value || '').trim();
    const rows = DATA.filter(function (r) {
      return !kw || r.name.toLowerCase().indexOf(kw.toLowerCase()) >= 0
        || r.group.toLowerCase().indexOf(kw.toLowerCase()) >= 0;
    });
    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });
    return rows;
  }

  function renderGrid() {
    const rows  = filtered();
    const size  = Number(document.getElementById('pSize').value);
    const total = rows.length;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (page > maxPage) page = maxPage;
    const from = (page - 1) * size;
    const cur  = rows.slice(from, from + size);

    document.getElementById('gridBody').innerHTML = cur.length
      ? cur.map(function (r) {
          return '<tr data-no="' + r.no + '">'
            + '<td><button class="act-menu-btn" onclick="openMenu(event,' + r.no + ')">'
            +   '&#9881; 작업 <span class="caret">&#9662;</span></button></td>'
            + '<td><a class="job-name" href="' + histHref(r) + '">' + r.name + '</a>'
            +   '<span class="job-group">' + r.group + '</span></td>'
            + '<td>' + schedCell(r) + '</td>'
            + '<td>' + badge(r.state) + '</td>'
            + '<td>' + dash(r.next) + '</td>'
            + '<td>' + dash(r.last) + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="6" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('pNo').textContent = page;

    document.querySelectorAll('#jobTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  function sortBy(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    page = 1;
    closeMenu();
    renderGrid();
  }

  function go(dir) {
    if (dir === 'size') { page = 1; renderGrid(); return; }
    const size = Number(document.getElementById('pSize').value);
    const maxPage = Math.max(1, Math.ceil(filtered().length / size));
    if (dir === 'first') page = 1;
    if (dir === 'prev')  page = Math.max(1, page - 1);
    if (dir === 'next')  page = Math.min(maxPage, page + 1);
    if (dir === 'last')  page = maxPage;
    renderGrid();
  }

  // ---- 행 [작업] 드롭다운 ----
  function openMenu(e, no) {
    e.stopPropagation();
    const menu = document.getElementById('jobMenu');
    const wasOpen = (menuNo === no && menu.classList.contains('show'));
    closeMenu();
    if (wasOpen) return;
    menuNo = no;

    // 일시중지된 작업이면 메뉴 항목을 '재개' 로 바꾼다
    const r = row(no);
    document.getElementById('mi-pause').innerHTML = (r && r.state === 'pause')
      ? '<span class="mi-ico">&#9654;</span> 재개'
      : '<span class="mi-ico">&#10074;&#10074;</span> 일시중지';

    const rect = e.currentTarget.getBoundingClientRect();
    menu.classList.add('show');
    const below = window.innerHeight - rect.bottom;
    menu.style.left = rect.left + 'px';
    menu.style.top  = (below < menu.offsetHeight + 12)
      ? (rect.top - menu.offsetHeight - 4) + 'px'
      : (rect.bottom + 4) + 'px';
    document.querySelectorAll('#gridBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
  }

  function closeMenu() {
    document.getElementById('jobMenu').classList.remove('show');
    document.querySelectorAll('#gridBody tr.selected').forEach(function (tr) { tr.classList.remove('selected'); });
    menuNo = null;
  }

  function menuAct(act) {
    const r = row(menuNo);
    closeMenu();
    if (!r) return;
    switch (act) {
      case 'pause':
        if (r.state === 'pause') { r.state = 'wait'; umsToast(r.name + ' 작업을 재개했습니다. (목업)'); }
        else { r.state = 'pause'; r.next = '-'; umsToast(r.name + ' 작업을 일시중지했습니다. (목업)'); }
        renderGrid();
        break;
      case 'run':
        r.state = 'run';
        umsToast(r.name + ' 작업을 즉시 실행했습니다. (목업)');
        renderGrid();
        break;
      case 'cancel':
        if (r.state !== 'run') { umsToast('실행 중인 작업이 아닙니다.'); break; }
        r.state = 'wait';
        umsToast(r.name + ' 실행을 취소했습니다. (목업)');
        renderGrid();
        break;
      case 'history': gotoHistory(r); break;
    }
  }

  // ---- 작업 상세/이력 (별도 페이지: admin/job-detail) ----
  function histHref(r) {
    const href = 'job-detail.html?job=' + encodeURIComponent(r.name);
    return window.umsLink ? window.umsLink(href) : href;
  }

  function gotoHistory(r) { location.href = histHref(r); }


  // ---- 초기화 ----
  renderGrid();

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.drop-menu') && !e.target.closest('.act-menu-btn')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeMenu();
  });
  document.addEventListener('scroll', closeMenu, true);

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid     = renderGrid;
  window.sortBy         = sortBy;
  window.go             = go;
  window.openMenu       = openMenu;
  window.menuAct        = menuAct;

})();
