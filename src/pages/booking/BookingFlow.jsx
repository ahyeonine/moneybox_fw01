import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useReservations } from '../../store/ReservationContext.jsx'
import Stepper from '../../components/Stepper.jsx'
import Modal from '../../components/Modal.jsx'
import BranchMap from '../../components/BranchMap.jsx'
import { BRANCHES, getBranch, branchCurrencies, currencyLimit } from '../../data/branches.js'
import { CURRENCY_META, getRate, toKrw, getDisplayRates, getBankCompare } from '../../data/rates.js'
import { validateAmount, isValidEmail, isValidName } from '../../lib/validation.js'
import { pickupRange, timeSlots } from '../../lib/date.js'
import { formatKrw, formatForeign, formatNumber, formatDate, formatDateTime } from '../../lib/format.js'

// 재고 소진 시뮬레이션 (데모용, 결정성 유지):
// 인천공항 T1점(B003) + 베트남 동(VND) 조합은 재고 소진으로 처리해 예외 플로우를 시연한다.
// TODO: 실제 재고 API 연동으로 교체
function isSoldOut(branchId, currency) {
  return branchId === 'B003' && currency === 'VND'
}

// 진행 단계: 지점선택(A) + 환전신청(B) 이 기존 8단계의 1~4단계를 흡수 통합.
const STAGES = ['branch', 'apply', 'info', 'review', 'consent', 'done']

const emptyDraft = {
  branchId: '',
  transactionType: 'SELL', // SELL(외화 구매=지점 매출) | BUY(외화 판매=지점 매입)
  currency: '',
  amount: '',
  pickupDate: '',
  pickupTime: '',
  customerName: '',
  email: '',
  rate: null,
}

