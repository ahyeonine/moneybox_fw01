import { createContext, useContext, useState, useCallback } from 'react'

// 지점 어드민(CEMS)용 프론트 상태.
// (최소·최대·신청단위 한도는 제거됨 — 금액 제한 없음)
// - webExcluded: 외국인 웹사이트 채널 "매입제외" 통화 { [currency]: true }
// 실제 저장 API 없음. 새로고침 시 초기값으로 리셋.

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [webExcluded, setWebExcluded] = useState({})

  const isWebExcluded = useCallback((cur) => !!webExcluded[cur], [webExcluded])
  const toggleWebExcluded = useCallback(
    (cur) => setWebExcluded((prev) => ({ ...prev, [cur]: !prev[cur] })),
    []
  )

  const value = { webExcluded, isWebExcluded, toggleWebExcluded }
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
