// 날짜 계산 유틸 (YYYY-MM-DD 문자열 기반)

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(s) {
  return new Date(s + 'T00:00:00')
}

export function addDays(iso, days) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** a < b 이면 음수, 같으면 0, a > b 이면 양수 (일 단위) */
export function diffDays(aIso, bIso) {
  const a = parseISO(aIso).getTime()
  const b = parseISO(bIso).getTime()
  return Math.round((a - b) / 86400000)
}

/**
 * 수령 가능 날짜 범위 계산.
 * @param todayIso 오늘(시뮬레이션 기준일)
 * @param leadTimeDays 지점 리드타임
 * @param maxWindowDays 최대 예약 가능일수 (기본 30일)
 */
export function pickupRange(todayIso, leadTimeDays, maxWindowDays = 30) {
  return {
    minDate: addDays(todayIso, leadTimeDays),
    maxDate: addDays(todayIso, maxWindowDays),
  }
}

/**
 * 수령 시간대 슬롯 생성. 지점 영업시간(open~close, "HH:mm") 내 1시간 단위.
 * TODO: 실제 예약 가능 시간/슬롯 재고 정책으로 교체.
 */
export function timeSlots(hours) {
  const open = hours?.open ?? '10:00'
  const close = hours?.close ?? '18:00'
  const startH = parseInt(open.slice(0, 2), 10)
  const endH = parseInt(close.slice(0, 2), 10)
  const slots = []
  for (let h = startH; h < endH; h += 1) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  return slots
}
