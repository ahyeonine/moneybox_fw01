import { createContext, useContext, useState, useCallback } from 'react'

// 운영 정책 공유 상태(프로토타입).
// - maxWindowDays: 예약 가능 기간 = 수령 예정일을 오늘부터 최대 며칠 뒤까지 선택할 수 있는지.
//   본사(CEMS 본사관리자)에서만 설정한다. 지점은 변경 불가.
//   고객 사이트 수령일 선택 범위(pickupRange)와 예약조회 변경에 반영된다.

const PolicyContext = createContext(null)

const DEFAULT_MAX_WINDOW_DAYS = 14 // 기본 2주
const MIN_WINDOW = 1
const MAX_WINDOW = 60

export function PolicyProvider({ children }) {
  const [maxWindowDays, setMax] = useState(DEFAULT_MAX_WINDOW_DAYS)

  // 본사에서만 호출(값은 1~60일로 클램프)
  const setMaxWindowDays = useCallback((v) => {
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return
    setMax(Math.min(MAX_WINDOW, Math.max(MIN_WINDOW, n)))
  }, [])

  const value = { maxWindowDays, setMaxWindowDays, MIN_WINDOW, MAX_WINDOW }
  return <PolicyContext.Provider value={value}>{children}</PolicyContext.Provider>
}

export function usePolicy() {
  const ctx = useContext(PolicyContext)
  if (!ctx) throw new Error('usePolicy must be used within PolicyProvider')
  return ctx
}
