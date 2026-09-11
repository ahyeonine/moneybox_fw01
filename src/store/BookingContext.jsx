import { createContext, useContext, useState, useCallback } from 'react'

// 외국인 웹사이트 신청(예약) 위저드의 진행 상태를 앱 루트에서 보관한다.
// → 다른 메뉴(이메일/CEMS 등)로 이동했다가 돌아와도 단계·입력값이 유지됨.
//   (새로고침 시에는 프로바이더가 재초기화되어 초기 상태로 리셋)
const BookingContext = createContext(null)

const EMPTY_DRAFT = {
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

// 이메일 OTP 진행 상태 (메뉴 이동 후에도 유지 — 새로고침/만료 시에만 리셋)
const EMPTY_OTP = {
  sent: false,
  code: null, // 현재 유효한 6자리 코드 (null = 미발급/무효화)
  input: '',
  expiresAt: 0, // 절대 시각(ms) — 남은 시간은 항상 여기서 재계산
  cooldownUntil: 0,
  attempts: 0,
  banner: null, // { type, text }
}

export function BookingProvider({ children }) {
  const [stage, setStage] = useState('branch')
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [soldOut, setSoldOut] = useState(false)
  const [consent, setConsent] = useState({
    terms: false,
    privacy: false,
    thirdparty: false,
    noshow: false,
  })
  const [emailVerified, setEmailVerified] = useState(false)
  const [otp, setOtpState] = useState(EMPTY_OTP) // 이메일 OTP 진행 상태
  const [result, setResult] = useState(null)
  // 회원가입(쿠폰)으로 확보한 회원 정보. null = 비회원.
  // 회원이면 이름·이메일(+인증)을 이미 보유 → 예약 중 "예약자 정보" 단계를 생략한다.
  const [member, setMember] = useState(null)
  // 마지막으로 머문 외국인 웹사이트(/site/*) 경로 — 탭 복귀 시 첫 화면을 거치지 않고 바로 이동
  const [lastSitePath, setLastSitePath] = useState('/site')

  const set = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), [])
  const setOtp = useCallback((patch) => setOtpState((o) => ({ ...o, ...patch })), [])
  const resetOtp = useCallback(() => setOtpState(EMPTY_OTP), [])

  // 의도적 초기화(처음부터 다시 / 새 예약)에서만 호출 — 메뉴 이동으로는 리셋되지 않음
  const resetBooking = useCallback(() => {
    setStage('branch')
    setDraft(EMPTY_DRAFT)
    setSoldOut(false)
    setConsent({ noshow: false, privacy: false })
    setEmailVerified(false)
    setOtpState(EMPTY_OTP)
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
    otp,
    setOtp,
    resetOtp,
    result,
    setResult,
    member,
    setMember,
    resetBooking,
    lastSitePath,
    setLastSitePath,
  }
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
