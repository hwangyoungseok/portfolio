// GW 관리 페이지 스크립트 (목업 데이터)
// 화면: GW > GW 관리
(function () {

  const DATA = [
    { no: 1, name: 'GW-IDC-01',
      instances: [
        { id: 101, ip: '10.10.1.5', hcPort: 7801, hostname: 'GWHOST-01', role: 'Active', priority: 1, lastHb: '방금' },
      ],
      ver: 'v2.3.1', date: '2023-04-10', use: true,  hasToken: true,
      memo: '', ups: [
        { name: 'UPS-1F-A', link: 'on' }, { name: 'UPS-1F-B', link: 'on' }, { name: 'UPS-1F-C', link: 'on' } ] },
    { no: 2, name: 'GW-IDC-02',
      instances: [
        { id: 102, ip: '10.10.2.5', hcPort: 7801, hostname: 'GWHOST-02', role: 'Active', priority: 1, lastHb: '방금' },
        { id: 103, ip: '10.10.2.6', hcPort: 7801, hostname: 'GWHOST-02B', role: 'Standby', priority: 2, lastHb: '방금' },
      ],
      ver: 'v2.3.1', date: '2022-11-28', use: true,  hasToken: true,
      memo: '', ups: [
        { name: 'UPS-2F-A', link: 'on' }, { name: 'UPS-2F-B', link: 'off' } ] },
    { no: 3, name: 'GW-DR-01',
      instances: [
        { id: 104, ip: '10.20.1.5', hcPort: 7801, hostname: 'GWHOST-03', role: 'Active', priority: 1, lastHb: '1분 전' },
      ],
      ver: 'v2.2.8', date: '2024-02-05', use: true,  hasToken: true,
      memo: '2024년 하반기 원격 점검 완료', ups: [
        { name: 'UPS-DR-1', link: 'on' }, { name: 'UPS-DR-2', link: 'on' } ] },
    { no: 4, name: 'GW-DR-02',
      instances: [],
      ver: '-', date: '2026-08-20', use: false, hasToken: false,
      memo: '설치 예정 (인증키 미발급)', ups: [] },
  ];
  let seq = DATA.length;
  let instSeq = 104;

  function roleBadgeHtml(role) {
    return role === 'Active' ? '<span class="gh-role-badge active">Active</span>' : '<span class="gh-role-badge standby">Standby · 백업</span>';
  }
  function hostDisplay(r) {
    if (!r.instances.length) return '-';
    const act = r.instances.filter(function (i) { return i.role === 'Active'; })[0] || r.instances[0];
    return act.hostname ? (act.hostname + ' / ' + act.ip) : (act.ip + ' (접속 대기중)');
  }
  function instCountText(r) {
    if (!r.instances.length) return '-';
    return r.instances.length + '대' + (r.instances.length > 1 ? ' (HA)' : '');
  }
  function instSearchText(r) {
    return r.instances.map(function (i) { return i.hostname + ' ' + i.ip; }).join(' ');
  }

  const USE_BADGE = { 1: ['badge-on', '사용'], 0: ['badge-off', '미사용'] };
  const LINK_BADGE = { on: ['badge-on', '온라인'], off: ['badge-off', '오프라인'] };

  function badge(map, key) {
    const pair = map[key] || ['badge-off', key];
    return '<span class="badge ' + pair[0] + '">' + pair[1] + '</span>';
  }

  function renderGrid() {
    const kw    = (document.getElementById('q').value || '').trim();
    const fUse  = document.getElementById('fUse').value;

    const rows = DATA.filter(function (r) {
      return (!kw || r.name.indexOf(kw) >= 0 || instSearchText(r).indexOf(kw) >= 0)
        && (fUse === '' || String(r.use ? 1 : 0) === fUse);
    });

    document.getElementById('gridBody').innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr data-no="' + r.no + '" onclick="gwRowClick(' + r.no + ')">'
            + '<td>' + r.no + '</td>'
            + '<td>' + r.name + '</td>'
            + '<td>' + hostDisplay(r) + '</td>'
            + '<td>' + instCountText(r) + '</td>'
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

  function gwInstRender(r) {
    const body = document.getElementById('gwInstBody');
    body.innerHTML = r.instances.length ? r.instances.map(function (ins, i) {
      return '<tr onclick="gwInstEditOpen(' + i + ')">'
        + '<td>' + ins.id + '</td>'
        + '<td>' + ins.ip + '</td>'
        + '<td>' + ins.hcPort + '</td>'
        + '<td style="text-align:left;">' + (ins.hostname || '<span style="color:#98a2b3;">접속 대기중</span>') + '</td>'
        + '<td>' + roleBadgeHtml(ins.role) + '</td>'
        + '<td><input type="number" class="gh-pri-input" min="1" data-idx="' + i + '" value="' + ins.priority + '" onclick="event.stopPropagation()"></td>'
        + '<td>' + (ins.lastHb || '-') + '</td>'
        + '<td><button class="icon-btn del" title="삭제" onclick="event.stopPropagation();gwInstAskDelete(' + i + ')">&#10005;</button></td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="8" style="padding:16px;color:#98a2b3;">등록된 인스턴스가 없습니다.</td></tr>';
  }
  function gwInstApply() {
    const r = DATA.filter(function (x) { return x.no === detailNo; })[0];
    if (!r || !r.instances.length) return;
    document.querySelectorAll('#gwInstBody .gh-pri-input').forEach(function (inp) {
      const i = Number(inp.dataset.idx), v = Number(inp.value);
      if (r.instances[i] && v > 0) r.instances[i].priority = v;
    });
    umsToast('인스턴스 설정을 즉시 반영했습니다. (각 인스턴스가 새 상위목록을 받으면 Role을 다시 판단해요)');
  }

  let delInstIdx = null;
  function gwInstAskDelete(idx) { delInstIdx = idx; show('instDelModal'); }
  function gwInstDelModalClose() { hide('instDelModal'); }
  function gwInstDelete() {
    const r = DATA.filter(function (x) { return x.no === detailNo; })[0];
    if (!r || delInstIdx == null) return;
    const removed = r.instances.splice(delInstIdx, 1)[0];
    delInstIdx = null;
    hide('instDelModal');
    gwInstRender(r);
    renderGrid();
    umsToast('인스턴스 ' + removed.id + '번을 삭제했습니다.');
  }

  let editingInstIdx = null;

  function gwInstOpen() {
    editingInstIdx = null;
    document.getElementById('instModalTitle').textContent = '인스턴스 등록';
    document.getElementById('im-ip').value = '';
    document.getElementById('im-priority').value = '';
    document.getElementById('im-port').value = '';
    show('instModal');
  }
  function gwInstEditOpen(idx) {
    const r = DATA.filter(function (x) { return x.no === detailNo; })[0];
    if (!r || !r.instances[idx]) return;
    editingInstIdx = idx;
    const ins = r.instances[idx];
    document.getElementById('instModalTitle').textContent = '인스턴스 수정 (번호 ' + ins.id + ')';
    document.getElementById('im-ip').value = ins.ip;
    document.getElementById('im-priority').value = ins.priority;
    document.getElementById('im-port').value = ins.hcPort;
    show('instModal');
  }
  function gwInstModalClose() { hide('instModal'); }
  function gwInstSave() {
    const r = DATA.filter(function (x) { return x.no === detailNo; })[0];
    if (!r) return;
    const ip = document.getElementById('im-ip').value.trim();
    const priority = Number(document.getElementById('im-priority').value);
    const port = Number(document.getElementById('im-port').value);
    if (!ip) { umsToast('IP를 입력하세요.'); return; }
    if (!priority || priority < 1) { umsToast('Priority를 입력하세요.'); return; }
    if (!port || port < 1) { umsToast('HealthCheckPort를 입력하세요.'); return; }

    if (editingInstIdx != null) {
      const ins = r.instances[editingInstIdx];
      ins.ip = ip; ins.priority = priority; ins.hcPort = port;
      hide('instModal');
      gwInstRender(r);
      renderGrid();
      umsToast('인스턴스 ' + ins.id + '번 정보를 수정했습니다.');
    } else {
      instSeq += 1;
      r.instances.push({ id: instSeq, ip: ip, hcPort: port, hostname: '', role: 'Standby', priority: priority, lastHb: '' });
      hide('instModal');
      gwInstRender(r);
      renderGrid();
      umsToast('인스턴스 ' + instSeq + '번이 등록되었습니다. 이 번호를 Token과 함께 GW 로컬 설정에 입력하세요.');
    }
  }

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

    gwInstRender(r);

    document.getElementById('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('버전', r.ver) + dvRow('등록일', r.date) + dvRow('사용여부', badge(USE_BADGE, r.use ? 1 : 0)))
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

    const memo = document.getElementById('m-memo').value.trim();

    if (editingNo == null) {
      seq += 1;
      DATA.unshift({ no: seq, name: name, instances: [], ver: '-', date: new Date().toISOString().slice(0, 10), use: true, hasToken: true, memo: memo, ups: [] });
    } else {
      const r = DATA.filter(function (x) { return x.no === editingNo; })[0];
      if (r) { r.name = name; r.memo = memo; r.hasToken = true; }
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
  window.gwInstApply   = gwInstApply;
  window.gwInstOpen    = gwInstOpen;
  window.gwInstEditOpen = gwInstEditOpen;
  window.gwInstModalClose = gwInstModalClose;
  window.gwInstSave    = gwInstSave;
  window.gwInstAskDelete = gwInstAskDelete;
  window.gwInstDelModalClose = gwInstDelModalClose;
  window.gwInstDelete  = gwInstDelete;

})();
