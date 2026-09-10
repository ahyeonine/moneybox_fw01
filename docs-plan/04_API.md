# API 정리 (REST Spec)

> 프로토타입은 백엔드 없이 프론트 상태로 동작한다. 아래는 향후 개발용 REST 명세 + 프로토타입 매핑.
> Base URL `/api/v1` · 고객 API 무인증 · 운영자 API `Authorization: Bearer <staff token>` · 날짜 `YYYY-MM-DD`, 일시 ISO-8601(+09:00) · 금액은 KRW=정수, 외화=소수.

## 1. 참조 데이터 (Public)

| Method · Path | 설명 | 프로토타입 |
|---|---|---|
| `GET /branches` | 지점 목록(취급통화·한도·리드타임) | `src/data/branches.js` |
| `GET /branches/{id}/currencies` | 지점 취급통화 + 한도 | `branchCurrencies()` |
| `GET /rates?currencies=USD,JPY` | 현재 환율(전 고객 동일) | `src/data/rates.js` |
| `GET /branches/{id}/availability?currency&date&amount` | 재고 확인(예약 가능 여부) | `isSoldOut()` |
| `GET /geocode?q=...&countrycodes=kr` | (V2) 장소 검색 → 좌표 | OpenStreetMap **Nominatim** 직접 호출(키 불필요) |

```json
GET /rates → 200 { "USD": 1385.0, "JPY": 8.95 }
GET /branches/{id}/availability → 200 {"available":true} · 409 {"available":false,"reason":"SOLD_OUT"}
```

## 2. 예약 (Customer · 무인증)

### `POST /reservations` — 신규 예약(무결제). 서버가 예약번호 발급 + 환율 픽스
→ `createReservation()`
```json
Request  { "branchId":"B001","transactionType":"BUY","currency":"USD",
           "foreignAmount":1000,"pickupDate":"2026-07-31","pickupTime":"10:00",
           "customerName":"JOHN SMITH","email":"john@example.com",
           "consent":{"terms":true,"privacy":true,"thirdParty":true,"noshow":true} }
201      { "reservationNo":"RSV-20260731-0001","status":"BOOKED","rate":1385.0,
           "krwAmount":1385000, ... }
422 { "errors":[{"field":"foreignAmount","code":"BELOW_MIN"}] }   409 { "code":"SOLD_OUT" }
```
- `transactionType`은 **`BUY`(원화구매, 외화→원화) 고정** — 외국인 웹사이트는 원화 살 때만 지원(매각 미지원).
- code: `BELOW_MIN | ABOVE_MAX | INVALID_FORMAT | LEAD_TIME | OUT_OF_WINDOW | SOLD_OUT`
- 수령일: 리드타임 이후 ~ 최대 2주(14일).

| Method · Path | 설명 | 프로토타입 |
|---|---|---|
| `GET /reservations/lookup?reservationNo&email` | 예약조회(번호+이메일, 무로그인) | `findReservation()` |
| `PATCH /reservations/{no}` | 예약 변경(BOOKED만) | `updateReservation()` |
| `POST /reservations/{no}/cancel` | 고객 취소 BOOKED→CANCELLED | `cancelReservation()` |
| `POST /reservations/{no}/reminder-response` | 방문예정 확인(**이 시점 재고 차감**) | `confirmVisit()` |

## 3. 회원(선택) — 쿠폰 전용

> 예약에는 회원가입이 **필요 없다.** 회원가입은 "환율 최저가 보장 쿠폰"을 받기 위한 **선택** 기능(프로토타입은 시뮬레이션, 실제 계정 미생성).

| Method · Path | 설명 |
|---|---|
| `POST /auth/email/code` | 이메일 인증번호 발송(수신 가능 여부 확인) |
| `POST /auth/signup` | 이름·이메일(+인증) 가입 → 쿠폰 적용 |

## 4. 운영자 (Operator · 인증)

| Method · Path | 설명 | 프로토타입 |
|---|---|---|
| `GET /operator/reservations` | 시재준비 리스트(필터/정렬) | `PrepList` |
| `GET /operator/reservations/{no}` | 거래처리용 상세 | `getByNo()` |
| `POST /operator/reservations/{no}/verify-id` | 현장 신분증 대조 기록(기존 POS OCR, 시뮬레이션) | — |
| `POST /operator/reservations/{no}/complete` | 거래완료 BOOKED→COMPLETED (`idVerified` 선행) · **베스트레이트 정산** | `completeReservation()` |

- 베스트레이트 정산: 완료 시 **예약환율 vs 오늘환율 비교 → 원화구매(BUY)에 유리한(원화 더 많은) 쪽 적용**, 실제적용환율·최종원화금액 별도 기록.
- 시재준비 노출 규칙: `CONFIRMED` 노출 / `NO_RESPONSE`&미래 숨김 / `NO_RESPONSE`&당일 노출 / `CANCELLED` 미노출.

## 5. 배치/시스템

| Method · Path | 설명 |
|---|---|
| `POST /system/auto-cancel` | 수령기한(당일 KST 자정) 경과 `BOOKED`→`CANCELLED(AUTO)` 일괄. 방문예정확인 건은 차감 재고 복구. → `runAutoCancel()` |
| `POST /system/reminders/send` | 수령 전일/당일 리마인더 발송(미구현) |

## 6. 상태코드 요약
생성 `201` · 조회/변경/취소/완료 `200` · 검증실패 `422` · 재고소진·전이불가 `409` · 조회실패 `404` · 운영자 인증실패 `401`.
