import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { SEED_RESERVATIONS } from '../data/seedReservations.js'
import { BRANCHES } from '../data/branches.js'
import { generateReservationNo } from '../lib/reservationNo.js'
import { diffDays, addDays } from '../lib/date.js'

const ReservationContext = createContext(null)

// 프로토타입 기준일(오늘, KST 달력 날짜). 실제 스케줄러 대신 시뮬레이션으로 흘려보낸다.
const INITIAL_TODAY = '2026-07-30'

// 노쇼(자동취소) 정책: 신규예약 차단 없음(07_정책 §7) — 안내성으로만 운영.
// countNoShow는 통계·안내용 카운트로만 사용하며, 예약 생성을 막지 않는다.

function clone(arr) {
  return arr.map((r) => ({ ...r }))
}

// 시재(시재) 시드: 지점×통화 조합별 수량(목데이터).
// 정책(D-30-16): 예약 접수는 시재와 무관(부족·마이너스여도 접수), 방문 예정 확인 시엔 '차감 예정'으로만
// 표시하고, 실제 시재 차감은 수령(거래완료) 시점이다. 시재 부족은 지점이 조달하므로 품절로 거절하지 않는다.
function seedStock() {
  const s = {}
  for (const b of BRANCHES) {
    for (const cur of b.currencies) {
      s[`${b.id}:${cur}`] = 50 // 기본 시재 (목데이터)
    }
  }
  // 이미 거래완료(COMPLETED)된 시드 예약은 수령 시점에 시재가 차감된 상태로 반영
  for (const r of SEED_RESERVATIONS) {
    if (r.status === 'COMPLETED') {
      const k = `${r.branchId}:${r.currency}`
      s[k] = (s[k] ?? 0) - 1
    }
  }
  return s
}

