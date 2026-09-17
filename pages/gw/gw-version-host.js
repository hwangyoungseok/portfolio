// GW 버전관리 (호스트) — umsGwVersion 목업
// 화면: GW > GW 버전관리   참고: ums_schema.sql umsGwVersion / ums_sequences.md #11
(function () {

  const DATA = [
    { no: 1, code: '2.3.1', path: '/data/gw-releases/gw-2.3.1.tar.gz', hash: fakeHash('2.3.1'), note: '배터리 SOH 계산 로직 개선, Modbus 재연결 안정화', reg: '2026-08-20 10:12' },
    { no: 2, code: '2.2.8', path: '/data/gw-releases/gw-2.2.8.tar.gz', hash: fakeHash('2.2.8'), note: 'SNMP 타임아웃 조정, 버퍼 적체 시 로그 개선', reg: '2026-07-02 09:40' },
    { no: 3, code: '2.1.4', path: '/data/gw-releases/gw-2.1.4.tar.gz', hash: fakeHash('2.1.4'), note: '최초 배포 버전', reg: '2026-05-11 14:05' },
  ];
  let seq = DATA.length;

  function fakeHash(seed) {
    // 목업 해시 — 실제로는 저장 시 서버가 파일 읽어서 SHA256 계산
    let h = 0;
    const s = seed + Date.now();
    for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    let hex = '';
    for (let i = 0; i < 8; i++) { h = (h * 1103515245 + 12345) >>> 0; hex += h.toString(16).padStart(8, '0'); }
    return hex.slice(0, 64);
  }

  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).classList.add('show'); }
  function hide(id) { el(id).classList.remove('show'); }

  function gvRender() {
    el('gvBody').innerHTML = DATA.length ? DATA.slice().sort(function (a, b) { return b.no - a.no; }).map(function (r) {
      return '<tr>'
        + '<td>' + r.no + '</td>'
        + '<td><b>' + r.code + '</b></td>'
        + '<td>' + r.path + '</td>'
        + '<td title="' + r.hash + '">' + r.hash.slice(0, 12) + '…</td>'
        + '<td>' + (r.note || '') + '</td>'
        + '<td>' + r.reg + '</td>'
        + '<td><button class="gv-del" onclick="gvAskDelete(' + r.no + ')" title="삭제">&#10005;</button></td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="7" style="padding:30px;color:#98a2b3;">등록된 버전이 없습니다.</td></tr>';
    el('gvCount').textContent = DATA.length;
  }

  function gvOpen() {
    el('m-code').value = '';
    el('m-path').value = '';
    el('m-note').value = '';
    show('gvModal');
  }
  function gvModalClose() { hide('gvModal'); }
  function gvSave() {
    const code = el('m-code').value.trim();
    const path = el('m-path').value.trim();
    if (!code) { umsToast('버전코드를 입력하세요.'); return; }
    if (!path) { umsToast('파일경로를 입력하세요.'); return; }
    if (DATA.some(function (r) { return r.code === code; })) { umsToast('이미 등록된 버전코드입니다.'); return; }
    seq++;
    DATA.push({ no: seq, code: code, path: path, hash: fakeHash(path), note: el('m-note').value.trim(), reg: nowStr() });
    hide('gvModal');
    gvRender();
    umsToast('버전을 등록했습니다. (파일 해시는 서버가 자동 계산 — 목업)');
  }

  let pendingNo = null;
  function gvAskDelete(no) { pendingNo = no; show('delModal'); }
  function gvDelete() {
    const i = DATA.findIndex(function (r) { return r.no === pendingNo; });
    if (i >= 0) DATA.splice(i, 1);
    hide('delModal');
    gvRender();
    umsToast('삭제되었습니다.');
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function nowStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  gvRender();

  window.gvOpen = gvOpen;
  window.gvModalClose = gvModalClose;
  window.gvSave = gvSave;
  window.gvAskDelete = gvAskDelete;
  window.gvDelete = gvDelete;
  window.delModalClose = function () { hide('delModal'); };

})();
