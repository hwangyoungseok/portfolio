// 템플릿 관리 페이지 스크립트 (목업 데이터)
// 화면: 관리 > 템플릿 관리   (호스트/고객 공통)
(function () {

  const LAYOUT = 'Abp.StandardEmailTemplates.Layout';

  // 템플릿 본문 (컬처별). 없는 컬처는 기본 컬처 본문을 보여준다.
  const BODY = {
    'Abp.Account.EmailConfirmationLink': {
      ko: '<h3>{{model.name}} 님, 반갑습니다.</h3>\n<p>아래 링크를 눌러 이메일 주소를 인증해 주세요.</p>\n<p><a href="{{model.link}}">이메일 인증하기</a></p>\n<p>본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>',
      en: '<h3>Hello {{model.name}},</h3>\n<p>Please confirm your email address by clicking the link below.</p>\n<p><a href="{{model.link}}">Confirm email</a></p>' },
    'Abp.Account.EmailSecurityCode': {
      ko: '<p>{{model.name}} 님, 보안 코드는 아래와 같습니다.</p>\n<h2>{{model.code}}</h2>\n<p>이 코드는 5분간 유효합니다.</p>' },
    'Abp.Account.PasswordResetLink': {
      ko: '<h3>비밀번호 재설정</h3>\n<p>{{model.name}} 님, 아래 링크에서 새 비밀번호를 설정하실 수 있습니다.</p>\n<p><a href="{{model.link}}">비밀번호 재설정</a></p>\n<p>링크는 24시간 후 만료됩니다.</p>' },
    'Abp.Account.UserInvitation': {
      ko: '<h3>UMS 초대</h3>\n<p>{{model.tenantName}} 에서 {{model.email}} 님을 UMS 사용자로 초대했습니다.</p>\n<p><a href="{{model.link}}">초대 수락하고 비밀번호 설정하기</a></p>' },
    'Abp.StandardEmailTemplates.Layout': {
      ko: '<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"></head>\n<body style="font-family:Malgun Gothic,sans-serif;">\n  <div style="max-width:600px;margin:0 auto;padding:24px;">\n    {{content}}\n    <hr>\n    <p style="color:#98a2b3;font-size:11px;">본 메일은 발신 전용입니다. © ETEVERSE EPA</p>\n  </div>\n</body>\n</html>' },
    'Abp.StandardEmailTemplates.Message': {
      ko: '<p>{{model.message}}</p>' },
    'EmailNotifierLayout': {
      en: '<div style="padding:16px;">\n  {{content}}\n</div>' },
    'Eteverse.Abp.Gdpr.PrivacyPolicy': {
      ko: '<h2>개인정보 처리방침</h2>\n<p>ETEVERSE EPA(이하 "회사")는 이용자의 개인정보를 중요시하며 관련 법령을 준수합니다.</p>\n<h3>1. 수집하는 개인정보 항목</h3>\n<p>이름, 이메일 주소, 전화번호, 소속 조직</p>\n<h3>2. 보유 및 이용 기간</h3>\n<p>서비스 이용 계약 종료 시까지</p>' },
    'Eteverse.Abp.Gdpr.TermsOfService': {
      ko: '<h2>이용약관</h2>\n<h3>제1조 (목적)</h3>\n<p>본 약관은 회사가 제공하는 UMS 통합 관리 시스템의 이용 조건 및 절차를 규정함을 목적으로 합니다.</p>\n<h3>제2조 (정의)</h3>\n<p>"테넌트"란 서비스를 계약하여 이용하는 고객사를 말합니다.</p>' },
    'Eteverse.Abp.MultiTenancy.NewTenantRegistered': {
      ko: '<h3>신규 테넌트 등록 알림</h3>\n<p>테넌트: {{model.tenantName}}</p>\n<p>에디션: {{model.editionName}}</p>\n<p>등록 일시: {{model.creationTime}}</p>' },
    'Ums.Alarm.MailNotification': {
      ko: '<h3>[{{model.severity}}] 알람 발생</h3>\n<table>\n  <tr><td>설비</td><td>{{model.deviceName}}</td></tr>\n  <tr><td>위치</td><td>{{model.location}}</td></tr>\n  <tr><td>내용</td><td>{{model.message}}</td></tr>\n  <tr><td>발생 시각</td><td>{{model.occurredAt}}</td></tr>\n</table>\n<p><a href="{{model.link}}">알람 상세 보기</a></p>' },
    'Ums.Alarm.SmsNotification': {
      ko: '[UMS] {{model.severity}} {{model.deviceName}} - {{model.message}} ({{model.occurredAt}})' },
    'Ums.Ticket.Assigned': {
      ko: '<h3>티켓이 배정되었습니다</h3>\n<p>티켓 번호: {{model.ticketNo}}</p>\n<p>제목: {{model.title}}</p>\n<p>담당자: {{model.assignee}}</p>\n<p><a href="{{model.link}}">티켓 열기</a></p>' },
    'Ums.Ticket.Closed': {
      ko: '<h3>티켓이 처리 완료되었습니다</h3>\n<p>티켓 번호: {{model.ticketNo}}</p>\n<p>처리 결과: {{model.result}}</p>\n<p>처리 일시: {{model.closedAt}}</p>' },
    'Ums.Report.MonthlyUsage': {
      ko: '<h3>{{model.month}} 월간 사용량 리포트</h3>\n<p>{{model.tenantName}} 님의 지난 달 설비 운영 요약입니다.</p>\n<p>총 알람 {{model.alarmCount}}건 / 처리 티켓 {{model.ticketCount}}건</p>\n<p><a href="{{model.link}}">리포트 내려받기</a></p>' },
  };

  // 템플릿에서 쓸 수 있는 변수 (편집 모달 하단 안내)
  const VARS = {
    'Abp.Account.EmailConfirmationLink': ['{{model.name}}', '{{model.link}}'],
    'Abp.Account.EmailSecurityCode':     ['{{model.name}}', '{{model.code}}'],
    'Abp.Account.PasswordResetLink':     ['{{model.name}}', '{{model.link}}'],
    'Abp.Account.UserInvitation':        ['{{model.tenantName}}', '{{model.email}}', '{{model.link}}'],
    'Abp.StandardEmailTemplates.Layout': ['{{content}}'],
    'Abp.StandardEmailTemplates.Message': ['{{model.message}}'],
    'EmailNotifierLayout':               ['{{content}}'],
    'Eteverse.Abp.MultiTenancy.NewTenantRegistered': ['{{model.tenantName}}', '{{model.editionName}}', '{{model.creationTime}}'],
    'Ums.Alarm.MailNotification': ['{{model.severity}}', '{{model.deviceName}}', '{{model.location}}', '{{model.message}}', '{{model.occurredAt}}', '{{model.link}}'],
    'Ums.Alarm.SmsNotification':  ['{{model.severity}}', '{{model.deviceName}}', '{{model.message}}', '{{model.occurredAt}}'],
    'Ums.Ticket.Assigned':        ['{{model.ticketNo}}', '{{model.title}}', '{{model.assignee}}', '{{model.link}}'],
    'Ums.Ticket.Closed':          ['{{model.ticketNo}}', '{{model.result}}', '{{model.closedAt}}'],
    'Ums.Report.MonthlyUsage':    ['{{model.month}}', '{{model.tenantName}}', '{{model.alarmCount}}', '{{model.ticketCount}}', '{{model.link}}'],
  };

  const DATA = [
    { no: 1,  name: 'Abp.Account.EmailConfirmationLink',            label: '이메일 인증 이메일',            inline: 1, layout: LAYOUT, culture: '' },
    { no: 2,  name: 'Abp.Account.EmailSecurityCode',                label: '이메일 보안 코드',              inline: 1, layout: LAYOUT, culture: '' },
    { no: 3,  name: 'Abp.Account.PasswordResetLink',                label: '비밀번호 재설정 이메일',        inline: 1, layout: LAYOUT, culture: '' },
    { no: 4,  name: 'Abp.Account.UserInvitation',                   label: '사용자 초대 이메일',            inline: 1, layout: LAYOUT, culture: '' },
    { no: 5,  name: 'Abp.StandardEmailTemplates.Layout',            label: 'Default email layout template', inline: 1, layout: '',     culture: '' },
    { no: 6,  name: 'Abp.StandardEmailTemplates.Message',           label: 'Simple message template for emails', inline: 1, layout: LAYOUT, culture: '' },
    { no: 7,  name: 'EmailNotifierLayout',                          label: '이메일 알림 템플릿',            inline: 1, layout: '',     culture: 'en' },
    { no: 8,  name: 'Eteverse.Abp.Gdpr.PrivacyPolicy',              label: '개인정보 처리방침',             inline: 0, layout: '',     culture: '' },
    { no: 9,  name: 'Eteverse.Abp.Gdpr.TermsOfService',             label: '이용약관',                      inline: 0, layout: '',     culture: '' },
    { no: 10, name: 'Eteverse.Abp.MultiTenancy.NewTenantRegistered', label: '테넌트 생성 알림',             inline: 0, layout: LAYOUT, culture: '' },
    { no: 11, name: 'Ums.Alarm.MailNotification',                   label: '알람 발생 메일',                inline: 0, layout: LAYOUT, culture: '' },
    { no: 12, name: 'Ums.Alarm.SmsNotification',                    label: '알람 발생 SMS',                 inline: 0, layout: '',     culture: '' },
    { no: 13, name: 'Ums.Ticket.Assigned',                          label: '티켓 배정 알림',                inline: 0, layout: LAYOUT, culture: '' },
    { no: 14, name: 'Ums.Ticket.Closed',                            label: '티켓 처리 완료 알림',           inline: 0, layout: LAYOUT, culture: '' },
    { no: 15, name: 'Ums.Report.MonthlyUsage',                      label: '월간 사용량 리포트',            inline: 0, layout: LAYOUT, culture: '' },
  ];

  let sortKey = 'name';
  let sortAsc = true;
  let page    = 1;
  let editNo  = null;

  function row(no) { return DATA.filter(function (r) { return r.no === no; })[0]; }

  function bodyOf(name, culture) {
    const b = BODY[name] || {};
    return b[culture] !== undefined ? b[culture]
      : (b.ko !== undefined ? b.ko : (b.en !== undefined ? b.en : ''));
  }

  // ---- 목록 ----
  function filtered() {
    const kw = (document.getElementById('q').value || '').trim();
    const rows = DATA.filter(function (r) {
      return !kw || r.name.toLowerCase().indexOf(kw.toLowerCase()) >= 0 || r.label.indexOf(kw) >= 0;
    });
    rows.sort(function (a, b) {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
    });
    return rows;
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
          return '<tr data-no="' + r.no + '">'
            + '<td><button class="btn-edit" onclick="editOpen(' + r.no + ')">콘텐츠 편집</button></td>'
            + '<td><span class="tpl-key">' + r.name + '</span></td>'
            + '<td>' + r.label + '</td>'
            + '<td>' + (r.inline ? '예' : '아니요') + '</td>'
            + '<td>' + (r.layout ? '<span class="tpl-layout">' + r.layout + '</span>' : '') + '</td>'
            + '<td>' + (r.culture || '') + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="6" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('pInfo').textContent = total
      ? (from + 1) + ' - ' + (from + cur.length) + ' / 전체 ' + total + ' 건'
      : '0 - 0 / 전체 0 건';
    document.getElementById('pNo').textContent = page;

    document.querySelectorAll('#tplTable th.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortAsc ? 'asc' : 'desc');
    });
  }

  function sortBy(key) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    page = 1;
    renderGrid();
  }

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

  // ---- 콘텐츠 편집 ----
  function editOpen(no) {
    const r = row(no);
    if (!r) return;
    editNo = no;
    document.getElementById('eTitle').textContent = r.label + ' — 콘텐츠 편집';
    document.getElementById('e-name').textContent   = r.name;
    document.getElementById('e-layout').textContent = r.layout || '(없음)';
    document.getElementById('e-culture').value = r.culture === 'en' ? 'en' : 'ko';
    document.getElementById('e-body').value = bodyOf(r.name, document.getElementById('e-culture').value);

    const vars = VARS[r.name] || [];
    document.getElementById('e-vars').innerHTML = vars.length
      ? vars.map(function (v) {
          return '<span class="var-chip" onclick="insertVar(\'' + v + '\')">' + v + '</span>';
        }).join(' ')
      : '<span class="tpl-none">없음</span>';

    show('editModal');
  }

  function cultureChange() {
    const r = row(editNo);
    if (!r) return;
    document.getElementById('e-body').value = bodyOf(r.name, document.getElementById('e-culture').value);
  }

  // 변수 칩을 누르면 커서 위치에 삽입
  function insertVar(v) {
    const ta = document.getElementById('e-body');
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + v + ta.value.substring(e);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + v.length;
  }

  function restoreDefault() {
    const r = row(editNo);
    if (!r) return;
    document.getElementById('e-body').value = bodyOf(r.name, document.getElementById('e-culture').value);
    umsToast('기본값으로 복원했습니다. (목업)');
  }

  function contentSave() {
    hide('editModal');
    umsToast('저장되었습니다.');
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  renderGrid();

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide('editModal'); });

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid     = renderGrid;
  window.sortBy         = sortBy;
  window.go             = go;
  window.editOpen       = editOpen;
  window.cultureChange  = cultureChange;
  window.insertVar      = insertVar;
  window.restoreDefault = restoreDefault;
  window.contentSave    = contentSave;
  window.editModalClose = function () { hide('editModal'); };

})();
