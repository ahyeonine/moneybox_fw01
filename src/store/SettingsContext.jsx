import { createContext, useContext, useState, useCallback } from 'react'
import { BRANCHES } from '../data/branches.js'
import { POLICY_MIN_AMOUNTS, POLICY_UNIT_STEPS } from '../data/rates.js'

// 어드민(CEMS) 한도관리용 프론트 상태.
// - minAmounts: 통화별 최소 환전금액 (전체 지점 공통)
// - maxAmounts: 통화별 건당 최대 환전금액 (전체 지점 공통) { currency: number }
// 실제 저장 API 없음. 새로고침 시 초기값으로 리셋.

const SettingsContext = createContext(null)

// 건당 최대금액 초기 시드: 대표 지점(첫 지점) 목데이터의 통화별 max 값을 불러온다.
// (지점별 구분 없이 전체 공통 상한으로 관리)
function seedMax() {
  const out = {}
  const base = BRANCHES[0]?.currencyLimits || {}
  for (const [cur, lim] of Object.entries(base)) {
    out[cur] = lim.max
  }
  return out
}

export function SettingsProvider({ children }) {
  const [minAmounts, setMinAmounts] = useState(() => ({ ...POLICY_MIN_AMOUNTS }))
  // 통화별 신청 단위 (전체 지점 공통). 외국인 웹사이트 신청화면에서만 올림 적용.
  const [unitAmounts, setUnitAmounts] = useState(() => ({ ...POLICY_UNIT_STEPS }))
  const [maxAmounts, setMaxAmounts] = useState(seedMax)
  // 외국인 웹사이트 채널 "매입제외" — 통화별로 신청화면 통화선택 목록에서 제외한다.
  // { [currency]: true }
  const [webExcluded, setWebExcluded] = useState({})

  // 통화별 최소금액 일괄 저장
  const saveMinAmounts = useCallback((next) => {
    setMinAmounts({ ...next })
  }, [])

  // 통화별 신청 단위 일괄 저장
  const saveUnitAmounts = useCallback((next) => {
    setUnitAmounts({ ...next })
  }, [])

  // 통화별 건당 최대금액 일괄 저장 (전체 지점 공통).
  // 주의: 최대금액을 낮춰도 이미 생성된 예약 레코드(reservations)는 절대 일괄 수정하지 않는다.
  //       새 상한은 이 시점 이후 새로 생성되는 예약에만 적용된다. (기존 예약 데이터 불변)
  const saveMaxAmounts = useCallback((next) => {
    setMaxAmounts({ ...next })
  }, [])

  const getMaxAmount = useCallback((cur) => maxAmounts[cur], [maxAmounts])

  // 외국인 웹사이트 "매입제외" 통화 조회/토글
  const isWebExcluded = useCallback((cur) => !!webExcluded[cur], [webExcluded])
  const toggleWebExcluded = useCallback(
    (cur) => setWebExcluded((prev) => ({ ...prev, [cur]: !prev[cur] })),
    []
  )

  const value = {
    minAmounts,
    unitAmounts,
    maxAmounts,
    saveMinAmounts,
    saveUnitAmounts,
    saveMaxAmounts,
    getMaxAmount,
    webExcluded,
    isWebExcluded,
    toggleWebExcluded,
  }
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
