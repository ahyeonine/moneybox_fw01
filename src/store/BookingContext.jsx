import { createContext, useContext, useState, useCallback } from 'react'

// 외국인 웹사이트 신청(예약) 위저드의 진행 상태를 앱 루트에서 보관한다.
// → 다른 메뉴(이메일/CEMS 등)로 이동했다가 돌아와도 단계·입력값이 유지됨.
//   (새로고침 시에는 프로바이더가 재초기화되어 초기 상태로 리셋)
const BookingContext = createContext(null)

export const EMPTY_DRAFT = {
  branchId: '',
  transactionType: 'BUY', // 외국인 웹사이트는 원화구매(=매입) 고정
  currency: '',
  amount: '',
  pickupDate: '',
  pickupTime: '',
  customerName: '',
  email: '',
  rate: null,
}

export function BookingProvider({ children }) {
  const [stage, setStage] = useState('branch')
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [soldOut, setSoldOut] = useState(false)
  const [consent, setConsent] = useState({ noshow: false, privacy: false })
  const [emailVerified, setEmailVerified] = useState(false)
  const [result, setResult] = useState(null)

  const set = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), [])

  // 의도적 초기화(처음부터 다시 / 새 예약)에서만 호출 — 메뉴 이동으로는 리셋되지 않음
  const resetBooking = useCallback(() => {
    setStage('branch')
    setDraft(EMPTY_DRAFT)
    setSoldOut(false)
    setConsent({ noshow: false, privacy: false })
    setEmailVerified(false)
    setResult(null)
  }, [])

  const value = {
    stage,
    setStage,
    draft,
    setDraft,
    set,
    soldOut,
    setSoldOut,
    consent,
    setConsent,
    emailVerified,
    setEmailVerified,
    result,
    setResult,
    resetBooking,
  }
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
