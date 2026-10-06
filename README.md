# UMS 통합 관리 시스템

데이터센터 설비(UPS · 배터리 · PDU · 칠러)와 수집 게이트웨이(GW)를 모니터링하고, 알람 · 티켓 · 테넌트(SaaS) 운영을 한 화면에서 처리하는 관리 콘솔 **프론트엔드 목업**입니다.

- 빌드 도구, 프레임워크, 서버가 없습니다. 순수 HTML / CSS / JavaScript로 만들었습니다.
- 파일을 더블클릭해서 열어도 동작합니다 (`file://` 지원).
- 차트는 외부 라이브러리 없이 인라인 SVG로 그립니다.

## 실행 방법

```bash
git clone <repo-url>
cd UMS
# index.html 을 브라우저로 열기 (더블클릭 또는 Live Server)
```

모드를 지정해서 열 수도 있습니다.

| 모드 | 주소 |
|------|------|
| 호스트 (운영사) | `index.html` 또는 `index.html?role=host` |
| 고객 (입주 고객) | `index.html?role=customer` |

> 모드는 URL 쿼리 `?role=` 로 전달되고, 사이드바/헤더 링크에 자동으로 붙습니다. `localStorage` 에도 백업되며, 기본값은 `host` 입니다.

## 두 가지 모드

| | 호스트 (운영사) | 고객 (입주 고객) |
|---|---|---|
| 대상 | 운영사 관리자 | 입주 고객사 (기본 테넌트: 세종클라우드) |
| 홈 | 티켓 현황, 전 테넌트 GW 헬스, 테넌트/구독 요약 | 티켓 현황, 인프라 헬스, 활성 알람, 핵심 지표 |
| 메뉴 | 티켓, SaaS 관리, GW, 알람 등 운영 업무 | 현황, 설비, 데이터 조회, 알람, 관리 등 |

- 메뉴 트리는 모드별로 완전히 분리되어 있습니다 (`shared/layout.js` 의 `MENUS`).
- 페이지 파일(`pages/**`)은 두 모드가 공유합니다. 화면 안에서 모드별 차이가 필요하면 `<body data-role>` 를 이용한 CSS 클래스를 씁니다.
  - `.host-only`: 고객 모드에서 숨김
  - `.customer-only`: 호스트 모드에서 숨김
- 파일명이 `-host` 로 끝나는 화면은 호스트 전용입니다 (예: `gw-list-host.html`).

## 폴더 구조

```
UMS/
├── index.html / index.css / index.js   # 홈 대시보드 (위젯 드래그 재배치, 편집 모드)
├── shared/
│   ├── common.css                      # 공통 스타일
│   └── layout.js                       # 사이드바 / 헤더 / 브레드크럼 / 푸터 조립, 모드 처리
└── pages/
    ├── account/    # 내 계정, 알림, 보안 로그, 세션
    ├── admin/      # 감사 로그, 조직/사용자/역할, 템플릿, 설정, 작업(Job)
    ├── alarm/      # 알람 현황·이력·규칙·관리, 액션 그룹, 알림 설정
    ├── data/       # UPS · 배터리 · PDU · 칠러 데이터 / 트렌드 / 실시간
    ├── facility/   # UPS · 배터리 · PDU · 칠러 목록, 위치 관리, 배터리 이력
    ├── gw/         # GW 목록 · 상태 · 서버 · 버전 · 알림 설정
    ├── saas/       # 테넌트, 에디션, 구독 요청 관리 (호스트)
    ├── status/     # 위치 현황, 전력 토폴로지, 지도 보기/관리
    ├── subscribe/  # 구독 현황, 구독 요청 (고객)
    └── ticket/     # 내 티켓, 미할당 티켓, 전체 티켓
```

각 화면은 `pages/<그룹>/<키>.html` + `.css` + `.js` 3개 파일 세트입니다.

## 새 화면 추가하기

1. `pages/<그룹>/<키>.html` / `.css` / `.js` 를 만듭니다.
2. HTML 은 아래 형태만 지키면 레이아웃이 자동 조립됩니다.

   ```html
   <body data-page="그룹/키">
     <div id="umsContent">
       <!-- 본문 -->
     </div>
     <script src="../../shared/layout.js"></script>
     <script src="<키>.js"></script>
   </body>
   ```

3. `shared/layout.js` 의 `MENUS` 에 메뉴 항목(`page: '그룹/키'`)을 추가합니다.
4. 화면이 완성되면 담당자 목록(`DONE_OH` / `DONE_KIM` / `DONE_HWANG`)에 `'그룹/키'` 를 추가합니다.
   - 목록에 없는 화면은 사이드바에서 흐리게(`nav-todo`) 표시됩니다.
5. 다른 화면으로 링크할 때는 모드 유지를 위해 `window.umsLink(href)` 를 사용합니다.

## 기술 스택

- HTML5 / CSS3 / Vanilla JavaScript (ES6)
- [SortableJS](https://sortablejs.github.io/Sortable/) (CDN, 대시보드 위젯 드래그)
- 차트: 인라인 SVG 직접 구현

## 참고

- 현재 모든 데이터는 화면 내 목업 데이터이며, 백엔드 연동은 없습니다.
- 대시보드 위젯 구성은 브라우저 `localStorage` (`ums.dash.v4.<role>`) 에 저장됩니다. 초기화하려면 해당 키를 삭제하세요.
