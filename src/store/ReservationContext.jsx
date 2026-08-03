import { createContext, useContext, useState, useCallback } from 'react'
import { SEED_RESERVATIONS } from '../data/seedReservations.js'
import { generateReservationNo } from '../lib/reservationNo.js'
import { diffDays } from '../lib/date.js'

const ReservationContext = createContext(null)

// 프로토타입 기준일(오늘). 실제 스케줄러 대신 시뮬레이션으로 흘려보낸다.
const INITIAL_TODAY = '2026-07-30'

function clone(arr) {
  return arr.map((r) => ({ ...r }))
}

export function ReservationProvider({ children }) {
  const [reservations, setReservations] = useState(() => clone(SEED_RESERVATIONS))
  const [today, setToday] = useState(INITIAL_TODAY)

  // 신규 예약 생성 → BOOKED 상태로 추가, 예약번호 발급
  const createReservation = useCallback(
    (draft) => {
      const reservationNo = generateReservationNo(today, reservations)
      const record = {
        reservationNo,
        status: 'BOOKED',
        transactionType: draft.transactionType,
        branchId: draft.branchId,
        currency: draft.currency,
        rate: draft.rate,
        foreignAmount: draft.foreignAmount,
        krwAmount: draft.krwAmount,
        customerName: draft.customerName,
        email: draft.email,
        pickupDate: draft.pickupDate,
        pickupTime: draft.pickupTime ?? '10:00',
        createdAt: `${today}T00:00:00+09:00`, // 프로토타입: 시각은 기준일 자정으로 기록
        processedAt: null,
        idVerified: false,
        reminderStatus: 'NONE',
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
  // 같은 이메일로 여러 건 예약한 경우 리스트가 여러 줄 나온다. 유효한 쌍이 없으면 빈 배열.
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

  const updateReservation = useCallback((reservationNo, patch) => {
    setReservations((prev) =>
      prev.map((r) => (r.reservationNo === reservationNo ? { ...r, ...patch } : r))
    )
  }, [])

  const cancelReservation = useCallback((reservationNo) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.reservationNo === reservationNo && r.status === 'BOOKED'
          ? { ...r, status: 'CANCELLED', processedAt: null }
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

  // 시뮬레이션: 기준일 하루 넘기기
  const advanceDay = useCallback(() => {
    setToday((d) => {
      const dt = new Date(d + 'T00:00:00')
      dt.setDate(dt.getDate() + 1)
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    })
  }, [])

  // 시뮬레이션: 자동취소 — 수령예정일이 오늘보다 이전인 BOOKED 예약을 취소
  // (수령기한=수령예정일 당일. 당일까지는 유지, 경과 시 자동취소)
  const runAutoCancel = useCallback(() => {
    let count = 0
    setReservations((prev) =>
      prev.map((r) => {
        if (r.status === 'BOOKED' && diffDays(r.pickupDate, today) < 0) {
          count += 1
          return { ...r, status: 'CANCELLED' }
        }
        return r
      })
    )
    return count
  }, [today])

  const resetData = useCallback(() => {
    setReservations(clone(SEED_RESERVATIONS))
    setToday(INITIAL_TODAY)
  }, [])

  const value = {
    reservations,
    today,
    createReservation,
    findReservation,
    findReservationsForLookup,
    getByNo,
    updateReservation,
    cancelReservation,
    completeReservation,
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
