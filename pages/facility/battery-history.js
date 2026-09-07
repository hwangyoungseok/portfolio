// 배터리 교체 이력 관리 — 그리드 + 등록/수정 모달 + 우측 상세 패널
// 화면: 설비관리 > 배터리 교체 이력 관리   참고: UMS_화면정의서_김진호.csv
(function () {

  const REASONS = ['SOH 저하', '고장', '정기교체', '기타'];
  const UPS_LOC = {
    'UPS-1F-A': '본사 IDC-1F', 'UPS-1F-B': '본사 IDC-1F',
    'UPS-2F-A': '본사 IDC-2F', 'UPS-DR-1': '판교 DR센터',
  };
  const UPS_LIST = Object.keys(UPS_LOC);
  const LOCATIONS = ['본사 IDC-1F', '본사 IDC-2F', '판교 DR센터'];
  // UPS 소속 배터리 목록 (구 배터리ID 콤보용)
  const UPS_BATTERIES = {
    'UPS-1F-A': ['BAT-1F-A-01', 'BAT-1F-A-02', 'BAT-1F-A-03', 'BAT-1F-A-04'],
    'UPS-1F-B': ['BAT-1F-B-01', 'BAT-1F-B-02', 'BAT-1F-B-03'],
    'UPS-2F-A': ['BAT-2F-A-01', 'BAT-2F-A-02'],
    'UPS-DR-1': ['BAT-DR-1-01', 'BAT-DR-1-02'],
  };

  const BAT_ST = { use: ['badge-ok', '사용중'], need: ['badge-warn', '교체필요'], scrap: ['badge-off', '폐기'] };
  function stBadge(k) { const p = BAT_ST[k] || ['badge-off', k]; return '<span class="badge ' + p[0] + '">' + p[1] + '</span>'; }

  // 목업: 각 행에 구/신 배터리 스펙 스냅샷 포함
  const DATA = [
    { no: 1, date: '2026-08-29', ups: 'UPS-1F-A', reason: 'SOH 저하', worker: '이엔지', memo: '정기점검 중 SOH 76% 확인',
      oldBat: { id: 'BAT-1F-A-01', maker: 'CSB', kind: '납축(VRLA)', cap: 100, install: '2019-03-11', st: 'scrap' },
      newBat: { id: 'BAT-1F-A-01-N', maker: 'CSB', kind: '납축(VRLA)', cap: 100, install: '2026-08-29', st: 'use' } },
    { no: 2, date: '2026-07-14', ups: 'UPS-2F-A', reason: '고장', worker: '박당직', memo: '셀 누액 발견, 긴급 교체',
      oldBat: { id: 'BAT-2F-A-02', maker: 'Panasonic', kind: '납축(VRLA)', cap: 65, install: '2020-05-02', st: 'scrap' },
      newBat: { id: 'BAT-2F-A-02-N', maker: 'Panasonic', kind: '납축(VRLA)', cap: 65, install: '2026-07-14', st: 'use' } },
    { no: 3, date: '2026-06-03', ups: 'UPS-DR-1', reason: '정기교체', worker: '이엔지', memo: '5년 주기 정기교체',
      oldBat: { id: 'BAT-DR-1-01', maker: 'Yuasa', kind: '납축(VRLA)', cap: 80, install: '2021-05-30', st: 'scrap' },
      newBat: { id: 'BAT-DR-1-01-N', maker: 'Yuasa', kind: '납축(VRLA)', cap: 80, install: '2026-06-03', st: 'use' } },
    { no: 4, date: '2026-03-21', ups: 'UPS-1F-B', reason: 'SOH 저하', worker: '김진호', memo: '',
      oldBat: { id: 'BAT-1F-B-02', maker: 'CSB', kind: '납축(VRLA)', cap: 100, install: '2018-09-17', st: 'scrap' },
      newBat: { id: 'BAT-1F-B-02-N', maker: 'CSB', kind: '리튬이온(LFP)', cap: 105, install: '2026-03-21', st: 'use' } },
    { no: 5, date: '2025-12-10', ups: 'UPS-1F-A', reason: '고장', worker: '박당직', memo: '내부저항 급상승',
      oldBat: { id: 'BAT-1F-A-03', maker: 'CSB', kind: '납축(VRLA)', cap: 100, install: '2019-03-11', st: 'scrap' },
      newBat: { id: 'BAT-1F-A-03-N', maker: 'CSB', kind: '납축(VRLA)', cap: 100, install: '2025-12-10', st: 'use' } },
    { no: 6, date: '2025-09-02', ups: 'UPS-2F-A', reason: '정기교체', worker: '이엔지', memo: '',
      oldBat: { id: 'BAT-2F-A-01', maker: 'Panasonic', kind: '납축(VRLA)', cap: 65, install: '2020-05-02', st: 'scrap' },
      newBat: { id: 'BAT-2F-A-01-N', maker: 'Panasonic', kind: '납축(VRLA)', cap: 65, install: '2025-09-02', st: 'use' } },
  ];
  const TODAY = '2026-09-07';

  function el(id) { return document.getElementById(id); }
  function fillSelect(id, arr, withAll) {
    const e = el(id); if (!e) return;
    e.innerHTML = (withAll ? '<option value="">전체</option>' : '')
      + arr.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }
  function shift(days) {
    const p = TODAY.split('-');
    const d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
  }
  function bhPreset(kind) {
    el('fFrom').value = shift(kind === '1y' ? 365 : 90);
    el('fTo').value = TODAY;
    bhRender();
  }

  function bhRender() {
    const fUps = el('fUps').value, fLoc = el('fLoc').value, fReason = el('fReason').value;
    const from = el('fFrom').value, to = el('fTo').value;
    const kw = (el('q').value || '').trim();

    const rows = DATA.filter(function (r) {
      return (!fUps || r.ups === fUps) && (!fLoc || UPS_LOC[r.ups] === fLoc) && (!fReason || r.reason === fReason)
        && (!from || r.date >= from) && (!to || r.date <= to)
        && (!kw || r.oldBat.id.indexOf(kw) >= 0 || r.newBat.id.indexOf(kw) >= 0 || r.worker.indexOf(kw) >= 0);
    });

    el('gridBody').innerHTML = rows.length ? rows.map(function (r) {
      return '<tr data-no="' + r.no + '" onclick="bhRowClick(' + r.no + ')">'
        + '<td>' + r.no + '</td>'
        + '<td>' + r.date + '</td>'
        + '<td class="cell-l">' + r.ups + '</td>'
        + '<td class="cell-l">' + UPS_LOC[r.ups] + '</td>'
        + '<td class="cell-l">' + r.oldBat.id + '</td>'
        + '<td class="cell-l">' + r.newBat.id + '</td>'
        + '<td>' + r.reason + '</td>'
        + '<td>' + r.worker + '</td>'
        + '<td class="cell-l">' + (r.memo || '') + '</td>'
        + '<td><span class="col-act">'
        +   '<button class="icon-btn" title="수정" onclick="event.stopPropagation();bhOpen(' + r.no + ')">&#9998;</button>'
        +   '<button class="icon-btn del" title="삭제" onclick="event.stopPropagation();bhAskDelete(' + r.no + ')">&#128465;</button>'
        + '</span></td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="10" style="padding:30px;color:#98a2b3;">조회 결과가 없습니다.</td></tr>';

    el('bhCount').textContent = rows.length;
  }

  function bhReset() {
    ['fUps', 'fLoc', 'fReason'].forEach(function (id) { el(id).value = ''; });
    el('q').value = '';
    bhPreset('1y');
  }

  let detailNo = null;
  function bhRowClick(no) {
    document.querySelectorAll('#gridBody tr').forEach(function (tr) { tr.classList.toggle('selected', Number(tr.dataset.no) === no); });
    bhDetailOpen(no);
  }

  function dvRow(label, val, multi) {
    return '<div class="dv-row' + (multi ? ' multi' : '') + '">'
      + '<span class="dv-label">' + label + '</span>'
      + '<div class="dv-box' + (multi ? ' multi' : '') + '">' + val + '</div></div>';
  }
  function dvGroup(rows) { return '<div class="dv-group">' + rows + '</div>'; }
  function batBlock(title, b) {
    return dvGroup(
      '<div class="dv-subhead">' + title + '</div>'
      + dvRow('배터리ID', b.id) + dvRow('제조사', b.maker) + dvRow('종류', b.kind)
      + dvRow('용량', b.cap + ' Ah') + dvRow('설치일자', b.install) + dvRow('상태', stBadge(b.st)));
  }

  function bhDetailOpen(no) {
    const r = DATA.filter(function (x) { return x.no === no; })[0];
    if (!r) return;
    detailNo = no;
    el('dTitle').textContent = r.ups + ' 배터리 교체 (' + r.date + ')';
    el('dBody').innerHTML =
      '<div class="dv">'
      + dvGroup(
          dvRow('교체일자', r.date) + dvRow('소속 UPS', r.ups) + dvRow('위치', UPS_LOC[r.ups])
          + dvRow('교체사유', r.reason) + dvRow('작업자', r.worker)
          + dvRow('비고', r.memo || '<span style="color:#8a97a5;">-</span>', true))
      + batBlock('구 배터리', r.oldBat)
      + batBlock('신 배터리', r.newBat)
      + '<div class="dv-snapshot-hint">※ 배터리 정보는 교체 시점 기준 스냅샷입니다.</div>'
      + '</div>';
    el('bhMask').classList.add('show');
    el('bhDrawer').classList.add('show');
  }
  function bhDetailClose() {
    el('bhMask').classList.remove('show');
    el('bhDrawer').classList.remove('show');
  }
  function bhEditFromDetail() { const no = detailNo; bhDetailClose(); bhOpen(no); }

  function bhFillOldBat() {
    const ups = el('m-ups').value;
    const list = UPS_BATTERIES[ups] || [];
    el('m-old').innerHTML = list.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }

  function bhOpen(no) {
    const r = (no == null) ? null : DATA.filter(function (x) { return x.no === no; })[0];
    el('mTitle').textContent = r ? '교체 이력 수정' : '교체 이력 등록';
    el('m-ups').value    = r ? r.ups : UPS_LIST[0];
    bhFillOldBat();
    el('m-old').value    = r ? r.oldBat.id : (el('m-old').options[0] ? el('m-old').options[0].value : '');
    el('m-new').value    = r ? r.newBat.id : '';
    el('m-date').value   = r ? r.date : '';
    el('m-reason').value = r ? r.reason : REASONS[0];
    el('m-worker').value = r ? r.worker : '';
    el('m-memo').value   = r ? r.memo : '';
    show('bhModal');
  }

  function bhSave()        { hide('bhModal'); bhRender(); umsToast('저장되었습니다.'); }
  function bhAskDelete(no) { bhRowClick(no); show('delModal'); }
  function bhDelete()      { hide('delModal'); umsToast('삭제되었습니다.'); }

  function show(id) { el(id).classList.add('show'); }
  function hide(id) { el(id).classList.remove('show'); }

  // ---- init ----
  fillSelect('fUps', UPS_LIST, true);
  fillSelect('fLoc', LOCATIONS, true);
  fillSelect('fReason', REASONS, true);
  fillSelect('m-ups', UPS_LIST, false);
  fillSelect('m-reason', REASONS, false);
  bhFillOldBat();
  bhPreset('1y');   // 기본: 최근 1년

  window.bhRender      = bhRender;
  window.bhReset       = bhReset;
  window.bhPreset      = bhPreset;
  window.bhRowClick    = bhRowClick;
  window.bhOpen        = bhOpen;
  window.bhSave        = bhSave;
  window.bhAskDelete   = bhAskDelete;
  window.bhDelete      = bhDelete;
  window.bhFillOldBat  = bhFillOldBat;
  window.bhModalClose  = function () { hide('bhModal'); };
  window.delModalClose = function () { hide('delModal'); };
  window.bhDetailClose = bhDetailClose;
  window.bhEditFromDetail = bhEditFromDetail;

})();
