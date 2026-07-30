# MoneyBox · 해외환전예약 프로토타입 (FX Reservation)

외국인 고객이 온라인으로 환전을 **예약(무결제)** 하고, 지정 지점을 방문해 **신분증 확인 후 현장 결제·수령**하는 서비스의 클릭 가능한 프로토타입입니다.

- 프론트엔드: **React + Vite + React Router** (백엔드 없음, 목데이터 + 프론트 상태 관리)
- 다국어: 한국어 / 영어
- 수령방식: 지점수령 단일 · 결제: 무결제 예약 + 현장 전액결제 · 신원확인: 현장 OCR(시뮬레이션)

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
# 또는
npm run build && npm run preview
```

## 주요 화면

| 경로 | 대상 | 설명 |
|---|---|---|
| `/` | 고객 | 홈 (랜딩) |
| `/book` | 고객 | **지점수령예약 8단계** (지점→통화/구분→금액→수령일→정보→확인→동의→완료) |
| `/lookup` | 고객 | 예약조회 (번호+이메일) → 취소 / 변경 |
| `/operator` | 지점 운영자 | 신규예약 리스트(시재준비) · 거래처리 · 시뮬레이션 도구 |
| `/about`, `/esim` | - | Out of Scope (더미 / 외부링크) |

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
├─ main.jsx / App.jsx          진입점 · 라우팅
├─ i18n/                       다국어 (ko/en) 사전 + Provider
├─ store/ReservationContext    전역 예약 상태 + 시뮬레이션 기준일
├─ data/                       목데이터 (지점 · 환율 · 시드 예약)
├─ lib/                        검증 · 날짜 · 포맷 · 예약번호 유틸
├─ components/                 Layout · Stepper · Badges · Modal · SimBar 등
└─ pages/
   ├─ Home / LookupPage / AboutPage / EsimPage
   ├─ booking/BookingFlow      8단계 위저드
   └─ operator/                OperatorConsole · PrepList · TransactionProcess
```

## 개발 문서

[`docs/`](./docs/README.md) — 데이터 모델, 화면/라우팅, REST API 설계, 상태 전이 다이어그램.

---
프로토타입 (mock data, no backend). 실제 정책 수치·연동은 코드 내 `// TODO` 참조.
