// 실행 이력 페이지 스크립트 (목업 데이터)
// 화면: 관리 > 작업 관리 > 실행 이력   (호스트 모드 전용)
// ※ 작업 집합은 [작업] 화면(pages/admin/job.js)과 동일. 작업 이름을 누르면
//   해당 작업의 상세 이력(admin/job-detail)으로 이동한다.
(function () {

  // name, 실행 주기(분), 평균 소요(ms), 생성할 실행 건수
  const JOBS = [
    { name: 'Eteverse.Abp.Alerting.AlertEvaluationWorker',                  every: 1,     base: 540,   count: 120 },
    { name: 'Ums.Mail.OutboxSenderWorker',                                  every: 1,     base: 95,    count: 110 },
    { name: 'Ums.Collect.GatewayPollingWorker',                             every: 5,     base: 1850,  count: 40  },
    { name: 'Ums.Data.TrendAggregationWorker',                              every: 10,    base: 3200,  count: 30  },
    { name: 'Volo.Abp.JobManagement.JobExecutionCleanupWorker',             every: 60,    base: 210,   count: 12  },
    { name: 'Volo.Abp.Identity.Session.IdentitySessionCleanupBackgroundWorker', every: 60, base: 175,  count: 12  },
    { name: 'Volo.Abp.OpenIddict.Tokens.TokenCleanupBackgroundWorker',      every: 60,    base: 160,   count: 12  },
    { name: 'Ums.Ticket.SlaEscalationWorker',                               every: 15,    base: 320,   count: 12  },
    { name: 'Ums.Facility.BatteryHealthCheckWorker',                        every: 1440,  base: 68000, count: 5, failFirst: 1 },
    { name: 'Eteverse.Abp.AuditLogging.ExpiredAuditLogDeleterWorker',       every: 1440,  base: 4100,  count: 5   },
    { name: 'Ums.Report.MonthlyUsageReportWorker',                          every: 43200, base: 22000, count: 2   },
    { name: 'report',                                                       every: 240,   base: 10001, count: 8   },
  ];

  const NODE = 'NON_CLUSTERED';
  const TOTAL_CAP = 368;   // 레퍼런스와 같은 규모로 맞춘다

  function pad(n) { return String(n).padStart(2, '0'); }

  function stamp(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
      + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // "2026-09-04 06:08" -> "2026. 9. 4. 오전 6:08"
  function fmtKo(v) {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!m) return v;
    const h = Number(m[4]);
    const ampm = h < 12 ? '오전' : '오후';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return Number(m[1]) + '. ' + Number(m[2]) + '. ' + Number(m[3]) + '. ' + ampm + ' ' + h12 + ':' + m[5];
  }

  // ---- 실행 이력 생성 (재현 가능) ----
  const DATA = (function build() {
    let seed = 909041;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }

    const base = new Date(2026, 8, 4, 6, 8, 0);   // 2026-09-04 06:08 기준으로 과거로

    // 주기에 맞춰 마지막 실행 시각을 정렬한다 (5분 주기면 06:05, 매일이면 03:00 …)
    function alignedStart(every) {
      const t = new Date(base.getTime());
      t.setSeconds(0, 0);
      if (every === 43200) return new Date(2026, 8, 1, 6, 0, 0);      // 매월 1일 06:00
      if (every === 1440)  return new Date(2026, 8, 4, 3, 0, 0);      // 매일 03:00
      if (every === 240)   { t.setHours(4, 0, 0, 0); return t; }      // 4시간 주기 -> 04:00
      if (every > 1) t.setMinutes(t.getMinutes() - (t.getMinutes() % every));
      return t;
    }

    const rows = [];
    JOBS.forEach(function (j) {
      let t = alignedStart(j.every);
      for (let i = 0; i < j.count; i++) {
        const cold = (i % 12 === 0 && j.every <= 5);
        const dur  = j.name === 'report'
          ? 10001
          : Math.round(j.base * (cold ? 4.7 : 1) * (0.92 + rnd() * 0.16));
        rows.push({
          name: j.name,
          at: stamp(t),
          start: stamp(t),
          dur: dur,
          ok: (j.failFirst && i === 0) ? 0 : (rnd() > 0.985 ? 0 : 1),
          retry: (j.failFirst && i === 0) ? 1 : 0,
          node: NODE,
        });
        t = new Date(t.getTime() - j.every * 60000);
      }
    });
    rows.sort(function (a, b) { return a.at < b.at ? 1 : (a.at > b.at ? -1 : 0); });
    return rows.slice(0, TOTAL_CAP);
  })();

  let sortKey = 'at';
  let sortAsc = false;
  let page    = 1;

  // ---- 검색 ----
  function filtered() {
    const kw   = (document.getElementById('fName').value || '').trim().toLowerCase();
    const st   = document.getElementById('fState').value;
    const from = (document.getElementById('fFrom').value || '').replace('T', ' ').substring(0, 16);
    const to   = (document.getElementById('fTo').value || '').replace('T', ' ').substring(0, 16);

    const rows = DATA.filter(function (r) {
      return (!kw   || r.name.toLowerCase().indexOf(kw) >= 0)
        && (!st   || (st === 'ok' ? r.ok : !r.ok))
        && (!from || r.at >= from)
        && (!to   || r.at <= to);
    });

    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });
    return rows;
  }

  function detailHref(name) {
    const href = 'job-detail.html?job=' + encodeURIComponent(name);
    return window.umsLink ? window.umsLink(href) : href;
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
          return '<tr>'
            + '<td><a class="job-name" href="' + detailHref(r.name) + '">' + r.name + '</a></td>'
            + '<td>' + (r.ok ? '<span class="badge badge-ok2">성공</span>'
                             : '<span class="badge badge-fail2">실패</span>') + '</td>'
            + '<td>' + fmtKo(r.at) + '</td>'
            + '<td>' + fmtKo(r.start) + '</td>'
            + '<td class="num' + (r.dur > 5000 ? ' dur-slow' : '') + '">' + r.dur.toLocaleString('ko-KR') + ' ms</td>'
            + '<td>' + r.retry + '</td>'
            + '<td>' + r.node + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="7" style="padding:30px;text-align:center;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';

    renderPageNums(maxPage);

    document.querySelectorAll('#execTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  // 1 2 3 4 5 … 37  형태의 페이지 번호
  function renderPageNums(maxPage) {
    let start = Math.max(1, page - 2);
    let end   = Math.min(maxPage, start + 4);
    start = Math.max(1, end - 4);

    let html = '';
    for (let i = start; i <= end; i++) {
      html += '<button class="page-btn' + (i === page ? ' active' : '') + '" onclick="goTo(' + i + ')">' + i + '</button>';
    }
    if (end < maxPage) {
      if (end < maxPage - 1) html += '<span class="page-dots">…</span>';
      html += '<button class="page-btn" onclick="goTo(' + maxPage + ')">' + maxPage + '</button>';
    }
    document.getElementById('pageNums').innerHTML = html;
  }

  function sortBy(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    page = 1;
    renderGrid();
  }

  function goTo(p) { page = p; renderGrid(); }

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

  function search() { page = 1; renderGrid(); }

  function resetSearch() {
    ['fName', 'fState', 'fFrom', 'fTo'].forEach(function (id) { document.getElementById(id).value = ''; });
    page = 1;
    renderGrid();
  }

  // ---- 초기화 ----
  // 다른 화면에서 ?job= 을 달고 들어오면 작업 이름으로 미리 걸러 준다
  const q = (location.search.match(/[?&]job=([^&]+)/) || [])[1];
  if (q) document.getElementById('fName').value = decodeURIComponent(q);
  renderGrid();

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid  = renderGrid;
  window.search      = search;
  window.resetSearch = resetSearch;
  window.sortBy      = sortBy;
  window.go          = go;
  window.goTo        = goTo;

})();
