// 작업 이력 페이지 스크립트 (목업 데이터)
// 화면: 관리 > 작업 관리 > (작업 상세)   (호스트 모드 전용)
// ※ 작업 목록은 [관리 > 작업 관리 > 작업] 화면(pages/admin/job.js)과 같은 집합.
(function () {

  // kind: 'interval'(주기) | 'cron' | 'manual'(수동)
  // state: 'wait' | 'run' | 'pause' | 'err'
  const JOBS = [
    { name: 'Eteverse.Abp.Alerting.AlertEvaluationWorker', group: 'DEFAULT',
      kind: 'interval', sched: '00:01:00', state: 'wait', next: '2026-09-04 15:03', last: '2026-09-04 15:02',
      asm: 'Eteverse.Abp.Alerting.Application, Version=1.5.0.0', base: 540, everyMin: 1 },
    { name: 'Ums.Collect.GatewayPollingWorker', group: 'DEFAULT',
      kind: 'cron', sched: '0 0/5 * * * ?', state: 'run', next: '2026-09-04 14:55', last: '2026-09-04 14:50',
      asm: 'Ums.Collect.Application, Version=1.5.0.0', base: 1850, everyMin: 5 },
    { name: 'Ums.Data.TrendAggregationWorker', group: 'DEFAULT',
      kind: 'cron', sched: '0 0/10 * * * ?', state: 'wait', next: '2026-09-04 15:00', last: '2026-09-04 14:50',
      asm: 'Ums.Data.Application, Version=1.5.0.0', base: 3200, everyMin: 10 },
    { name: 'Volo.Abp.JobManagement.JobExecutionCleanupWorker', group: 'DEFAULT',
      kind: 'interval', sched: '01:00:00', state: 'wait', next: '2026-09-04 15:50', last: '2026-09-04 14:50',
      asm: 'Volo.Abp.JobManagement.Domain, Version=9.0.0.0', base: 210, everyMin: 60 },
    { name: 'Volo.Abp.Identity.Session.IdentitySessionCleanupBackgroundWorker', group: 'DEFAULT',
      kind: 'interval', sched: '01:00:00', state: 'wait', next: '2026-09-04 15:50', last: '2026-09-04 14:50',
      asm: 'Volo.Abp.Identity.Domain, Version=9.0.0.0', base: 175, everyMin: 60 },
    { name: 'Volo.Abp.OpenIddict.Tokens.TokenCleanupBackgroundWorker', group: 'DEFAULT',
      kind: 'interval', sched: '01:00:00', state: 'wait', next: '2026-09-04 15:50', last: '2026-09-04 14:50',
      asm: 'Volo.Abp.OpenIddict.Domain, Version=9.0.0.0', base: 160, everyMin: 60 },
    { name: 'Eteverse.Abp.AuditLogging.ExpiredAuditLogDeleterWorker', group: 'DEFAULT',
      kind: 'interval', sched: '1.00:00:00', state: 'wait', next: '2026-09-05 14:50', last: '2026-09-04 14:50',
      asm: 'Eteverse.Abp.AuditLogging.Domain, Version=1.5.0.0', base: 4100, everyMin: 1440 },
    { name: 'Ums.Mail.OutboxSenderWorker', group: 'DEFAULT',
      kind: 'interval', sched: '00:00:30', state: 'wait', next: '2026-09-04 14:51', last: '2026-09-04 14:50',
      asm: 'Ums.Mail.Application, Version=1.5.0.0', base: 95, everyMin: 1 },
    { name: 'Ums.Ticket.SlaEscalationWorker', group: 'DEFAULT',
      kind: 'interval', sched: '00:15:00', state: 'pause', next: '-', last: '2026-09-04 11:30',
      asm: 'Ums.Ticket.Application, Version=1.5.0.0', base: 320, everyMin: 15 },
    { name: 'Ums.Facility.BatteryHealthCheckWorker', group: 'DEFAULT',
      kind: 'cron', sched: '0 0 3 * * ?', state: 'err', next: '2026-09-05 03:00', last: '2026-09-04 03:00',
      asm: 'Ums.Facility.Application, Version=1.5.0.0', base: 68000, everyMin: 1440, failFirst: 1 },
    { name: 'Ums.Report.MonthlyUsageReportWorker', group: 'DEFAULT',
      kind: 'cron', sched: '0 0 6 1 * ?', state: 'wait', next: '2026-10-01 06:00', last: '2026-09-01 06:00',
      asm: 'Ums.Report.Application, Version=1.5.0.0', base: 22000, everyMin: 43200 },
    { name: 'manual', group: 'demo',
      kind: 'manual', sched: '', state: 'wait', next: '-', last: '-',
      asm: 'Ums.Demo.Application, Version=1.5.0.0', base: 0, everyMin: 0 },
  ];

  const STATE_BADGE = {
    wait:  ['badge-wait2',  '대기'],
    run:   ['badge-run2',   '실행 중'],
    pause: ['badge-pause2', '일시중지'],
    err:   ['badge-err2',   '오류'],
  };

  let cur = null;

  function pad(n) { return String(n).padStart(2, '0'); }

  // "2026-09-04 15:02" -> "2026. 9. 4. 오후 3:02" (레퍼런스 표기)
  function fmtKo(v) {
    if (!v || v === '-') return '-';
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!m) return v;
    const h = Number(m[4]);
    const ampm = h < 12 ? '오전' : '오후';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return Number(m[1]) + '. ' + Number(m[2]) + '. ' + Number(m[3]) + '. '
      + ampm + ' ' + h12 + ':' + m[5];
  }

  function schedText(j) {
    if (j.kind === 'manual') return '수동';
    if (j.kind === 'cron')   return 'cron  ' + j.sched;
    return '주기';
  }

  function badge(state) {
    const p = STATE_BADGE[state] || STATE_BADGE.wait;
    return '<span class="badge ' + p[0] + '">' + p[1] + '</span>';
  }

  function dl(rows) {
    return rows.map(function (r) {
      return '<dt>' + r[0] + '</dt><dd>' + (r[1] === '' || r[1] == null
        ? '<span class="jh-none">-</span>' : r[1]) + '</dd>';
    }).join('');
  }

  // ---- 실행 이력 생성 (작업별로 재현 가능) ----
  function makeHist(j) {
    if (j.last === '-') return [];
    let seed = 0;
    for (let i = 0; i < j.name.length; i++) seed = (seed * 31 + j.name.charCodeAt(i)) % 100000;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }

    const m = j.last.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    let t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), 0);

    const out = [];
    const step = Math.max(1, j.everyMin);
    for (let i = 0; i < 24; i++) {
      const at = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate())
               + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes());
      // 첫 실행이 오래 걸리는 워커(콜드 스타트) 표현
      const cold = (i === 0 || i === 12);
      const dur  = Math.round(j.base * (cold ? 5 : 1) * (0.92 + rnd() * 0.16));
      out.push({
        at: at,
        dur: dur,
        ok: (j.failFirst && i === 0) ? 0 : (rnd() > 0.97 ? 0 : 1),
        retry: (j.failFirst && i === 0) ? 1 : 0,
        node: 'NON_CLUSTERED',
      });
      t = new Date(t.getTime() - step * 60000);
    }
    return out;
  }

  // ---- 렌더 ----
  function render(j) {
    cur = j;
    document.getElementById('jobTitle').textContent = j.name;
    document.getElementById('jobPick').value = j.name;

    document.getElementById('jobSummary').innerHTML = dl([
      ['그룹', j.group],
      ['스케줄', schedText(j) + (j.kind === 'interval' ? '<br>' + j.sched : '')],
      ['상태', badge(j.state)],
      ['다음 실행', fmtKo(j.next)],
      ['마지막 실행', fmtKo(j.last)],
      ['최대 재시도', ''],
    ]);

    const jobType = 'Volo.Abp.BackgroundWorkers.Quartz.QuartzPeriodicBackgroundWorkerAdapter`1[['
      + j.name + ', ' + j.asm + ', Culture=neutral, PublicKeyToken=null]]';

    document.getElementById('jobDetail').innerHTML = dl([
      ['jobGroup', j.group],
      ['jobName', j.name],
      ['jobType', jobType],
      ['durable', 'False'],
      ['concurrentExecutionDisallowed', 'True'],
      ['triggerGroup', j.group],
      ['triggerName', j.name],
      ['triggerState', j.state === 'pause' ? 'Paused' : (j.state === 'err' ? 'Error' : 'Normal')],
      ['misfireInstruction', '0'],
      ['priority', '5'],
    ]);

    const hist = makeHist(j);
    document.getElementById('histBody').innerHTML = hist.length
      ? hist.map(function (h) {
          return '<tr>'
            + '<td>' + (h.ok ? '<span class="badge badge-ok2">성공</span>'
                             : '<span class="badge badge-fail2">실패</span>') + '</td>'
            + '<td>' + fmtKo(h.at) + '</td>'
            + '<td class="num' + (h.dur > 1000 ? ' dur-slow' : '') + '">'
            +   h.dur.toLocaleString('ko-KR') + ' ms</td>'
            + '<td>' + h.retry + '</td>'
            + '<td>' + h.node + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="5" style="padding:30px;text-align:center;color:#98a2b3;">실행 이력이 없습니다.</td></tr>';
  }

  function selectJob(name) {
    const j = JOBS.filter(function (x) { return x.name === name; })[0] || JOBS[0];
    render(j);
    // 새로고침/공유해도 같은 작업이 열리도록 주소를 바꾼다 (페이지 이동은 아님)
    if (window.history && history.replaceState) {
      const base = location.pathname + '?job=' + encodeURIComponent(j.name)
        + (window.umsRole && window.umsRole !== 'host' ? '&role=' + window.umsRole : '');
      history.replaceState(null, '', base);
    }
  }

  // ---- 초기화 ----
  document.getElementById('jobPick').innerHTML = JOBS.map(function (j) {
    return '<option>' + j.name + '</option>';
  }).join('');

  document.getElementById('backLink').href =
    (window.umsLink ? window.umsLink('job.html') : 'job.html');

  const q = (location.search.match(/[?&]job=([^&]+)/) || [])[1];
  const want = q ? decodeURIComponent(q) : '';
  render(JOBS.filter(function (j) { return j.name === want; })[0] || JOBS[0]);

  window.selectJob = selectJob;

})();
