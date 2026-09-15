// 예약(Reservation) 시드 목데이터
// 예약조회/운영자 화면 데모를 위해 다양한 상태·수령일·리마인더 응답을 섞어 둔다.
// 기준일(오늘)은 앱 전역에서 2026-07-30 으로 시뮬레이션한다. (store/ReservationContext)

import { toKrw, getRate } from './rates.js'

// 이름 → 생년월일(여권/신분증 대조·POS 신분증 스캔 매칭용). 같은 이름은 같은 생년월일.
const NAME_DOB = {
  'JOHN SMITH': '1986-04-12',
  'JON SMITH': '1986-04-12', // 오입력(철자 오타) 데모 — 생년월일 동일

  'YUKI TANAKA': '1992-09-03',
  'MARIE DUBOIS': '1990-01-27',
  'WEI CHEN': '1988-11-15',
  'DAVID LEE': '1979-06-08',
  'AKIRA SATO': '1995-03-21',
  'NOSHOW USER': '1991-07-19',
  'RUSH ONE': '1993-12-01',
  'RUSH TWO': '1990-05-30',
  'CONFIRMED NOSHOW': '1987-02-14',
  'BEST RATE': '1994-08-25',
  'MEI LIN': '1996-10-10',

  // 국내예약(한국인) 데모 — 신분증(주민등록증) 대조용
  '홍길동': '1985-05-16',
  '김민준': '1990-11-03',
  '이서연': '1993-02-27',
  '박지훈': '1988-08-09',
  '최수아': '1996-04-21',
  '정우성': '1979-12-30',
}

// 헬퍼: 시드 한 건 생성
function make(o) {
  const rate = o.rate ?? getRate(o.currency)
  return {
    reservationNo: o.reservationNo,
    status: o.status, // BOOKED | COMPLETED | CANCELLED
    transactionType: o.transactionType, // SELL(매출·외화준비) | BUY(매입·원화준비)
    branchId: o.branchId,
    currency: o.currency,
    rate,
    foreignAmount: o.foreignAmount,
    krwAmount: toKrw(o.foreignAmount, rate),
    customerName: o.customerName,
    birthDate: o.birthDate ?? NAME_DOB[o.customerName] ?? null, // 여권/신분증 생년월일
    email: o.email,
    pickupDate: o.pickupDate, // YYYY-MM-DD
    pickupTime: o.pickupTime ?? '10:00', // HH:mm (지점 상세 화면에서 선택)
    createdAt: o.createdAt,
    processedAt: o.processedAt ?? null,
    idVerified: o.idVerified ?? false,
    // 리마인더 응답: CONFIRMED(방문예정확인) | NO_RESPONSE(무응답) | NONE(발송전)
    reminderStatus: o.reminderStatus ?? 'NONE',
    // 취소 사유: 'AUTO'(노쇼/자동취소) | 'CUSTOMER'(고객취소) | null
    cancelReason: o.cancelReason ?? null,
  }
}

