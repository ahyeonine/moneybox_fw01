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

// 가용시재(동시성) 시드: 지점×통화 조합별 잔여 수량. 데모용으로 B004+USD 만 1개로 세팅.
// 재고는 예약 생성 시점이 아니라 리마인더 "방문 예정" 확인 시점(confirmVisit)에 차감된다.
function seedStock() {
  const s = {}
  for (const b of BRANCHES) {
    for (const cur of Object.keys(b.currencyLimits)) {
      s[`${b.id}:${cur}`] = 50 // 충분한 기본 재고 (목데이터)
    }
  }
  s['B004:USD'] = 1 // 데모: 재고 1개만 남은 상태 (방문예정 확정 경쟁 시연용, 미응답 2건이라 미차감)
  // 시드 예약 중 이미 "방문예정확인(CONFIRMED)"된 BOOKED 건은 확인 시점에 가용시재를 잡은 상태이므로
  // 초기 재고에서 미리 차감해 둔다. (수령기한 경과로 자동취소되면 이 재고가 복구되는 것을 시연 가능)
  for (const r of SEED_RESERVATIONS) {
    if (r.status === 'BOOKED' && r.reminderStatus === 'CONFIRMED') {
      const k = `${r.branchId}:${r.currency}`
      s[k] = (s[k] ?? 0) - 1
    }
  }
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

  // 지점 취소 (운영자/CEMS) — 노쇼 카운트 제외. cancelReason='BRANCH'
  //  · 방문예정확인(CONFIRMED)으로 재고가 잡혀 있던 건은 가용시재를 복구한다.
  //  · 취소된 예약 레코드를 반환 → 호출측에서 지점취소 안내 이메일 발송에 사용.
  const cancelByBranch = useCallback(
    (reservationNo) => {
      const rec = reservations.find(
        (r) => r.reservationNo === reservationNo && r.status === 'BOOKED'
      )
      if (!rec) return null
      if (rec.reminderStatus === 'CONFIRMED') restoreStock(rec.branchId, rec.currency)
      setReservations((prev) =>
        prev.map((r) =>
          r.reservationNo === reservationNo && r.status === 'BOOKED'
            ? { ...r, status: 'CANCELLED', cancelReason: 'BRANCH', processedAt: null }
            : r
        )
      )
      return rec
    },
    [reservations]
  )

  // 거래완료. extra 로 실제적용환율(appliedRate)·최종원화(appliedKrwAmount)를 함께 기록.
  //  · 예약환율(rate)/예약원화(krwAmount)는 보존하고, 실제 정산값만 별도 필드로 저장(베스트레이트).
  const completeReservation = useCallback(
    (reservationNo, extra = {}) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.reservationNo === reservationNo && r.status === 'BOOKED'
            ? {
                ...r,
                status: 'COMPLETED',
                idVerified: true,
                processedAt: `${today}T00:00:00+09:00`,
                ...extra,
              }
            : r
        )
      )
    },
    [today]
  )

  // ── 가용시재(동시성) ──
  const getStock = useCallback((branchId, currency) => stockRef.current[`${branchId}:${currency}`] ?? 0, [])
  // 가용시재 차감 시도(내부): 남아있으면 차감 후 true, 없으면 false.
  const consumeStock = (branchId, currency) => {
    const k = `${branchId}:${currency}`
    const cur = stockRef.current[k] ?? 999
    if (cur <= 0) return false
    stockRef.current = { ...stockRef.current, [k]: cur - 1 }
    return true
  }
  // 가용시재 복구(내부): 방문예정확인 후 자동취소된 건의 예약시재/가용시재를 되돌린다.
  const restoreStock = (branchId, currency) => {
    const k = `${branchId}:${currency}`
    stockRef.current = { ...stockRef.current, [k]: (stockRef.current[k] ?? 0) + 1 }
  }

  // 리마인더 "방문 예정" 확인 → 이 시점에 가용시재 재확인·차감(예약시재 반영).
  //  - 재고 없으면 { ok:false, reason:'SOLD_OUT' } (상태 불변) → "다른 고객이 이미 확정" 안내
  //  - 성공 시 reminderStatus='CONFIRMED'. (취소/무응답 자동취소는 재고 반영 전이라 복구 불필요)
  const confirmVisit = useCallback(
    (reservationNo) => {
      const rec = reservations.find(
        (r) => r.reservationNo.toUpperCase() === (reservationNo || '').trim().toUpperCase()
      )
      if (!rec) return { ok: false, reason: 'NOT_FOUND' }
      if (rec.status !== 'BOOKED') return { ok: false, reason: 'NOT_BOOKED' }
      if (rec.reminderStatus === 'CONFIRMED') return { ok: true, reason: 'ALREADY' }
      if (!consumeStock(rec.branchId, rec.currency)) return { ok: false, reason: 'SOLD_OUT' }
      setReservations((prev) =>
        prev.map((r) =>
          r.reservationNo === rec.reservationNo ? { ...r, reminderStatus: 'CONFIRMED' } : r
        )
      )
      return { ok: true, reason: 'CONFIRMED' }
    },
    [reservations]
  )

  // 시뮬레이션: 기준일 하루 넘기기 (KST 달력 기준, UTC 산술로 결정적 처리)
  const advanceDay = useCallback(() => {
    setToday((d) => addDays(d, 1))
  }, [])

  // 시뮬레이션: 자동취소(노쇼) — 수령예정일(KST)이 오늘보다 이전인 BOOKED 예약을 취소.
  // 수령기한 = 수령예정일 당일. 당일까지는 유지하고, KST 자정을 넘겨 경과하면 자동취소한다.
  // 리마인더 응답상태(방문예정확인/미응답)와 무관하게 동일 적용. (방문예정확인 후 미방문도 노쇼)
  const runAutoCancel = useCallback(() => {
    const targets = reservations.filter(
      (r) => r.status === 'BOOKED' && diffDays(r.pickupDate, today) < 0
    )
    if (!targets.length) return { cancelled: 0, restored: 0 }
    // 재고 복구는 분기 처리:
    //  - 방문예정확인(CONFIRMED): 확인 시점에 차감했던 예약시재/가용시재를 복구
    //  - 미응답(NO_RESPONSE/NONE): 애초 재고 미반영 → 복구 없음
    let restored = 0
    targets.forEach((r) => {
      if (r.reminderStatus === 'CONFIRMED') {
        restoreStock(r.branchId, r.currency)
        restored += 1
      }
    })
    const cancelSet = new Set(targets.map((r) => r.reservationNo))
    // 노쇼 이력(이메일별 자동취소 누적)에는 두 경우 모두 cancelReason='AUTO' 로 동일 카운트.
    setReservations((prev) =>
      prev.map((r) =>
        cancelSet.has(r.reservationNo) ? { ...r, status: 'CANCELLED', cancelReason: 'AUTO' } : r
      )
    )
    // 자동취소된 예약 레코드도 반환 → 호출측(SimBar)에서 자동취소 안내 이메일 발송에 사용
    return { cancelled: targets.length, restored, records: targets }
  }, [reservations, today])

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
    cancelByBranch,
    completeReservation,
    getStock,
    confirmVisit,
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