export default function BookingFlow() {
  const { t } = useI18n()
  const { today, createReservation } = useReservations()

  const [stage, setStage] = useState('branch')
  const [draft, setDraft] = useState(emptyDraft)
  const [soldOut, setSoldOut] = useState(false)
  const [consent, setConsent] = useState({ noshow: false, privacy: false })
  const [result, setResult] = useState(null)

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const branch = getBranch(draft.branchId)
  const limit =
    draft.branchId && draft.currency ? currencyLimit(draft.branchId, draft.currency) : null
  const amountCheck = validateAmount(draft.amount, limit)
  const rate = draft.currency ? getRate(draft.currency) : null
  const krw = amountCheck.ok ? toKrw(Number(draft.amount), rate) : 0
  const range = useMemo(
    () => (branch ? pickupRange(today, branch.leadTimeDays, 30) : null),
    [branch, today]
  )

  const stepLabels = [
    t('wz.branch'),
    t('wz.apply'),
    t('wz.info'),
    t('wz.review'),
    t('wz.consent'),
    t('wz.done'),
  ]
  const stageIndex = STAGES.indexOf(stage) + 1 // 1-based for Stepper

  // STEP A: 지점 선택 → 신청 화면으로. 통화/구분/금액/일시 초기화
  function selectBranch(branchId) {
    const first = branchCurrencies(branchId)[0] || ''
    setDraft((d) => ({
      ...d,
      branchId,
      currency: first,
      transactionType: 'SELL',
      amount: '',
      pickupDate: '',
      pickupTime: '',
    }))
    setStage('apply')
  }

  // STEP B: 신청하기 → 재고 확인 후 예약자정보로
  function submitApply() {
    if (isSoldOut(draft.branchId, draft.currency)) {
      setSoldOut(true)
      return
    }
    setStage('info')
  }

  function goReview() {
    setStage('review')
  }

  // 최종확인 → 동의: 이 시점에 환율 픽스
  function fixRateAndConsent() {
    set({ rate })
    setStage('consent')
  }

  function submit() {
    const fixedRate = draft.rate ?? rate
    const rec = createReservation({
      transactionType: draft.transactionType,
      branchId: draft.branchId,
      currency: draft.currency,
      rate: fixedRate,
      foreignAmount: Number(draft.amount),
      krwAmount: toKrw(Number(draft.amount), fixedRate),
      customerName: draft.customerName.trim().toUpperCase(),
      email: draft.email.trim(),
      pickupDate: draft.pickupDate,
      pickupTime: draft.pickupTime,
    })
    setResult(rec)
    setStage('done')
  }

  function restart() {
    setDraft(emptyDraft)
    setConsent({ noshow: false, privacy: false })
    setSoldOut(false)
    setResult(null)
    setStage('branch')
  }

  const applyValid =
    !!draft.currency &&
    amountCheck.ok &&
    !!draft.pickupDate &&
    !!draft.pickupTime &&
    draft.pickupDate >= (range?.minDate || '') &&
    draft.pickupDate <= (range?.maxDate || '9999-12-31')
  const infoValid = isValidName(draft.customerName) && isValidEmail(draft.email)
  const consentValid = consent.noshow && consent.privacy

  if (soldOut) {
    return (
      <div className="card">
        <div className="notice danger">
          <strong>{t('err.soldout.t')}</strong>
          <div style={{ marginTop: 4 }}>{t('err.soldout.d')}</div>
        </div>
        <button className="btn primary block" onClick={restart}>
          {t('err.soldout.restart')}
        </button>
      </div>
    )
  }

  return (
    <div>
      <Stepper steps={stepLabels} current={stageIndex} />

      {stage === 'branch' && <StepBranch selectedId={draft.branchId} onSelect={selectBranch} />}

      {stage === 'apply' && (
        <StepApply
          branch={branch}
          draft={draft}
          set={set}
          limit={limit}
          amountCheck={amountCheck}
          rate={rate}
          krw={krw}
          range={range}
          onBack={() => setStage('branch')}
          onApply={submitApply}
          canApply={applyValid}
        />
      )}

      {stage === 'info' && (
        <div className="card">
          <StepInfo draft={draft} set={set} />
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setStage('apply')}>
              {t('common.prev')}
            </button>
            <button className="btn primary" onClick={goReview} disabled={!infoValid}>
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {stage === 'review' && (
        <div className="card">
          <StepReview draft={draft} branch={branch} rate={rate} krw={krw} />
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setStage('info')}>
              {t('common.prev')}
            </button>
            <button className="btn primary" onClick={fixRateAndConsent}>
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {stage === 'consent' && (
        <div className="card">
          <StepConsent consent={consent} setConsent={setConsent} />
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setStage('review')}>
              {t('common.prev')}
            </button>
            <button className="btn primary" onClick={submit} disabled={!consentValid}>
              {t('site.nav.branch')}
            </button>
          </div>
        </div>
      )}

      {stage === 'done' && result && (
        <div className="card">
          <StepDone rec={result} onNew={restart} />
        </div>
      )}
    </div>
  )
}

/* ================= STEP A: 지점 선택 ================= */
function StepBranch({ selectedId, onSelect }) {
  const { t, lang } = useI18n()
  return (
    <div className="card">
      <h2>{t('stepA.title')}</h2>
      <div className="branch-split">
        <div className="branch-list">
          <div className="split-h tiny">{t('stepA.listTitle')}</div>
          {BRANCHES.map((b) => (
            <button
              key={b.id}
              className={`option ${selectedId === b.id ? 'selected' : ''}`}
              onClick={() => onSelect(b.id)}
            >
              <span className="opt-emoji">🏦</span>
              <span>
                <div className="opt-main">{b.name[lang]}</div>
                <div className="opt-sub">
                  <span className="dot-open">●</span> {t('stepA.open')} · {b.address[lang]}
                </div>
              </span>
              <span className="opt-right">{t('stepA.select')} ›</span>
            </button>
          ))}
        </div>
        <div className="branch-map">
          <div className="split-h tiny">{t('stepA.mapTitle')}</div>
          <BranchMap selectedId={selectedId} onSelect={onSelect} />
        </div>
      </div>
    </div>
  )
}

/* ================= STEP B: 지점 상세 + 신청 ================= */
function StepApply({ branch, draft, set, limit, amountCheck, rate, krw, range, onBack, onApply, canApply }) {
  const { t } = useI18n()
  if (!branch) return null
  return (
    <div>
      <button className="btn ghost" style={{ marginBottom: 12 }} onClick={onBack}>
        ‹ {t('wz.branch')}
      </button>
      <div className="detail-split">
        <BranchDetailLeft branch={branch} />
        <ApplyCard
          branch={branch}
          draft={draft}
          set={set}
          limit={limit}
          amountCheck={amountCheck}
          rate={rate}
          krw={krw}
          range={range}
          onApply={onApply}
          canApply={canApply}
        />
      </div>
    </div>
  )
}

function BranchDetailLeft({ branch }) {
  const { t, lang } = useI18n()
  const [rateTab, setRateTab] = useState('buy') // buy(외화 살 때) | sell(외화 팔 때)
  const [showAll, setShowAll] = useState(false)
  const [copied, setCopied] = useState(false)
  const currencies = branchCurrencies(branch.id)

  function copyPhone() {
    try {
      navigator.clipboard?.writeText(branch.phone)
    } catch (e) {
      /* ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const bankCompare = getBankCompare(currencies[0])

  return (
    <div className="detail-left">
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>{branch.name[lang]}</h2>
        <div className="tiny" style={{ marginBottom: 8 }}>
          ★ {branch.rating.toFixed(1)} · {branch.reviewCount}
          {t('stepB.reviews')}
        </div>
        <div className="notice success" style={{ margin: '0 0 12px' }}>
          {t('stepB.openUntil').replace('{time}', branch.hours.close)}
        </div>
        <div className="summary">
          <div className="row">
            <span className="k">{t('common.branch')}</span>
            <span className="v">{branch.address[lang]}</span>
          </div>
          <div className="row">
            <span className="k">☎</span>
            <span className="v" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {branch.phone}
              <button className="btn ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={copyPhone}>
                {copied ? t('stepB.copied') : t('stepB.copy')}
              </button>
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16 }}>
          {branch.name[lang]} {t('stepB.liveRate')}
        </h2>
        <div className="tabs" style={{ marginBottom: 12 }}>
          <button className={rateTab === 'buy' ? 'active' : ''} onClick={() => setRateTab('buy')}>
            {t('stepB.buyTab')}
          </button>
          <button className={rateTab === 'sell' ? 'active' : ''} onClick={() => setRateTab('sell')}>
            {t('stepB.sellTab')}
          </button>
        </div>
        <div className="rate-cards">
          {currencies.slice(0, 4).map((c) => {
            const dr = getDisplayRates(c)
            return (
              <div className="rate-card" key={c}>
                <div className="rc-cur">
                  {CURRENCY_META[c]?.flag} {c}
                </div>
                <div className="rc-rate">{formatNumber(rateTab === 'buy' ? dr.buy : dr.sell)}</div>
              </div>
            )
          })}
        </div>
        <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setShowAll(true)}>
          {t('stepB.allRates')}
        </button>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16 }}>{t('stepB.bankCompare')}</h2>
        <div className="rate-cards">
          {bankCompare.map((bk, i) => (
            <div className="rate-card bank" key={i}>
              <div className="rc-cur">{bk.name[lang]}</div>
              <div className="rc-rate">{formatNumber(bk.buy)}</div>
              <div className="tiny">
                {CURRENCY_META[currencies[0]]?.flag} {currencies[0]} · {t('stepB.bankBuy')}
              </div>
            </div>
          ))}
        </div>
        <div className="tiny" style={{ marginTop: 8 }}>
          {CURRENCY_META[currencies[0]]?.flag} {formatNumber(getDisplayRates(currencies[0]).buy)} ·{' '}
          {t('stepB.vsBank')}
        </div>
      </div>

      {showAll && (
        <Modal onClose={() => setShowAll(false)}>
          <h2>{t('stepB.allRatesTitle')}</h2>
          <table style={{ minWidth: 'auto', width: '100%' }}>
            <thead>
              <tr>
                <th>{t('common.currency')}</th>
                <th className="num">{t('stepB.buyTab')}</th>
                <th className="num">{t('stepB.sellTab')}</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((c) => {
                const dr = getDisplayRates(c)
                return (
                  <tr key={c}>
                    <td>
                      {CURRENCY_META[c]?.flag} {c}
                    </td>
                    <td className="num">{formatNumber(dr.buy)}</td>
                    <td className="num">{formatNumber(dr.sell)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <button className="btn ghost block" style={{ marginTop: 14 }} onClick={() => setShowAll(false)}>
            {t('common.close')}
          </button>
        </Modal>
      )}
    </div>
  )
}

function ApplyCard({ branch, draft, set, limit, amountCheck, rate, krw, range, onApply, canApply }) {
  const { t, lang } = useI18n()
  const currencies = branchCurrencies(branch.id)
  const slots = timeSlots(branch.hours)

  return (
    <div className="detail-right">
      <div className="card apply-card">
        <h2 style={{ fontSize: 16 }}>{t('stepB.applyCardTitle')}</h2>

        {/* 외화 구매 / 외화 판매 (= transactionType) */}
        <div className="pill-group" style={{ marginBottom: 16 }}>
          {[
            { tx: 'SELL', title: t('stepB.buyFx'), hint: t('stepB.buyFxHint') },
            { tx: 'BUY', title: t('stepB.sellFx'), hint: t('stepB.sellFxHint') },
          ].map((o) => (
            <button
              key={o.tx}
              className={`pill ${draft.transactionType === o.tx ? 'selected' : ''}`}
              onClick={() => set({ transactionType: o.tx })}
            >
              <div className="pill-t">{o.title}</div>
              <div className="pill-d">{o.hint}</div>
            </button>
          ))}
        </div>

        {/* 수령 날짜 및 시간 */}
        <div className="field">
          <span className="lbl">{t('stepB.dateTime')}</span>
          <div className="grid-2">
            <input
              type="date"
              value={draft.pickupDate}
              min={range?.minDate}
              max={range?.maxDate}
              onChange={(e) => set({ pickupDate: e.target.value })}
            />
            <select value={draft.pickupTime} onChange={(e) => set({ pickupTime: e.target.value })}>
              <option value="">{t('stepB.time')}</option>
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {range && (
            <div className="tiny" style={{ marginTop: 6 }}>
              {formatDate(range.minDate, lang)} ~ {formatDate(range.maxDate, lang)}
            </div>
          )}
        </div>

        {/* 환전 금액 */}
        <div className="field">
          <span className="lbl">{t('stepB.amountTitle')}</span>
          <div className="amount-row">
            <select
              className="cur-select"
              value={draft.currency}
              onChange={(e) => set({ currency: e.target.value })}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_META[c]?.flag} {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="numeric"
              value={draft.amount}
              onChange={(e) => set({ amount: e.target.value })}
              placeholder="0"
            />
          </div>
          {limit && (
            <div className="tiny" style={{ marginTop: 6 }}>
              {t('stepB.maxHint')}: {formatNumber(limit.max)} {draft.currency}
              {limit.unitStep ? ` · ${t('stepB.unitHint')}: ${formatNumber(limit.unitStep)} ${draft.currency}` : ''}
            </div>
          )}
          {!amountCheck.ok && draft.amount !== '' && (
            <div className="err-text">{t(`err.amount.${amountCheck.code}`)}</div>
          )}
        </div>

        {/* 환산 원화 (참고용) */}
        <div className="convert-box">
          <div className="cv-top">
            {draft.amount ? formatForeign(Number(draft.amount), draft.currency) : `0 ${draft.currency}`}
          </div>
          <div className="cv-arrow">↓</div>
          <div className="cv-krw">{formatKrw(krw)}</div>
        </div>
        <div className="tiny" style={{ margin: '8px 0 4px' }}>
          {t('common.rate')} 1 {draft.currency} = {formatNumber(rate)} KRW
        </div>

        <button className="btn primary block" style={{ marginTop: 10 }} onClick={onApply} disabled={!canApply}>
          {t('stepB.apply')}
        </button>
        <div className="tiny" style={{ marginTop: 8 }}>
          {t('stepB.rateNote')}
        </div>
      </div>
    </div>
  )
}

/* ================= STEP 5: 예약자 정보 ================= */
function StepInfo({ draft, set }) {
  const { t } = useI18n()
  const nameOk = draft.customerName === '' || isValidName(draft.customerName)
  const emailOk = draft.email === '' || isValidEmail(draft.email)
  return (
    <div>
      <h2>{t('book.step5.title')}</h2>
      <label className="field">
        <span className="lbl">{t('common.name')}</span>
        <input
          type="text"
          value={draft.customerName}
          onChange={(e) => set({ customerName: e.target.value })}
          placeholder="HONG GILDONG"
          autoFocus
        />
        <div className="tiny" style={{ marginTop: 6 }}>
          {t('book.step5.namehint')}
        </div>
        {!nameOk && <div className="err-text">{t('err.name')}</div>}
      </label>
      <label className="field">
        <span className="lbl">{t('common.email')}</span>
        <input
          type="email"
          value={draft.email}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="you@example.com"
        />
        {!emailOk && <div className="err-text">{t('err.email')}</div>}
      </label>
    </div>
  )
}

/* ================= STEP 6: 최종 확인 ================= */
function StepReview({ draft, branch, rate, krw }) {
  const { t, lang } = useI18n()
  return (
    <div>
      <h2>{t('book.step6.title')}</h2>
      <div className="summary">
        <div className="row">
          <span className="k">{t('common.branch')}</span>
          <span className="v">{branch?.name[lang]}</span>
        </div>
        <div className="row">
          <span className="k">{t('common.txType')}</span>
          <span className="v">{t(`tx.${draft.transactionType}`)}</span>
        </div>
        <div className="row">
          <span className="k">{t('common.currency')}</span>
          <span className="v">
            {CURRENCY_META[draft.currency]?.flag} {draft.currency}
          </span>
        </div>
        <div className="row">
          <span className="k">{t('common.foreignAmount')}</span>
          <span className="v">{formatForeign(Number(draft.amount), draft.currency)}</span>
        </div>
        <div className="row">
          <span className="k">
            {t('common.rate')} <span className="tiny">({t('book.step6.ratefixed')})</span>
          </span>
          <span className="v">
            1 {draft.currency} = {formatNumber(rate)} KRW
          </span>
        </div>
        <div className="row">
          <span className="k">{t('stepB.dateTime')}</span>
          <span className="v">{formatDateTime(draft.pickupDate, draft.pickupTime, lang)}</span>
        </div>
        <div className="row total">
          <span className="k">{t('common.krwAmount')}</span>
          <span className="v">{formatKrw(krw)}</span>
        </div>
      </div>
      <div className="notice info" style={{ marginTop: 12 }}>
        {t('review.ratefixed.note')}
      </div>
    </div>
  )
}

/* ================= STEP 7: 정책 동의 ================= */
function StepConsent({ consent, setConsent }) {
  const { t } = useI18n()
  const allChecked = consent.noshow && consent.privacy
  const toggleAll = () => {
    const next = !allChecked
    setConsent({ noshow: next, privacy: next })
  }
  return (
    <div>
      <h2>{t('book.step7.title')}</h2>
      <div className="check-row check-all">
        <input type="checkbox" checked={allChecked} onChange={toggleAll} />
        <div>
          <div className="ct">{t('book.step7.agreeAll')}</div>
        </div>
      </div>
      <div className="check-row">
        <input
          type="checkbox"
          checked={consent.noshow}
          onChange={(e) => setConsent((c) => ({ ...c, noshow: e.target.checked }))}
        />
        <div>
          <div className="ct">{t('book.step7.noshow.t')}</div>
          <div className="cd">{t('book.step7.noshow.d')}</div>
        </div>
      </div>
      <div className="check-row">
        <input
          type="checkbox"
          checked={consent.privacy}
          onChange={(e) => setConsent((c) => ({ ...c, privacy: e.target.checked }))}
        />
        <div>
          <div className="ct">{t('book.step7.privacy.t')}</div>
          <div className="cd">{t('book.step7.privacy.d')}</div>
        </div>
      </div>
    </div>
  )
}

/* ================= STEP 8: 완료 ================= */
function StepDone({ rec, onNew }) {
  const { t, lang } = useI18n()
  const nav = useNavigate()
  return (
    <div>
      <div style={{ textAlign: 'center', fontSize: 44 }}>🎉</div>
      <h2 style={{ textAlign: 'center' }}>{t('book.step8.title')}</h2>
      <p className="muted" style={{ textAlign: 'center' }}>
        {t('book.step8.sub')}
      </p>
      <div className="result-code">{rec.reservationNo}</div>
      <div className="summary" style={{ marginTop: 12 }}>
        <div className="row">
          <span className="k">{t('stepB.dateTime')}</span>
          <span className="v">{formatDateTime(rec.pickupDate, rec.pickupTime, lang)}</span>
        </div>
        <div className="row total">
          <span className="k">{t('common.krwAmount')}</span>
          <span className="v">{formatKrw(rec.krwAmount)}</span>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn ghost" onClick={onNew}>
          {t('book.step8.newBooking')}
        </button>
        <button
          className="btn primary"
          onClick={() => nav(`/site/lookup?no=${rec.reservationNo}&email=${encodeURIComponent(rec.email)}`)}
        >
          {t('book.step8.gotoLookup')}
        </button>
      </div>
    </div>
  )
}
