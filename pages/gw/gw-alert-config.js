// GW 알림 설정 (호스트 전역) — 고정 이벤트별 사용여부/임계값/대상 그룹/채널
// 화면: GW > GW 알림 설정   참고: GW_개발요구사항.txt [12]
// 저장: umsGwAlertRule (프로토타입은 localStorage: ums.gwAlertConfig.host)
(function () {

  const LS_KEY = 'ums.gwAlertConfig.host';
  const GROUPS = ['관제팀', '야간당직팀', '전기설비 1차대응', '공조 담당', '관리자 전체'];

  // 고정 이벤트 종류 (코드 enum 과 동일해야 함)
  const EVENTS = [
    { key: 'GwDisconnected', name: 'GW 연결끊김', desc: 'GW 연결이 끊어졌을 때', unit: null },
    { key: 'GwReconnected', name: 'GW 연결복구', desc: '끊겼던 GW 가 다시 연결됐을 때', unit: null },
    { key: 'GwServerResourceHigh', name: '서버 리소스 임계 초과', desc: 'GW 서버 CPU/메모리/디스크 사용률 초과', unit: '%', def: 90 },
    { key: 'GwHeartbeatDelay', name: 'HEARTBEAT 지연', desc: '마지막 HEARTBEAT 수신 후 경과', unit: '초', def: 90 },
    { key: 'GwBufferHigh', name: '미전송 버퍼 적체', desc: '미전송 계측 버퍼 건수 초과', unit: '건', def: 1000 },
  ];

  const DEFAULT = {
    GwDisconnected: { on: true, th: null, grp: '관제팀', ch: ['email', 'sms'] },
    GwReconnected: { on: false, th: null, grp: '관제팀', ch: ['email'] },
    GwServerResourceHigh: { on: true, th: 90, grp: '관제팀', ch: ['email'] },
    GwHeartbeatDelay: { on: true, th: 90, grp: '관제팀', ch: ['email'] },
    GwBufferHigh: { on: false, th: 1000, grp: '관제팀', ch: ['email'] },
  };

  function el(id) { return document.getElementById(id); }
  function load() {
    try { const j = JSON.parse(localStorage.getItem(LS_KEY)); if (j) return j; } catch (e) { /* noop */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  let cfg = load();

  function render() {
    el('gacBody').innerHTML = EVENTS.map(function (ev) {
      const c = cfg[ev.key] || {};
      const th = ev.unit
        ? '<div class="gac-th"><input type="number" min="0" id="th-' + ev.key + '" value="' + (c.th == null ? (ev.def || '') : c.th) + '"><span class="u">' + ev.unit + '</span></div>'
        : '<div class="gac-th na">해당 없음</div>';
      const grp = '<select class="search-select gac-grp" id="grp-' + ev.key + '">'
        + GROUPS.map(function (g) { return '<option' + (g === c.grp ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select>';
      const ch = ['email', 'sms', 'kakao'].map(function (k) {
        const lb = k === 'email' ? '이메일' : k === 'sms' ? 'SMS' : '카카오';
        return '<label><input type="checkbox" class="ch-' + ev.key + '" value="' + k + '"' + ((c.ch || []).indexOf(k) >= 0 ? ' checked' : '') + '> ' + lb + '</label>';
      }).join('');
      return '<tr class="' + (c.on ? '' : 'off') + '" data-key="' + ev.key + '">'
        + '<td><label class="switch"><input type="checkbox" class="gac-on" id="on-' + ev.key + '"' + (c.on ? ' checked' : '') + '><span class="switch-track"></span></label></td>'
        + '<td class="gac-ev"><div class="gac-ev-name">' + ev.name + '</div><div class="gac-ev-desc">' + ev.desc + '</div></td>'
        + '<td>' + th + '</td><td>' + grp + '</td><td><div class="gac-chs">' + ch + '</div></td>'
        + '</tr>';
    }).join('');
    // 사용 토글 → 행 흐리게
    el('gacBody').querySelectorAll('.gac-on').forEach(function (t) {
      t.addEventListener('change', function () { t.closest('tr').classList.toggle('off', !t.checked); });
    });
  }

  function collect() {
    const out = {};
    EVENTS.forEach(function (ev) {
      const thEl = el('th-' + ev.key);
      out[ev.key] = {
        on: el('on-' + ev.key).checked,
        th: thEl ? (thEl.value === '' ? null : Number(thEl.value)) : null,
        grp: el('grp-' + ev.key).value,
        ch: Array.prototype.filter.call(document.querySelectorAll('.ch-' + ev.key), function (c) { return c.checked; })
          .map(function (c) { return c.value; }),
      };
    });
    return out;
  }

  function gacSave() {
    cfg = collect();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cfg));
      const t = new Date();
      const p = function (n) { return String(n).padStart(2, '0'); };
      el('gacSaved').textContent = '저장됨 ' + p(t.getHours()) + ':' + p(t.getMinutes()) + ':' + p(t.getSeconds());
      umsToast('GW 알림 설정을 저장했습니다.');
    } catch (e) { umsToast('저장 실패'); }
  }
  function gacReset() {
    cfg = JSON.parse(JSON.stringify(DEFAULT));
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* noop */ }
    render();
    umsToast('기본값으로 되돌렸습니다.');
  }

  render();
  window.gacSave = gacSave;
  window.gacReset = gacReset;

})();
