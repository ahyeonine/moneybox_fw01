// 예약(Reservation) 시드 목데이터
// 예약조회/운영자 화면 데모를 위해 다양한 상태·수령일·리마인더 응답을 섞어 둔다.
// 기준일(오늘)은 앱 전역에서 2026-07-30 으로 시뮬레이션한다. (store/ReservationContext)

import { toKrw, getRate } from './rates.js'

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
]
