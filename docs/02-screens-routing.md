# 화면 목록 & 라우팅 구조 (Screens & Routing)

> 라우팅은 `react-router-dom` (`src/App.jsx`) 기준.
> **최상위는 3개 탭**(외국인 웹사이트 / CEMS(어드민) / POS)으로 구분되며, 각 탭은 서로 다른 사용자를
> 위한 별도 시스템입니다. 프로토타입에서는 데모 편의를 위해 상단 탭바(`TopTabs`)로 전환합니다.

---

## 0. 최상위 3개 탭

| 탭 | 경로 | 대상 사용자 | 진입 컴포넌트 |
|---|---|---|---|
| **외국인 웹사이트** | `/site/*` | 고객(외국인) | `CustomerSite` (자체 헤더/네비) |
| **CEMS (어드민)** | `/cems` | 지점 운영자 | `CemsShell` → `PrepList` |
| **POS** | `/pos` | 지점 직원 | `PosShell` → `SimBar` + `TransactionProcess` |

- 최상위 셸: `RootLayout` = `TopTabs`(3탭 전환) + `<Outlet/>`
- `/` 진입 시 `/site` 로 리다이렉트. 미매칭 경로도 `/site` 로.

---

## 1. 라우트 맵

| 경로 | 컴포넌트 | 대상 | 설명 |
|---|---|---|---|
| `/` | → `/site` | - | 리다이렉트 |
| `/site` (index) | `BookingFlow` | 고객 | **지점수령예약 = 기본 진입 페이지** (STEP A→B→…→완료) |
| `/site/airport` | `AirportPage` | 고객 | 공항 수령 — Out of Scope, 미운영 안내만 |
| `/site/esim` | `EsimPage` | - | eSIM 더미 외부링크 |
| `/site/about` | `AboutPage` | - | 회사 소개·문의 더미 텍스트 |
| `/site/lookup` | `LookupPage` | 고객 | 예약조회 → 취소/변경. 헤더 네비에는 없고 **푸터/예약완료 화면에서 링크** |
| `/cems` | `CemsShell` | 운영자 | 신규예약 리스트(시재준비) |
| `/pos` | `PosShell` | 직원 | 거래처리 + 시뮬레이션 바 |
| `*` | → `/site` | - | 폴백 |

---

## 2. 탭 1 · 외국인 웹사이트

### 2.1 헤더 (전 페이지 공통 · `CustomerSite`)
- **좌측**: 로고 `MONEY BOX`
- **네비게이션**: `지점 수령`(활성/핵심) · `공항 수령`(Out of Scope 안내) · `eSIM`(더미링크) · `회사 소개·문의`(더미)
- **우측**: 언어 선택 **드롭다운**(한국어/영어, `LanguageDropdown`, 기존 i18n 재사용)
- 로그인 버튼 없음 (로그인 미구현 결정 유지)
- 푸터에 `예약 조회` 링크

### 2.2 지점수령예약 플로우 (`BookingFlow`)
기존 8단계 중 **1~4단계(지점/통화/금액/수령일)를 STEP A + STEP B로 흡수 통합**.
진행 표시는 6단계 Stepper: `지점 선택 · 환전 신청 · 예약자 정보 · 최종 확인 · 정책 동의 · 예약 완료`.
**중도 이탈/새로고침 → 처음부터 (임시저장 없음).**

| 단계 | 내부 stage | 화면 | 비고 |
|---|---|---|---|
| **STEP A. 지점 선택** | `branch` | 좌: 지점 리스트 / 우: 지도(`BranchMap`, 더미 마커). 지점 클릭 → STEP B | 기존 1단계 흡수 |
| **STEP B. 지점 상세+신청** | `apply` | 좌: 지점 상세(별점·영업상태·주소·전화+복사·실시간환율 탭·은행비교) / 우: sticky 신청 카드 | 기존 2~4단계 흡수 |
| 5. 예약자 정보 | `info` | 예약자명(여권 영문명) + 이메일 | 기존 로직 동일 |
| 6. 최종 확인 | `review` | 요약 + **환율 픽스(이 시점 확정)** + 날짜·시간 | 기존 로직 동일 |
| 7. 정책 동의 | `consent` | 노쇼 안내 + 개인정보 동의(전체동의) | 기존 로직 동일 |
| 8. 예약 완료 | `done` | 예약번호 발급, 완료 화면, 조회 링크 | 기존 로직 동일 |

