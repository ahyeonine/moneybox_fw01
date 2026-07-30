import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useReservations } from '../../store/ReservationContext.jsx'
import Stepper from '../../components/Stepper.jsx'
import { BRANCHES, getBranch, branchCurrencies, currencyLimit } from '../../data/branches.js'
import { CURRENCY_META, getRate, toKrw } from '../../data/rates.js'
import { validateAmount, isValidEmail, isValidName } from '../../lib/validation.js'
import { pickupRange } from '../../lib/date.js'
import { formatKrw, formatForeign, formatNumber, formatDate } from '../../lib/format.js'

// 재고 소진 시뮬레이션 (데모용, 결정성 유지):
// 인천공항 T1점(B003) + 베트남 동(VND) 조합은 재고 소진으로 처리해 예외 플로우를 시연한다.
// TODO: 실제 재고 API 연동으로 교체
function isSoldOut(branchId, currency) {
  return branchId === 'B003' && currency === 'VND'
}

const emptyDraft = {
  branchId: '',
  transactionType: 'SELL', // SELL(매출) | BUY(매입)
  currency: '',
  amount: '',
  pickupDate: '',
  customerName: '',
  email: '',
  rate: null,
}

export default function BookingFlow() {
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const { today, createReservation } = useReservations()

  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState(emptyDraft)
  const [soldOut, setSoldOut] = useState(false)
  const [consent, setConsent] = useState({ noshow: false, privacy: false })
  const [result, setResult] = useState(null) // 완료된 예약 레코드

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const branch = getBranch(draft.branchId)
  const limit = draft.branchId && draft.currency ? currencyLimit(draft.branchId, draft.currency) : null
  const amountCheck = validateAmount(draft.amount, limit)
  const rate = draft.currency ? getRate(draft.currency) : null
  const krw = amountCheck.ok ? toKrw(Number(draft.amount), rate) : 0

  const range = useMemo(
    () => (branch ? pickupRange(today, branch.leadTimeDays, 30) : null),
    [branch, today]
  )

  function goNext() {
    // 재고 소진 체크 (통화 선택 직후)
    if (step === 2 && isSoldOut(draft.branchId, draft.currency)) {
      setSoldOut(true)
      return
    }
    if (step === 6) {
      // 최종 확인 → 환율 픽스
      set({ rate })
    }
    setStep((s) => Math.min(8, s + 1))
  }
  function goPrev() {
    setStep((s) => Math.max(1, s - 1))
  }

  function restart() {
    setDraft(emptyDraft)
    setConsent({ noshow: false, privacy: false })
    setSoldOut(false)
    setResult(null)
    setStep(1)
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
    })
    setResult(rec)
    setStep(8)
  }

  // 각 단계의 "다음" 활성화 조건
  const canNext = {
    1: !!draft.branchId,
    2: !!draft.currency,
    3: amountCheck.ok,
    4: !!draft.pickupDate,
    5: isValidName(draft.customerName) && isValidEmail(draft.email),
    6: true,
    7: consent.noshow && consent.privacy,
  }[step]

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
      <Stepper current={step} />

      <div className="card">
        {step === 1 && <Step1 draft={draft} set={set} />}
        {step === 2 && <Step2 draft={draft} set={set} />}
        {step === 3 && (
          <Step3 draft={draft} set={set} limit={limit} amountCheck={amountCheck} krw={krw} rate={rate} />
        )}
        {step === 4 && <Step4 draft={draft} set={set} range={range} branch={branch} />}
        {step === 5 && <Step5 draft={draft} set={set} />}
        {step === 6 && <Step6 draft={draft} branch={branch} rate={rate} krw={krw} />}
        {step === 7 && <Step7 consent={consent} setConsent={setConsent} />}
        {step === 8 && result && <Step8 rec={result} onNew={restart} />}

        {step < 7 && (
          <div className="btn-row">
            {step > 1 && (
              <button className="btn ghost" onClick={goPrev}>
                {t('common.prev')}
              </button>
            )}
            <button className="btn primary" onClick={goNext} disabled={!canNext}>
              {t('common.next')}
            </button>
          </div>
        )}

        {step === 7 && (
          <div className="btn-row">
            <button className="btn ghost" onClick={goPrev}>
              {t('common.prev')}
            </button>
            <button className="btn primary" onClick={submit} disabled={!canNext}>
              {t('nav.book')}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ---- helper display for currency label ----
}

function curLabel(currency, lang) {
  const m = CURRENCY_META[currency]
  return m ? `${m.flag} ${currency} · ${m.label[lang]}` : currency
}

/* ---------------- Step 1: 지점 ---------------- */
function Step1({ draft, set }) {
  const { t, lang } = useI18n()
  return (
    <div>
      <h2>{t('book.step1.title')}</h2>
      {BRANCHES.map((b) => (
        <button
          key={b.id}
          className={`option ${draft.branchId === b.id ? 'selected' : ''}`}
          onClick={() => set({ branchId: b.id, currency: '' })}
        >
          <span className="opt-emoji">🏦</span>
          <span>
            <div className="opt-main">{b.name[lang]}</div>
            <div className="opt-sub">{b.address[lang]}</div>
          </span>
          <span className="opt-right">
            {Object.keys(b.currencyLimits).join(' · ')}
            <br />
            Lead {b.leadTimeDays}d
          </span>
        </button>
      ))}
    </div>
  )
}

/* ---------------- Step 2: 환전구분 + 통화 ---------------- */
function Step2({ draft, set }) {
  const { t, lang } = useI18n()
  const currencies = branchCurrencies(draft.branchId)
  return (
    <div>
      <h2>{t('book.step2.title')}</h2>

      <div className="field">
        <span className="lbl">{t('book.step2.txlabel')}</span>
        <div className="pill-group">
          {['SELL', 'BUY'].map((tx) => (
            <button
              key={tx}
              className={`pill ${draft.transactionType === tx ? 'selected' : ''}`}
              onClick={() => set({ transactionType: tx })}
            >
              <div className="pill-t">{t(`tx.${tx}.short`)}</div>
              <div className="pill-d">{t(`tx.${tx}`)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="lbl">{t('book.step2.currencylabel')}</span>
        {currencies.length === 0 && <div className="notice warn">{t('book.step2.noCurrency')}</div>}
        {currencies.map((c) => (
          <button
            key={c}
            className={`option ${draft.currency === c ? 'selected' : ''}`}
            onClick={() => set({ currency: c })}
          >
            <span className="opt-emoji">{CURRENCY_META[c]?.flag}</span>
            <span>
              <div className="opt-main">{c}</div>
              <div className="opt-sub">{CURRENCY_META[c]?.label[lang]}</div>
            </span>
            <span className="opt-right">{formatNumber(getRate(c))} KRW</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Step 3: 금액 ---------------- */
function Step3({ draft, set, limit, amountCheck, krw, rate }) {
  const { t } = useI18n()
  return (
    <div>
      <h2>{t('book.step3.title')}</h2>
      <label className="field">
        <span className="lbl">
          {t('common.foreignAmount')} ({draft.currency})
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={draft.amount}
          onChange={(e) => set({ amount: e.target.value })}
          placeholder="0"
          autoFocus
        />
        {limit && (
          <div className="tiny" style={{ marginTop: 6 }}>
            {t('book.step3.limit')}: {formatNumber(limit.min)} ~ {formatNumber(limit.max)} {draft.currency}
          </div>
        )}
        {!amountCheck.ok && draft.amount !== '' && (
          <div className="err-text">{t(`err.amount.${amountCheck.code}`)}</div>
        )}
      </label>

      {amountCheck.ok && (
        <div className="notice info">
          {t('book.step3.est')}: <strong>{formatKrw(krw)}</strong>
          <div className="tiny" style={{ marginTop: 2 }}>
            {t('common.rate')} 1 {draft.currency} = {formatNumber(rate)} KRW
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Step 4: 수령일 ---------------- */
function Step4({ draft, set, range, branch }) {
  const { t, lang } = useI18n()
  return (
    <div>
      <h2>{t('book.step4.title')}</h2>
      <div className="notice info">
        {t('book.step4.help')}
        {branch && (
          <div className="tiny" style={{ marginTop: 4 }}>
            {t('common.branch')}: {branch.name[lang]} · Lead time {branch.leadTimeDays} day(s)
          </div>
        )}
      </div>
      <label className="field">
        <span className="lbl">{t('common.pickupDate')}</span>
        <input
          type="date"
          value={draft.pickupDate}
          min={range?.minDate}
          max={range?.maxDate}
          onChange={(e) => set({ pickupDate: e.target.value })}
        />
        {range && (
          <div className="tiny" style={{ marginTop: 6 }}>
            {formatDate(range.minDate, lang)} ~ {formatDate(range.maxDate, lang)}
          </div>
        )}
      </label>
    </div>
  )
}

/* ---------------- Step 5: 예약자 정보 ---------------- */
function Step5({ draft, set }) {
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

/* ---------------- Step 6: 최종 확인 ---------------- */
function Step6({ draft, branch, rate, krw }) {
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
          <span className="v">{curLabel(draft.currency, lang)}</span>
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
          <span className="k">{t('common.pickupDate')}</span>
          <span className="v">{formatDate(draft.pickupDate, lang)}</span>
        </div>
        <div className="row total">
          <span className="k">{t('common.krwAmount')}</span>
          <span className="v">{formatKrw(krw)}</span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Step 7: 정책 동의 ---------------- */
function Step7({ consent, setConsent }) {
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

/* ---------------- Step 8: 완료 ---------------- */
function Step8({ rec, onNew }) {
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
          <span className="k">{t('common.pickupDate')}</span>
          <span className="v">{formatDate(rec.pickupDate, lang)}</span>
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
          onClick={() => nav(`/lookup?no=${rec.reservationNo}&email=${encodeURIComponent(rec.email)}`)}
        >
          {t('book.step8.gotoLookup')}
        </button>
      </div>
    </div>
  )
}
