// GW 상태 모니터링 페이지 스크립트 (목업 데이터)
// 화면: GW > GW 상태 모니터링
(function () {

  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];

  const DATA = [
    { name: 'GW-IDC-01', loc: '본사 IDC-1F', state: 'on',  last: '2026-09-03 09:41:07', delay: 0, ups: 3 },
    { name: 'GW-IDC-02', loc: '본사 IDC-2F', state: 'off', last: '2026-09-03 08:12:20', delay: 47, ups: 2 },
    { name: 'GW-DR-01',  loc: '판교 DR센터',   state: 'on',  last: '2026-09-03 09:41:11', delay: 0, ups: 2 },
    { name: 'GW-DR-02',  loc: '판교 DR센터',   state: 'off', last: '-',                  delay: 0, ups: 0 },
  ];

  const STATE_BADGE = { on: ['badge-on', 'On'], off: ['badge-off', 'Off'] };

  function badge(map, key) {
    const pair = map[key] || ['badge-off', key];
    return '<span class="badge ' + pair[0] + '">' + pair[1] + '</span>';
  }

  function fillSelect(id, arr, withAll) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  function renderGrid() {
    const fLoc   = document.getElementById('fLoc').value;
    const fState = document.getElementById('fState').value;

    const rows = DATA.filter(function (r) {
      return (!fLoc || r.loc === fLoc) && (!fState || r.state === fState);
    });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr class="' + (r.state === 'off' ? 'row-off' : '') + '" onclick="gwStatusRowClick(\'' + r.name + '\')">'
            + '<td>' + r.name + '</td>'
            + '<td>' + r.loc + '</td>'
            + '<td>' + badge(STATE_BADGE, r.state) + '</td>'
            + '<td>' + r.last + '</td>'
            + '<td>' + (r.state === 'off' && r.ups === 0 ? '-' : r.delay + '건') + '</td>'
            + '<td>' + r.ups + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="6" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = rows.length;
  }

  function gwStatusRowClick(name) {
    const r = DATA.filter(function (x) { return x.name === name; })[0];
    if (!r) return;
    if (r.state === 'off') {
      umsToast(name + ' 오프라인 — 관련 알람/티켓으로 이동합니다.');
      setTimeout(function () { window.location.href = '../alarm/alarm-history.html'; }, 700);
    } else {
      umsToast(name + '은(는) 정상 통신 중입니다.');
    }
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function nowStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' '
      + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  let refreshTimer = null;

  function tick() {
    DATA.forEach(function (r) {
      if (r.state === 'on') {
        r.last = nowStr();
        r.delay = Math.random() < 0.85 ? 0 : Math.floor(Math.random() * 3) + 1;
      }
    });
    renderGrid();
    document.getElementById('lastRefresh').textContent = '마지막 새로고침 ' + nowStr();
  }

  function toggleAutoRefresh() {
    const on = document.getElementById('autoRefresh').checked;
    if (on) {
      tick();
      refreshTimer = setInterval(tick, 5000);
      umsToast('자동 새로고침이 켜졌습니다. (5초 주기)');
    } else {
      clearInterval(refreshTimer);
      refreshTimer = null;
      document.getElementById('lastRefresh').textContent = '';
      umsToast('자동 새로고침이 꺼졌습니다.');
    }
  }

  // ---- 초기화 ----
  fillSelect('fLoc', LOCATIONS, true);
  renderGrid();

  window.renderGrid         = renderGrid;
  window.gwStatusRowClick   = gwStatusRowClick;
  window.toggleAutoRefresh  = toggleAutoRefresh;

})();
