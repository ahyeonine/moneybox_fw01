// 지점(Branch) 목데이터
// (지점 상세 정보 hours/phone/rating/mapPos 등은 프로토타입 표시용 더미)

/**
 * region: 지역(서울/부산/울산/대구/창원/수원 …) — 예약 플로우에서 지역 먼저 선택 후 지점 필터링.
 *   대표 지역(서울·부산) 외는 "그 외" 칩으로 묶인다.
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
  // ── "그 외" 지역(비대표) 지점 ──
  {
    id: 'B005',
    name: { ko: '울산점', en: 'Ulsan Branch' },
    region: { ko: '울산', en: 'Ulsan' },
    address: { ko: '울산 남구 삼산로 200', en: '200 Samsan-ro, Nam-gu, Ulsan' },
    leadTimeDays: 0,
    phone: '052-1234-0005',
    hours: { open: '10:00', close: '20:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 82, y: 74 }, // 더미
    lat: 35.5384,
    lng: 129.3114,
    currencies: ['USD', 'JPY', 'CNY'],
  },
  {
    id: 'B006',
    name: { ko: '대구 동성로점', en: 'Daegu Dongseongno Branch' },
    region: { ko: '대구', en: 'Daegu' },
    address: { ko: '대구 중구 동성로 30', en: '30 Dongseong-ro, Jung-gu, Daegu' },
    leadTimeDays: 0,
    phone: '053-1234-0006',
    hours: { open: '10:00', close: '20:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 66, y: 60 }, // 더미
    lat: 35.8693,
    lng: 128.5947,
    currencies: ['USD', 'JPY', 'EUR', 'CNY'],
  },
  {
    id: 'B007',
    name: { ko: '창원 상남점', en: 'Changwon Sangnam Branch' },
    region: { ko: '창원', en: 'Changwon' },
    address: { ko: '경남 창원시 성산구 상남로 100', en: '100 Sangnam-ro, Seongsan-gu, Changwon' },
    leadTimeDays: 0,
    phone: '055-1234-0007',
    hours: { open: '10:00', close: '20:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 72, y: 80 }, // 더미
    lat: 35.2281,
    lng: 128.6811,
    currencies: ['USD', 'JPY', 'CNY'],
  },
  {
    id: 'B008',
    name: { ko: '수원역점', en: 'Suwon Station Branch' },
    region: { ko: '수원', en: 'Suwon' },
    address: { ko: '경기 수원시 팔달구 덕영대로 924', en: '924 Deogyeong-daero, Paldal-gu, Suwon' },
    leadTimeDays: 0,
    phone: '031-1234-0008',
    hours: { open: '10:00', close: '20:00' }, // 더미
    rating: 0,
    reviewCount: 0,
    mapPos: { x: 46, y: 26 }, // 더미
    lat: 37.2659,
    lng: 127.0001,
    currencies: ['USD', 'JPY', 'CNY', 'EUR'],
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

// 대표 지역만 개별 노출하고 나머지는 "그 외"로 묶는다. (비대표 지점이 없으면 "그 외" 칩은 표시 안 함)
export const PRIMARY_REGIONS = ['서울', '부산']
// "그 외" 가상 지역 — 대표 지역이 아닌 모든 지점을 포함.
export const OTHER_REGION = { ko: '그 외', en: 'Other areas', other: true }

/** 지역 선택 칩: 대표 지역(있는 것만) + "그 외"(비대표 지점이 있으면). */
export function regionChips() {
  const chips = []
  for (const ko of PRIMARY_REGIONS) {
    const b = BRANCHES.find((x) => x.region.ko === ko)
    if (b) chips.push(b.region)
  }
  if (BRANCHES.some((b) => !PRIMARY_REGIONS.includes(b.region.ko))) chips.push(OTHER_REGION)
  return chips
}

/** 지점이 선택 지역에 해당하는지 — "그 외"는 대표 지역이 아닌 전부. */
export function branchMatchesRegion(b, regionKo) {
  if (regionKo === OTHER_REGION.ko) return !PRIMARY_REGIONS.includes(b.region.ko)
  return b.region.ko === regionKo
}
