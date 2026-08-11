# MoneyBox · 해외환전예약 프로토타입 (FX Reservation)

외국인 고객이 온라인으로 환전을 **예약(무결제)** 하고, 지정 지점을 방문해 **현장에서 결제·수령**하는 서비스의 클릭 가능한 프로토타입입니다.

- 프론트엔드: **React + Vite + React Router** (백엔드 없음, 목데이터 + 프론트 상태 관리)
- 다국어: 한국어 / 영어
- 수령방식: 지점수령 단일 · 결제: 무결제 예약 + 현장 전액결제 · 회원/로그인/본인인증 없음(이메일 OTP는 이메일 수신 가능 여부 확인용)

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
# 또는
npm run build && npm run preview
```

## 화면 구조 — 최상위 3개 탭

상단 탭바로 3개 시스템을 전환합니다 (실제로는 서로 다른 사용자용 별도 시스템, 프로토타입 데모 편의상 탭 전환).

| 탭 / 경로 | 대상 | 설명 |
|---|---|---|
| **외국인 웹사이트** `/site` | 고객 | 지점수령예약 (STEP A 지점선택 → STEP B 지점상세+신청 → 정보 → 확인 → 동의 → 완료) |
| ↳ `/site/airport` | - | 공항 수령 (Out of Scope, 미운영 안내) |
| ↳ `/site/esim`, `/site/about` | - | eSIM 더미링크 / 회사 소개·문의 더미 |
| ↳ `/site/lookup` | 고객 | 예약조회 (번호+이메일) → 취소 / 변경 |
| **CEMS (어드민)** `/cems` | 지점 운영자 | 실제 CEMS 골격 재현 (파란 헤더 + 5탭 + 사이드바) |
| ↳ `/cems/reservations` | 운영자 | 외국인 환전예약관리 (필터 + 테이블 + 페이지네이션) |
| ↳ `/cems/settings/rates` | 운영자 | 환전율관리 (통화/채널별 환율, 읽기전용 데모) |
| ↳ `/cems/settings/limits` | 운영자 | 외국인서비스 한도관리 (통화별 최소 / 지점별 최대) |
| **POS** `/pos` | 지점 직원 | POS 홈 (타일 화면) — 기본 진입 |
| ↳ `/pos/reservation` | 직원 | 환전예약 검색 폼 (이름·수령일·예약번호 끝 4자리) |
| ↳ `/pos/reservation/results` | 직원 | 검색 결과 리스트 (방문확인만/전체보기 토글) → 행 클릭 시 거래처리 |
| ↳ `/pos/transaction` | 직원 | 거래처리 (예약번호 조회 → 거래완료) + 시뮬레이션, `홈으로` 복귀 |

> 예약 플로우는 기존 8단계 중 1~4단계(지점/통화/금액/수령일)를 STEP A·B로 통합했으며,
> 검증·상태·환율픽스(최종확인 시점)·자동취소 등 로직은 그대로 유지됩니다.

## 데모용 시드 데이터

예약조회·거래처리에서 사용:

| 예약번호 | 이메일 | 상태 |
|---|---|---|
| `RSV-20260728-0001` | john@example.com | 예약 (BOOKED) |
| `RSV-20260728-0002` | yuki@example.com | 예약 (BOOKED) |
| `RSV-20260725-0005` | david@example.com | 완료 (COMPLETED) |
| `RSV-20260724-0006` | akira@example.com | 취소 (CANCELLED) |

> 기준일(오늘)은 `2026-07-30` 으로 시뮬레이션됩니다. 운영자 콘솔의 "하루 넘기기 / 자동취소 실행"으로
> 수령기한 경과 → 자동취소 흐름을 확인할 수 있습니다. (실제 스케줄러 없음)

## 프로젝트 구조

```
src/
├─ main.jsx / App.jsx          진입점 · 라우팅 (3탭)
├─ i18n/                       다국어 (ko/en) 사전 + Provider
├─ store/ReservationContext    전역 예약 상태 + 시뮬레이션 기준일
├─ data/                       목데이터 (지점 · 환율 · 시드 예약)
├─ lib/                        검증 · 날짜(시간슬롯) · 포맷 · 예약번호 유틸
├─ components/
│   ├─ RootLayout · TopTabs    최상위 3탭 셸
│   ├─ CustomerSite            외국인 웹사이트 헤더/네비
│   ├─ LanguageDropdown · LanguageToggle · Stepper · Badges · Modal · SimBar
│   └─ BranchMap               STEP A 더미 지도
└─ pages/
   ├─ LookupPage · AirportPage · AboutPage · EsimPage
   ├─ booking/BookingFlow      STEP A/B + 정보·확인·동의·완료
   └─ operator/                CemsShell(→PrepList) · PosShell(→TransactionProcess)
```

## 개발 문서

[`docs/`](./docs/README.md) — 데이터 모델, 화면/라우팅, REST API 설계, 상태 전이 다이어그램.

---
프로토타입 (mock data, no backend). 실제 정책 수치·연동은 코드 내 `// TODO` 참조.
