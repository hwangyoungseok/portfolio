// GW 관리 페이지 스크립트 (목업 데이터)
// 화면: GW > GW 관리
(function () {

  const LOCATIONS  = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];
  const INSTALL_POS = ['랙 A-01', '랙 A-02', '랙 B-01', '랙 B-02', '서버실 콘솔'];

  const DATA = [
    { no: 1, name: 'GW-IDC-01', loc: '본사 IDC-1F', pos: '랙 A-01', host: 'GWHOST-01 / 10.10.1.5', ver: 'v2.3.1', date: '2023-04-10', use: true,  hasToken: true,
      memo: '', ups: [
        { name: 'UPS-1F-A', link: 'on' }, { name: 'UPS-1F-B', link: 'on' }, { name: 'UPS-1F-C', link: 'on' } ] },
    { no: 2, name: 'GW-IDC-02', loc: '본사 IDC-2F', pos: '랙 B-01', host: 'GWHOST-02 / 10.10.2.5', ver: 'v2.3.1', date: '2022-11-28', use: true,  hasToken: true,
      memo: '', ups: [
        { name: 'UPS-2F-A', link: 'on' }, { name: 'UPS-2F-B', link: 'off' } ] },
    { no: 3, name: 'GW-DR-01',  loc: '판교 DR센터',   pos: '서버실 콘솔', host: 'GWHOST-03 / 10.20.1.5', ver: 'v2.2.8', date: '2024-02-05', use: true,  hasToken: true,
      memo: '2024년 하반기 원격 점검 완료', ups: [
        { name: 'UPS-DR-1', link: 'on' }, { name: 'UPS-DR-2', link: 'on' } ] },
    { no: 4, name: 'GW-DR-02',  loc: '판교 DR센터',   pos: '랙 B-02', host: '-', ver: '-', date: '2026-08-20', use: false, hasToken: false,
      memo: '설치 예정 (인증키 미발급)', ups: [] },
  ];
  let seq = DATA.length;

  const USE_BADGE = { 1: ['badge-on', '사용'], 0: ['badge-off', '미사용'] };
  const LINK_BADGE = { on: ['badge-on', '온라인'], off: ['badge-off', '오프라인'] };

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
    const kw    = (document.getElementById('q').value || '').trim();
    const fLoc  = document.getElementById('fLoc').value;
    const fUse  = document.getElementById('fUse').value;

    const rows = DATA.filter(function (r) {
      return (!kw || r.name.indexOf(kw) >= 0 || r.host.indexOf(kw) >= 0)
        && (!fLoc || r.loc === fLoc)
        && (fUse === '' || String(r.use ? 1 : 0) === fUse);
    });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr data-no="' + r.no + '" onclick="gwRowClick(' + r.no + ')">'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.name + '</td>'
            + '<td>' + r.loc + '</td>'
            + '<td>' + r.host + '</td>'
            + '<td>' + r.ver + '</td>'
            + '<td>' + r.date + '</td>'
            + '<td>' + r.ups.length + '</td>'
            + '<td>' + badge(USE_BADGE, r.use ? 1 : 0) + '</td>'
            + '<td><span class="col-act">'
            +   '<button class="icon-btn" title="수정" onclick="event.stopPropagation();gwOpen(' + r.no + ')">&#9998;</button>'
            +   '<button class="icon-btn del" title="삭제" onclick="event.stopPropagation();gwAskDelete(' + r.no + ')">&#128465;</button>'
            + '</span></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="9" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    document.getElementById('gridCount').textContent = rows.length;
  }

  function resetSearch() {
    document.getElementById('fLoc').value = '';
    document.getElementById('fUse').value = '';
    document.getElementById('q').value = '';
    renderGrid();
  }

  let detailNo = null;

  function gwRowClick(no) {
    document.querySelectorAll('#gridBody tr').forEach(function (tr) {
      tr.classList.toggle('selected', Number(tr.dataset.no) === no);
    });
    gwDetailOpen(no);
  }

  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }

  function gwDetailOpen(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    detailNo = no;
    document.getElementById('dTitle').textContent = r.name + ' 상세';

    const upsTable = r.ups.length
      ? '<table class="dv-mini-table"><thead><tr><th>UPS명</th><th>통신상태</th></tr></thead><tbody>'
        + r.ups.map(function (u) { return '<tr><td>' + u.name + '</td><td>' + badge(LINK_BADGE, u.link) + '</td></tr>'; }).join('')
        + '</tbody></table>'
      : '<span style="color:#8a97a5;">소속된 UPS가 없습니다.</span>';

    document.getElementById('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('위치', r.loc) + dvRow('설치위치', r.pos) + dvRow('설치 PC 정보', r.host)
          + dvRow('버전', r.ver) + dvRow('등록일', r.date) + dvRow('사용여부', badge(USE_BADGE, r.use ? 1 : 0)))
      + dvGroup(
          dvRow('소속 UPS 목록 (' + r.ups.length + '대)', upsTable, true))
      + dvGroup(
          dvRow('비고', r.memo || '<span style="color:#8a97a5;">-</span>', true))
      + '</div>';
    document.getElementById('gwMask').classList.add('show');
    document.getElementById('gwDrawer').classList.add('show');
  }

  function gwDetailClose() {
    document.getElementById('gwMask').classList.remove('show');
    document.getElementById('gwDrawer').classList.remove('show');
  }

  function gwEditFromDetail() {
    const no = detailNo;
    gwDetailClose();
    gwOpen(no);
  }

  let editingNo = null;

  function gwOpen(no) {
    const r = (no == null) ? null : DATA.filter(function (x) { return x.no === no; })[0];
    editingNo = no;
    document.getElementById('mTitle').textContent = r ? 'GW 수정' : 'GW 등록';
    document.getElementById('m-name').value = r ? r.name : '';
    document.getElementById('m-loc').value  = r ? r.loc  : LOCATIONS[0];
    document.getElementById('m-pos').value  = r ? r.pos  : INSTALL_POS[0];
    document.getElementById('m-memo').value = r ? r.memo : '';

    const tokenEl = document.getElementById('m-token');
    tokenEl.classList.remove('issued');
    if (r && r.hasToken) {
      tokenEl.value = '인증키 발급됨 (보안상 재표시되지 않습니다)';
      tokenEl.dataset.hasToken = '1';
      document.getElementById('m-token-btn').textContent = '재발급';
    } else {
      tokenEl.value = '';
      tokenEl.placeholder = '발급 버튼을 클릭하여 인증키/토큰을 발급받으세요.';
      tokenEl.dataset.hasToken = '0';
      document.getElementById('m-token-btn').textContent = '발급';
    }
    show('gwModal');
  }

  function genToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return 'GWK-' + s;
  }

  function gwIssueToken() {
    const tokenEl = document.getElementById('m-token');
    if (tokenEl.dataset.hasToken === '1') {
      show('reissueModal');
    } else {
      gwIssueTokenConfirmed();
    }
  }

  function gwIssueTokenConfirmed() {
    hide('reissueModal');
    const tokenEl = document.getElementById('m-token');
    tokenEl.value = genToken();
    tokenEl.classList.add('issued');
    tokenEl.dataset.hasToken = '1';
    document.getElementById('m-token-btn').textContent = '재발급';
    umsToast('인증키가 발급되었습니다. 최초 1회만 표시되니 지금 복사해 두세요.');
  }

  function gwSave() {
    const name = document.getElementById('m-name').value.trim();
    if (!name) { umsToast('GW명을 입력하세요.'); return; }
    const tokenEl = document.getElementById('m-token');
    if (tokenEl.dataset.hasToken !== '1') { umsToast('인증키/토큰을 발급받으세요.'); return; }

    const loc  = document.getElementById('m-loc').value;
    const pos  = document.getElementById('m-pos').value;
    const memo = document.getElementById('m-memo').value.trim();

    if (editingNo == null) {
      seq += 1;
      DATA.unshift({ no: seq, name: name, loc: loc, pos: pos, host: '-', ver: '-', date: new Date().toISOString().slice(0, 10), use: true, hasToken: true, memo: memo, ups: [] });
    } else {
      const r = DATA.filter(function (x) { return x.no === editingNo; })[0];
      if (r) { r.name = name; r.loc = loc; r.pos = pos; r.memo = memo; r.hasToken = true; }
    }

    hide('gwModal');
    renderGrid();
    umsToast('저장되었습니다.');
  }

  let deleteNo = null;

  function gwAskDelete(no) { deleteNo = no; show('delModal'); }
  function gwDelete() {
    const idx = DATA.findIndex(function (x) { return x.no === deleteNo; });
    if (idx >= 0) DATA.splice(idx, 1);
    hide('delModal');
    if (detailNo === deleteNo) gwDetailClose();
    deleteNo = null;
    renderGrid();
    umsToast('삭제되었습니다.');
  }

  function show(id) { document.getElementById(id).classList.add('show'); }
  function hide(id) { document.getElementById(id).classList.remove('show'); }

  // ---- 초기화 ----
  fillSelect('fLoc', LOCATIONS, true);
  fillSelect('m-loc', LOCATIONS, false);
  fillSelect('m-pos', INSTALL_POS, false);
  renderGrid();

  // 인라인 onclick 에서 호출되므로 전역 노출
  window.renderGrid   = renderGrid;
  window.resetSearch  = resetSearch;
  window.gwRowClick   = gwRowClick;
  window.gwOpen        = gwOpen;
  window.gwIssueToken  = gwIssueToken;
  window.gwIssueTokenConfirmed = gwIssueTokenConfirmed;
  window.reissueModalClose = function () { hide('reissueModal'); };
  window.gwSave        = gwSave;
  window.gwAskDelete   = gwAskDelete;
  window.gwDelete      = gwDelete;
  window.gwModalClose  = function () { hide('gwModal'); };
  window.delModalClose = function () { hide('delModal'); };
  window.gwDetailClose = gwDetailClose;
  window.gwEditFromDetail = gwEditFromDetail;

})();
