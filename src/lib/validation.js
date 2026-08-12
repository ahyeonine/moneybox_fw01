// 검증 유틸

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(v) {
  return EMAIL_RE.test((v || '').trim())
}

/**
 * 금액 검증. 반환: { ok, code }
 * code: 'EMPTY' | 'BELOW_MIN' | 'ABOVE_MAX' | null
 */
export function validateAmount(amount, limit) {
  if (amount === '' || amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return { ok: false, code: 'EMPTY' }
  }
  const n = Number(amount)
  if (limit && n < limit.min) return { ok: false, code: 'BELOW_MIN' }
  if (limit && n > limit.max) return { ok: false, code: 'ABOVE_MAX' }
  if (n <= 0) return { ok: false, code: 'EMPTY' }
  return { ok: true, code: null }
}

/**
 * 금액 자동 보정. 보정 순서: 1) 단위 올림(ceil) → 2) 최대 초과 시 최대로 → 3) 최소 미만 시 최소로.
 * 반환: { value, changed, reason } (reason: 'UNIT' | 'MAX' | 'MIN' | null)
 */
export function correctAmount(value, limit) {
  const n = Number(value)
  if (!limit || !n || Number.isNaN(n) || n <= 0) {
    return { value, changed: false, reason: null }
  }
  const unit = limit.unitStep || 1
  let reason = null
  let c = Math.ceil(n / unit) * unit // 1) 단위 보정(올림)
  if (c !== n) reason = 'UNIT'
  if (c > limit.max) {
    c = limit.max // 2) 최대 보정
    reason = 'MAX'
  }
  if (c < limit.min) {
    c = limit.min // 3) 최소 보정
    reason = 'MIN'
  }
  return { value: c, changed: c !== n, reason: c !== n ? reason : null }
}

/** 예약자 영문명: 알파벳/공백만, 2자 이상 */
export function isValidName(v) {
  const s = (v || '').trim()
  return s.length >= 2 && /^[A-Za-z\s]+$/.test(s)
}
