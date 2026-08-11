# API 엔드포인트 설계 (REST Spec)

> 프로토타입에는 실제 백엔드가 없습니다(프론트 상태 관리). 아래는 **향후 개발 시 참고용** REST 명세로,
> 프로토타입의 `ReservationContext` 액션들이 실제 API로 어떻게 매핑되는지 함께 표기했습니다.

- Base URL: `/api/v1`
- 인증: 고객 API는 무인증(로그인 없음). 운영자 API는 `Authorization: Bearer <staff token>` 가정.
- 통화금액은 문자열/숫자 혼용 주의 → 응답은 정수(KRW)·소수(외화) 명시.
- 날짜: `YYYY-MM-DD`, 일시: ISO-8601(+09:00).

---

## 1. 참조 데이터 (Public)

### `GET /branches`
지점 목록. 취급통화·한도·리드타임 포함.
→ 프로토타입: `src/data/branches.js`

```json
200 OK
[
  {
    "id": "B001",
    "name": { "ko": "명동점", "en": "Myeongdong Branch" },
    "address": { "ko": "서울 중구 명동길 14", "en": "14 Myeongdong-gil..." },
    "leadTimeDays": 1,
    "currencies": [
      { "currency": "USD", "min": 100, "max": 10000 },
      { "currency": "JPY", "min": 10000, "max": 1500000 }
    ]
  }
]
```

### `GET /branches/{branchId}/currencies`
특정 지점 취급통화 + 한도.

### `GET /rates?currencies=USD,JPY`
현재 환율 (회원/비회원 구분 없이 전 고객 동일).
→ 프로토타입: `src/data/rates.js`

```json
200 OK
{ "USD": 1385.0, "JPY": 8.95 }
```

### `GET /branches/{branchId}/availability?currency=USD&date=2026-08-01&amount=500`
재고 확인(예약 가능 여부). 8단계 통화선택/최종확인, 변경 시 재확인에 사용.
→ 프로토타입: `isSoldOut()` 목함수

```json
200 OK
{ "available": true }
409 Conflict
{ "available": false, "reason": "SOLD_OUT" }
```

---

## 2. 예약 (Customer)

### `POST /reservations`
신규 예약 생성 (무결제). 서버가 예약번호 발급 + 환율 픽스.
→ 프로토타입: `createReservation()`

**Request**
```json
{
  "branchId": "B001",
  "transactionType": "SELL",
  "currency": "USD",
  "foreignAmount": 500,
  "pickupDate": "2026-07-31",
  "customerName": "JOHN SMITH",
  "email": "john@example.com",
  "consent": { "noshow": true, "privacy": true }
}
```

**Response**
```json
201 Created
{
  "reservationNo": "RSV-20260731-0001",
  "status": "BOOKED",
  "transactionType": "SELL",
  "branchId": "B001",
  "currency": "USD",
  "rate": 1385.0,
  "foreignAmount": 500,
  "krwAmount": 692500,
  "pickupDate": "2026-07-31",
  "customerName": "JOHN SMITH",
  "email": "john@example.com",
  "createdAt": "2026-07-30T12:00:00+09:00"
}
```

**검증 에러 (예시)**
```json
422 Unprocessable Entity
{ "errors": [
  { "field": "foreignAmount", "code": "BELOW_MIN" },
  { "field": "email", "code": "INVALID_FORMAT" }
] }
409 Conflict  { "code": "SOLD_OUT" }
```
- `code`: `BELOW_MIN` | `ABOVE_MAX` | `INVALID_FORMAT` | `LEAD_TIME` | `OUT_OF_WINDOW` | `SOLD_OUT`
- 수령일 제약: 리드타임 이후 ~ **최대 2주(14일)** 이내. 범위 밖이면 `LEAD_TIME`(리드타임 미만) 또는 `OUT_OF_WINDOW`(14일 초과).

### `GET /reservations/lookup?reservationNo=RSV-...&email=...`
예약조회 (번호+이메일 대조, 무로그인).
→ 프로토타입: `findReservation()`

```json
200 OK { ...reservation... }
404 Not Found { "code": "NOT_FOUND" }
```

### `PATCH /reservations/{reservationNo}`
예약 변경 (지점/통화/금액/수령일). `BOOKED` 상태에서만.
변경 시 재고 재확인 + 환율 재픽스(정책에 따라).
→ 프로토타입: `updateReservation()`

