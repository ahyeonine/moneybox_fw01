import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { MOCK_RATES } from '../data/rates.js'

// 환율 공유 상태(mock store).
//  - rates: 통화별 기준환율(KRW per 1 unit). 2분마다 소폭 자동 변동(±0.1~0.5%).
//  예약 시 환율을 고정하지 않고 수령일 전광판(기준) 환율을 적용한다.
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

const HISTORY_LEN = 24 // 스파크라인용 최근 관측치 최대 개수

// 초기 히스토리 시드 — 현재값 주변에서 소폭 변동하는 n개 관측치(마지막=현재).
function seedHistory(rates, n = 12) {
  const h = {}
  for (const [cur, v] of Object.entries(rates)) {
    const arr = []
    let x = v
    for (let i = 0; i < n; i++) {
      arr.push(roundSig(x))
      x = x * (1 + (Math.random() - 0.5) * 0.006) // 과거로 갈수록 ±0.3% 흔들림
    }
    arr.reverse()
    arr[arr.length - 1] = v // 마지막은 현재 기준율
    h[cur] = arr
  }
  return h
}

export function RatesProvider({ children }) {
  const [rates, setRates] = useState(() => ({ ...MOCK_RATES }))
  const [history, setHistory] = useState(() => seedHistory(MOCK_RATES))
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

  // 기준율 변동 시 히스토리에 관측치 추가(스파크라인/추이용)
  useEffect(() => {
    setHistory((h) => {
      const nh = { ...h }
      for (const [cur, v] of Object.entries(rates)) {
        nh[cur] = [...(h[cur] || []), v].slice(-HISTORY_LEN)
      }
      return nh
    })
  }, [rates])

  // 적용 기준환율(수령일 전광판) — 2분 주기 자동 변동
  const getRate = useCallback((cur) => rates[cur] ?? null, [rates])

  // 통화별 최근 기준율 히스토리(오래된→최신). 스파크라인/유리도 계산용.
  const getHistory = useCallback((cur) => history[cur] || [], [history])

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

  const value = {
    rates,
    history,
    lastUpdated,
    tick,
    getRate,
    getHistory,
    getDisplayRates,
    getBankCompare,
  }
  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>
}

export function useRates() {
  const ctx = useContext(RatesContext)
  if (!ctx) throw new Error('useRates must be used within RatesProvider')
  return ctx
}
