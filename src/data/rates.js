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
 */
export function toKrw(foreignAmount, rate) {
  if (!foreignAmount || !rate) return 0
  return Math.round(foreignAmount * rate)
}
