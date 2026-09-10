# API · 실제 운영에 필요한 것

> 현재 프로토타입은 백엔드 없이 프론트 상태로만 동작한다(목데이터·시뮬레이션).
> 아래는 **실제로 작동시키려면 무엇이 필요한지**를 정리한 것: 백엔드 구성요소 · 외부 연동 · 엔드포인트 · 비기능 요구사항.

---

## A. 실제 작동에 필요한 것 (체크리스트)

### 1. 백엔드 서버 + DB
- REST(또는 GraphQL) API 서버 + 관계형 DB(PostgreSQL 등). 스키마는 `05_데이터모델.md` 기준: Reservation / Branch / BranchCurrency / Rate / CurrencyMinAmount / BranchMaxAmount.
- 트랜잭션·동시성 처리(특히 재고 차감/복구). 예약번호 발급(일자별 시퀀스, 유니크).

### 2. 환율 피드 (필수)
- 실시간 환율 소스(내부 딜링/외부 환율 API) → `Rate.baseRate` 갱신(현재 2분 자동변동은 목).
- **스프레드/우대 정책** 적용해 `appliedRate` 산출(현재 미반영, `// TODO`). 예약 생성 시 스냅샷을 `Reservation.rate`로 픽스.
- CEMS "외국인 웹사이트 매입환율 직접입력"이 실 환율 관리와 연동되어야 함.

### 3. 재고(시재) 시스템 (필수)
- 지점×통화별 가용시재 관리. `availability` 조회, **방문예정 확인 시 차감(consume)**, 자동취소 시 조건부 복구(restore).
- 동시성: 오버부킹 허용(예약 생성 시 미차감) → 확인 시점 경쟁 해소. 원자적 차감 필요.

### 4. 이메일 발송 (필수)
- 트랜잭션 메일 서비스(SES/SendGrid 등): **OTP 인증코드**, 예약완료 확인, 수령 전일/당일 **리마인더**, 취소 안내.
- OTP 저장소(코드·만료 5분·재발송 쿨다운·오답 5회 무효화) — 현재는 화면 표시 시뮬레이션.

### 5. 인증
- 고객: 예약은 **무인증**. 이메일은 형식검증 + OTP 수신확인(본인인증 아님).
- **선택 회원가입**(쿠폰용): 이름+이메일+이메일 인증. 실제 계정/세션 발급 필요(현재 시뮬레이션).
- 운영자(CEMS/POS): 스태프 인증(SSO/토큰) + 권한(지점/본사). `Authorization: Bearer`.

### 6. 지도/위치 (V2)
- 장소 검색·지오코딩: 프로토타입은 **OpenStreetMap Nominatim**(무료·정책상 프로덕션 부적합). 실서비스는 **Google/네이버/카카오 지오코딩 + 지도 SDK(키·쿼터·요금)** 권장.
- 지점 좌표 정합성, "가까운 지점" 계산(현재 하버사인, 실서비스는 실도로/소요시간 고려 가능).

### 7. 스케줄러/배치
- 자동취소(수령기한 경과 → CANCELLED, 조건부 재고복구), 리마인더 발송 크론.

### 8. CEMS/POS 연동
- 예약 생성 → CEMS 예약관리 리스트 반영. POS 거래완료 시 상태전이 + **베스트레이트 정산(예약환율 vs 오늘환율 → 유리한 쪽)** 결과·실제적용환율·최종원화금액 기록.
- 신분증 대조는 기존 POS 흐름(온라인 사전수집 없음).

### 9. 비기능 요구사항
- HTTPS/TLS, CORS(도메인 화이트리스트), **레이트 리밋**(OTP·검색·예약 남용 방지), 멱등성 키(예약 생성 중복 방지).
- 개인정보(이름·이메일) 보호·보관/파기 정책, 동의 이력 저장, 감사 로그, 관측성(로깅/모니터링/알림).
- i18n: 서버 응답 코드 기반(문구는 클라이언트 i18n), 다국어 확장(中·日).

---

## B. 엔드포인트 (설계안)

> Base `/api/v1` · 날짜 `YYYY-MM-DD`, 일시 ISO-8601(+09:00) · KRW=정수, 외화=소수.

### 참조 데이터 (Public)
- `GET /branches` — 지점(취급통화·한도·리드타임·좌표)
- `GET /branches/{id}/currencies`
- `GET /rates?currencies=USD,JPY` — 현재 적용환율(전 고객 동일)
- `GET /branches/{id}/availability?currency&date&amount` — 재고 확인 (`200 {available}` / `409 SOLD_OUT`)
- `GET /geocode?q=&countrycodes=kr` — (V2) 장소 검색 → 좌표 *(실서비스: 유료 지오코딩)*

### 예약 (Customer · 무인증)
- `POST /reservations` — 신규 예약(무결제). `transactionType='BUY'`(원화구매) 고정. 서버가 예약번호 발급 + 환율 픽스.
  - 검증코드: `BELOW_MIN | ABOVE_MAX | INVALID_FORMAT | LEAD_TIME | OUT_OF_WINDOW | SOLD_OUT`. 수령일 = 리드타임 이후 ~ 14일.
- `GET /reservations/lookup?reservationNo&email` — 조회(번호+이메일)
- `PATCH /reservations/{no}` — 변경(BOOKED만)
- `POST /reservations/{no}/cancel` — 고객 취소
- `POST /reservations/{no}/reminder-response` — 방문예정 확인 (**이 시점 재고 차감**, 소진 시 409)

### 인증/회원 (선택 · 쿠폰용)
- `POST /auth/email/code` — 이메일 인증코드 발송
- `POST /auth/email/verify` — 코드 검증
- `POST /auth/signup` — 이름·이메일(+인증) 가입 → 쿠폰 적용 *(예약엔 불필요)*

### 운영자 (Operator · 인증)
- `GET /operator/reservations` — 시재준비 리스트(필터/정렬, 리마인더 노출규칙)
- `GET /operator/reservations/{no}`
- `POST /operator/reservations/{no}/verify-id` — 현장 신분증 대조 기록
- `POST /operator/reservations/{no}/complete` — 거래완료(`idVerified` 선행) + **베스트레이트 정산**

### 배치/시스템
- `POST /system/auto-cancel` — 수령기한 경과 예약 일괄 취소(+조건부 재고복구)
- `POST /system/reminders/send` — 전일/당일 리마인더 발송

### 상태코드
생성 `201` · 성공 `200` · 검증실패 `422` · 재고소진·전이불가 `409` · 조회실패 `404` · 운영자 인증실패 `401`.
