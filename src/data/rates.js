// 환율(Rate) 목데이터 — 비회원 기준 (회원 우대율 미구현)
// KRW per 1 unit of foreign currency.
//
// TODO: 실제 환율 피드/스프레드 정책으로 교체할 것.
//       프로토타입에서는 고정 목환율을 사용하며, 예약 최종확인(6단계) 시점에 이 값으로 픽스한다.

export const MOCK_RATES = {
  USD: 1385.0,
  JPY: 8.95, // 1엔 기준
  EUR: 1495.5,
  CNY: 190.2,
  GBP: 1760.0,
  THB: 38.4,
  VND: 0.054,
}

export const CURRENCY_META = {
  USD: { flag: '🇺🇸', label: { ko: '미국 달러', en: 'US Dollar' } },
  JPY: { flag: '🇯🇵', label: { ko: '일본 엔', en: 'Japanese Yen' } },
  EUR: { flag: '🇪🇺', label: { ko: '유로', en: 'Euro' } },
  CNY: { flag: '🇨🇳', label: { ko: '중국 위안', en: 'Chinese Yuan' } },
  GBP: { flag: '🇬🇧', label: { ko: '영국 파운드', en: 'British Pound' } },
  THB: { flag: '🇹🇭', label: { ko: '태국 바트', en: 'Thai Baht' } },
  VND: { flag: '🇻🇳', label: { ko: '베트남 동', en: 'Vietnamese Dong' } },
}

/** 예약 시점 환율 조회 (비회원 기준) */
export function getRate(currency) {
  return MOCK_RATES[currency] ?? null
}

/**
 * 외화금액 * 환율 = 원화금액.
 * 매출(SELL, 고객이 외화 구매)/매입(BUY, 고객이 외화 판매) 모두
 * 프로토타입에서는 동일 공식을 사용한다. (스프레드 미반영)
 *
 * 실제 예약 금액 계산(예상금액/최종확정)은 이 함수 + getRate(기준 목환율)만 사용하며,
 * 아래 표시용 매매율(getDisplayRates)/은행비교(getBankCompare)는 지점 상세 화면
 * "실시간 환율" 섹션의 노출 전용입니다. 예약 계산 로직에는 영향을 주지 않습니다.
 */
export function toKrw(foreignAmount, rate) {
  if (!foreignAmount || !rate) return 0
  return Math.round(foreignAmount * rate)
}

// 표시용 매매 스프레드 (노출 전용, 예약 계산 미반영)
// TODO: 실제 매매기준율/스프레드 정책으로 교체
const DISPLAY_SPREAD = 0.0175 // ±1.75%

/**
 * 지점 상세 "실시간 환율" 카드용 살 때/팔 때 표시 환율.
 * buy  = 고객이 외화를 살 때 적용(기준율 + 스프레드)
 * sell = 고객이 외화를 팔 때 적용(기준율 - 스프레드)
 */
export function getDisplayRates(currency) {
  const base = getRate(currency)
  if (base == null) return null
  const round = (n) => Math.round(n * 100) / 100
  return {
    base,
    buy: round(base * (1 + DISPLAY_SPREAD)),
    sell: round(base * (1 - DISPLAY_SPREAD)),
  }
}

/**
 * 은행 환율 비교(더미). 우리 환율 대비 은행이 얼마나 불리한지 표시용.
 * TODO: 실제 비교 데이터 연동
 */
export function getBankCompare(currency) {
  const base = getRate(currency)
  if (base == null) return []
  const round = (n) => Math.round(n * 100) / 100
  return [
    { name: { ko: 'A은행', en: 'Bank A' }, buy: round(base * 1.028) },
    { name: { ko: 'B은행', en: 'Bank B' }, buy: round(base * 1.035) },
  ]
}