**STEP B 신청 카드 상세**
- 상단 탭 `외화 구매`/`외화 판매` → 데이터모델 `transactionType` 매핑
  - 외화 구매 = 고객이 삼 = `SELL`(지점 매출·외화 준비)
  - 외화 판매 = 고객이 팖 = `BUY`(지점 매입·원화 준비)
- `수령 날짜 및 시간`: 날짜 캘린더(리드타임~최대 30일 검증 유지) + 시간 슬롯 선택(`pickupTime`, 신규 필드)
- `환전 금액`: 통화 드롭다운(국기) + 숫자 입력, `신청 가능 금액: [지점별 최대] [통화]` 안내, 입력 단위 안내, 환산 원화 자동 표시
- **환율은 STEP B에서 참고용 예상금액만** 표시하고, 6단계(최종확인)에서 확정 환율로 재계산·픽스 (기존 로직 유지)

**예외 플로우**
- 금액 미달/초과 → 인라인 에러 + 신청 버튼 비활성
- 재고 소진(데모: `B003 + VND`) → `신청하기` 시 안내 화면 후 "처음부터 다시"

### 2.3 예약조회 (`LookupPage`) — 변경 없음
예약번호 + 이메일 조회, `BOOKED` 상태에서만 취소(확인모달)/변경. `?no=&email=` 딥링크(`/site/lookup`).

---

## 3. 탭 2 · CEMS (어드민) — `CemsShell` → `PrepList`
기존 "신규예약 리스트(시재 준비용)" 화면을 이 탭으로 이동. 로직/컬럼/필터/리마인더 노출규칙 그대로.
자체 상단 헤더(`CEMS ·` 타이틀 + 언어토글).

## 4. 탭 3 · POS — `PosShell` → `SimBar` + `TransactionProcess`
기존 "거래처리" 화면을 이 탭으로 이동. 예약번호 조회 → 신분증 대조 → 거래완료. 시뮬레이션 바 유지.

---

## 5. 컴포넌트 트리 (요약)

```
main.jsx
└─ BrowserRouter → I18nProvider → ReservationProvider
   └─ App (Routes)
      └─ RootLayout                     ← TopTabs(3탭) + Outlet
         ├─ CustomerSite (/site)        ← 로고/네비/언어드롭다운 + Outlet
         │  ├─ BookingFlow (index)      ← Stepper + StepBranch/StepApply/Info/Review/Consent/Done
         │  │   ├─ BranchMap            (STEP A 더미 지도)
         │  │   └─ BranchDetailLeft / ApplyCard (STEP B)
         │  ├─ AirportPage / EsimPage / AboutPage
         │  └─ LookupPage
         ├─ CemsShell (/cems)           ← PrepList
         └─ PosShell (/pos)             ← SimBar + TransactionProcess
```

---

## 6. 다국어 (i18n) — 변경 없음
한국어(`ko`)/영어(`en`), `src/i18n/strings.js` + `useI18n().t(key)`. 외국인 웹사이트 헤더의 언어
드롭다운(`LanguageDropdown`)과 어드민 헤더의 토글(`LanguageToggle`)이 동일 i18n 상태를 공유.

---

## 7. 이번 재구성에서 바뀐 부분 (요약)
- 최상위 진입이 **라우트 나열 → 3개 탭(외국인 웹사이트/CEMS/POS)** 으로 재편.
- 고객 사이트에 **자체 헤더/네비**(지점수령·공항수령·eSIM·회사소개) + 언어 드롭다운 신설.
- 기존 홈(`Home`)·공용 레이아웃(`Layout`)·`OperatorConsole` 제거, `RootLayout`/`CustomerSite`/`CemsShell`/`PosShell` 신설.
- 예약 8단계 중 1~4단계를 **STEP A(지점선택)** + **STEP B(지점상세+신청)** 로 통합. 5~8단계 및
  모든 검증·상태·환율픽스·자동취소 로직은 **변경 없음**.
- 신규 필드 `pickupTime`(수령 시간) 추가 (STEP B 시간 선택). 그 외 데이터 모델 변경 없음.
