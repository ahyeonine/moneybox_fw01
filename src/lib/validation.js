// 검증 유틸

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

/** 예약자 영문명: 알파벳/공백만, 2자 이상 */
export function isValidName(v) {
  const s = (v || '').trim()
  return s.length >= 2 && /^[A-Za-z\s]+$/.test(s)
}
