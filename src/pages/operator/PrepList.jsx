import { useState, useMemo } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useReservations } from '../../store/ReservationContext.jsx'
import { getBranch } from '../../data/branches.js'
import { CURRENCY_META } from '../../data/rates.js'
import { formatDate, formatKrw, formatForeign, formatNumber } from '../../lib/format.js'
import { diffDays } from '../../lib/date.js'
import { StatusBadge, TxBadge, ReminderBadge } from '../../components/Badges.jsx'

// 리마인더 응답별 시재준비 리스트 노출 규칙:
//  - CONFIRMED(방문예정확인)  → 노출
//  - NO_RESPONSE 이면서 수령일이 미래(전일까지 무응답) → 기본 숨김(직접조회는 가능)
//  - NO_RESPONSE 이면서 수령일이 오늘(당일 무응답) → 노출
//  - 취소/자동취소(CANCELLED) → 미노출
// showHidden 토글로 숨김 항목까지 표시할 수 있다.
function shouldShow(rec, today) {
  if (rec.status === 'CANCELLED') return false
  if (rec.reminderStatus === 'NO_RESPONSE') {
    const isToday = diffDays(rec.pickupDate, today) === 0
    return isToday // 당일이면 노출, 전일까지면 숨김
  }
  return true
}

export default function PrepList() {
  const { t, lang } = useI18n()
  const { reservations, today } = useReservations()

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('ALL')
  const [showHidden, setShowHidden] = useState(false)

  const rows = useMemo(() => {
    return reservations
      .filter((r) => (status === 'ALL' ? r.status !== 'CANCELLED' : r.status === status))
      .filter((r) => (from ? r.pickupDate >= from : true))
      .filter((r) => (to ? r.pickupDate <= to : true))
      .filter((r) => showHidden || shouldShow(r, today))
      .sort((a, b) => (a.pickupDate < b.pickupDate ? -1 : a.pickupDate > b.pickupDate ? 1 : 0))
  }, [reservations, status, from, to, showHidden, today])

  // 시재 준비 합계: 매출=외화준비(통화별), 매입=원화준비(KRW)
  const summary = useMemo(() => {
    const sell = {} // currency -> foreign total
    let buyKrw = 0
    for (const r of rows) {
      if (r.status !== 'BOOKED') continue
      if (r.transactionType === 'SELL') {
        sell[r.currency] = (sell[r.currency] || 0) + r.foreignAmount
      } else {
        buyKrw += r.krwAmount
      }
    }
    return { sell, buyKrw }
  }, [rows])

  return (
    <div>
      <h2>{t('op.prep.title')}</h2>
      <p className="muted">{t('op.prep.sub')}</p>

      <div className="summary-cards">
        <div className="sc">
          <div className="lbl">{t('op.prep.summary.sell')}</div>
          <div className="val">
            {Object.keys(summary.sell).length === 0 && '-'}
            {Object.entries(summary.sell).map(([c, v]) => (
              <div key={c}>
                {CURRENCY_META[c]?.flag} {formatForeign(v, c)}
              </div>
            ))}
          </div>
        </div>
        <div className="sc">
          <div className="lbl">{t('op.prep.summary.buy')}</div>
          <div className="val">{formatKrw(summary.buyKrw)}</div>
        </div>
      </div>

      <div className="op-toolbar card" style={{ marginBottom: 14 }}>
        <label className="field-inline">
          <span>{t('op.prep.filter.from')}</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field-inline">
          <span>{t('op.prep.filter.to')}</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="field-inline">
          <span>{t('op.prep.filter.status')}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">{t('op.prep.filter.all')}</option>
            <option value="BOOKED">{t('status.BOOKED')}</option>
            <option value="COMPLETED">{t('status.COMPLETED')}</option>
            <option value="CANCELLED">{t('status.CANCELLED')}</option>
          </select>
        </label>
        <label className="field-inline" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <span>{t('op.prep.showHidden')}</span>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="notice info">{t('op.prep.empty')}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.pickupDate')}</th>
                <th>{t('common.reservationNo')}</th>
                <th>{t('common.name')}</th>
                <th>{t('common.currency')}</th>
                <th>{t('common.txType')}</th>
                <th className="num">{t('common.foreignAmount')}</th>
                <th className="num">{t('common.rate')}</th>
                <th className="num">{t('common.krwAmount')}</th>
                <th>{t('op.prep.reminder')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.reservationNo} style={{ opacity: shouldShow(r, today) ? 1 : 0.5 }}>
                  <td>{formatDate(r.pickupDate, lang)}</td>
                  <td>{r.reservationNo}</td>
                  <td>{r.customerName}</td>
                  <td>
                    {CURRENCY_META[r.currency]?.flag} {r.currency}
                  </td>
                  <td>
                    <TxBadge type={r.transactionType} />
                  </td>
                  <td className="num">{formatNumber(r.foreignAmount)}</td>
                  <td className="num">{formatNumber(r.rate)}</td>
                  <td className="num">{formatKrw(r.krwAmount)}</td>
                  <td>
                    <ReminderBadge status={r.reminderStatus} />
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
