# 데이터 모델 (Data Model)

> 프로토타입(`src/data/*`, `src/store/ReservationContext.jsx`) 기준으로 정리한 데이터 모델입니다.
> 프로토타입은 프론트 상태로만 관리하지만, 아래는 실제 백엔드 스키마 설계에 바로 참고할 수 있도록 타입/제약을 명시합니다.

---

## 1. Reservation (예약)

가장 핵심 엔티티. 상태(`status`)를 중심으로 생명주기가 흐릅니다.

| 필드 | 타입 | 필수 | 설명 | 예시 |
|---|---|---|---|---|
| `id` | UUID / bigint | ✔ | PK (프로토타입에서는 `reservationNo`를 식별자로 사용) | `a1b2...` |
| `reservationNo` | string | ✔ | 사용자 노출용 예약번호. `RSV-YYYYMMDD-####` 포맷, 일자별 시퀀스 | `RSV-20260728-0001` |
| `status` | enum | ✔ | `BOOKED` \| `COMPLETED` \| `CANCELLED` | `BOOKED` |
| `transactionType` | enum | ✔ | `SELL`(매출·외화준비) \| `BUY`(매입·원화준비) | `SELL` |
| `branchId` | string (FK→Branch) | ✔ | 수령 지점 | `B001` |
| `currency` | string(3) | ✔ | ISO 4217 통화코드 | `USD` |
| `rate` | decimal(18,4) | ✔ | 예약 시점 픽스 환율 (KRW / 1 unit, 비회원 기준) | `1385.0` |
| `foreignAmount` | decimal(18,2) | ✔ | 거래 외화 금액 | `500` |
| `krwAmount` | bigint | ✔ | 원화 환산액 = `round(foreignAmount * rate)` | `692500` |
| `customerName` | string | ✔ | 예약자명(여권 영문명, 대문자 정규화) | `JOHN SMITH` |
| `email` | string | ✔ | 예약자 이메일 (형식검증만, 인증 없음) | `john@example.com` |
| `pickupDate` | date (YYYY-MM-DD) | ✔ | 수령 예정일 | `2026-07-31` |
| `pickupTime` | string (HH:mm) | ✔ | 수령 예정 시간 (지점 상세 화면에서 슬롯 선택) | `10:00` |
| `createdAt` | datetime | ✔ | 신청 일시 | `2026-07-28T09:12:00+09:00` |
| `processedAt` | datetime \| null | | 완료 처리 일시 (완료 시 세팅) | `null` |
| `idVerified` | boolean | ✔ | 지점 현장 신분증 대조 완료 여부 (시뮬레이션) | `false` |
| `reminderStatus` | enum | ✔ | `NONE`(발송전) \| `CONFIRMED`(방문예정확인) \| `NO_RESPONSE`(무응답) | `CONFIRMED` |

### 파생/계산 규칙
- `krwAmount = round(foreignAmount * rate)` — 프로토타입은 매출/매입 동일 공식(스프레드 미반영). `// TODO: 스프레드/우대율 반영`
- `rate` 는 **6단계(최종확인) 진입 시점에 픽스**되어 이후 변하지 않음.
- 회원/비회원 우대율은 미구현 — `rate`는 항상 비회원 기준.

### 인덱스 제안 (백엔드)
- `UNIQUE(reservationNo)`
- `INDEX(email)` — 예약조회
- `INDEX(branchId, pickupDate, status)` — 운영자 시재준비 리스트
- `INDEX(status, pickupDate)` — 자동취소 배치

---

## 2. Branch (지점)

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | string | ✔ | PK |
| `name` | i18n string | ✔ | 지점명 (`{ ko, en }`) |
| `address` | i18n string | ✔ | 주소 (`{ ko, en }`) |
| `leadTimeDays` | int | ✔ | 리드타임(준비일수). 예약일+리드타임 이후부터 수령 가능 |
| `currencyLimits` | map | ✔ | `통화코드 → { min, max }` (취급통화 + 통화별 한도) |

> `currencyLimits` 의 키 목록 = 그 지점이 취급하는 통화. 통화선택(2단계)은 이 키 목록만 노출.
> **`// TODO: 최소/최대금액·리드타임 실제 정책 수치로 교체`** (현재는 임의 목데이터)

### 정규화 시 (백엔드 참고)
`currencyLimits` 는 별도 테이블로 분리 가능:

