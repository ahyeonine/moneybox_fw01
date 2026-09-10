// 환율(Rate) 목데이터 — 회원/비회원 구분 없이 모든 고객 동일 환율 적용.
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
  AUD: 905.0,
  CAD: 1010.0,
  HKD: 177.0,
  CHF: 1560.0,
  SGD: 1025.0,
  TWD: 43.5,
  NZD: 830.0,
  PHP: 24.2,
  IDR: 0.085,
  MYR: 312.0,
  INR: 16.6,
}

export const CURRENCY_META = {
  USD: { flag: '🇺🇸', label: { ko: '미국 달러', en: 'US Dollar' } },
  JPY: { flag: '🇯🇵', label: { ko: '일본 엔', en: 'Japanese Yen' } },
  EUR: { flag: '🇪🇺', label: { ko: '유로', en: 'Euro' } },
  CNY: { flag: '🇨🇳', label: { ko: '중국 위안', en: 'Chinese Yuan' } },
  GBP: { flag: '🇬🇧', label: { ko: '영국 파운드', en: 'British Pound' } },
  THB: { flag: '🇹🇭', label: { ko: '태국 바트', en: 'Thai Baht' } },
  VND: { flag: '🇻🇳', label: { ko: '베트남 동', en: 'Vietnamese Dong' } },
  AUD: { flag: '🇦🇺', label: { ko: '호주 달러', en: 'Australian Dollar' } },
  CAD: { flag: '🇨🇦', label: { ko: '캐나다 달러', en: 'Canadian Dollar' } },
  HKD: { flag: '🇭🇰', label: { ko: '홍콩 달러', en: 'Hong Kong Dollar' } },
  CHF: { flag: '🇨🇭', label: { ko: '스위스 프랑', en: 'Swiss Franc' } },
  SGD: { flag: '🇸🇬', label: { ko: '싱가포르 달러', en: 'Singapore Dollar' } },
  TWD: { flag: '🇹🇼', label: { ko: '대만 달러', en: 'Taiwan Dollar' } },
  NZD: { flag: '🇳🇿', label: { ko: '뉴질랜드 달러', en: 'NZ Dollar' } },
  PHP: { flag: '🇵🇭', label: { ko: '필리핀 페소', en: 'Philippine Peso' } },
  IDR: { flag: '🇮🇩', label: { ko: '인도네시아 루피아', en: 'Indonesian Rupiah' } },
  MYR: { flag: '🇲🇾', label: { ko: '말레이시아 링깃', en: 'Malaysian Ringgit' } },
  INR: { flag: '🇮🇳', label: { ko: '인도 루피', en: 'Indian Rupee' } },
}

// 전체 통화 표시 순서 (18종). 어드민 한도관리·환율관리 화면에서 사용.
export const CURRENCY_ORDER = [
  'USD', 'JPY', 'EUR', 'CNY', 'GBP', 'HKD', 'THB', 'TWD', 'SGD',
  'AUD', 'CAD', 'CHF', 'NZD', 'PHP', 'MYR', 'IDR', 'VND', 'INR',
]

// 통화별 신청 단위(입력 단위) 기본 시드값 (지점 어드민 CEMS에서 통화별로 조정)
// 외국인 웹사이트 신청화면에서만 이 단위로 올림(ceil) 처리한다. (CEMS/POS/이메일 미적용)
export const POLICY_UNIT_STEPS = {
  USD: 10, JPY: 1000, EUR: 5, CNY: 50, GBP: 5, HKD: 50, THB: 100,
  TWD: 100, SGD: 10, AUD: 10, CAD: 10, CHF: 10, NZD: 10, PHP: 100,
  MYR: 10, IDR: 10000, VND: 10000, INR: 100,
}

// 통화별 최소 환전금액 기본 시드값 (지점 어드민 CEMS 초기값).
// 정책(07_정책 §4): 최소 = 미화 USD 100 상당액을 통화별로 환산 → 신청단위로 올림.
// 지점이 CEMS 한도관리에서 통화별로 조정(이 값은 기본 시드).
const MIN_USD_EQUIV = 100 // 미화 100달러 기준
const ceilToUnit = (n, step) => (step > 0 ? Math.ceil(n / step) * step : Math.ceil(n))
export const POLICY_MIN_AMOUNTS = Object.fromEntries(
  CURRENCY_ORDER.map((c) => {
    if (c === 'USD') return [c, MIN_USD_EQUIV]
    const krwFloor = MIN_USD_EQUIV * MOCK_RATES.USD // USD 100 상당 원화
    return [c, ceilToUnit(krwFloor / MOCK_RATES[c], POLICY_UNIT_STEPS[c])]
  })
)

/** 예약 시점 환율 조회 (전 고객 동일 환율) */
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
