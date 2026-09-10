// 알람 조회 (호스트) — 전 고객사 현재 활성 알람 현황
// 화면: 알람 > 알람 조회 (호스트)
(function () {

  const TENANTS = ['세종클라우드', '대한IDC', '한빛전산', '미래테크'];
  const SEV = { crit: ['badge-crit', 'Critical'], major: ['badge-major', 'Major'], minor: ['badge-minor', 'Minor'], warn: ['badge-warn', 'Warning'] };
  const HS = { '미확인': 'status-pending', '확인': 'status-progress', '조치완료': 'status-done' };
  const PAGE_SIZE = 10;

  // 목업: 현재 Active 알람
  const DATA = [
    { no: 1, ten: '세종클라우드', sev: 'crit', at: '2026-09-10 09:41:12', fac: 'UPS-2F-B', name: '출력전압 상하한 초과', h: '미확인' },
    { no: 2, ten: '세종클라우드', sev: 'major', at: '2026-09-10 09:18:47', fac: 'CH-2F-01', name: '압축기 트립', h: '확인' },
    { no: 3, ten: '세종클라우드', sev: 'major', at: '2026-09-10 08:57:03', fac: 'BAT-1F-A-01', name: '셀 온도 초과', h: '미확인' },
    { no: 4, ten: '세종클라우드', sev: 'minor', at: '2026-09-10 08:12:22', fac: 'PDU-1F-01', name: '분기전류 경고', h: '확인' },
    { no: 5, ten: '세종클라우드', sev: 'warn', at: '2026-09-10 07:40:10', fac: 'UPS-1F-B', name: '출력 부하율 85% 초과', h: '조치완료' },
    { no: 6, ten: '대한IDC', sev: 'crit', at: '2026-09-10 09:29:12', fac: 'GW-DR-02', name: 'GW 서버 응답 없음 (SYSTEM)', h: '미확인' },
    { no: 7, ten: '대한IDC', sev: 'minor', at: '2026-09-10 07:20:10', fac: 'PDU-A-03', name: '입력전압 변동', h: '확인' },
    { no: 8, ten: '한빛전산', sev: 'crit', at: '2026-09-10 09:41:09', fac: 'BAT-2F-01', name: '배터리 스트링 전압 저하', h: '미확인' },
    { no: 9, ten: '한빛전산', sev: 'crit', at: '2026-09-10 09:05:33', fac: 'UPS-1F-A', name: '배터리 자가진단 실패', h: '확인' },
    { no: 10, ten: '한빛전산', sev: 'major', at: '2026-09-10 08:30:41', fac: 'GW-01', name: '미전송 버퍼 적체', h: '확인' },
    { no: 11, ten: '한빛전산', sev: 'major', at: '2026-09-10 07:50:33', fac: 'GW-02', name: 'GW 연결끊김 (SYSTEM)', h: '미확인' },
    { no: 12, ten: '한빛전산', sev: 'minor', at: '2026-09-10 06:44:12', fac: 'CH-01', name: '냉수 출구온도 12℃ 초과', h: '조치완료' },
    { no: 13, ten: '한빛전산', sev: 'warn', at: '2026-09-10 05:10:00', fac: 'PDU-1F-02', name: '분기전류 경고', h: '조치완료' },
    { no: 14, ten: '미래테크', sev: 'major', at: '2026-09-10 09:36:40', fac: 'CH-MAIN', name: '냉수 유량 저하', h: '미확인' },
    { no: 15, ten: '미래테크', sev: 'minor', at: '2026-09-10 08:02:14', fac: 'PDU-MAIN-01', name: '온도 센서 이상', h: '확인' },
    { no: 16, ten: '미래테크', sev: 'warn', at: '2026-09-10 06:15:26', fac: 'GW-SUB', name: 'HEARTBEAT 지연', h: '미확인' },
  ];

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function sevBadge(k) { const p = SEV[k]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }

  let comboTen = '';   // 콤보 선택 고객사 ('' = 전체)
  let cardTen = '';    // 전체 상태에서 카드 클릭한 고객사
  let page = 1;

  function effTen() { return comboTen || cardTen; }

  function counts(ten) {
    const c = { crit: 0, major: 0, minor: 0, warn: 0, total: 0 };
    DATA.forEach(function (r) { if (r.ten === ten) { c[r.sev]++; c.total++; } });
    return c;
  }

  function renderCards() {
    const list = (comboTen ? [comboTen] : TENANTS.slice())
      .map(function (t) { return { ten: t, c: counts(t) }; })
      .sort(function (a, b) { return b.c.total - a.c.total; });
    const box = el('ovCards');
    if (!list.length) { box.innerHTML = '<div class="ov-cards-empty">고객사가 없습니다.</div>'; return; }
    box.innerHTML = list.map(function (x) {
      const sel = effTen() === x.ten;
      const cell = function (cls, label, n) {
        return '<div class="ov-sev ' + (n ? cls : 'zero') + '"><span class="n">' + n + '</span>' + label + '</div>';
      };
      return '<div class="ov-card' + (sel ? ' sel' : '') + '" onclick="ovCardClick(\'' + x.ten + '\')">'
        + '<div class="ov-card-name">' + x.ten + '<span class="ov-card-total">활성 <b>' + x.c.total + '</b></span></div>'
        + '<div class="ov-sevs">'
        + cell('s-crit', 'Crit', x.c.crit) + cell('s-major', 'Maj', x.c.major)
        + cell('s-minor', 'Min', x.c.minor) + cell('s-warn', 'Warn', x.c.warn)
        + '</div></div>';
    }).join('');
    updateNav();
  }

  function updateNav() {
    const box = el('ovCards');
    const over = box.scrollWidth > box.clientWidth + 4;
    el('ovPrev').disabled = !over || box.scrollLeft <= 2;
    el('ovNext').disabled = !over || box.scrollLeft + box.clientWidth >= box.scrollWidth - 2;
  }
  function ovScroll(dir) { el('ovCards').scrollBy({ left: dir * 240, behavior: 'smooth' }); setTimeout(updateNav, 260); }

  function renderList() {
    const t = effTen();
    const rows = DATA.filter(function (r) { return !t || r.ten === t; })
      .sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    const total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page), total);
    el('ovBody').innerHTML = rows.length
      ? rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(function (r, i) {
          return '<tr><td>' + ((page - 1) * PAGE_SIZE + i + 1) + '</td>'
            + '<td>' + r.ten + '</td><td>' + sevBadge(r.sev) + '</td><td>' + r.at + '</td>'
            + '<td>' + r.fac + '</td><td>' + esc(r.name) + '</td>'
            + '<td><span class="status-badge ' + (HS[r.h] || 'status-pending') + '">' + r.h + '</span></td></tr>';
        }).join('')
      : '<tr><td colspan="7" style="padding:30px;color:#98a2b3;">활성 알람이 없습니다.</td></tr>';
    el('ovCount').textContent = rows.length;

    const tag = el('ovFilterTag');
    if (t) { tag.hidden = false; tag.textContent = t + ' 만 표시' + (!comboTen ? ' (카드 클릭)' : ''); }
    else tag.hidden = true;

    let pg = '<button class="page-btn"' + (page === 1 ? ' disabled' : '') + ' data-p="' + (page - 1) + '">&#9664;</button>';
    for (let p = 1; p <= total; p++) pg += '<button class="page-btn' + (p === page ? ' active' : '') + '" data-p="' + p + '">' + p + '</button>';
    pg += '<button class="page-btn"' + (page === total ? ' disabled' : '') + ' data-p="' + (page + 1) + '">&#9654;</button>';
    el('ovPaging').innerHTML = pg;
  }

  function renderSummary() {
    const total = DATA.length;
    const cr = DATA.filter(function (r) { return r.sev === 'crit'; }).length;
    el('ovSummary').innerHTML = '전 고객사 활성 <b>' + total + '</b>건 · Critical <b style="color:#c0392b">' + cr + '</b>건';
  }

  function ovComboChange() {
    comboTen = el('fTenant').value;
    cardTen = '';
    page = 1;
    renderCards(); renderList();
  }
  function ovCardClick(ten) {
    if (comboTen) return;                 // 콤보로 고정된 상태면 카드 클릭 무시
    cardTen = (cardTen === ten) ? '' : ten; // 같은 카드 다시 누르면 해제
    page = 1;
    renderCards(); renderList();
  }

  // ---- init ----
  el('fTenant').innerHTML = '<option value="">전체</option>' + TENANTS.map(function (t) { return '<option>' + t + '</option>'; }).join('');
  el('ovPaging').addEventListener('click', function (e) {
    const b = e.target.closest('.page-btn'); if (!b || b.disabled) return;
    page = Number(b.dataset.p); renderList();
  });
  el('ovCards').addEventListener('scroll', updateNav);
  window.addEventListener('resize', updateNav);
  renderSummary();
  renderCards();
  renderList();

  window.ovComboChange = ovComboChange;
  window.ovCardClick = ovCardClick;
  window.ovScroll = ovScroll;

})();
