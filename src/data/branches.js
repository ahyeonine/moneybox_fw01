// 지점(Branch) 목데이터
// 지점별 취급통화가 다르고, 통화별 최소/최대 금액과 리드타임(수령 가능까지 준비일수)을 가진다.
//
// TODO: 실제 정책 수치(최소/최대금액, 리드타임)로 교체할 것.
//       현재 값은 프로토타입용 임의 목데이터입니다.

/**
 * currencyLimits: 통화코드 -> { min, max } (외화 기준 금액)
 * leadTimeDays: 예약일 기준 최소 준비일수. 이 일수 이후 날짜부터 수령 가능.
 */
export const BRANCHES = [
  {
    id: 'B001',
    name: { ko: '명동점', en: 'Myeongdong Branch' },
    address: { ko: '서울 중구 명동길 14', en: '14 Myeongdong-gil, Jung-gu, Seoul' },
    leadTimeDays: 1,
    currencyLimits: {
      // TODO: 실제 정책 수치로 교체
      USD: { min: 100, max: 10000 },
      JPY: { min: 10000, max: 1500000 },
      EUR: { min: 100, max: 8000 },
      CNY: { min: 500, max: 60000 },
    },
  },
  {
    id: 'B002',
    name: { ko: '강남점', en: 'Gangnam Branch' },
    address: { ko: '서울 강남구 강남대로 396', en: '396 Gangnam-daero, Gangnam-gu, Seoul' },
    leadTimeDays: 1,
    currencyLimits: {
      // TODO: 실제 정책 수치로 교체
      USD: { min: 100, max: 12000 },
      EUR: { min: 100, max: 8000 },
      GBP: { min: 100, max: 6000 },
    },
  },
  {
    id: 'B003',
    name: { ko: '인천공항 T1점', en: 'Incheon Airport T1' },
    address: { ko: '인천 중구 공항로 272 T1', en: '272 Gonghang-ro, Jung-gu, Incheon (T1)' },
    leadTimeDays: 2,
    currencyLimits: {
      // TODO: 실제 정책 수치로 교체
      USD: { min: 100, max: 8000 },
      JPY: { min: 10000, max: 1000000 },
      CNY: { min: 500, max: 40000 },
      THB: { min: 1000, max: 200000 },
      VND: { min: 500000, max: 50000000 },
    },
  },
  {
    id: 'B004',
    name: { ko: '부산 서면점', en: 'Busan Seomyeon Branch' },
    address: { ko: '부산 부산진구 중앙대로 691', en: '691 Jungang-daero, Busanjin-gu, Busan' },
    leadTimeDays: 1,
    currencyLimits: {
      // TODO: 실제 정책 수치로 교체
      USD: { min: 100, max: 7000 },
      JPY: { min: 10000, max: 1000000 },
    },
  },
]

export function getBranch(branchId) {
  return BRANCHES.find((b) => b.id === branchId) || null
}

/** 지점이 취급하는 통화 코드 리스트 */
export function branchCurrencies(branchId) {
  const b = getBranch(branchId)
  return b ? Object.keys(b.currencyLimits) : []
}

/** 지점/통화별 최소·최대 한도 */
export function currencyLimit(branchId, currency) {
  const b = getBranch(branchId)
  if (!b) return null
  return b.currencyLimits[currency] || null
}
