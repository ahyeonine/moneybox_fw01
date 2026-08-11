# 개발 문서 (Development Docs)

해외환전예약 서비스(지점수령) 프로토타입 기준 개발 문서입니다.

| 문서 | 내용 |
|---|---|
| [01-data-model.md](./01-data-model.md) | 데이터 모델 — 예약/지점/환율 테이블 필드·타입·제약, enum |
| [02-screens-routing.md](./02-screens-routing.md) | 화면 목록과 라우팅 구조, 컴포넌트 트리, i18n |
| [03-api-spec.md](./03-api-spec.md) | REST API 엔드포인트 설계 (향후 백엔드 참고용) |
| [04-state-diagram.md](./04-state-diagram.md) | 상태 전이 다이어그램 (예약→완료/취소), 자동취소·리마인더 |

## 프로토타입 범위 요약

**In Scope (구현됨)**
- 지점수령예약 8단계 플로우 (`/book`)
- 예약조회 · 취소 · 변경 (`/lookup`)
- 운영자 신규예약 리스트 / 시재준비 요약 (`/operator` → 탭)
- 운영자 거래처리 (예약번호 조회 → 완료)
- 예약자정보 단계 이메일 OTP(입력 이메일 수신 가능 여부 확인)
- 한국어/영어 2개 언어, 예약 상태머신, 자동취소 시뮬레이션

**Out of Scope (자리/링크만)**
- eSIM(외부링크), 회사소개(더미), 로그인/회원가입/본인인증(없음)
- 공항수령, 온라인 결제/PG, 온라인 신분증 업로드, 현장 신분증 대조/OCR, 노쇼 제재
- 회원 우대율, 취소 컷오프, 더블옵트인

## 결정 필요 항목 처리 (프로토타입)

| 항목 | 처리 | 코드 위치 |
|---|---|---|
| 통화별 최소/최대금액 | 임의 목데이터 + `// TODO` | `src/data/branches.js` |
| 회원/비회원 우대율 | 구분 없음 — 전 고객 동일 환율 | `src/data/rates.js` |
| 취소 컷오프 | 정책 미확정(`// TODO`) — 화면에는 확정적 문구 미노출 | `store/ReservationContext.js#cancelReservation` |
| 이메일 인증 | 형식 검증 + OTP로 수신 가능 여부 확인(본인인증 아님) | `src/lib/validation.js`, `pages/booking/BookingFlow.jsx` |
| 재고 소진 | 데모용 결정성 규칙(B003+VND) | `pages/booking/BookingFlow.jsx#isSoldOut` |
| eSIM 연동 | 더미 외부링크 | `src/pages/EsimPage.jsx` |

> Mermaid 다이어그램은 GitHub에서 바로 렌더링됩니다.
