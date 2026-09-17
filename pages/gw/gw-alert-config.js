// GW 알림 설정 (호스트 전역) — 고정 이벤트별로 규칙(사용여부/임계값/대상 그룹/채널)을 여러 개 등록 가능
// 화면: GW > GW 알림 설정   참고: GW_개발요구사항.txt [12]
// 대상 그룹 목록은 [알람 > 알람 알림 그룹 관리](action-group-host.js)에서 등록한 그룹과 동일(페이지 독립이라 목업은 각자 보유)
(function () {

  const LS_KEY = 'ums.gwAlertConfig.host';
  const GROUPS = ['NOC팀', '기술지원팀', '고객지원팀', '장애대응반'];

  // 고정 이벤트 종류 (코드 enum 과 동일해야 함)
  const EVENTS = [
    { key: 'GwDisconnected', name: 'GW 연결끊김', unit: null },
    { key: 'GwReconnected', name: 'GW 연결복구', unit: null },
    { key: 'GwServerResourceHigh', name: '서버 리소스 임계 초과', unit: '%', def: 90 },
    { key: 'GwHeartbeatDelay', name: 'HEARTBEAT 지연', unit: '초', def: 90 },
    { key: 'GwBufferHigh', name: '미전송 버퍼 적체', unit: '건', def: 1000 },
  ];

  // 이벤트당 규칙 배열 (같은 이벤트에 대상그룹이 다른 규칙 여러 개 등록 가능)
  const DEFAULT = {
    GwDisconnected: [{ on: true, th: null, grp: 'NOC팀', ch: ['email', 'sms'] }],
    GwReconnected: [{ on: false, th: null, grp: 'NOC팀', ch: ['email'] }],
    GwServerResourceHigh: [{ on: true, th: 90, grp: '기술지원팀', ch: ['email'] }],
    GwHeartbeatDelay: [{ on: true, th: 90, grp: 'NOC팀', ch: ['email'] }],
    GwBufferHigh: [{ on: false, th: 1000, grp: '기술지원팀', ch: ['email'] }],
  };

  function el(id) { return document.getElementById(id); }
  function load() {
    try { const j = JSON.parse(localStorage.getItem(LS_KEY)); if (j) return j; } catch (e) { /* noop */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  let cfg = load();

  function ruleRowHtml(ev, r, i) {
    const th = ev.unit
      ? '<div class="gac-th"><input type="number" min="0" id="th-' + ev.key + '-' + i + '" value="' + (r.th == null ? (ev.def || '') : r.th) + '"><span class="u">' + ev.unit + '</span></div>'
      : '<div class="gac-th na">해당 없음</div>';
    const grp = '<select class="search-select gac-grp" id="grp-' + ev.key + '-' + i + '">'
      + GROUPS.map(function (g) { return '<option' + (g === r.grp ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select>';
    const ch = ['email', 'sms', 'kakao'].map(function (k) {
      const lb = k === 'email' ? '이메일' : k === 'sms' ? 'SMS' : '카카오';
      return '<label><input type="checkbox" class="ch-' + ev.key + '-' + i + '" value="' + k + '"' + ((r.ch || []).indexOf(k) >= 0 ? ' checked' : '') + '> ' + lb + '</label>';
    }).join('');
    return '<tr class="' + (r.on ? '' : 'off') + '">'
      + '<td><label class="switch"><input type="checkbox" class="gac-r-on" id="on-' + ev.key + '-' + i + '"' + (r.on ? ' checked' : '') + '><span class="switch-track"></span></label></td>'
      + '<td>' + th + '</td><td>' + grp + '</td><td><div class="gac-chs">' + ch + '</div></td>'
      + '<td><button class="gac-r-del" type="button" onclick="gacDelRule(\'' + ev.key + '\', ' + i + ')" title="삭제">&#10005;</button></td>'
      + '</tr>';
  }

  function cardHtml(ev) {
    const rules = cfg[ev.key] || [];
    const rows = rules.length ? rules.map(function (r, i) { return ruleRowHtml(ev, r, i); }).join('')
      : '<tr class="gac-rule-empty"><td colspan="5">등록된 규칙이 없습니다.</td></tr>';
    return '<div class="gac-card">'
      + '<div class="gac-card-head"><span class="gac-card-title">' + ev.name + '</span></div>'
      + '<div class="grid-scroll"><table class="grid-table gac-rule-table"><thead><tr>'
      + '<th style="width:56px;">사용</th><th style="width:150px;">임계값</th><th style="width:200px;">대상 그룹</th><th>채널</th><th style="width:44px;"></th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<div class="gac-card-foot"><button class="btn" type="button" onclick="gacAddRule(\'' + ev.key + '\')">+ 규칙 추가</button></div>'
      + '</div>';
  }

  function render() {
    el('gacList').innerHTML = EVENTS.map(cardHtml).join('');
    el('gacList').querySelectorAll('.gac-r-on').forEach(function (t) {
      t.addEventListener('change', function () { t.closest('tr').classList.toggle('off', !t.checked); });
    });
  }

  // 현재 화면(DOM)에 입력된 값을 cfg 구조로 거둬들임 (add/delete/save 전에 항상 먼저 호출 — 입력값 보존)
  function collect() {
    const out = {};
    EVENTS.forEach(function (ev) {
      const rules = cfg[ev.key] || [];
      out[ev.key] = rules.map(function (r, i) {
        const thEl = el('th-' + ev.key + '-' + i);
        return {
          on: el('on-' + ev.key + '-' + i).checked,
          th: thEl ? (thEl.value === '' ? null : Number(thEl.value)) : null,
          grp: el('grp-' + ev.key + '-' + i).value,
          ch: Array.prototype.filter.call(document.querySelectorAll('.ch-' + ev.key + '-' + i), function (c) { return c.checked; })
            .map(function (c) { return c.value; }),
        };
      });
    });
    return out;
  }

  function gacAddRule(key) {
    cfg = collect();
    const ev = EVENTS.filter(function (e) { return e.key === key; })[0];
    cfg[key] = cfg[key] || [];
    cfg[key].push({ on: true, th: (ev && ev.unit) ? (ev.def || null) : null, grp: GROUPS[0], ch: ['email'] });
    render();
  }
  function gacDelRule(key, idx) {
    cfg = collect();
    cfg[key].splice(idx, 1);
    render();
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
  window.gacAddRule = gacAddRule;
  window.gacDelRule = gacDelRule;

})();
