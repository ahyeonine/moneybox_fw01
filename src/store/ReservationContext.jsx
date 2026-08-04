import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { SEED_RESERVATIONS } from '../data/seedReservations.js'
import { BRANCHES } from '../data/branches.js'
import { generateReservationNo } from '../lib/reservationNo.js'
import { diffDays, addDays } from '../lib/date.js'

const ReservationContext = createContext(null)

// 프로토타입 기준일(오늘, KST 달력 날짜). 실제 스케줄러 대신 시뮬레이션으로 흘려보낸다.
const INITIAL_TODAY = '2026-07-30'

// 노쇼(자동취소) 누적 차단 임계값.
// TODO: 실제 임계값 정책 확정 필요 (현재 N=2 는 프로토타입 임시값)
export const NOSHOW_LIMIT = 2

function clone(arr) {
  return arr.map((r) => ({ ...r }))
}

// 재고(동시성) 시드: 지점×통화 조합별 재고 수량. 데모용으로 B001+USD 만 1개로 세팅.
function seedStock() {
  const s = {}
  for (const b of BRANCHES) {
    for (const cur of Object.keys(b.currencyLimits)) {
      s[`${b.id}:${cur}`] = 50 // 충분한 기본 재고 (목데이터)
    }
  }
  s['B001:USD'] = 1 // 데모: 재고 1개만 남은 상태
  return s
}

