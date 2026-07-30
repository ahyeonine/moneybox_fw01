import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { getBranch, branchCurrencies, currencyLimit, BRANCHES } from '../data/branches.js'
import { CURRENCY_META, getRate, toKrw } from '../data/rates.js'
import { validateAmount } from '../lib/validation.js'
import { pickupRange } from '../lib/date.js'
import { formatKrw, formatForeign, formatDate, formatNumber } from '../lib/format.js'
import { StatusBadge, TxBadge } from '../components/Badges.jsx'
import Modal from '../components/Modal.jsx'

export default function LookupPage() {
  const { t, lang } = useI18n()
  const { findReservation, cancelReservation, updateReservation, today } = useReservations()
  const [params] = useSearchParams()

  const [form, setForm] = useState({ no: params.get('no') || '', email: params.get('email') || '' })
  const [searched, setSearched] = useState(false)
  const [record, setRecord] = useState(null)
  const [showCancel, setShowCancel] = useState(false)
  const [editing, setEditing] = useState(false)
  const [flash, setFlash] = useState(null)

  function doSearch(e) {
    e?.preventDefault()
    const r = findReservation(form.no, form.email)
    setRecord(r)
    setSearched(true)
    setEditing(false)
    setFlash(null)
  }

  // 딥링크(예약완료 → 조회) 자동 조회
  useEffect(() => {
    if (params.get('no') && params.get('email')) {
      const r = findReservation(params.get('no'), params.get('email'))
      setRecord(r)
      setSearched(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // record 를 항상 최신 상태로 (store 갱신 반영)
  const live = record ? findReservation(record.reservationNo, record.email) : null

  function onCancel() {
    cancelReservation(record.reservationNo)
    setShowCancel(false)
    setFlash({ type: 'success', msg: t('lookup.cancelled.msg') })
  }

  function onSaved(patch) {
    updateReservation(record.reservationNo, patch)
    setEditing(false)
    setFlash({ type: 'success', msg: t('lookup.change.saved') })
  }

  return (
    <div>
      <h1>{t('lookup.title')}</h1>
      <p className="muted">{t('lookup.sub')}</p>

      <form className="card" onSubmit={doSearch}>
        <label className="field">
          <span className="lbl">{t('common.reservationNo')}</span>
          <input
            type="text"
            value={form.no}
            onChange={(e) => setForm((f) => ({ ...f, no: e.target.value }))}
            placeholder="RSV-20260728-0001"
          />
        </label>
        <label className="field">
          <span className="lbl">{t('common.email')}</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
          />
        </label>
        <button className="btn primary block" type="submit" disabled={!form.no || !form.email}>
          {t('common.search')}
        </button>
        <div className="tiny" style={{ marginTop: 10 }}>
          demo: RSV-20260728-0001 / john@example.com · RSV-20260725-0005 / david@example.com
        </div>
      </form>

      {searched && !live && (
        <div className="notice danger" style={{ marginTop: 14 }}>
          {t('lookup.notfound')}
        </div>
      )}

      {flash && (
        <div className={`notice ${flash.type}`} style={{ marginTop: 14 }}>
          {flash.msg}
        </div>
      )}

      {live && !editing && (
        <Detail
          rec={live}
          onCancel={() => setShowCancel(true)}
          onEdit={() => {
            setEditing(true)
            setFlash(null)
          }}
        />
      )}

      {live && editing && (
        <ChangeForm rec={live} today={today} onSave={onSaved} onCancel={() => setEditing(false)} />
      )}

      {showCancel && (
        <Modal onClose={() => setShowCancel(false)}>
          <h2>{t('lookup.cancelConfirm.t')}</h2>
          <p className="muted">{t('lookup.cancelConfirm.d')}</p>
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setShowCancel(false)}>
              {t('common.close')}
            </button>
            <button className="btn danger" onClick={onCancel}>
              {t('lookup.cancelBtn')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Detail({ rec, onCancel, onEdit }) {
  const { t, lang } = useI18n()
  const branch = getBranch(rec.branchId)
  const editable = rec.status === 'BOOKED'
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{t('lookup.detail')}</h2>
        <StatusBadge status={rec.status} />
        <TxBadge type={rec.transactionType} />
      </div>
      <div className="summary">
        <div className="row">
          <span className="k">{t('common.reservationNo')}</span>
          <span className="v">{rec.reservationNo}</span>
        </div>
        <div className="row">
          <span className="k">{t('common.name')}</span>
          <span className="v">{rec.customerName}</span>
        </div>
        <div className="row">
          <span className="k">{t('common.branch')}</span>
          <span className="v">{branch?.name[lang]}</span>
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
        <div className="row">
          <span className="k">{t('common.pickupDate')}</span>
          <span className="v">{formatDate(rec.pickupDate, lang)}</span>
        </div>
        <div className="row total">
          <span className="k">{t('common.krwAmount')}</span>
          <span className="v">{formatKrw(rec.krwAmount)}</span>
        </div>
      </div>

      {editable ? (
        <div className="btn-row">
          <button className="btn ghost" onClick={onEdit}>
            {t('lookup.changeBtn')}
          </button>
          <button className="btn danger" onClick={onCancel}>
            {t('lookup.cancelBtn')}
          </button>
        </div>
      ) : (
        <div className="notice info" style={{ marginTop: 16 }}>
          {t('lookup.onlyBookedEditable')}
        </div>
      )}
    </div>
  )
}

function ChangeForm({ rec, today, onSave, onCancel }) {
  const { t, lang } = useI18n()
  const [branchId, setBranchId] = useState(rec.branchId)
  const [currency, setCurrency] = useState(rec.currency)
  const [amount, setAmount] = useState(String(rec.foreignAmount))
  const [pickupDate, setPickupDate] = useState(rec.pickupDate)

  const currencies = branchCurrencies(branchId)
  // 지점 변경 시 통화가 취급목록에 없으면 첫 통화로 보정
  const effectiveCurrency = currencies.includes(currency) ? currency : currencies[0]
  const limit = currencyLimit(branchId, effectiveCurrency)
  const amountCheck = validateAmount(amount, limit)
  const branch = getBranch(branchId)
  const range = pickupRange(today, branch.leadTimeDays, 30)
  const rate = getRate(effectiveCurrency)
  const krw = amountCheck.ok ? toKrw(Number(amount), rate) : 0

  // 재고 재확인(목데이터): 항상 가능하다고 간주. TODO: 실제 재고 API
  const dateOk = pickupDate >= range.minDate && pickupDate <= range.maxDate
  const canSave = amountCheck.ok && dateOk && effectiveCurrency

  function save() {
    onSave({
      branchId,
      currency: effectiveCurrency,
      foreignAmount: Number(amount),
      rate,
      krwAmount: toKrw(Number(amount), rate),
      pickupDate,
    })
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2>{t('lookup.change.title')}</h2>

      <label className="field">
        <span className="lbl">{t('common.branch')}</span>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          {BRANCHES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name[lang]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="lbl">{t('common.currency')}</span>
        <select value={effectiveCurrency} onChange={(e) => setCurrency(e.target.value)}>
          {currencies.map((c) => (
            <option key={c} value={c}>
              {CURRENCY_META[c]?.flag} {c} · {CURRENCY_META[c]?.label[lang]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="lbl">
          {t('common.foreignAmount')} ({effectiveCurrency})
        </span>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        {limit && (
          <div className="tiny" style={{ marginTop: 6 }}>
            {t('book.step3.limit')}: {formatNumber(limit.min)} ~ {formatNumber(limit.max)} {effectiveCurrency}
          </div>
        )}
        {!amountCheck.ok && <div className="err-text">{t(`err.amount.${amountCheck.code}`)}</div>}
      </label>

      <label className="field">
        <span className="lbl">{t('common.pickupDate')}</span>
        <input
          type="date"
          value={pickupDate}
          min={range.minDate}
          max={range.maxDate}
          onChange={(e) => setPickupDate(e.target.value)}
        />
      </label>

      {amountCheck.ok && (
        <div className="notice info">
          {t('common.krwAmount')}: <strong>{formatKrw(krw)}</strong> · 1 {effectiveCurrency} ={' '}
          {formatNumber(rate)} KRW
        </div>
      )}

      <div className="btn-row">
        <button className="btn ghost" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button className="btn primary" onClick={save} disabled={!canSave}>
          {t('common.save')}
        </button>
      </div>
    </div>
  )
}
