// 날짜 계산 유틸 (YYYY-MM-DD 문자열 기반)
//
// ── 시간대(TZ) 기준: 한국 표준시(KST, UTC+9) ──
// 모든 날짜 문자열은 KST 달력 날짜를 의미한다. 날짜 연산은 런타임 로컬 TZ에
// 영향받지 않도록 UTC 자정으로 파싱해 처리한다(순수 날짜 산술이므로 결과는 KST 달력과 동일).
// 자동취소(수령기한) 판정은 "KST 자정"을 경계로, 수령예정일이 지난 다음날 KST 00:00부터 성립한다.

function toISODate(d) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISO(s) {
  // KST 달력 날짜를 UTC 자정으로 고정 파싱 (로컬 TZ 무관하게 결정적)
  return new Date(s + 'T00:00:00Z')
}

export function addDays(iso, days) {
  const d = parseISO(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toISODate(d)
}

/** a < b 이면 음수, 같으면 0, a > b 이면 양수 (일 단위, KST 달력 기준) */
export function diffDays(aIso, bIso) {
  const a = parseISO(aIso).getTime()
  const b = parseISO(bIso).getTime()
  return Math.round((a - b) / 86400000)
}

/**
 * 수령 가능 날짜 범위 계산.
 * @param todayIso 오늘(시뮬레이션 기준일)
 * @param leadTimeDays 지점 리드타임
 * @param maxWindowDays 최대 예약 가능일수. `null`(또는 숫자 아님)이면 기간 제한 없음 → maxDate=null.
 * @returns {{ minDate: string, maxDate: string|null }} maxDate=null 이면 상한 없음(무제한).
 */
export function pickupRange(todayIso, leadTimeDays, maxWindowDays = null) {
  const n = Math.round(Number(maxWindowDays))
  const unlimited = maxWindowDays == null || !Number.isFinite(n) || n <= 0
  return {
    minDate: addDays(todayIso, leadTimeDays),
    maxDate: unlimited ? null : addDays(todayIso, n),
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