export function ReservationProvider({ children }) {
  const [reservations, setReservations] = useState(() => clone(SEED_RESERVATIONS))
  const [today, setToday] = useState(INITIAL_TODAY)
  // 재고는 동기적으로 읽고/차감해야 하므로 ref 로 관리 (동시성 확인 로직에서 사용)
  const stockRef = useRef(seedStock())

  // 신규 예약 생성 → BOOKED 상태로 추가, 예약번호 발급
  const createReservation = useCallback(
    (draft) => {
      const reservationNo = generateReservationNo(today, reservations)
      const record = {
        reservationNo,
        status: 'BOOKED',
        transactionType: draft.transactionType, // 내부 데이터: 항상 BUY(매입) 고정. 화면 미노출
        branchId: draft.branchId,
        currency: draft.currency,
        rate: draft.rate,
        foreignAmount: draft.foreignAmount,
        krwAmount: draft.krwAmount,
        customerName: draft.customerName,
        email: draft.email,
        pickupDate: draft.pickupDate,
        pickupTime: draft.pickupTime ?? '10:00',
        createdAt: `${today}T00:00:00+09:00`, // 프로토타입: 시각은 기준일 자정(KST)으로 기록
        processedAt: null,
        idVerified: false,
        reminderStatus: 'NONE',
        cancelReason: null, // CANCELLED 시 'AUTO'(노쇼/자동취소) | 'CUSTOMER'(고객취소)
      }
      setReservations((prev) => [record, ...prev])
      return record
    },
    [today, reservations]
  )

  const findReservation = useCallback(
    (reservationNo, email) => {
      const no = (reservationNo || '').trim().toUpperCase()
      const em = (email || '').trim().toLowerCase()
      return (
        reservations.find(
          (r) => r.reservationNo.toUpperCase() === no && r.email.toLowerCase() === em
        ) || null
      )
    },
    [reservations]
  )

  const getByNo = useCallback(
    (reservationNo) => {
      const no = (reservationNo || '').trim().toUpperCase()
      return reservations.find((r) => r.reservationNo.toUpperCase() === no) || null
    },
    [reservations]
  )

  // 예약조회: (예약번호+이메일) 유효성 확인 후, 같은 이메일의 모든 예약 리스트 반환.
  const findReservationsForLookup = useCallback(
    (reservationNo, email) => {
      const no = (reservationNo || '').trim().toUpperCase()
      const em = (email || '').trim().toLowerCase()
      if (!no || !em) return []
      const sameEmail = reservations.filter((r) => r.email.toLowerCase() === em)
      const valid = sameEmail.some((r) => r.reservationNo.toUpperCase() === no)
      if (!valid) return []
      return [...sameEmail].sort((a, b) =>
        a.pickupDate < b.pickupDate ? -1 : a.pickupDate > b.pickupDate ? 1 : 0
      )
    },
    [reservations]
  )

  // 노쇼(자동취소) 누적 횟수 — 이메일 기준. 신규예약 차단 판정에 사용.
  const countNoShow = useCallback(
    (email) => {
      const em = (email || '').trim().toLowerCase()
      if (!em) return 0
      return reservations.filter(
        (r) => r.email.toLowerCase() === em && r.status === 'CANCELLED' && r.cancelReason === 'AUTO'
      ).length
    },
    [reservations]
  )

  const updateReservation = useCallback((reservationNo, patch) => {
    setReservations((prev) =>
      prev.map((r) => (r.reservationNo === reservationNo ? { ...r, ...patch } : r))
    )
  }, [])

  // 고객 취소
  const cancelReservation = useCallback((reservationNo) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.reservationNo === reservationNo && r.status === 'BOOKED'
          ? { ...r, status: 'CANCELLED', cancelReason: 'CUSTOMER', processedAt: null }
          : r
      )
    )
  }, [])

  const completeReservation = useCallback(
    (reservationNo) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.reservationNo === reservationNo && r.status === 'BOOKED'
            ? { ...r, status: 'COMPLETED', idVerified: true, processedAt: `${today}T00:00:00+09:00` }
            : r
        )
      )
    },
    [today]
  )

  // ── 재고(동시성) ──
  const getStock = useCallback((branchId, currency) => stockRef.current[`${branchId}:${currency}`] ?? 0, [])
  // 재고 차감 시도: 남아있으면 차감 후 true, 없으면 false. (예약완료 직전 동시성 확인)
  const consumeStock = useCallback((branchId, currency) => {
    const k = `${branchId}:${currency}`
    const cur = stockRef.current[k] ?? 999
    if (cur <= 0) return false
    stockRef.current = { ...stockRef.current, [k]: cur - 1 }
    return true
  }, [])
  // 데모: "다른 사용자가 방금 이 재고를 가져갔다" → 해당 조합 재고 0으로
  const takeStockDemo = useCallback((branchId, currency) => {
    stockRef.current = { ...stockRef.current, [`${branchId}:${currency}`]: 0 }
  }, [])

  // 시뮬레이션: 기준일 하루 넘기기 (KST 달력 기준, UTC 산술로 결정적 처리)
  const advanceDay = useCallback(() => {
    setToday((d) => addDays(d, 1))
  }, [])

  // 시뮬레이션: 자동취소(노쇼) — 수령예정일(KST)이 오늘보다 이전인 BOOKED 예약을 취소.
  // 수령기한 = 수령예정일 당일. 당일까지는 유지하고, KST 자정을 넘겨 경과하면 자동취소한다.
  const runAutoCancel = useCallback(() => {
    let count = 0
    setReservations((prev) =>
      prev.map((r) => {
        if (r.status === 'BOOKED' && diffDays(r.pickupDate, today) < 0) {
          count += 1
          return { ...r, status: 'CANCELLED', cancelReason: 'AUTO' }
        }
        return r
      })
    )
    return count
  }, [today])

  const resetData = useCallback(() => {
    setReservations(clone(SEED_RESERVATIONS))
    setToday(INITIAL_TODAY)
    stockRef.current = seedStock()
  }, [])

  const value = {
    reservations,
    today,
    createReservation,
    findReservation,
    findReservationsForLookup,
    getByNo,
    countNoShow,
    updateReservation,
    cancelReservation,
    completeReservation,
    getStock,
    consumeStock,
    takeStockDemo,
    advanceDay,
    runAutoCancel,
    resetData,
  }

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>
}

export function useReservations() {
  const ctx = useContext(ReservationContext)
  if (!ctx) throw new Error('useReservations must be used within ReservationProvider')
  return ctx
}
