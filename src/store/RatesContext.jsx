import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { MOCK_RATES } from '../data/rates.js'

// 환율 공유 상태(mock store).
//  - rates: 통화별 기준환율(KRW per 1 unit). 2분마다 소폭 자동 변동(±0.1~0.5%).
//  - webOverride: CEMS 환전율관리 "외국인 웹사이트" 채널에서 수동 지정한 환율(통화별).
//    값이 있으면 외국인 웹사이트(STEP B)가 이 값을 기준환율로 사용한다.
//  실제 외부 환율 API 없음. 프로토타입용 시뮬레이션.

const RatesContext = createContext(null)

const DISPLAY_SPREAD = 0.0175 // 표시용 매매 스프레드 ±1.75% (예약 계산 미반영)
const REFRESH_MS = 120000 // 2분 주기 자동 갱신

// 유효숫자 기준 반올림 — 큰 값(1385)·작은 값(0.054=VND) 모두 정밀도 유지
function roundSig(n, sig = 5) {
  if (!n) return 0
  const d = Math.ceil(Math.log10(Math.abs(n)))
  const mag = Math.pow(10, sig - d)
  return Math.round(n * mag) / mag
}

// 한 스텝 변동: 부호 랜덤 × 크기 0.1~0.5%
function drift(rate) {
  const mag = 0.001 + Math.random() * 0.004 // 0.1% ~ 0.5%
  const sign = Math.random() < 0.5 ? -1 : 1
  return roundSig(rate * (1 + sign * mag))
}

export function RatesProvider({ children }) {
  const [rates, setRates] = useState(() => ({ ...MOCK_RATES }))
  const [webOverride, setWebOverride] = useState({}) // { [currency]: number }
  const [lastUpdated, setLastUpdated] = useState(() => Date.now())
  const [tick, setTick] = useState(0) // 갱신 횟수(참고/디버그)

  // 2분마다 기준환율 소폭 변동
  useEffect(() => {
    const id = setInterval(() => {
      setRates((prev) => {
        const next = {}
        for (const [cur, v] of Object.entries(prev)) next[cur] = drift(v)
        return next
      })
      setLastUpdated(Date.now())
      setTick((t) => t + 1)
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  // 외국인 웹사이트가 적용하는 기준환율: 수동 오버라이드 우선, 없으면 자동 변동 기준환율
  const getRate = useCallback(
    (cur) => webOverride[cur] ?? rates[cur] ?? null,
    [rates, webOverride]
  )

  // 표시용 살 때/팔 때 (기준 ± 스프레드)
  const getDisplayRates = useCallback(
    (cur) => {
      const base = getRate(cur)
      if (base == null) return null
      return {
        base,
        buy: roundSig(base * (1 + DISPLAY_SPREAD)),
        sell: roundSig(base * (1 - DISPLAY_SPREAD)),
      }
    },
    [getRate]
  )

  // 은행 환율 비교(더미) — 기준환율 대비
  const getBankCompare = useCallback(
    (cur) => {
      const base = getRate(cur)
      if (base == null) return []
      return [
        { name: { ko: 'A은행', en: 'Bank A' }, buy: roundSig(base * 1.028) },
        { name: { ko: 'B은행', en: 'Bank B' }, buy: roundSig(base * 1.035) },
      ]
    },
    [getRate]
  )

  // CEMS "외국인 웹사이트" 채널 수동 환율 지정/해제. (value 없으면 자동 변동으로 복귀)
  const setWebRate = useCallback((cur, value) => {
    setWebOverride((prev) => {
      const next = { ...prev }
      const n = Number(value)
      if (value === '' || value == null || !Number.isFinite(n) || n <= 0) delete next[cur]
      else next[cur] = roundSig(n)
      return next
    })
    setLastUpdated(Date.now())
  }, [])

  const value = {
    rates,
    webOverride,
    lastUpdated,
    tick,
    getRate,
    getDisplayRates,
    getBankCompare,
    setWebRate,
  }
  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>
}

export function useRates() {
  const ctx = useContext(RatesContext)
  if (!ctx) throw new Error('useRates must be used within RatesProvider')
  return ctx
}