**BranchCurrency**

| 필드 | 타입 | 설명 |
|---|---|---|
| `branchId` | FK→Branch | |
| `currency` | string(3) | |
| `minAmount` | decimal | 통화별 최소 |
| `maxAmount` | decimal | 통화별 최대 |
| PK | `(branchId, currency)` | |

---

## 3. Rate (환율) — 참조 데이터

프로토타입은 고정 목환율(`src/data/rates.js`)을 사용합니다. 실제 백엔드에서는:

| 필드 | 타입 | 설명 |
|---|---|---|
| `currency` | string(3) | 통화코드 |
| `baseRate` | decimal(18,4) | 기준환율 (KRW/unit) |
| `guestRate` | decimal(18,4) | 비회원 적용환율 (프로토타입이 쓰는 값) |
| `memberRate` | decimal(18,4) | 회원 우대환율 (미구현) |
| `effectiveAt` | datetime | 환율 유효 시각 |

> 예약 생성 시 당시 `guestRate` 스냅샷을 `Reservation.rate` 에 복사(픽스)합니다.

---

## 4. Enum 정의

```
ReservationStatus  = BOOKED | COMPLETED | CANCELLED
TransactionType    = SELL   | BUY
ReminderStatus     = NONE   | CONFIRMED | NO_RESPONSE
```

- **SELL(매출)**: 고객이 외화를 구매 → 지점은 **외화 시재** 준비
- **BUY(매입)**: 고객이 외화를 판매 → 지점은 **원화 시재** 준비

---

## 4.5 어드민 한도 정책 (CEMS 외국인서비스 한도관리)

CEMS "외국인서비스 한도관리" 화면이 다루는 데이터. 프로토타입에서는 `SettingsContext`(프론트 상태)로만
관리하며 새로고침 시 초기화됩니다. 실제 백엔드에서는 아래 두 구조로 저장 권장.

### CurrencyMinAmount (통화별 최소 환전금액 · 전체 지점 공통)

| 필드 | 타입 | 설명 |
|---|---|---|
| `currency` | string(3) | PK. 통화코드 (18종) |
| `minAmount` | decimal | 최소 환전금액 (외화 기준) |

- 프로토타입 시드: `POLICY_MIN_AMOUNTS` (`src/data/rates.js`). // TODO: 실제 정책 수치
- **최대금액 컬럼 없음** — 최대는 지점별 리스크 상한(아래)에서 관리.

### BranchMaxAmount (지점별 건당 최대 환전금액 · 환율 리스크 상한)

| 필드 | 타입 | 설명 |
|---|---|---|
| `branchId` | FK→Branch | |
| `currency` | string(3) | |
| `maxAmount` | decimal | 건당 최대 환전금액 (외화 기준) |
| PK | `(branchId, currency)` | |

- 입력 방식: `USD 기준 금액`을 일괄 입력하면 목환율로 통화별 상당액(`maxAmount`)을 자동 계산 후
  통화별 개별 수정. 지점 단위로 저장.
- 프로토타입 초기 시드: 기존 `Branch.currencyLimits[*].max` 값에서 로드(`SettingsContext.seedBranchMax`).
- 예약 금액 검증(booking)은 기존 `Branch.currencyLimits` 를 그대로 사용하며, 본 어드민 화면은
  데모 목적의 별도 상태입니다. (실제로는 이 테이블이 검증의 소스가 되도록 연결 예정)

### 통화 마스터 (18종)
`CURRENCY_ORDER` (`src/data/rates.js`): USD, JPY, EUR, CNY, GBP, HKD, THB, TWD, SGD, AUD, CAD, CHF,
NZD, PHP, MYR, IDR, VND, INR. 각 통화는 `CURRENCY_META`(국기·명칭)와 `MOCK_RATES`(목환율)를 가짐.

---

## 5. 프로토타입에서 생략한 것 (Out of Scope)

| 항목 | 사유 |
|---|---|
| User / 회원 테이블 | 로그인 없음 (확정) |
| Payment / PG | 무결제 예약, 현장 결제 |
| IdDocument 업로드 | 온라인 신분증 업로드 없음 (현장 OCR) |
| NoShowPenalty | 노쇼 제재 없음 |
| 우대율/컷오프 정책 | 프로토타입 범위 밖 (`// TODO`) |
