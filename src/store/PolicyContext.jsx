import { createContext, useContext, useState, useCallback } from 'react'

// 운영 정책 공유 상태(프로토타입).
// - maxWindowDays: 예약 가능 기간 = 수령 예정일을 오늘부터 최대 며칠 뒤까지 선택할 수 있는지.
//   `null`이면 기간 제한 없음(무제한 · 기본값) — 오늘 이후 날짜를 자유롭게 선택할 수 있다.
//   본사(CEMS 본사관리자)에서만 설정한다. 지점은 변경 불가.
//   고객 사이트 수령일 선택 범위(pickupRange)와 예약조회 변경에 반영된다.

const PolicyContext = createContext(null)

const DEFAULT_MAX_WINDOW_DAYS = null // 기본 무제한(기간 제한 없음)
const MIN_WINDOW = 1 // 일수 지정 시 최소 1일(상한 제한 없음)

export function PolicyProvider({ children }) {
  const [maxWindowDays, setMax] = useState(DEFAULT_MAX_WINDOW_DAYS)

  // 본사에서만 호출.
  //  · null/빈값/0 이하/숫자 아님 → 무제한(null)
  //  · 그 외 양수 → 그대로 사용(상한 제한 없음, 최소 1일)
  const setMaxWindowDays = useCallback((v) => {
    if (v == null || v === '') {
      setMax(null)
      return
    }
    const n = Math.round(Number(v))
    if (!Number.isFinite(n) || n <= 0) {
      setMax(null)
      return
    }
    setMax(Math.max(MIN_WINDOW, n))
  }, [])

  const value = { maxWindowDays, setMaxWindowDays, MIN_WINDOW }
  return <PolicyContext.Provider value={value}>{children}</PolicyContext.Provider>
}

export function usePolicy() {
  const ctx = useContext(PolicyContext)
  if (!ctx) throw new Error('usePolicy must be used within PolicyProvider')
  return ctx
}
