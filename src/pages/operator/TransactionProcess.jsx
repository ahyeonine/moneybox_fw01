import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useReservations } from '../../store/ReservationContext.jsx'
import { getBranch } from '../../data/branches.js'
import { CURRENCY_META } from '../../data/rates.js'
import { formatDate, formatKrw, formatForeign, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'

export default function TransactionProcess() {
  const { t, lang } = useI18n()
  const { getByNo, completeReservation } = useReservations()
  const [params] = useSearchParams()

  const [query, setQuery] = useState(params.get('no') || '')
  const [no, setNo] = useState(null) // 조회된 예약번호
  const [notFound, setNotFound] = useState(false)
  const [idChecked, setIdChecked] = useState(false)
  const [flash, setFlash] = useState(null)

  // 예약조회 결과 리스트에서 행 클릭 → ?no=RSV-... 로 진입 시 자동 조회
  useEffect(() => {
    const qno = params.get('no')
    if (!qno) return
    const r = getByNo(qno)
    if (r) {
      setNo(r.reservationNo)
      setIdChecked(r.idVerified)
      setNotFound(false)
    } else {
      setNotFound(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 항상 store 최신 상태를 참조
  const rec = no ? getByNo(no) : null

  function doLookup(e) {
    e?.preventDefault()
    const r = getByNo(query)
    if (r) {
      setNo(r.reservationNo)
      setNotFound(false)
      setIdChecked(r.idVerified)
      setFlash(null)
    } else {
      setNo(null)
      setNotFound(true)
    }
  }

  function complete() {
    if (!idChecked) {
      setFlash({ type: 'warn', msg: t('op.tx.needId') })
      return
    }
    if (rec.status !== 'BOOKED') {
      setFlash({ type: 'danger', msg: t('op.tx.notBooked') })
      return
    }
    completeReservation(rec.reservationNo)
    setFlash({ type: 'success', msg: t('op.tx.completed.msg') })
  }

  const branch = rec ? getBranch(rec.branchId) : null

  return (
    <div>
      <h2>{t('op.tx.title')}</h2>
      <p className="muted">{t('op.tx.sub')}</p>

      <form className="card" onSubmit={doLookup}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('op.tx.lookupPlaceholder')}
          />
          <button className="btn primary" type="submit" disabled={!query}>
            {t('common.search')}
          </button>
        </div>
        <div className="tiny" style={{ marginTop: 10 }}>
          demo: RSV-20260728-0001 · RSV-20260728-0002
        </div>
      </form>

      {notFound && (
        <div className="notice danger" style={{ marginTop: 14 }}>
          {t('lookup.notfound')}
        </div>
      )}

      {rec && (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{rec.reservationNo}</h2>
            <StatusBadge status={rec.status} />
          </div>

          <div className="summary">
            <div className="row">
              <span className="k">{t('common.name')}</span>
              <span className="v">{rec.customerName}</span>
            </div>
            <div className="row">
              <span className="k">{t('common.email')}</span>
              <span className="v">{rec.email}</span>
            </div>
            <div className="row">
              <span className="k">{t('common.branch')}</span>
              <span className="v">{branch?.name[lang]}</span>
            </div>
            <div className="row">
              <span className="k">{t('common.pickupDate')}</span>
              <span className="v">{formatDate(rec.pickupDate, lang)}</span>
            </div>
            <div className="row">
              <span className="k">{t('common.currency')}</span>
              <span className="v">
                {CURRENCY_META[rec.currency]?.flag} {rec.currency}
              </span>
            </div>
            <div className="row">
              <span className="k">{t('common.foreignAmount')}</span>
              <span className="v">{formatForeign(rec.foreignAmount, rec.currency)}</span>
            </div>
            <div className="row">
              <span className="k">{t('common.rate')}</span>
              <span className="v">
                1 {rec.currency} = {formatNumber(rec.rate)} KRW
              </span>
            </div>
            <div className="row total">
              <span className="k">{t('common.krwAmount')}</span>
              <span className="v">{formatKrw(rec.krwAmount)}</span>
            </div>
          </div>

          {rec.status === 'BOOKED' ? (
            <>
              <label className="check-row" style={{ marginTop: 16 }}>
                <input
                  type="checkbox"
                  checked={idChecked}
                  onChange={(e) => setIdChecked(e.target.checked)}
                />
                <div>
                  <div className="ct">{t('op.tx.idcheck')}</div>
                </div>
              </label>
              <button className="btn success block" onClick={complete} disabled={!idChecked}>
                {t('op.tx.complete')}
              </button>
            </>
          ) : (
            <div className="notice info" style={{ marginTop: 16 }}>
              {t('op.tx.notBooked')}
            </div>
          )}

          {flash && (
            <div className={`notice ${flash.type}`} style={{ marginTop: 12 }}>
              {flash.msg}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