export function ReservationProvider({ children }) {
  const [reservations, setReservations] = useState(() => clone(SEED_RESERVATIONS))
  const [today, setToday] = useState(INITIAL_TODAY)
  // 시재는 동기적으로 읽고/차감해야 하므로 ref 로 관리 (동시성 확인 로직에서 사용)
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
        // 환율 확정 방식: 'FIXED'(V1 예약시점 고정) | 'BOARD'(V2 수령일 전광판 환율)
        rateMode: draft.rateMode ?? 'FIXED',
        coupon: draft.coupon ?? false, // 쿠폰(전광판보다 우대) 적용 여부
        foreignAmount: draft.foreignAmount,
        krwAmount: draft.krwAmount,
        customerName: draft.customerName,
        birthDate: draft.birthDate ?? null, // 여권 OCR 생년월일(있으면)
        email: draft.email,
        emailVerified: draft.emailVerified ?? false, // 이메일 인증(수신 가능 확인) 완료 여부
        marketingConsent: draft.marketingConsent ?? false, // 마케팅 정보 수신 동의(선택)
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

  // 신청내역조회: (예약자명 + 이메일)로 같은 이메일의 신청내역 리스트 반환.
  //  · 이메일은 정확히 일치, 이름은 대소문자 무시 부분일치(여권영문명 입력 편의).
  const findReservationsByNameEmail = useCallback(
    (name, email) => {
      const nm = (name || '').trim().toLowerCase()
      const em = (email || '').trim().toLowerCase()
      if (!nm || !em) return []
      return reservations
        .filter((r) => r.email.toLowerCase() === em && r.customerName.toLowerCase().includes(nm))
        .sort((a, b) => (a.pickupDate < b.pickupDate ? -1 : a.pickupDate > b.pickupDate ? 1 : 0))
    },
    [reservations]
  )

  // 회원 예약조회: 이메일로 같은 이메일의 전체 신청내역 반환(비밀번호는 프로토타입에서 미검증).
  const findReservationsByEmail = useCallback(
    (email) => {
      const em = (email || '').trim().toLowerCase()
      if (!em) return []
      return reservations
        .filter((r) => r.email.toLowerCase() === em)
        .sort((a, b) => (a.pickupDate < b.pickupDate ? -1 : a.pickupDate > b.pickupDate ? 1 : 0))
    },
    [reservations]
  )

  // 노쇼(자동취소) 누적 횟수 — 이메일 기준. 통계·안내용(신규예약 차단에는 미사용).
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

  // 예약 변경 = 고객 화면상 '예약 변경' 한 동작이지만, 내부적으로는
  // 기존 예약 취소(cancelReason='CHANGE') + 변경 내용 반영한 신규 예약 생성(취소 후 재예약).
  // 새 예약번호를 발급해 반환한다. 환율 미고정이므로 예약 환율 재픽스는 없음.
  const changeReservation = useCallback(
    (oldNo, patch) => {
      const old = reservations.find((r) => r.reservationNo === oldNo && r.status === 'BOOKED')
      if (!old) return null
      const reservationNo = generateReservationNo(today, reservations)
      const next = {
        ...old,
        ...patch,
        reservationNo,
        status: 'BOOKED',
        reminderStatus: 'NONE',
        createdAt: `${today}T00:00:00+09:00`,
        processedAt: null,
        idVerified: false,
        changedFrom: oldNo, // 변경 이력(취소된 기존 예약번호)
      }
      setReservations((prev) =>
        prev
          .map((r) =>
            r.reservationNo === oldNo ? { ...r, status: 'CANCELLED', cancelReason: 'CHANGE' } : r
          )
          .concat(next)
      )
      return next // 신규 예약 레코드 반환(호출측에서 목록·상세 즉시 갱신용)
    },
    [reservations, today]
  )

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
  //  · 실제 시재는 수령(거래완료) 시점에만 차감되므로, 미수령 취소 건은 복구할 시재가 없다.
  //  · 취소된 예약 레코드를 반환 → 호출측에서 지점취소 안내 이메일 발송에 사용.
  const cancelByBranch = useCallback(
    (reservationNo) => {
      const rec = reservations.find(
        (r) => r.reservationNo === reservationNo && r.status === 'BOOKED'
      )
      if (!rec) return null
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
      // 실제 시재 차감은 수령(거래완료) 시점. 부족해도 진행(지점 조달, 음수 허용).
      const rec = reservations.find(
        (r) => r.reservationNo === reservationNo && r.status === 'BOOKED'
      )
      if (rec) consumeStock(rec.branchId, rec.currency)
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
    [reservations, today]
  )

  // ── 시재(시재) ──
  const getStock = useCallback((branchId, currency) => stockRef.current[`${branchId}:${currency}`] ?? 0, [])
  // 실제 시재 차감(수령/거래완료 시점). 정책상 부족해도 진행하므로 음수까지 허용(지점 조달).
  const consumeStock = (branchId, currency) => {
    const k = `${branchId}:${currency}`
    stockRef.current = { ...stockRef.current, [k]: (stockRef.current[k] ?? 0) - 1 }
  }

  // 리마인더 "방문 예정" 확인 → 예약을 확정(reminderStatus='CONFIRMED').
  //  정책(D-30-16): 확인 시점엔 시재를 '차감 예정'으로만 잡고 실제 차감은 하지 않으며, 품절로 거절하지 않는다.
  //  실제 시재 차감은 수령(거래완료) 시점(completeReservation).
  const confirmVisit = useCallback(
    (reservationNo) => {
      const rec = reservations.find(
        (r) => r.reservationNo.toUpperCase() === (reservationNo || '').trim().toUpperCase()
      )
      if (!rec) return { ok: false, reason: 'NOT_FOUND' }
      if (rec.status !== 'BOOKED') return { ok: false, reason: 'NOT_BOOKED' }
      if (rec.reminderStatus === 'CONFIRMED') return { ok: true, reason: 'ALREADY' }
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
    // 실제 시재는 수령(거래완료) 시점에만 차감되므로, 미수령 자동취소 건은 복구할 시재가 없다.
    const cancelSet = new Set(targets.map((r) => r.reservationNo))
    // 노쇼 이력(이메일별 자동취소 누적)에는 두 경우 모두 cancelReason='AUTO' 로 동일 카운트.
    setReservations((prev) =>
      prev.map((r) =>
        cancelSet.has(r.reservationNo) ? { ...r, status: 'CANCELLED', cancelReason: 'AUTO' } : r
      )
    )
    // 자동취소된 예약 레코드도 반환 → 호출측(SimBar)에서 자동취소 안내 이메일 발송에 사용
    return { cancelled: targets.length, restored: 0, records: targets }
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
    findReservationsByNameEmail,
    findReservationsByEmail,
    getByNo,
    countNoShow,
    updateReservation,
    changeReservation,
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
