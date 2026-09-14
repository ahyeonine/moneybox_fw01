import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useReservations } from '../../store/ReservationContext.jsx'
import { useRates } from '../../store/RatesContext.jsx'
import { useEmail, BRANCH_CANCEL_REASON } from '../../store/EmailContext.jsx'
import { getBranch } from '../../data/branches.js'
import { CURRENCY_META, toKrw, WEB_COUPON_BONUS } from '../../data/rates.js'
import { formatDate, formatKrw, formatForeign, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'

export default function TransactionProcess() {
  const { t, lang } = useI18n()
  const { reservations, getByNo, completeReservation, cancelByBranch } = useReservations()
  const { getRate } = useRates()
  const { sendEmail } = useEmail()
  const [params] = useSearchParams()

  const [query, setQuery] = useState(params.get('no') || '')
  const [no, setNo] = useState(null) // 조회된 예약번호
  const [notFound, setNotFound] = useState(false)
  const [idChecked, setIdChecked] = useState(false)
  const [flash, setFlash] = useState(null)
  const [scanned, setScanned] = useState(null) // 신분증 스캔 결과 { name, birthDate }

  // 신분증 스캔 데모용 신원 목록 — 예약에 있는 (이름+생년월일) 중복 제거.
  const demoIds = []
  {
    const seen = new Set()
    for (const r of reservations) {
      if (!r.birthDate) continue
      const k = `${r.customerName}|${r.birthDate}`
      if (seen.has(k)) continue
      seen.add(k)
      demoIds.push({ name: r.customerName, birthDate: r.birthDate })
    }
  }
  // 스캔된 신분증과 이름·생년월일이 모두 일치하는 예약
  const matches = scanned
    ? reservations.filter(
        (r) => r.customerName === scanned.name && r.birthDate === scanned.birthDate
      )
    : []

  function doScan(id) {
    setScanned(id)
    setNo(null)
    setNotFound(false)
    setFlash(null)
  }
  function selectMatch(r) {
    setNo(r.reservationNo)
    setIdChecked(true) // 신분증 스캔·대조 완료로 간주
    setFlash(null)
  }

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

  // ── 정산 ──
  // 원화구매(BUY): 1통화당 원화가 많을수록 고객에게 유리.
  //  - FIXED(예약시점 고정): 예약환율 vs 오늘환율 중 큰 값(베스트레이트 보장).
  //  - BOARD(환율 미고정): 수령일 전광판(오늘) 환율 적용 + 쿠폰 보유 시 우대.
  const isBoard = rec?.rateMode === 'BOARD'
  const hasCoupon = !!rec?.coupon
  const todayRate = rec ? getRate(rec.currency) : null
  const round2 = (n) => Math.round(n * 100) / 100
  const appliedRate = (() => {
    if (!rec || todayRate == null) return rec?.rate
    if (isBoard) return hasCoupon ? round2(todayRate * (1 + WEB_COUPON_BONUS)) : todayRate
    return Math.max(rec.rate, todayRate)
  })()
  const appliedKrw = rec ? toKrw(rec.foreignAmount, appliedRate) : 0
  const rateImproved = rec && !isBoard && todayRate != null && appliedRate > rec.rate

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

      {!rec && (
        <>
          {/* ① 신분증 스캔 → 이름·생년월일 일치 예약 조회 */}
          <div className="card scan-panel">
            <h3 className="scan-h">🪪 {t('op.tx.scan.title')}</h3>
            <p className="muted">{t('op.tx.scan.sub')}</p>
            {!scanned ? (
              <>
                <div className="tiny scan-demo-label">{t('op.tx.scan.demoLabel')}</div>
                <div className="scan-demo-list">
                  {demoIds.map((id) => (
                    <button
                      key={`${id.name}|${id.birthDate}`}
                      type="button"
                      className="scan-demo-btn"
                      onClick={() => doScan(id)}
                    >
                      📷 {id.name} · {id.birthDate}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="scan-result">
                  <span>
                    🪪 <b>{scanned.name}</b> · {scanned.birthDate}
                  </span>
                  <button type="button" className="btn ghost sm" onClick={() => setScanned(null)}>
                    {t('op.tx.scan.again')}
                  </button>
                </div>
                {matches.length === 0 ? (
                  <div className="notice danger" style={{ marginTop: 10 }}>
                    {t('op.tx.scan.none')}
                  </div>
                ) : (
                  <div className="scan-matches">
                    <div className="tiny">
                      {t('op.tx.scan.matched')} ({matches.length})
                    </div>
                    {matches.map((m) => (
                      <button
                        key={m.reservationNo}
                        type="button"
                        className="scan-match"
                        onClick={() => selectMatch(m)}
                      >
                        <span className="sm-no">{m.reservationNo}</span>
                        <span className="sm-cur">
                          {CURRENCY_META[m.currency]?.flag} {formatNumber(m.foreignAmount)} {m.currency}
                        </span>
                        <span className="sm-date">{formatDate(m.pickupDate, lang)}</span>
                        <StatusBadge status={m.status} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ② 또는 예약번호로 검색 */}
          <form className="card" onSubmit={doLookup}>
            <div className="tiny" style={{ marginBottom: 8, fontWeight: 700 }}>
              {t('op.tx.orSearch')}
            </div>
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
          </form>

          {notFound && (
            <div className="notice danger" style={{ marginTop: 14 }}>
              {t('lookup.notfound')}
            </div>
          )}
        </>
      )}

      {rec && (
        <div className="card" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="btn ghost sm"
            style={{ marginBottom: 12 }}
            onClick={() => {
              setNo(null)
              setNotFound(false)
              setFlash(null)
            }}
          >
            ‹ {t('op.tx.scan.back')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{rec.reservationNo}</h2>
            <StatusBadge status={rec.status} />
          </div>

          <div className="summary">
            <div className="row">
              <span className="k">{t('common.name')}</span>
              <span className="v">{rec.customerName}</span>
            </div>
            {rec.birthDate && (
              <div className="row">
                <span className="k">{t('op.tx.birth')}</span>
                <span className="v">{rec.birthDate}</span>
              </div>
            )}
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
                {isBoard ? t('op.tx.board.reservedNone') : `1 ${rec.currency} = ${formatNumber(rec.rate)} KRW`}
              </span>
            </div>
            <div className="row total">
              <span className="k">{t('common.krwAmount')}</span>
              <span className="v">{isBoard ? '—' : formatKrw(rec.krwAmount)}</span>
            </div>
          </div>

          {/* 정산: BOARD(전광판+쿠폰) / FIXED(베스트레이트) */}
          {rec.status === 'BOOKED' && (
            <div className="bestrate-box" style={{ marginTop: 14 }}>
              <div className="bestrate-title">
                💱 {isBoard ? t('op.tx.board.title') : t('op.tx.bestRate.title')}
              </div>
              <div className="summary">
                {isBoard ? (
                  <>
                    <div className="row">
                      <span className="k">{t('op.tx.board.board')}</span>
                      <span className="v">1 {rec.currency} = {formatNumber(todayRate)} KRW</span>
                    </div>
                    {hasCoupon && (
                      <div className="row">
                        <span className="k">{t('op.tx.board.coupon')}</span>
                        <span className="v" style={{ color: '#0a7d3c', fontWeight: 700 }}>
                          +{(WEB_COUPON_BONUS * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="row">
                      <span className="k">{t('op.tx.bestRate.reserved')}</span>
                      <span className="v">1 {rec.currency} = {formatNumber(rec.rate)} KRW</span>
                    </div>
                    <div className="row">
                      <span className="k">{t('op.tx.bestRate.today')}</span>
                      <span className="v">1 {rec.currency} = {formatNumber(todayRate)} KRW</span>
                    </div>
                  </>
                )}
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
                {isBoard
                  ? hasCoupon
                    ? t('op.tx.board.couponNote')
                    : t('op.tx.board.note')
                  : rateImproved
                    ? t('op.tx.bestRate.improved')
                    : t('op.tx.bestRate.same')}
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
