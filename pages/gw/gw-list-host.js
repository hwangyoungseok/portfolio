// GW 관리 (호스트) — 전 고객사 GW 조회 + 버전(목표버전/업데이트모드) 관리 + HA 인스턴스 관리
// 화면: GW > GW 관리 (호스트)   참고: [GW 버전관리] 화면에서 등록한 버전을 여기서 GW별 목표버전으로 지정
// GW HA 구조: 논리 GW(umsGateway) 1개 = 인스턴스(umsGwInstance, 실제 설치 서버) 1~N개.
//   Role(Active/Standby)은 각 인스턴스가 자기 상위 우선순위(Priority) 인스턴스들을 헬스체크해서 자율 판단
//   (여기서 Role을 직접 편집할 수 없는 이유). 관리자는 Priority만 조정하고 [설정 즉시 반영]으로 바로 push.
(function () {

  const TENANTS = ['세종클라우드', '대한IDC', '한빛전산', '미래테크'];
  // [GW 버전관리] 화면의 등록 버전 목록 목업 (페이지가 독립적이라 여기서도 동일 목록을 들고 있음)
  const VERSIONS = ['2.3.1', '2.2.8', '2.1.4'];

  const DATA = [
    { no: 1, tenant: '세종클라우드', name: 'GW-IDC-01', ver: 'v2.3.1', use: true,
      instances: [
        { id: 201, ip: '10.10.1.5', hcPort: 7801, hostname: 'GWHOST-01', role: 'Active', priority: 1, lastHb: '방금' },
        { id: 202, ip: '10.10.1.6', hcPort: 7801, hostname: 'GWHOST-01B', role: 'Standby', priority: 2, lastHb: '방금' },
      ],
      targetVer: '2.3.1', mode: 'Manual', updStatus: 'Success', updAt: '2026-08-21 03:05', updNote: '정상 완료',
      fac: [{ n: 'UPS-1F-A', l: 'on' }, { n: 'UPS-1F-B', l: 'on' }, { n: 'PDU-1F-01', l: 'on' }] },
    { no: 2, tenant: '세종클라우드', name: 'GW-IDC-02', ver: 'v2.3.1', use: true,
      instances: [{ id: 203, ip: '10.10.2.5', hcPort: 7801, hostname: 'GWHOST-02', role: 'Active', priority: 1, lastHb: '방금' }],
      targetVer: '', mode: 'Manual', updStatus: null, updAt: null, updNote: '',
      fac: [{ n: 'UPS-2F-A', l: 'on' }, { n: 'UPS-2F-B', l: 'off' }, { n: 'CH-2F-01', l: 'on' }] },
    { no: 3, tenant: '세종클라우드', name: 'GW-DR-01', ver: 'v2.2.8', use: true,
      instances: [{ id: 204, ip: '10.20.1.5', hcPort: 7801, hostname: 'GWHOST-03', role: 'Active', priority: 1, lastHb: '1분 전' }],
      targetVer: '2.3.1', mode: 'Auto', updStatus: null, updAt: null, updNote: '',
      fac: [{ n: 'UPS-DR-1', l: 'on' }, { n: 'UPS-DR-2', l: 'on' }] },
    { no: 4, tenant: '대한IDC', name: 'GW-A-01', ver: 'v2.3.1', use: true,
      instances: [{ id: 205, ip: '172.16.0.11', hcPort: 7801, hostname: 'DHIDC-GW01', role: 'Active', priority: 1, lastHb: '방금' }],
      targetVer: '2.3.1', mode: 'Manual', updStatus: 'Success', updAt: '2026-08-20 22:41', updNote: '정상 완료',
      fac: [{ n: 'UPS-A-1', l: 'on' }, { n: 'PDU-A-01', l: 'on' }, { n: 'PDU-A-02', l: 'on' }] },
    { no: 5, tenant: '대한IDC', name: 'GW-DR-02', ver: '-', use: false,
      instances: [],
      targetVer: '', mode: 'Manual', updStatus: null, updAt: null, updNote: '', fac: [] },
    { no: 6, tenant: '한빛전산', name: 'GW-01', ver: 'v2.2.8', use: true,
      instances: [
        { id: 206, ip: '192.168.10.20', hcPort: 7801, hostname: 'HANBIT-GW', role: 'Active', priority: 1, lastHb: '방금' },
        { id: 207, ip: '192.168.10.21', hcPort: 7801, hostname: 'HANBIT-GW-B', role: 'Standby', priority: 2, lastHb: '방금' },
      ],
      targetVer: '2.3.1', mode: 'Manual', updStatus: 'Failed', updAt: '2026-09-10 02:15', updNote: '해시 불일치 - 재시도 필요',
      fac: [{ n: 'UPS-1F-A', l: 'on' }, { n: 'CH-01', l: 'on' }, { n: 'BAT-1F-01', l: 'on' }] },
    { no: 7, tenant: '한빛전산', name: 'GW-02', ver: 'v2.3.1', use: true,
      instances: [{ id: 208, ip: '192.168.20.20', hcPort: 7801, hostname: 'HANBIT-GW2', role: 'Active', priority: 1, lastHb: '2분 전' }],
      targetVer: '2.3.1', mode: 'Manual', updStatus: 'Success', updAt: '2026-08-19 11:02', updNote: '정상 완료',
      fac: [{ n: 'UPS-2F-01', l: 'off' }] },
    { no: 8, tenant: '미래테크', name: 'GW-MAIN', ver: 'v2.3.1', use: true,
      instances: [{ id: 209, ip: '10.30.1.9', hcPort: 7801, hostname: 'MRT-GW-MAIN', role: 'Active', priority: 1, lastHb: '방금' }],
      targetVer: '2.3.1', mode: 'Manual', updStatus: 'Success', updAt: '2026-08-18 09:30', updNote: '정상 완료',
      fac: [{ n: 'UPS-2F-A', l: 'on' }, { n: 'PDU-MAIN-01', l: 'on' }, { n: 'CH-MAIN', l: 'on' }] },
    { no: 9, tenant: '미래테크', name: 'GW-SUB', ver: 'v2.2.8', use: true,
      instances: [{ id: 210, ip: '10.30.9.9', hcPort: 7801, hostname: 'MRT-GW-SUB', role: 'Active', priority: 1, lastHb: '방금' }],
      targetVer: '', mode: 'Manual', updStatus: null, updAt: null, updNote: '', fac: [{ n: 'UPS-DR-1', l: 'on' }] },
    { no: 10, tenant: '미래테크', name: 'GW-LAB', ver: 'v2.1.4', use: false,
      instances: [],
      targetVer: '', mode: 'Manual', updStatus: null, updAt: null, updNote: '', fac: [] },
  ];
  let instSeq = 210;

  const LINK = { on: ['badge-on', '온라인'], off: ['badge-off', '오프라인'] };
  const USE = { 1: ['badge-on', '사용'], 0: ['badge-off', '미사용'] };
  const UPD_LABEL = { InProgress: '진행중', Success: '성공', Failed: '실패' };
  const UPD_CLS = { InProgress: 'status-progress', Success: 'status-done', Failed: 'status-overdue' };
  function badge(map, k) { const p = map[k] || ['badge-off', k]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }
  function el(id) { return document.getElementById(id); }
  function fill(id, arr) { el(id).innerHTML = '<option value="">전체</option>' + arr.map(function (v) { return '<option>' + v + '</option>'; }).join(''); }
  function show(id) { el(id).classList.add('show'); }
  function hide(id) { el(id).classList.remove('show'); }
  function roleBadgeHtml(role) {
    return role === 'Active' ? '<span class="gh-role-badge active">Active</span>' : '<span class="gh-role-badge standby">Standby · 백업</span>';
  }

  // 그리드 표시용: 대표 설치 PC(Active 인스턴스, 없으면 첫번째) / 인스턴스 수
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

  // 그리드용 업데이트 상태 뱃지: 진행중 > 목표버전 미지정 > 최신/필요/실패
  function verBadge(r) {
    if (r.updStatus === 'InProgress') return '<span class="gv-badge progress">진행중</span>';
    if (!r.targetVer) return '<span class="gv-badge none">-</span>';
    const cur = (r.ver || '').replace(/^v/, '');
    if (r.updStatus === 'Failed') return '<span class="gv-badge crit">실패</span>';
    if (cur === r.targetVer) return '<span class="gv-badge ok">최신</span>';
    return '<span class="gv-badge warn">업데이트 필요</span>';
  }

  function ghRender() {
    const ft = el('fTenant').value, fu = el('fUse').value, kw = (el('q').value || '').trim();
    const rows = DATA.filter(function (r) {
      return (!ft || r.tenant === ft)
        && (fu === '' || String(r.use ? 1 : 0) === fu)
        && (!kw || r.name.indexOf(kw) >= 0 || instSearchText(r).indexOf(kw) >= 0);
    });
    el('ghBody').innerHTML = rows.length ? rows.map(function (r) {
      return '<tr data-no="' + r.no + '" onclick="ghRowClick(' + r.no + ')">'
        + '<td>' + r.no + '</td>'
        + '<td><span class="gh-tenant">' + r.tenant + '</span></td>'
        + '<td>' + r.name + '</td>'
        + '<td>' + hostDisplay(r) + '</td>'
        + '<td>' + instCountText(r) + '</td>'
        + '<td>' + r.ver + '</td>'
        + '<td>' + verBadge(r) + '</td>'
        + '<td>' + r.fac.length + '대</td>'
        + '<td>' + badge(USE, r.use ? 1 : 0) + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="9" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';
    el('ghCount').textContent = rows.length;
  }
  function ghReset() {
    ['fTenant', 'fUse'].forEach(function (id) { el(id).value = ''; });
    el('q').value = '';
    ghRender();
  }

  let curNo = null;

  function ghUpdStatusHtml(r) {
    if (!r.updStatus) return '<span style="color:#98a2b3;">업데이트 이력이 없습니다.</span>';
    return '<span class="status-badge ' + UPD_CLS[r.updStatus] + '">' + UPD_LABEL[r.updStatus] + '</span>'
      + (r.updAt ? r.updAt : '') + (r.updNote ? ' · ' + r.updNote : '');
  }

  function ghInstRender(r) {
    const body = el('ghInstBody');
    body.innerHTML = r.instances.length ? r.instances.map(function (ins, i) {
      return '<tr onclick="ghInstEditOpen(' + i + ')">'
        + '<td>' + ins.id + '</td>'
        + '<td>' + ins.ip + '</td>'
        + '<td>' + ins.hcPort + '</td>'
        + '<td style="text-align:left;">' + (ins.hostname || '<span style="color:#98a2b3;">접속 대기중</span>') + '</td>'
        + '<td>' + roleBadgeHtml(ins.role) + '</td>'
        + '<td><input type="number" class="gh-pri-input" min="1" data-idx="' + i + '" value="' + ins.priority + '" onclick="event.stopPropagation()"></td>'
        + '<td>' + (ins.lastHb || '-') + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="7" style="padding:16px;color:#98a2b3;">등록된 인스턴스가 없습니다.</td></tr>';
  }
  function ghInstApply() {
    const r = DATA.filter(function (x) { return x.no === curNo; })[0];
    if (!r || !r.instances.length) return;
    document.querySelectorAll('.gh-pri-input').forEach(function (inp) {
      const i = Number(inp.dataset.idx), v = Number(inp.value);
      if (r.instances[i] && v > 0) r.instances[i].priority = v;
    });
    umsToast('인스턴스 설정을 즉시 반영했습니다. (각 인스턴스가 새 상위목록을 받으면 Role을 다시 판단해요)');
  }

  let editingInstIdx = null;

  function ghInstOpen() {
    editingInstIdx = null;
    el('instModalTitle').textContent = '인스턴스 등록';
    el('im-ip').value = '';
    el('im-priority').value = '';
    el('im-port').value = '';
    show('instModal');
  }
  function ghInstEditOpen(idx) {
    const r = DATA.filter(function (x) { return x.no === curNo; })[0];
    if (!r || !r.instances[idx]) return;
    editingInstIdx = idx;
    const ins = r.instances[idx];
    el('instModalTitle').textContent = '인스턴스 수정 (번호 ' + ins.id + ')';
    el('im-ip').value = ins.ip;
    el('im-priority').value = ins.priority;
    el('im-port').value = ins.hcPort;
    show('instModal');
  }
  function ghInstModalClose() { hide('instModal'); }
  function ghInstSave() {
    const r = DATA.filter(function (x) { return x.no === curNo; })[0];
    if (!r) return;
    const ip = el('im-ip').value.trim();
    const priority = Number(el('im-priority').value);
    const port = Number(el('im-port').value);
    if (!ip) { umsToast('IP를 입력하세요.'); return; }
    if (!priority || priority < 1) { umsToast('Priority를 입력하세요.'); return; }
    if (!port || port < 1) { umsToast('HealthCheckPort를 입력하세요.'); return; }

    if (editingInstIdx != null) {
      const ins = r.instances[editingInstIdx];
      ins.ip = ip; ins.priority = priority; ins.hcPort = port;
      hide('instModal');
      ghInstRender(r);
      ghRender();
      umsToast('인스턴스 ' + ins.id + '번 정보를 수정했습니다.');
    } else {
      instSeq += 1;
      r.instances.push({ id: instSeq, ip: ip, hcPort: port, hostname: '', role: 'Standby', priority: priority, lastHb: '' });
      hide('instModal');
      ghInstRender(r);
      ghRender();
      umsToast('인스턴스 ' + instSeq + '번이 등록되었습니다. 이 번호를 Token과 함께 GW 로컬 설정에 입력하세요.');
    }
  }

  function ghRowClick(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    curNo = no;
    document.querySelectorAll('#ghBody tr').forEach(function (tr) { tr.classList.toggle('selected', Number(tr.dataset.no) === no); });
    el('ghdTitle').textContent = r.tenant + ' · ' + r.name;

    el('ghCurVer').textContent = r.ver || '-';
    el('ghTargetVer').innerHTML = '<option value="">미지정</option>' + VERSIONS.map(function (v) {
      return '<option' + (v === r.targetVer ? ' selected' : '') + '>' + v + '</option>';
    }).join('');
    document.querySelectorAll('input[name="ghMode"]').forEach(function (rd) { rd.checked = (rd.value === r.mode); });
    el('ghUpdStatus').innerHTML = ghUpdStatusHtml(r);

    ghInstRender(r);

    el('ghdBody').innerHTML = '<div class="gh-ver-t" style="margin-top:4px;">소속 설비</div>' + (r.fac.length
      ? '<table class="gh-fac-list"><thead><tr><th>설비명</th><th style="width:90px;">통신상태</th></tr></thead><tbody>'
        + r.fac.map(function (f) { return '<tr><td>' + f.n + '</td><td>' + badge(LINK, f.l) + '</td></tr>'; }).join('')
        + '</tbody></table>'
      : '<div style="color:#98a2b3;font-size:12px;padding:16px 2px;">연결된 설비가 없습니다.</div>');
    el('ghMask').classList.add('show');
    el('ghDrawer').classList.add('show');
  }
  function ghDrawerClose() {
    el('ghMask').classList.remove('show');
    el('ghDrawer').classList.remove('show');
    curNo = null;
  }

  function ghVerSave() {
    const r = DATA.filter(function (x) { return x.no === curNo; })[0];
    if (!r) return;
    r.targetVer = el('ghTargetVer').value;
    r.mode = document.querySelector('input[name="ghMode"]:checked').value;
    ghRender();
    umsToast('저장했습니다.');
  }

  function ghUpdateNow() {
    const r = DATA.filter(function (x) { return x.no === curNo; })[0];
    if (!r) return;
    if (!r.targetVer) { umsToast('목표버전을 먼저 지정하세요.'); return; }
    if ((r.ver || '').replace(/^v/, '') === r.targetVer) { umsToast('이미 목표버전과 동일합니다.'); return; }
    r.updStatus = 'InProgress'; r.updAt = nowStr(); r.updNote = '';
    ghRender();
    el('ghUpdStatus').innerHTML = ghUpdStatusHtml(r);
    umsToast('업데이트를 시작했습니다. (목업 — 잠시 후 완료 처리)');
    setTimeout(function () {
      r.updStatus = 'Success'; r.ver = 'v' + r.targetVer; r.updAt = nowStr(); r.updNote = '정상 완료';
      ghRender();
      if (curNo === r.no) el('ghUpdStatus').innerHTML = ghUpdStatusHtml(r);
      umsToast(r.name + ' 업데이트 완료 (v' + r.targetVer + ')');
    }, 1400);
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function nowStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  fill('fTenant', TENANTS);
  ghRender();

  window.ghRender = ghRender;
  window.ghReset = ghReset;
  window.ghRowClick = ghRowClick;
  window.ghDrawerClose = ghDrawerClose;
  window.ghVerSave = ghVerSave;
  window.ghUpdateNow = ghUpdateNow;
  window.ghInstApply = ghInstApply;
  window.ghInstOpen = ghInstOpen;
  window.ghInstModalClose = ghInstModalClose;
  window.ghInstSave = ghInstSave;

})();
