// 알람 이력 조회 (호스트) — 전 고객사 알람 이력
// 화면: 알람 > 알람 이력 조회 (호스트)
(function () {

  const TENANTS = ['세종클라우드', '대한IDC', '한빛전산', '미래테크'];
  const SEV = { crit: ['badge-crit', 'Critical'], major: ['badge-major', 'Major'], minor: ['badge-minor', 'Minor'], warn: ['badge-warn', 'Warning'] };
  const HS = { '미확인': 'status-pending', '확인': 'status-progress', '조치완료': 'status-done' };
  const PAGE_SIZE = 12;
  const TODAY = '2026-09-10';

  // 목업: 발생 알람 이력 (cleared 없으면 Active)
  const DATA = (function () {
    const rows = [];
    const seed = [
      ['세종클라우드', 'crit', 'RULE', 'UPS-2F-B', '출력전압 상하한 초과', '미확인'],
      ['세종클라우드', 'major', 'DEVICE', 'UPS-2F-B', 'On Battery', '확인'],
      ['세종클라우드', 'minor', 'RULE', 'PDU-1F-01', '분기전류 경고', '조치완료'],
      ['세종클라우드', 'major', 'RULE', 'CH-2F-01', '냉수 출구온도 초과', '조치완료'],
      ['세종클라우드', 'warn', 'RULE', 'UPS-1F-B', '출력 부하율 경고', '조치완료'],
      ['대한IDC', 'crit', 'SYSTEM', 'GW-DR-02', 'GW 서버 응답 없음', '미확인'],
      ['대한IDC', 'minor', 'RULE', 'PDU-A-03', '입력전압 변동', '확인'],
      ['대한IDC', 'major', 'DEVICE', 'UPS-A-1', 'Bypass 전환', '조치완료'],
      ['한빛전산', 'crit', 'RULE', 'BAT-2F-01', '스트링 전압 저하', '미확인'],
      ['한빛전산', 'crit', 'RULE', 'UPS-1F-A', '배터리 자가진단 실패', '확인'],
      ['한빛전산', 'major', 'SYSTEM', 'GW-01', '미전송 버퍼 적체', '확인'],
      ['한빛전산', 'major', 'SYSTEM', 'GW-02', 'GW 연결끊김', '미확인'],
      ['한빛전산', 'minor', 'RULE', 'CH-01', '냉수 출구온도 12℃ 초과', '조치완료'],
      ['한빛전산', 'warn', 'RULE', 'PDU-1F-02', '분기전류 경고', '조치완료'],
      ['미래테크', 'major', 'RULE', 'CH-MAIN', '냉수 유량 저하', '미확인'],
      ['미래테크', 'minor', 'DEVICE', 'PDU-MAIN-01', '온도 센서 이상', '확인'],
      ['미래테크', 'warn', 'SYSTEM', 'GW-SUB', 'HEARTBEAT 지연', '미확인'],
      ['미래테크', 'crit', 'DEVICE', 'UPS-2F-A', '배터리 룸 과온', '조치완료'],
      ['세종클라우드', 'major', 'RULE', 'BAT-1F-A-01', '셀 온도 초과', '조치완료'],
      ['대한IDC', 'warn', 'RULE', 'PDU-A-01', '부하율 경고', '조치완료'],
      ['미래테크', 'minor', 'RULE', 'UPS-DR-1', '입력 주파수 이탈', '조치완료'],
      ['세종클라우드', 'crit', 'RULE', 'CH-1F-01', '응축기 압력 경고', '확인'],
      ['한빛전산', 'minor', 'DEVICE', 'PDU-2F-01', '아웃렛 과전류', '조치완료'],
      ['대한IDC', 'major', 'RULE', 'UPS-A-1', '출력전압 초과', '조치완료'],
      ['미래테크', 'warn', 'RULE', 'CH-MAIN', '냉수 출구온도 경고', '조치완료'],
      ['세종클라우드', 'minor', 'RULE', 'PDU-2F-02', '분기전류 경고', '조치완료'],
      ['한빛전산', 'major', 'RULE', 'UPS-2F-01', '출력 부하율 초과', '조치완료'],
      ['미래테크', 'crit', 'SYSTEM', 'GW-LAB', '계측 수집 중단', '조치완료'],
      ['대한IDC', 'minor', 'RULE', 'CH-A-01', '냉수 유량 저하', '조치완료'],
      ['세종클라우드', 'warn', 'DEVICE', 'UPS-DR-2', '팬 속도 이상', '조치완료'],
    ];
    let d = new Date(TODAY + 'T09:30:00');
    seed.forEach(function (s, i) {
      d = new Date(d.getTime() - (20 + Math.floor(Math.random() * 260)) * 60000);
      const p = function (n) { return String(n).padStart(2, '0'); };
      const fmt = function (dt) { return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate()) + ' ' + p(dt.getHours()) + ':' + p(dt.getMinutes()) + ':' + p(dt.getSeconds()); };
      const active = i < 6;   // 최근 6건은 Active
      const at = fmt(d);
      const cleared = active ? '' : fmt(new Date(d.getTime() + (10 + Math.floor(Math.random() * 400)) * 60000));
      rows.push({
        no: i + 1, ten: s[0], sev: s[1], src: s[2], fac: s[3], name: s[4], h: s[5],
        at: at, cleared: cleared, ackBy: s[5] === '미확인' ? '' : ['관리자', '박당직', '이엔지'][i % 3],
        desc: s[4] + '\nRule  : (조건식 스냅샷)\nValue : (발생값)',
      });
    });
    return rows;
  })();

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function sevBadge(k) { const p = SEV[k]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }
  function dash(v) { return v ? v : '<span style="color:#c9ced4;">-</span>'; }
  function dOf(s) { return (s || '').slice(0, 10); }
  function shift(days) {
    const p = TODAY.split('-');
    const dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    dt.setUTCDate(dt.getUTCDate() - days);
    return dt.toISOString().slice(0, 10);
  }

  let page = 1;
  function ahPreset(k) { el('fFrom').value = shift(k === '30d' ? 29 : 6); el('fTo').value = TODAY; page = 1; ahRender(); }

  function filtered() {
    const ft = el('fTenant').value, from = el('fFrom').value, to = el('fTo').value;
    const sv = el('fSev').value, sr = el('fSrc').value, hs = el('fHs').value, st = el('fState').value;
    const kw = (el('q').value || '').trim();
    return DATA.filter(function (r) {
      const state = r.cleared ? 'cleared' : 'active';
      return (!ft || r.ten === ft) && (!from || dOf(r.at) >= from) && (!to || dOf(r.at) <= to)
        && (!sv || r.sev === sv) && (!sr || r.src === sr) && (!hs || r.h === hs) && (!st || state === st)
        && (!kw || r.fac.indexOf(kw) >= 0 || r.name.indexOf(kw) >= 0);
    }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  }

  function ahRender() {
    const rows = filtered();
    const total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page), total);
    el('ahBody').innerHTML = rows.length
      ? rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(function (r, i) {
          return '<tr data-no="' + r.no + '" onclick="ahRowClick(' + r.no + ')">'
            + '<td>' + ((page - 1) * PAGE_SIZE + i + 1) + '</td>'
            + '<td>' + r.ten + '</td>'
            + '<td><span class="src src-' + r.src + '">' + r.src + '</span></td>'
            + '<td>' + sevBadge(r.sev) + '</td>'
            + '<td>' + r.at + '</td>'
            + '<td>' + dash(r.cleared) + '</td>'
            + '<td><span class="ahh-st ' + (r.cleared ? 'cleared' : 'active') + '">' + (r.cleared ? 'Cleared' : 'Active') + '</span></td>'
            + '<td class="cell-l">' + r.fac + '</td>'
            + '<td class="cell-l">' + esc(r.name) + '</td>'
            + '<td><span class="status-badge ' + (HS[r.h] || 'status-pending') + '">' + r.h + '</span></td>'
            + '<td>' + dash(r.ackBy) + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="11" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';
    el('ahCount').textContent = rows.length;

    let pg = '<button class="page-btn"' + (page === 1 ? ' disabled' : '') + ' data-p="' + (page - 1) + '">&#9664;</button>';
    for (let p = 1; p <= total; p++) pg += '<button class="page-btn' + (p === page ? ' active' : '') + '" data-p="' + p + '">' + p + '</button>';
    pg += '<button class="page-btn"' + (page === total ? ' disabled' : '') + ' data-p="' + (page + 1) + '">&#9654;</button>';
    el('ahPaging').innerHTML = pg;
  }

  function ahReset() {
    ['fTenant', 'fSev', 'fSrc', 'fHs', 'fState'].forEach(function (id) { el(id).value = ''; });
    el('q').value = '';
    ahPreset('30d');
  }

  function ahRowClick(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    document.querySelectorAll('#ahBody tr').forEach(function (tr) { tr.classList.toggle('selected', Number(tr.dataset.no) === no); });
    function row(k, v, multi, cls) {
      return '<div class="dv-row' + (multi ? ' multi' : '') + '"><span class="dv-label">' + k + '</span>'
        + '<div class="dv-box' + (multi ? ' multi' : '') + (cls ? ' ' + cls : '') + '">' + v + '</div></div>';
    }
    el('ahdTitle').textContent = r.name;
    el('ahdBody').innerHTML = '<div class="dv">'
      + '<div class="dv-group">' + row('고객사', r.ten) + row('Source', '<span class="src src-' + r.src + '">' + r.src + '</span>')
        + row('심각도', sevBadge(r.sev)) + row('상태', '<span class="ahh-st ' + (r.cleared ? 'cleared' : 'active') + '">' + (r.cleared ? 'Cleared' : 'Active') + '</span>')
        + row('발생시각', r.at) + row('해제시각', dash(r.cleared)) + '</div>'
      + '<div class="dv-group">' + row('대상 설비', r.fac) + row('알람명', esc(r.name))
        + row('Description', esc(r.desc), true, 'am-desc') + '</div>'
      + '<div class="dv-group">' + row('처리상태', '<span class="status-badge ' + (HS[r.h] || 'status-pending') + '">' + r.h + '</span>')
        + (r.ackBy ? row('확인자', r.ackBy) : '') + '</div>'
      + '</div>';
    el('ahMask').classList.add('show');
    el('ahDrawer').classList.add('show');
  }
  function ahDetailClose() { el('ahMask').classList.remove('show'); el('ahDrawer').classList.remove('show'); }

  // ---- init ----
  el('fTenant').innerHTML = '<option value="">전체</option>' + TENANTS.map(function (t) { return '<option>' + t + '</option>'; }).join('');
  el('ahPaging').addEventListener('click', function (e) {
    const b = e.target.closest('.page-btn'); if (!b || b.disabled) return;
    page = Number(b.dataset.p); ahRender();
  });
  ahPreset('30d');

  window.ahRender = ahRender;
  window.ahReset = ahReset;
  window.ahPreset = ahPreset;
  window.ahRowClick = ahRowClick;
  window.ahDetailClose = ahDetailClose;

})();
