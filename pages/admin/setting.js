// 설정 페이지 스크립트 (목업)
// 화면: 관리 > 설정   (호스트/고객 공통)
(function () {

  // 카테고리별 마지막으로 본 탭 기억
  const lastTab = { account: 'acc-general', identity: 'id-password' };

  function selectSec(sec) {
    document.querySelectorAll('.set-nav-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.sec === sec);
    });
    document.querySelectorAll('.set-sec').forEach(function (el) {
      el.classList.toggle('show', el.id === 'sec-' + sec);
    });
    if (lastTab[sec]) selectTab(sec, lastTab[sec]);
  }

  function selectTab(sec, tab) {
    lastTab[sec] = tab;
    const root = document.getElementById('sec-' + sec);
    if (!root) return;
    root.querySelectorAll('.tab').forEach(function (el) {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    root.querySelectorAll('.set-pane').forEach(function (el) {
      el.classList.toggle('show', el.id === 'pane-' + tab);
    });
  }

  function save(what) {
    umsToast(what.replace(/&gt;/g, '>') + ' 설정을 저장했습니다.');
  }

  function testMail() {
    const from = (document.getElementById('m-from').value || '').trim();
    if (!from) { umsToast('발신자 주소를 입력하세요.'); return; }
    umsToast('테스트 메일을 발송했습니다. (목업)');
  }

  // SMTP 인증 사용 토글 라벨
  const mAuth = document.getElementById('m-auth');
  if (mAuth) {
    mAuth.addEventListener('change', function () {
      document.getElementById('m-authText').textContent = this.checked ? '사용' : '사용 안 함';
      ['m-user', 'm-pass'].forEach(function (id) {
        document.getElementById(id).disabled = !mAuth.checked;
      });
    });
  }

  // 캡차 사용 여부에 따라 하위 입력 활성/비활성
  const captcha = document.getElementById('s-captcha');
  function syncCaptcha() {
    const on = captcha.checked;
    ['s-captcha-vendor', 's-captcha-site', 's-captcha-secret',
     's-captcha-login', 's-captcha-signup', 's-captcha-pw']
      .forEach(function (id) { document.getElementById(id).disabled = !on; });
  }
  if (captcha) { captcha.addEventListener('change', syncCaptcha); syncCaptcha(); }

  // 계정 잠금 사용 여부에 따라 하위 입력 활성/비활성
  const lock = document.getElementById('l-enabled');
  function syncLock() {
    ['l-count', 'l-min'].forEach(function (id) {
      document.getElementById(id).disabled = !lock.checked;
    });
  }
  if (lock) { lock.addEventListener('change', syncLock); syncLock(); }

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.selectSec = selectSec;
  window.selectTab = selectTab;
  window.save      = save;
  window.testMail  = testMail;

})();
