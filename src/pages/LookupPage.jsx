import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { getBranch, branchCurrencies, BRANCHES } from '../data/branches.js'
import { CURRENCY_META, toKrw } from '../data/rates.js'
import { useRates } from '../store/RatesContext.jsx'
import { useEmail } from '../store/EmailContext.jsx'
import { usePolicy } from '../store/PolicyContext.jsx'
import { pickupRange } from '../lib/date.js'
import { formatKrw, formatForeign, formatDate, formatNumber } from '../lib/format.js'
import { StatusBadge } from '../components/Badges.jsx'
import Modal from '../components/Modal.jsx'
import DevNote from '../components/DevNote.jsx'

export default function LookupPage({ ctx } = {}) {
  const { t } = useI18n()
  const { findReservationsForLookup, findReservationsByNameEmail, findReservationsByEmail, getByNo, cancelReservation, updateReservation, confirmVisit, today } =
    useReservations()
  const { sendEmail } = useEmail()
  const [params] = useSearchParams()

  // 조회 방식: 회원(이메일+비밀번호) / 비회원(예약번호+이메일)
  const [mode, setMode] = useState('guest')
  const [form, setForm] = useState({
    resNo: params.get('no') || '',
    name: params.get('name') || '',
    email: params.get('email') || '',
    password: '',
  })
  const [searched, setSearched] = useState(false)
  const [autoLoggedIn, setAutoLoggedIn] = useState(false) // 이메일 링크로 진입한 회원 자동 로그인
  const [results, setResults] = useState([]) // 조회 결과 리스트 (같은 이름+이메일 다건)
  const [detailNo, setDetailNo] = useState(null) // 상세 보기 대상 예약번호
  const [showCancel, setShowCancel] = useState(false)
  const [editing, setEditing] = useState(false)
  const [flash, setFlash] = useState(null)

  function applyResults(list, autoSelectNo) {
    setResults(list)
    setSearched(true)
    setEditing(false)
    setFlash(null)
    const hit =
      autoSelectNo && list.find((r) => r.reservationNo.toUpperCase() === autoSelectNo.toUpperCase())
    setDetailNo(hit ? hit.reservationNo : null)
  }

  // 비회원: 여권 영문명 + 이메일
  function runSearch(name, email, autoSelectNo) {
    applyResults(findReservationsByNameEmail(name, email), autoSelectNo)
  }

  function doSearch(e) {
    e?.preventDefault()
    if (mode === 'member') {
      // 회원: 이메일 + 비밀번호(프로토타입 — 비밀번호는 확인만, 실제 계정 미연동)
      applyResults(findReservationsByEmail(form.email), null)
    } else {
      // 비회원: 예약번호 + 이메일
      applyResults(findReservationsForLookup(form.resNo, form.email), form.resNo)
    }
  }

  const searchDisabled =
    mode === 'member' ? !form.email || !form.password : !form.resNo || !form.email

  // 진입 컨텍스트/딥링크(예약완료·이메일 → 예약확인):
  //  - 회원: 이메일 자동 로그인 → 예약 목록에서 선택
  //  - 비회원: 예약번호+이메일 → 해당 예약 자동 선택
  useEffect(() => {
    // 인앱 컨텍스트(ctx) 우선
    if (ctx?.autoLogin && ctx.email) {
      setMode('member'); setForm((f) => ({ ...f, email: ctx.email })); setAutoLoggedIn(true)
      applyResults(findReservationsByEmail(ctx.email), null)
      return
    }
    if (ctx?.no && ctx.email) {
      setMode('guest'); setForm((f) => ({ ...f, resNo: ctx.no, email: ctx.email }))
      applyResults(findReservationsForLookup(ctx.no, ctx.email), ctx.no)
      return
    }
    // URL 딥링크 폴백 (이메일 링크)
    const no = params.get('no')
    const name = params.get('name')
    const email = params.get('email')
    const login = params.get('login')
    if (login === '1' && email) {
      setMode('member'); setForm((f) => ({ ...f, email })); setAutoLoggedIn(true)
      applyResults(findReservationsByEmail(email), null)
    } else if (no && email) applyResults(findReservationsForLookup(no, email), no)
    else if (name && email) runSearch(name, email, null)
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
          '조회 방식: 회원=이메일+비밀번호 / 비회원=예약번호+이메일 (같은 이메일의 신청내역 전체 조회)',
          '프로토타입: 회원 비밀번호는 확인만(실계정 미연동), 조회는 이메일 일치로 처리',
          '"예약" 상태일 때만 취소/변경 가능',
          '가용시재 차감(예약시재 반영)은 예약완료가 아니라 "방문 예정 확인" 시점에 발생 — 이 시점에 재고 재확인(동시성)',
          '자세히: 03_플로우.mermaid',
        ]}
      />
      <h1>{t('lookup.title')}</h1>
      <p className="muted">{t('lookup.sub')}</p>

      {autoLoggedIn && (
        <div className="lookup-login-banner">
          <span className="lli-dot" aria-hidden="true" />
          {t('lookup.autologin').replace('{name}', results[0]?.customerName || form.email)}
        </div>
      )}

      {!autoLoggedIn && (
      <form className="card" onSubmit={doSearch}>
        {/* 조회 방식 토글 */}
        <div className="lookup-mode" role="group" aria-label={t('lookup.mode.label')}>
          <button
            type="button"
            className={`lookup-mode-btn${mode === 'member' ? ' on' : ''}`}
            onClick={() => { setMode('member'); setSearched(false) }}
          >
            {t('lookup.mode.member')}
          </button>
          <button
            type="button"
            className={`lookup-mode-btn${mode === 'guest' ? ' on' : ''}`}
            onClick={() => { setMode('guest'); setSearched(false) }}
          >
            {t('lookup.mode.guest')}
          </button>
        </div>

        {mode === 'guest' && (
          <label className="field">
            <span className="lbl">{t('lookup.resno')}</span>
            <input
              type="text"
              value={form.resNo}
              onChange={(e) => setForm((f) => ({ ...f, resNo: e.target.value }))}
              placeholder="RSV-20260728-0001"
            />
          </label>
        )}

        <label className="field">
          <span className="lbl">{t('common.email')}</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
          />
        </label>

        {mode === 'member' && (
          <label className="field">
            <span className="lbl">{t('lookup.password')}</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={t('s2v.signup.pw.ph')}
            />
          </label>
        )}

        <button className="btn primary block" type="submit" disabled={searchDisabled}>
          {t('common.search')}
        </button>
        <div className="tiny" style={{ marginTop: 10 }}>
          {mode === 'member' ? t('lookup.member.hint') : t('lookup.guest.hint')}
        </div>
      </form>
      )}

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
          today={today}
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

// 두 날짜(YYYY-MM-DD) 사이 일수 차 (b - a).
function daysBetween(a, b) {
  if (!a || !b) return NaN
  const d1 = new Date(`${a}T00:00:00`)
  const d2 = new Date(`${b}T00:00:00`)
  return Math.round((d2 - d1) / 86400000)
}

function Detail({ rec, today, onBack, onCancel, onConfirmVisit, onEdit }) {
  const { t, lang } = useI18n()
  const branch = getBranch(rec.branchId)
  const editable = rec.status === 'BOOKED'
  const confirmed = rec.reminderStatus === 'CONFIRMED'
  // 수령 전날(D-1)~당일: 방문 확정 창. 이 기간에는 [방문 확정]+[예약 취소], 그 이전엔 [예약 변경]+[예약 취소].
  const daysUntil = daysBetween(today, rec.pickupDate)
  const inConfirmWindow = daysUntil === 0 || daysUntil === 1
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
          <span className="v">{t('s2v.sum.rate.board')}</span>
        </div>
        <div className="row">
          <span className="k">{t('common.pickupDate')}</span>
          <span className="v">{formatDate(rec.pickupDate, lang)}</span>
        </div>
      </div>

      {editable && (
        <>
          {confirmed ? (
            /* 이미 방문 예정 확인됨 — 안내 + 예약 취소 */
            <>
              <div className="notice success" style={{ marginTop: 16 }}>
                {t('lookup.visitConfirmedNote')}
              </div>
              <div className="btn-row">
                <button className="btn danger block" onClick={onCancel}>
                  {t('lookup.cancelBtn')}
                </button>
              </div>
            </>
          ) : inConfirmWindow ? (
            /* 수령 전날/당일 — 방문 확정 + 예약 취소 (변경은 불가) */
            <>
              <div className="notice info" style={{ marginTop: 16 }}>
                {t('lookup.confirmWindow.note')}
              </div>
              <div className="btn-row">
                <button className="btn success" onClick={onConfirmVisit}>
                  {t('lookup.confirmVisit')}
                </button>
                <button className="btn danger" onClick={onCancel}>
                  {t('lookup.cancelBtn')}
                </button>
              </div>
            </>
          ) : (
            /* 그 이전 — 예약 변경 + 예약 취소 */
            <div className="btn-row">
              <button className="btn ghost" onClick={onEdit}>
                {t('lookup.changeBtn')}
              </button>
              <button className="btn danger" onClick={onCancel}>
                {t('lookup.cancelBtn')}
              </button>
            </div>
          )}
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
  const { maxWindowDays } = usePolicy() // 본사 설정 예약 가능 기간
  const [branchId, setBranchId] = useState(rec.branchId)
  const [currency, setCurrency] = useState(rec.currency)
  const [amount, setAmount] = useState(String(rec.foreignAmount))
  const [pickupDate, setPickupDate] = useState(rec.pickupDate)

  const currencies = branchCurrencies(branchId)
  // 지점 변경 시 통화가 취급목록에 없으면 첫 통화로 보정
  const effectiveCurrency = currencies.includes(currency) ? currency : currencies[0]
  const amountValid = Number(amount) > 0
  const branch = getBranch(branchId)
  const range = pickupRange(today, branch.leadTimeDays, maxWindowDays)
  const rate = getRate(effectiveCurrency)
  const krw = amountValid ? toKrw(Number(amount), rate) : 0

  // 재고 재확인(목데이터): 항상 가능하다고 간주. TODO: 실제 재고 API
  // 상한(range.maxDate)이 null이면 기간 제한 없음(무제한) → 하한만 확인
  const dateOk =
    pickupDate >= range.minDate && (range.maxDate == null || pickupDate <= range.maxDate)
  const canSave = amountValid && dateOk && effectiveCurrency

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
        {!amountValid && <div className="err-text">{t('err.amount.required')}</div>}
      </label>

      <label className="field">
        <span className="lbl">{t('common.pickupDate')}</span>
        <input
          type="date"
          value={pickupDate}
          min={range.minDate}
          max={range.maxDate || undefined}
          onChange={(e) => setPickupDate(e.target.value)}
        />
      </label>

      {amountValid && (
        <div className="notice info">
          {t('s2v.sum.rate.board')} · {t('s2v.rate.disclaimer')}
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
