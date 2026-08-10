import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { getBranch, branchCurrencies, currencyLimit, BRANCHES } from '../data/branches.js'
import { CURRENCY_META, toKrw } from '../data/rates.js'
import { useRates } from '../store/RatesContext.jsx'
import { useEmail } from '../store/EmailContext.jsx'
import { validateAmount } from '../lib/validation.js'
import { pickupRange } from '../lib/date.js'
import { formatKrw, formatForeign, formatDate, formatNumber } from '../lib/format.js'
import { StatusBadge } from '../components/Badges.jsx'
import Modal from '../components/Modal.jsx'
import DevNote from '../components/DevNote.jsx'

export default function LookupPage() {
  const { t } = useI18n()
  const { findReservationsForLookup, getByNo, cancelReservation, updateReservation, confirmVisit, today } =
    useReservations()
  const { sendEmail } = useEmail()
  const [params] = useSearchParams()

  const [form, setForm] = useState({ no: params.get('no') || '', email: params.get('email') || '' })
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([]) // 조회 결과 리스트 (같은 이메일 다건)
  const [detailNo, setDetailNo] = useState(null) // 상세 보기 대상 예약번호
  const [showCancel, setShowCancel] = useState(false)
  const [editing, setEditing] = useState(false)
  const [flash, setFlash] = useState(null)

  function runSearch(no, email, autoSelectNo) {
    const list = findReservationsForLookup(no, email)
    setResults(list)
    setSearched(true)
    setEditing(false)
    setFlash(null)
    const hit =
      autoSelectNo && list.find((r) => r.reservationNo.toUpperCase() === autoSelectNo.toUpperCase())
    setDetailNo(hit ? hit.reservationNo : null)
  }

  function doSearch(e) {
    e?.preventDefault()
    runSearch(form.no, form.email, null)
  }

  // 딥링크(예약완료 → 조회): 자동 조회 후 해당 예약 상세로 바로 진입
  useEffect(() => {
    const no = params.get('no')
    const email = params.get('email')
    if (no && email) runSearch(no, email, no)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 상세 대상 (항상 store 최신 반영)
  const detailRec = detailNo ? getByNo(detailNo) : null

  function backToList() {
    setDetailNo(null)
    setEditing(false)
    setFlash(null)
  }

  function onCancel() {
    const rec = getByNo(detailNo)
    cancelReservation(detailNo)
    setShowCancel(false)
    setFlash({ type: 'success', msg: t('lookup.cancelled.msg') })
    // 고객 취소 완료 이메일 발송
    if (rec) sendEmail('customerCancel', rec.email, { name: rec.customerName, reservationNo: rec.reservationNo })
  }

  function onSaved(patch) {
    updateReservation(detailNo, patch)
    setEditing(false)
    setFlash({ type: 'success', msg: t('lookup.change.saved') })
  }

  // 리마인더 "방문 예정" 확인 → 이 시점에 가용시재 재확인·차감(동시성). 재고 없으면 안내.
  function onConfirmVisit() {
    const res = confirmVisit(detailNo)
    if (res.ok) {
      setFlash({ type: 'success', msg: t('lookup.visitConfirmed.msg') })
    } else if (res.reason === 'SOLD_OUT') {
      setFlash({ type: 'danger', msg: t('lookup.visitSoldOut.msg') })
    }
  }

  return (
    <div>
      <DevNote
        items={[
          '조회 조건: 예약번호 + 이메일 (전화번호 없음)',
          '"예약" 상태일 때만 취소/변경 가능',
          '가용시재 차감(예약시재 반영)은 예약완료가 아니라 "방문 예정 확인" 시점에 발생 — 이 시점에 재고 재확인(동시성)',
          '자세히: 03_예약플로우_화면정의서.md',
        ]}
      />
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
          demo: RSV-20260728-0001 / john@example.com (같은 이메일 3건) · RSV-20260724-0006 / akira@example.com
        </div>
      </form>

      {searched && results.length === 0 && (
        <div className="notice danger" style={{ marginTop: 14 }}>
          {t('lookup.notfound')}
        </div>
      )}

      {flash && (
        <div className={`notice ${flash.type}`} style={{ marginTop: 14 }}>
          {flash.msg}
        </div>
      )}

      {/* 리스트 (상세 미선택 시) */}
      {results.length > 0 && !detailNo && (
        <ResultList
          results={results}
          onSelect={(no) => {
            setDetailNo(no)
            setFlash(null)
          }}
        />
      )}

      {/* 상세 */}
      {detailRec && !editing && (
        <Detail
          rec={detailRec}
          onBack={backToList}
          onCancel={() => setShowCancel(true)}
          onConfirmVisit={onConfirmVisit}
          onEdit={() => {
            setEditing(true)
            setFlash(null)
          }}
        />
      )}

      {detailRec && editing && (
        <ChangeForm rec={detailRec} today={today} onSave={onSaved} onCancel={() => setEditing(false)} />
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

// 조회 결과 리스트 (예약번호 / 수령일 / 통화 / 상태) — 항목 클릭 시 상세로
function ResultList({ results, onSelect }) {
  const { t, lang } = useI18n()
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2>
        {t('lookup.listTitle')} <span className="tiny">({results.length})</span>
      </h2>
      <div className="lookup-list">
        {results.map((r) => (
          <button key={r.reservationNo} className="lookup-row" onClick={() => onSelect(r.reservationNo)}>
            <span className="lr-no">{r.reservationNo}</span>
            <span className="lr-date">{formatDate(r.pickupDate, lang)}</span>
            <span className="lr-cur">
              {CURRENCY_META[r.currency]?.flag} {r.currency}
            </span>
            <span className="lr-status">
              <StatusBadge status={r.status} />
            </span>
            <span className="lr-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Detail({ rec, onBack, onCancel, onConfirmVisit, onEdit }) {
  const { t, lang } = useI18n()
  const branch = getBranch(rec.branchId)
  const editable = rec.status === 'BOOKED'
  const confirmed = rec.reminderStatus === 'CONFIRMED'
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <button className="btn ghost" style={{ marginBottom: 12 }} onClick={onBack}>
        ‹ {t('lookup.backToList')}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{t('lookup.detail')}</h2>
        <StatusBadge status={rec.status} />
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

      {editable && (
        <>
          {/* 리마인더 방문 예정 확인 — 이 시점에 가용시재 반영(동시성) */}
          {confirmed ? (
            <div className="notice success" style={{ marginTop: 16 }}>
              ✔ {t('lookup.visitConfirmedNote')}
            </div>
          ) : (
            <button
              className="btn success block"
              style={{ marginTop: 16 }}
              onClick={onConfirmVisit}
            >
              {t('lookup.confirmVisit')}
            </button>
          )}
          <div className="btn-row">
            <button className="btn ghost" onClick={onEdit}>
              {t('lookup.changeBtn')}
            </button>
            <button className="btn danger" onClick={onCancel}>
              {t('lookup.cancelBtn')}
            </button>
          </div>
        </>
      )}
      {!editable && (
        <div className="notice info" style={{ marginTop: 16 }}>
          {t('lookup.onlyBookedEditable')}
        </div>
      )}
    </div>
  )
}

function ChangeForm({ rec, today, onSave, onCancel }) {
  const { t, lang } = useI18n()
  const { getRate } = useRates() // 변경 시에도 실시간 환율로 재계산
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
  const range = pickupRange(today, branch.leadTimeDays, 14)
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
