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
]
