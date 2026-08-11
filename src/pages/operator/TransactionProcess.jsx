import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useReservations } from '../../store/ReservationContext.jsx'
import { useRates } from '../../store/RatesContext.jsx'
import { useEmail, BRANCH_CANCEL_REASON } from '../../store/EmailContext.jsx'
import { getBranch } from '../../data/branches.js'
import { CURRENCY_META, toKrw } from '../../data/rates.js'
import { formatDate, formatKrw, formatForeign, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'

export default function TransactionProcess() {
  const { t, lang } = useI18n()
  const { getByNo, completeReservation, cancelByBranch } = useReservations()
  const { getRate } = useRates()
  const { sendEmail } = useEmail()
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

  // ── 베스트레이트 정산 ──
  // 원화구매(BUY): 1통화당 원화가 많을수록 고객에게 유리 → 예약환율 vs 오늘환율 중 큰 값 적용.
  const todayRate = rec ? getRate(rec.currency) : null
  const appliedRate = rec && todayRate != null ? Math.max(rec.rate, todayRate) : rec?.rate
  const appliedKrw = rec ? toKrw(rec.foreignAmount, appliedRate) : 0
  const rateImproved = rec && todayRate != null && appliedRate > rec.rate

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
    completeReservation(rec.reservationNo, {
      appliedRate,
      appliedKrwAmount: appliedKrw,
    })
    setFlash({ type: 'success', msg: t('op.tx.completed.msg') })
  }

  // 지점 취소 → 상태 취소(사유=지점) + 지점취소 안내 이메일 발송
  function cancelBranch() {
    if (rec.status !== 'BOOKED') {
      setFlash({ type: 'danger', msg: t('op.tx.notBooked') })
      return
    }
    cancelByBranch(rec.reservationNo)
    sendEmail('branchCancel', rec.email, {
      name: rec.customerName,
      reservationNo: rec.reservationNo,
      branchReason: BRANCH_CANCEL_REASON,
    })
    setFlash({ type: 'warn', msg: t('op.tx.branchCancelled') })
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
          demo: RSV-20260728-0001 · RSV-20260728-0002 · RSV-20260729-0401(베스트레이트)
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

          {/* 베스트레이트 정산: 예약환율 vs 오늘환율 비교 → 유리한 쪽 적용 */}
          {rec.status === 'BOOKED' && (
            <div className="bestrate-box" style={{ marginTop: 14 }}>
              <div className="bestrate-title">💱 {t('op.tx.bestRate.title')}</div>
              <div className="summary">
                <div className="row">
                  <span className="k">{t('op.tx.bestRate.reserved')}</span>
                  <span className="v">
                    1 {rec.currency} = {formatNumber(rec.rate)} KRW
                  </span>
                </div>
                <div className="row">
                  <span className="k">{t('op.tx.bestRate.today')}</span>
                  <span className="v">
                    1 {rec.currency} = {formatNumber(todayRate)} KRW
                  </span>
                </div>
                <div className="row">
                  <span className="k">{t('op.tx.bestRate.applied')}</span>
                  <span className="v" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    1 {rec.currency} = {formatNumber(appliedRate)} KRW
                  </span>
                </div>
                <div className="row total">
                  <span className="k">{t('op.tx.bestRate.appliedKrw')}</span>
                  <span className="v">{formatKrw(appliedKrw)}</span>
                </div>
              </div>
              <div className="tiny" style={{ marginTop: 8 }}>
                {rateImproved ? t('op.tx.bestRate.improved') : t('op.tx.bestRate.same')}
              </div>
            </div>
          )}

          {/* 완료된 거래: 실제 적용된 베스트레이트 결과 표기 */}
          {rec.status === 'COMPLETED' && rec.appliedRate != null && (
            <div className="bestrate-box" style={{ marginTop: 14 }}>
              <div className="bestrate-title">💱 {t('op.tx.bestRate.title')}</div>
              <div className="summary">
                <div className="row">
                  <span className="k">{t('op.tx.bestRate.reserved')}</span>
                  <span className="v">
                    1 {rec.currency} = {formatNumber(rec.rate)} KRW
                  </span>
                </div>
                <div className="row">
                  <span className="k">{t('op.tx.bestRate.applied')}</span>
                  <span className="v" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    1 {rec.currency} = {formatNumber(rec.appliedRate)} KRW
                  </span>
                </div>
                <div className="row total">
                  <span className="k">{t('op.tx.bestRate.appliedKrw')}</span>
                  <span className="v">{formatKrw(rec.appliedKrwAmount ?? rec.krwAmount)}</span>
                </div>
              </div>
              <div className="tiny" style={{ marginTop: 8 }}>
                {rec.appliedRate > rec.rate
                  ? t('op.tx.bestRate.improved')
                  : t('op.tx.bestRate.same')}
              </div>
            </div>
          )}

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
              <button
                className="btn ghost block"
                style={{ marginTop: 8, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={cancelBranch}
              >
                {t('op.tx.branchCancel')}
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
