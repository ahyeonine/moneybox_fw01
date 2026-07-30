// 포맷 유틸

export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-'
  return Number(n).toLocaleString('en-US')
}

export function formatKrw(n) {
  return `₩${formatNumber(n)}`
}

export function formatForeign(n, currency) {
  return `${formatNumber(n)} ${currency}`
}

/** YYYY-MM-DD → 로케일 표기 */
export function formatDate(iso, lang = 'ko') {
  if (!iso) return '-'
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return iso
  if (lang === 'ko') {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate()
    ).padStart(2, '0')}`
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
