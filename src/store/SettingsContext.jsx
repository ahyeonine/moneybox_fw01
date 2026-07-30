import { createContext, useContext, useState, useCallback } from 'react'
import { BRANCHES } from '../data/branches.js'
import { POLICY_MIN_AMOUNTS } from '../data/rates.js'

// 어드민(CEMS) 한도관리용 프론트 상태.
// - minAmounts: 통화별 최소 환전금액 (전체 지점 공통)
// - branchMaxAmounts: 지점별 건당 최대 환전금액 { branchId: { currency: number } }
// 실제 저장 API 없음. 새로고침 시 초기값으로 리셋.

const SettingsContext = createContext(null)

// 지점별 최대금액 초기 시드: 기존 지점 목데이터의 통화별 max 값을 불러온다.
function seedBranchMax() {
  const out = {}
  for (const b of BRANCHES) {
    out[b.id] = {}
    for (const [cur, lim] of Object.entries(b.currencyLimits)) {
      out[b.id][cur] = lim.max
    }
  }
  return out
}

export function SettingsProvider({ children }) {
  const [minAmounts, setMinAmounts] = useState(() => ({ ...POLICY_MIN_AMOUNTS }))
  const [branchMaxAmounts, setBranchMaxAmounts] = useState(seedBranchMax)

  // 통화별 최소금액 일괄 저장
  const saveMinAmounts = useCallback((next) => {
    setMinAmounts({ ...next })
  }, [])

  // 특정 지점의 통화별 최대금액 저장
  const saveBranchMax = useCallback((branchId, currencyMap) => {
    setBranchMaxAmounts((prev) => ({ ...prev, [branchId]: { ...currencyMap } }))
  }, [])

  const getBranchMax = useCallback(
    (branchId) => branchMaxAmounts[branchId] || {},
    [branchMaxAmounts]
  )

  const value = { minAmounts, branchMaxAmounts, saveMinAmounts, saveBranchMax, getBranchMax }
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
