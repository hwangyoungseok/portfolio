// 알람 알림 설정 (호스트 전역) — 심각도별로 규칙(사용여부/대상 그룹/채널)을 여러 개 등록 가능
// 화면: 알람 > 알람 알림 설정   참고: GW 알림 설정과 동일 패턴(고정 항목 + 규칙 여러 개, 조건식 빌더 없음)
// 대상 그룹 목록은 [알람 알림 그룹 관리](action-group-host.js)에서 등록한 그룹과 동일(페이지 독립이라 목업은 각자 보유)
(function () {

  const LS_KEY = 'ums.alarmNotifyConfig.host';
  const GROUPS = ['NOC팀', '기술지원팀', '고객지원팀', '장애대응반'];

  // 고정 심각도 (알람 심각도 enum과 동일해야 함)
  const SEVS = [
    { key: 'Critical', name: 'Critical', cls: 'crit' },
    { key: 'Major', name: 'Major', cls: 'major' },
    { key: 'Minor', name: 'Minor', cls: 'minor' },
    { key: 'Warning', name: 'Warning', cls: 'warn' },
  ];

  // 심각도당 규칙 배열 (같은 심각도에 대상그룹이 다른 규칙 여러 개 등록 가능)
  const DEFAULT = {
    Critical: [{ on: true, grp: 'NOC팀', ch: ['email', 'sms'] }, { on: true, grp: '장애대응반', ch: ['sms'] }],
    Major: [{ on: true, grp: '기술지원팀', ch: ['email'] }],
    Minor: [{ on: false, grp: '기술지원팀', ch: ['email'] }],
    Warning: [{ on: false, grp: 'NOC팀', ch: ['email'] }],
  };

  function el(id) { return document.getElementById(id); }
  function load() {
    try { const j = JSON.parse(localStorage.getItem(LS_KEY)); if (j) return j; } catch (e) { /* noop */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  let cfg = load();

  function ruleRowHtml(sv, r, i) {
    const grp = '<select class="search-select anh-grp" id="grp-' + sv.key + '-' + i + '">'
      + GROUPS.map(function (g) { return '<option' + (g === r.grp ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select>';
    const ch = ['email', 'sms', 'kakao'].map(function (k) {
      const lb = k === 'email' ? '이메일' : k === 'sms' ? 'SMS' : '카카오';
      return '<label><input type="checkbox" class="ch-' + sv.key + '-' + i + '" value="' + k + '"' + ((r.ch || []).indexOf(k) >= 0 ? ' checked' : '') + '> ' + lb + '</label>';
    }).join('');
    return '<tr class="' + (r.on ? '' : 'off') + '">'
      + '<td><label class="switch"><input type="checkbox" class="anh-r-on" id="on-' + sv.key + '-' + i + '"' + (r.on ? ' checked' : '') + '><span class="switch-track"></span></label></td>'
      + '<td>' + grp + '</td><td><div class="anh-chs">' + ch + '</div></td>'
      + '<td><button class="anh-r-del" type="button" onclick="anhDelRule(\'' + sv.key + '\', ' + i + ')" title="삭제">&#10005;</button></td>'
      + '</tr>';
  }

  function cardHtml(sv) {
    const rules = cfg[sv.key] || [];
    const rows = rules.length ? rules.map(function (r, i) { return ruleRowHtml(sv, r, i); }).join('')
      : '<tr class="anh-rule-empty"><td colspan="4">등록된 규칙이 없습니다.</td></tr>';
    return '<div class="anh-card">'
      + '<div class="anh-card-head"><span class="anh-sev-badge ' + sv.cls + '">' + sv.name + '</span></div>'
      + '<div class="grid-scroll"><table class="grid-table anh-rule-table"><thead><tr>'
      + '<th style="width:56px;">사용</th><th style="width:220px;">대상 그룹</th><th>채널</th><th style="width:44px;"></th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<div class="anh-card-foot"><button class="btn" type="button" onclick="anhAddRule(\'' + sv.key + '\')">+ 규칙 추가</button></div>'
      + '</div>';
  }

  function render() {
    el('anhList').innerHTML = SEVS.map(cardHtml).join('');
    el('anhList').querySelectorAll('.anh-r-on').forEach(function (t) {
      t.addEventListener('change', function () { t.closest('tr').classList.toggle('off', !t.checked); });
    });
  }

  // 현재 화면(DOM)에 입력된 값을 cfg 구조로 거둬들임 (add/delete/save 전에 항상 먼저 호출 — 입력값 보존)
  function collect() {
    const out = {};
    SEVS.forEach(function (sv) {
      const rules = cfg[sv.key] || [];
      out[sv.key] = rules.map(function (r, i) {
        return {
          on: el('on-' + sv.key + '-' + i).checked,
          grp: el('grp-' + sv.key + '-' + i).value,
          ch: Array.prototype.filter.call(document.querySelectorAll('.ch-' + sv.key + '-' + i), function (c) { return c.checked; })
            .map(function (c) { return c.value; }),
        };
      });
    });
    return out;
  }

  function anhAddRule(key) {
    cfg = collect();
    cfg[key] = cfg[key] || [];
    cfg[key].push({ on: true, grp: GROUPS[0], ch: ['email'] });
    render();
  }
  function anhDelRule(key, idx) {
    cfg = collect();
    cfg[key].splice(idx, 1);
    render();
  }

  function anhSave() {
    cfg = collect();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cfg));
      const t = new Date();
      const p = function (n) { return String(n).padStart(2, '0'); };
      el('anhSaved').textContent = '저장됨 ' + p(t.getHours()) + ':' + p(t.getMinutes()) + ':' + p(t.getSeconds());
      umsToast('알람 알림 설정을 저장했습니다.');
    } catch (e) { umsToast('저장 실패'); }
  }
  function anhReset() {
    cfg = JSON.parse(JSON.stringify(DEFAULT));
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* noop */ }
    render();
    umsToast('기본값으로 되돌렸습니다.');
  }

  render();
  window.anhSave = anhSave;
  window.anhReset = anhReset;
  window.anhAddRule = anhAddRule;
  window.anhDelRule = anhDelRule;

})();
