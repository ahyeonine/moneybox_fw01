// 지점(Branch) 목데이터
// (지점 상세 정보 hours/phone/rating/mapPos 등은 프로토타입 표시용 더미)

/**
 * region: 지역(서울/인천/부산/제주 …) — 예약 플로우에서 지역 먼저 선택 후 지점 필터링.
 * currencies: 지점이 취급하는 통화 코드 목록. (금액 한도 정책은 제거됨)
 * leadTimeDays: 준비일수(리드타임). 정책상 제한 없음 → 0 (예약일 당일부터 수령 가능).
 *   수령 가능 범위는 예약일 ~ 최대 2주(14일). pickupRange(today, leadTimeDays, 14).
 */
export const BRANCHES = [
  {
    id: 'B001',
    name: { ko: '명동점', en: 'Myeongdong Branch' },
    region: { ko: '서울', en: 'Seoul' },
    address: { ko: '서울 중구 명동길 14', en: '14 Myeongdong-gil, Jung-gu, Seoul' },
    leadTimeDays: 0,
    phone: '02-1234-0001',
    hours: { open: '10:00', close: '21:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 44, y: 34 }, // 더미 지도 마커 위치(%)
    lat: 37.5636, // 지도 임베드용 근사 좌표(프로토타입)
    lng: 126.985,
    currencies: ['USD', 'JPY', 'EUR', 'CNY'],
  },
  {
    id: 'B002',
    name: { ko: '강남점', en: 'Gangnam Branch' },
    region: { ko: '서울', en: 'Seoul' },
    address: { ko: '서울 강남구 강남대로 396', en: '396 Gangnam-daero, Gangnam-gu, Seoul' },
    leadTimeDays: 0,
    phone: '02-1234-0002',
    hours: { open: '09:00', close: '20:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 50, y: 62 }, // 더미
    lat: 37.4979,
    lng: 127.0276,
    currencies: ['USD', 'EUR', 'GBP'],
  },
  {
    id: 'B003',
    name: { ko: '인천공항 T1점', en: 'Incheon Airport T1' },
    region: { ko: '인천', en: 'Incheon' },
    address: { ko: '인천 중구 공항로 272 T1', en: '272 Gonghang-ro, Jung-gu, Incheon (T1)' },
    leadTimeDays: 0,
    phone: '032-1234-0003',
    hours: { open: '06:00', close: '22:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 14, y: 40 }, // 더미
    lat: 37.4491,
    lng: 126.4509,
    currencies: ['USD', 'JPY', 'CNY', 'THB', 'VND'],
  },
  {
    id: 'B004',
    name: { ko: '부산 서면점', en: 'Busan Seomyeon Branch' },
    region: { ko: '부산', en: 'Busan' },
    address: { ko: '부산 부산진구 중앙대로 691', en: '691 Jungang-daero, Busanjin-gu, Busan' },
    leadTimeDays: 0,
    phone: '051-1234-0004',
    hours: { open: '10:00', close: '20:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 78, y: 82 }, // 더미
    lat: 35.1577,
    lng: 129.0594,
    currencies: ['USD', 'JPY'],
  },
  {
    id: 'B005',
    name: { ko: '제주공항점', en: 'Jeju Airport Branch' },
    region: { ko: '제주', en: 'Jeju' },
    address: { ko: '제주 제주시 공항로 2', en: '2 Gonghang-ro, Jeju-si, Jeju' },
    leadTimeDays: 0,
    phone: '064-1234-0005',
    hours: { open: '08:00', close: '21:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 30, y: 92 }, // 더미
    lat: 33.5104,
    lng: 126.4914,
    currencies: ['USD', 'JPY', 'CNY'],
  },
]

export function getBranch(branchId) {
  return BRANCHES.find((b) => b.id === branchId) || null
}

/** 지점이 취급하는 통화 코드 리스트 */
export function branchCurrencies(branchId) {
  const b = getBranch(branchId)
  return b ? b.currencies : []
}

/** 지역 목록 (지점이 있는 지역만, 등장 순서 유지) */
export function regionList() {
  const seen = new Set()
  const out = []
  for (const b of BRANCHES) {
    if (!seen.has(b.region.ko)) {
      seen.add(b.region.ko)
      out.push(b.region)
    }
  }
  return out
}
