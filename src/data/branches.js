// 지점(Branch) 목데이터
// 지점별 취급통화가 다르고, 통화별 최소/최대 금액을 가진다.
// (지점 상세 정보 hours/phone/rating/mapPos 등은 프로토타입 표시용 더미)

/**
 * currencyLimits: 통화코드 -> { min, max } (외화 기준 금액)
 *   - 최소: 기본 USD 100 상당액(rates.js POLICY_MIN_AMOUNTS), 지점이 CEMS 한도관리에서 설정.
 *   - 최대: 지점이 설정하되 상한 USD 9,999 상당액(정책 07_정책 §4). 목값은 상한 이내로 시드.
 * leadTimeDays: 준비일수(리드타임). 정책상 최소 제한 없음 → 0 (예약일 당일부터 수령 가능).
 *   수령 가능 범위는 예약일 ~ 최대 2주(14일). pickupRange(today, leadTimeDays, 14).
 */
export const BRANCHES = [
  {
    id: 'B001',
    name: { ko: '명동점', en: 'Myeongdong Branch' },
    address: { ko: '서울 중구 명동길 14', en: '14 Myeongdong-gil, Jung-gu, Seoul' },
    leadTimeDays: 0,
    phone: '02-1234-0001',
    hours: { open: '10:00', close: '21:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 44, y: 34 }, // 더미 지도 마커 위치(%)
    lat: 37.5636, // 지도 임베드용 근사 좌표(프로토타입)
    lng: 126.985,
    currencyLimits: {
      USD: { min: 100, max: 9900, unitStep: 20 },
      JPY: { min: 10000, max: 1500000, unitStep: 1000 },
      EUR: { min: 100, max: 8000, unitStep: 20 },
      CNY: { min: 500, max: 60000, unitStep: 100 },
    },
  },
  {
    id: 'B002',
    name: { ko: '강남점', en: 'Gangnam Branch' },
    address: { ko: '서울 강남구 강남대로 396', en: '396 Gangnam-daero, Gangnam-gu, Seoul' },
    leadTimeDays: 0,
    phone: '02-1234-0002',
    hours: { open: '09:00', close: '20:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 50, y: 62 }, // 더미
    lat: 37.4979,
    lng: 127.0276,
    currencyLimits: {
      USD: { min: 100, max: 9900, unitStep: 20 },
      EUR: { min: 100, max: 8000, unitStep: 20 },
      GBP: { min: 100, max: 6000, unitStep: 10 },
    },
  },
  {
    id: 'B003',
    name: { ko: '인천공항 T1점', en: 'Incheon Airport T1' },
    address: { ko: '인천 중구 공항로 272 T1', en: '272 Gonghang-ro, Jung-gu, Incheon (T1)' },
    leadTimeDays: 0,
    phone: '032-1234-0003',
    hours: { open: '06:00', close: '22:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 14, y: 40 }, // 더미
    lat: 37.4491,
    lng: 126.4509,
    currencyLimits: {
      USD: { min: 100, max: 8000, unitStep: 20 },
      JPY: { min: 10000, max: 1000000, unitStep: 1000 },
      CNY: { min: 500, max: 40000, unitStep: 100 },
      THB: { min: 1000, max: 200000, unitStep: 100 },
      VND: { min: 500000, max: 50000000, unitStep: 10000 },
    },
  },
  {
    id: 'B004',
    name: { ko: '부산 서면점', en: 'Busan Seomyeon Branch' },
    address: { ko: '부산 부산진구 중앙대로 691', en: '691 Jungang-daero, Busanjin-gu, Busan' },
    leadTimeDays: 0,
    phone: '051-1234-0004',
    hours: { open: '10:00', close: '20:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 78, y: 82 }, // 더미
    lat: 35.1577,
    lng: 129.0594,
    currencyLimits: {
      USD: { min: 100, max: 7000, unitStep: 20 },
      JPY: { min: 10000, max: 1000000, unitStep: 1000 },
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