**Request** (변경 필드만)
```json
{ "email": "john@example.com", "branchId": "B002", "currency": "EUR",
  "foreignAmount": 1000, "pickupDate": "2026-08-02" }
```
```json
200 OK { ...updated... }
409 Conflict { "code": "NOT_EDITABLE", "status": "COMPLETED" }
```

### `POST /reservations/{reservationNo}/cancel`
고객 취소. `BOOKED` → `CANCELLED`. (취소 컷오프 정책은 미확정 — `// TODO`)
→ 프로토타입: `cancelReservation()`

**Request** `{ "email": "john@example.com" }`
```json
200 OK { "reservationNo": "...", "status": "CANCELLED" }
409 Conflict { "code": "NOT_CANCELABLE" }
```

---

## 3. 운영자 (Operator, 인증 필요)

### `GET /operator/reservations`
시재준비 리스트. 필터/정렬 지원.
→ 프로토타입: `PrepList`

**Query**: `branchId`, `from`(pickupDate≥), `to`(pickupDate≤), `status`, `includeHidden`(리마인더 무응답 숨김 포함), `sort=pickupDate:asc`

```json
200 OK
{
  "items": [ { "reservationNo": "...", "pickupDate": "...", "customerName": "...",
    "currency": "USD", "transactionType": "SELL", "foreignAmount": 500,
    "rate": 1385.0, "krwAmount": 692500, "reminderStatus": "CONFIRMED",
    "status": "BOOKED" } ],
  "summary": { "sellByCurrency": { "USD": 500 }, "buyKrwTotal": 0 }
}
```

리마인더 응답별 기본 노출 규칙(서버가 `includeHidden=false` 시 적용):
- `CONFIRMED` → 노출
- `NO_RESPONSE` & 수령일 미래(전일까지) → 숨김
- `NO_RESPONSE` & 수령일 당일 → 노출
- `CANCELLED` → 미노출

### `GET /operator/reservations/{reservationNo}`
거래처리용 상세 조회.
→ 프로토타입: `getByNo()`

> 본인인증·현장 신분증 대조/OCR 절차 없음 — 별도 verify-id 엔드포인트 없이 예약번호 조회 후 바로 거래완료한다.

### `POST /operator/reservations/{reservationNo}/complete`
거래완료 처리. `BOOKED` → `COMPLETED`.
→ 프로토타입: `completeReservation()`

```json
200 OK { "reservationNo": "...", "status": "COMPLETED", "processedAt": "..." }
409 Conflict { "code": "NOT_BOOKED" }
```

---

## 4. 배치/시스템

### `POST /system/auto-cancel` (스케줄러/크론)
수령기한(당일 KST 자정) 경과한 `BOOKED` 예약을 `CANCELLED`(`cancelReason=AUTO`)로 일괄 전환.
리마인더 응답상태(방문예정확인/미응답)와 무관하게 동일 적용하며, 노쇼 이력에도 동일 카운트.
방문예정확인(`CONFIRMED`)이었던 건은 차감했던 예약시재/가용시재를 **복구**한다(미응답 건은 미반영이라 복구 없음).
→ 프로토타입: `runAutoCancel()` (관리자 버튼으로 시뮬레이션, `{ cancelled, restored }` 반환)

```json
200 OK { "cancelledCount": 3, "restoredStock": 2 }
```

### 리마인더 발송/응답
- `POST /system/reminders/send` — 수령 전일/당일 이메일 발송, `reminderStatus` 갱신 트리거 (프로토타입 미구현)
- 고객 응답(방문예정 확인): `POST /reservations/{no}/reminder-response { "response": "CONFIRMED" }`
  - **이 시점에 재고를 차감**한다(예약시재 반영·가용시재 차감). 재고가 남아있으면 `reminderStatus=CONFIRMED`,
    소진 시 `409 SOLD_OUT`(상태는 `BOOKED` 유지) — 예약 생성(8단계)은 재고를 잡지 않으므로 경쟁은 여기서 해소.
  - → 프로토타입: `ReservationContext.confirmVisit()` (예약조회 화면 "방문 예정 확인" 버튼)

---

## 5. 상태코드 요약

| 상황 | 코드 |
|---|---|
| 생성 성공 | `201` |
| 조회/변경/취소/완료 성공 | `200` |
| 입력 검증 실패 | `422` |
| 재고소진/상태전이 불가 | `409` |
| 조회 실패 | `404` |
| 운영자 인증 실패 | `401` |
