// 내 계정 페이지 스크립트 (목업 데이터)
// 화면: (헤더 사용자 메뉴) > 내 계정   (호스트/고객 공통)
// ※ 모드에 따라 표시되는 계정이 다르다 (호스트=관리자 / 고객=고객사 담당자).
(function () {

  const HOST = (window.umsIsHost !== false);

  // 로그인 사용자 (목업). 호스트/고객 모드별로 다른 계정을 보여준다.
  const ME = HOST
    ? { uname: 'admin', first: '',     last: 'admin', email: 'admin@eteverse.com',
        phone: '02-1234-5678', avatar: '관', color: '#3498db', tfa: false }
    : { uname: 'it.sejong', first: '지훈', last: '오', email: 'it@sejongcloud.co.kr',
        phone: '044-123-4567', avatar: '고', color: '#27ae60', tfa: false };

  // 인증 앱 설정 키 (목업 — 실제로는 서버가 발급한다)
  const AUTH_KEY = 'JBSW Y3DP EHPK 3PXP';

  function el(id) { return document.getElementById(id); }

  // 안내문 자리에 검증 메시지를 띄운다. text 가 비면 기본 안내로 되돌린다.
  function msg(id, text, base) {
    const e = el(id);
    e.textContent = text || base;
    e.classList.toggle('err', !!text);
  }

  // ---- 좌측 카테고리 ----
  function selectSec(sec) {
    document.querySelectorAll('.set-nav-item').forEach(function (e) {
      e.classList.toggle('active', e.dataset.sec === sec);
    });
    document.querySelectorAll('.set-sec').forEach(function (e) {
      e.classList.toggle('show', e.id === 'sec-' + sec);
    });
  }

  // ---- 프로필 사진 ----
  function avatarType() {
    const c = document.querySelector('input[name="avatarType"]:checked');
    return c ? c.value : 'default';
  }

  function syncAvatarUpload() {
    el('avatarFile').disabled = (avatarType() !== 'upload');
  }

  function saveAvatar() {
    const label = { default: '기본 아바타', gravatar: 'Gravatar', upload: '업로드한 이미지' }[avatarType()];
    if (avatarType() === 'upload' && !el('avatarFile').value) {
      umsToast('업로드할 이미지를 선택하세요.');
      return;
    }
    umsToast('프로필 사진을 ' + label + '(으)로 변경했습니다. (목업)');
  }

  // ---- 비밀번호 변경 ----
  const P_BASE = '영문·숫자를 포함해 8자 이상이어야 합니다.';

  function savePassword() {
    const cur = el('p-current').value;
    const nw  = el('p-new').value;
    const cf  = el('p-confirm').value;

    if (!cur)              { msg('p-msg', '현재 비밀번호를 입력하세요.', P_BASE); return; }
    if (!nw)               { msg('p-msg', '새 비밀번호를 입력하세요.', P_BASE); return; }
    if (nw.length < 8)     { msg('p-msg', '새 비밀번호는 8자 이상이어야 합니다.', P_BASE); return; }
    if (!/[A-Za-z]/.test(nw) || !/[0-9]/.test(nw)) {
      msg('p-msg', '새 비밀번호에 영문과 숫자를 모두 포함하세요.', P_BASE); return;
    }
    if (nw === cur)        { msg('p-msg', '현재 비밀번호와 다른 값을 입력하세요.', P_BASE); return; }
    if (nw !== cf)         { msg('p-msg', '새 비밀번호가 일치하지 않습니다.', P_BASE); return; }

    msg('p-msg', '', P_BASE);
    ['p-current', 'p-new', 'p-confirm'].forEach(function (id) { el(id).value = ''; });
    umsToast('비밀번호를 변경했습니다. (목업)');
  }

  // ---- 개인 정보 ----
  const U_BASE = '이메일을 바꾸면 새 주소로 인증 메일이 발송됩니다.';

  function fillProfile() {
    el('u-name').value  = ME.uname;
    el('u-first').value = ME.first;
    el('u-last').value  = ME.last;
    el('u-email').value = ME.email;
    el('u-phone').value = ME.phone;
  }

  function saveProfile() {
    const uname = el('u-name').value.trim();
    const email = el('u-email').value.trim();

    if (!uname) { msg('u-msg', '사용자명을 입력하세요.', U_BASE); return; }
    if (!email) { msg('u-msg', '이메일을 입력하세요.', U_BASE); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg('u-msg', '이메일 형식이 올바르지 않습니다.', U_BASE); return;
    }

    msg('u-msg', '', U_BASE);
    const changedEmail = (email !== ME.email);
    ME.uname = uname; ME.email = email;
    ME.first = el('u-first').value.trim();
    ME.last  = el('u-last').value.trim();
    ME.phone = el('u-phone').value.trim();

    umsToast(changedEmail
      ? '개인 정보를 저장했습니다. ' + email + ' 로 인증 메일을 발송했습니다. (목업)'
      : '개인 정보를 저장했습니다. (목업)');
  }

  // ---- 인증 앱 (2FA) ----
  const A_BASE = '앱에 표시된 6자리 숫자를 입력하세요.';

  function renderAuth() {
    el('authState').innerHTML = ME.tfa
      ? '<span class="ma-state on">사용 중</span>'
      : '<span class="ma-state off">사용 안 함</span>';
    el('authSetup').hidden = ME.tfa;
    el('authDone').hidden  = !ME.tfa;
  }

  function enableAuthApp() {
    const code = el('authCode').value.trim();
    if (!code)                { msg('authMsg', '확인 코드를 입력하세요.', A_BASE); return; }
    if (!/^[0-9]{6}$/.test(code)) { msg('authMsg', '6자리 숫자를 입력하세요.', A_BASE); return; }

    msg('authMsg', '', A_BASE);
    el('authCode').value = '';
    ME.tfa = true;
    renderAuth();
    umsToast('인증 앱을 활성화했습니다. (목업)');
  }

  function disableAuthApp() {
    ME.tfa = false;
    renderAuth();
    umsToast('인증 앱을 비활성화했습니다. (목업)');
  }

  // ---- 초기화 ----
  el('curAvatar').textContent = ME.avatar;
  el('curAvatar').style.background = ME.color;
  el('authKey').textContent = AUTH_KEY;
  fillProfile();
  renderAuth();
  syncAvatarUpload();

  document.querySelectorAll('input[name="avatarType"]').forEach(function (r) {
    r.addEventListener('change', syncAvatarUpload);
  });

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.selectSec       = selectSec;
  window.saveAvatar      = saveAvatar;
  window.savePassword    = savePassword;
  window.saveProfile     = saveProfile;
  window.enableAuthApp   = enableAuthApp;
  window.disableAuthApp  = disableAuthApp;

})();