export const SEED_RESERVATIONS = [
  make({
    reservationNo: 'RSV-20260728-0001',
    status: 'BOOKED',
    transactionType: 'SELL',
    branchId: 'B001',
    currency: 'USD',
    foreignAmount: 500,
    customerName: 'JOHN SMITH',
    email: 'john@example.com',
    pickupDate: '2026-07-31',
    createdAt: '2026-07-28T09:12:00+09:00',
    reminderStatus: 'CONFIRMED',
  }),
  make({
    reservationNo: 'RSV-20260728-0002',
    status: 'BOOKED',
    transactionType: 'BUY',
    branchId: 'B001',
    currency: 'JPY',
    foreignAmount: 80000,
    customerName: 'YUKI TANAKA',
    email: 'yuki@example.com',
    pickupDate: '2026-07-30',
    createdAt: '2026-07-28T14:40:00+09:00',
    reminderStatus: 'NO_RESPONSE', // 당일 무응답 → 준비리스트 노출
  }),
  make({
    reservationNo: 'RSV-20260729-0003',
    status: 'BOOKED',
    transactionType: 'SELL',
    branchId: 'B002',
    currency: 'EUR',
    foreignAmount: 1200,
    customerName: 'MARIE DUBOIS',
    email: 'marie@example.com',
    pickupDate: '2026-08-03',
    createdAt: '2026-07-29T11:05:00+09:00',
    reminderStatus: 'NONE',
  }),
  make({
    reservationNo: 'RSV-20260729-0004',
    status: 'BOOKED',
    transactionType: 'SELL',
    branchId: 'B003',
    currency: 'USD',
    foreignAmount: 2000,
    customerName: 'WEI CHEN',
    email: 'wei@example.com',
    pickupDate: '2026-08-01',
    createdAt: '2026-07-29T16:22:00+09:00',
    reminderStatus: 'NO_RESPONSE', // 전일까지 무응답 → 준비리스트 기본 숨김
  }),
  make({
    reservationNo: 'RSV-20260725-0005',
    status: 'COMPLETED',
    transactionType: 'SELL',
    branchId: 'B001',
    currency: 'USD',
    foreignAmount: 800,
    customerName: 'DAVID LEE',
    email: 'david@example.com',
    pickupDate: '2026-07-27',
    createdAt: '2026-07-25T10:00:00+09:00',
    processedAt: '2026-07-27T13:30:00+09:00',
    idVerified: true,
    reminderStatus: 'CONFIRMED',
  }),
  make({
    reservationNo: 'RSV-20260724-0006',
    status: 'CANCELLED',
    transactionType: 'BUY',
    branchId: 'B004',
    currency: 'JPY',
    foreignAmount: 50000,
    customerName: 'AKIRA SATO',
    email: 'akira@example.com',
    pickupDate: '2026-07-26',
    createdAt: '2026-07-24T08:15:00+09:00',
    reminderStatus: 'NO_RESPONSE',
    cancelReason: 'CUSTOMER', // 고객취소 (노쇼 아님)
  }),
  // ── 노쇼(자동취소) 2회 누적된 더미 이메일 (신규예약 차단 테스트용) ──
  make({
    reservationNo: 'RSV-20260710-0101',
    status: 'CANCELLED',
    transactionType: 'BUY',
    branchId: 'B001',
    currency: 'USD',
    foreignAmount: 500,
    customerName: 'NOSHOW USER',
    email: 'noshow@example.com',
    pickupDate: '2026-07-12',
    createdAt: '2026-07-10T09:00:00+09:00',
    reminderStatus: 'NO_RESPONSE',
    cancelReason: 'AUTO', // 노쇼 1
  }),
  make({
    reservationNo: 'RSV-20260718-0102',
    status: 'CANCELLED',
    transactionType: 'BUY',
    branchId: 'B002',
    currency: 'USD',
    foreignAmount: 300,
    customerName: 'NOSHOW USER',
    email: 'noshow@example.com',
    pickupDate: '2026-07-20',
    createdAt: '2026-07-18T09:00:00+09:00',
    reminderStatus: 'NO_RESPONSE',
    cancelReason: 'AUTO', // 노쇼 2 → 임계값(2) 도달, 신규예약 차단 대상
  }),
  // ── 같은 이메일(john@example.com)로 여러 건 예약된 케이스 (예약조회 리스트 데모) ──
  make({
    reservationNo: 'RSV-20260729-0007',
    status: 'BOOKED',
    transactionType: 'SELL',
    branchId: 'B002',
    currency: 'EUR',
    foreignAmount: 600,
    customerName: 'JOHN SMITH',
    email: 'john@example.com',
    pickupDate: '2026-08-02',
    createdAt: '2026-07-29T10:05:00+09:00',
    reminderStatus: 'CONFIRMED',
  }),
  make({
    reservationNo: 'RSV-20260726-0008',
    status: 'COMPLETED',
    transactionType: 'SELL',
    branchId: 'B001',
    currency: 'USD',
    foreignAmount: 300,
    customerName: 'JOHN SMITH',
    email: 'john@example.com',
    pickupDate: '2026-07-28',
    createdAt: '2026-07-26T16:20:00+09:00',
    processedAt: '2026-07-28T11:10:00+09:00',
    idVerified: true,
    reminderStatus: 'CONFIRMED',
  }),
  // ── 신분증 스캔 오입력(철자 오타) 데모 ──
  // 이름 'JON SMITH'(JOHN SMITH의 오타), 생년월일은 동일(1986-04-12).
  // POS 신분증 스캔(JOHN SMITH) 시 "유사(오입력 의심)"로 함께 노출된다.
  make({
    reservationNo: 'RSV-20260730-0009',
    status: 'BOOKED',
    transactionType: 'BUY',
    branchId: 'B001',
    currency: 'USD',
    foreignAmount: 700,
    customerName: 'JON SMITH',
    email: 'jon.typo@example.com',
    pickupDate: '2026-08-02',
    createdAt: '2026-07-30T09:00:00+09:00',
    reminderStatus: 'CONFIRMED',
  }),
  // ── 재고 경쟁 데모: 같은 지점·통화(B004+USD, 재고 1개)에 방문예정 미확인 예약 2건 ──
  // 같은 이메일(rush@example.com)로 조회 → 첫 건 "방문 예정 확인" 성공(재고 1→0),
  // 둘째 건 확인 시 "다른 고객이 이미 확정하여 재고가 소진되었습니다".
  make({
    reservationNo: 'RSV-20260729-0201',
    status: 'BOOKED',
    transactionType: 'BUY',
    branchId: 'B004',
    currency: 'USD',
    foreignAmount: 500,
    customerName: 'RUSH ONE',
    email: 'rush@example.com',
    pickupDate: '2026-08-01',
    createdAt: '2026-07-29T09:30:00+09:00',
    reminderStatus: 'NO_RESPONSE',
  }),
  make({
    reservationNo: 'RSV-20260729-0202',
    status: 'BOOKED',
    transactionType: 'BUY',
    branchId: 'B004',
    currency: 'USD',
    foreignAmount: 300,
    customerName: 'RUSH TWO',
    email: 'rush@example.com',
    pickupDate: '2026-08-01',
    createdAt: '2026-07-29T09:31:00+09:00',
    reminderStatus: 'NO_RESPONSE',
  }),
  // ── 방문예정확인 후 미방문(노쇼) 데모 ──
  // reminderStatus=CONFIRMED(방문예정확인) 이므로 시드 재고(B002+USD)에서 1개 미리 차감된 상태.
  // 기준일을 수령기한(2026-07-31) 이후로 넘긴 뒤 "자동취소 실행" → 이 건도 자동취소되고
  // 확인 시점에 잡았던 가용시재가 복구된다. (노쇼 누적에도 카운트)
  make({
    reservationNo: 'RSV-20260729-0301',
    status: 'BOOKED',
    transactionType: 'BUY',
    branchId: 'B002',
    currency: 'USD',
    foreignAmount: 400,
    customerName: 'CONFIRMED NOSHOW',
    email: 'visit@example.com',
    pickupDate: '2026-07-31',
    createdAt: '2026-07-29T09:00:00+09:00',
    reminderStatus: 'CONFIRMED',
  }),
  // ── 베스트레이트(환율 보장) 데모 ──
  // 예약환율(1,300)을 현재 기준환율(USD 1,385)보다 낮게 고정해 둔 건.
  // POS 거래완료 처리 시 예약환율 vs 오늘환율(기준)을 비교 → 더 유리한 오늘환율(1,385)로 정산되어
  // 원화금액이 예약 시점보다 늘어나는 것을 시연한다. (실제적용환율은 별도 필드로 기록, 예약환율은 보존)
  make({
    reservationNo: 'RSV-20260729-0401',
    status: 'BOOKED',
    transactionType: 'BUY',
    branchId: 'B001',
    currency: 'USD',
    rate: 1300, // 예약 시점 고정환율(현재 기준환율보다 낮음)
    foreignAmount: 1000,
    customerName: 'BEST RATE',
    email: 'bestrate@example.com',
    pickupDate: '2026-07-31',
    createdAt: '2026-07-29T09:45:00+09:00',
    reminderStatus: 'CONFIRMED',
  }),
  // ── 예약번호 끝자리 중복 데모 ──
  // 끝 4자리(0001)가 RSV-20260728-0001 과 겹치는 다른 날짜 예약.
  // POS "예약번호 끝 4자리" 검색에서 같은 끝자리 여러 건이 리스트로 노출되는 것을 시연.
  make({
    reservationNo: 'RSV-20260805-0001',
    status: 'BOOKED',
    transactionType: 'BUY',
    branchId: 'B002',
    currency: 'JPY',
    foreignAmount: 60000,
    customerName: 'MEI LIN',
    email: 'mei@example.com',
    pickupDate: '2026-08-05',
    createdAt: '2026-08-01T10:00:00+09:00',
    reminderStatus: 'CONFIRMED',
  }),
  // ── 국내예약(한국인) 데모 — POS 국내예약 탭 목록용 (이름은 한글) ──
  make({
    reservationNo: 'RSV-20260730-1001',
    status: 'BOOKED',
    transactionType: 'SELL',
    branchId: 'B001',
    currency: 'USD',
    foreignAmount: 1000,
    customerName: '홍길동',
    email: 'hong@example.com',
    pickupDate: '2026-07-31',
    createdAt: '2026-07-30T10:10:00+09:00',
    reminderStatus: 'CONFIRMED',
  }),
  make({
    reservationNo: 'RSV-20260730-1002',
    status: 'BOOKED',
    transactionType: 'SELL',
    branchId: 'B002',
    currency: 'JPY',
    foreignAmount: 100000,
    customerName: '김민준',
    email: 'kim@example.com',
    pickupDate: '2026-08-01',
    createdAt: '2026-07-30T11:20:00+09:00',
    reminderStatus: 'NO_RESPONSE',
  }),
  make({
    reservationNo: 'RSV-20260729-1003',
    status: 'COMPLETED',
    transactionType: 'SELL',
    branchId: 'B001',
    currency: 'EUR',
    foreignAmount: 700,
    customerName: '이서연',
    email: 'lee@example.com',
    pickupDate: '2026-07-29',
    createdAt: '2026-07-28T09:40:00+09:00',
    processedAt: '2026-07-29T14:00:00+09:00',
    idVerified: true,
    reminderStatus: 'CONFIRMED',
  }),
  make({
    reservationNo: 'RSV-20260731-1004',
    status: 'BOOKED',
    transactionType: 'SELL',
    branchId: 'B004',
    currency: 'USD',
    foreignAmount: 500,
    customerName: '박지훈',
    email: 'park@example.com',
    pickupDate: '2026-08-02',
    createdAt: '2026-07-31T13:05:00+09:00',
    reminderStatus: 'NONE',
  }),
  make({
    reservationNo: 'RSV-20260730-1005',
    status: 'BOOKED',
    transactionType: 'BUY',
    branchId: 'B002',
    currency: 'CNY',
    foreignAmount: 3000,
    customerName: '최수아',
    email: 'choi@example.com',
    pickupDate: '2026-08-03',
    createdAt: '2026-07-30T15:45:00+09:00',
    reminderStatus: 'CONFIRMED',
  }),
  make({
    reservationNo: 'RSV-20260728-1006',
    status: 'CANCELLED',
    transactionType: 'SELL',
    branchId: 'B003',
    currency: 'USD',
    foreignAmount: 1200,
    customerName: '정우성',
    email: 'jung@example.com',
    pickupDate: '2026-07-30',
    createdAt: '2026-07-28T08:50:00+09:00',
    reminderStatus: 'NO_RESPONSE',
    cancelReason: 'CUSTOMER',
  }),
]
