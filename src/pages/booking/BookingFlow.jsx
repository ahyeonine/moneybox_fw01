import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useReservations, NOSHOW_LIMIT } from '../../store/ReservationContext.jsx'
import { useSettings } from '../../store/SettingsContext.jsx'
import { useRates } from '../../store/RatesContext.jsx'
import { useEmail } from '../../store/EmailContext.jsx'
import Stepper from '../../components/Stepper.jsx'
import Modal from '../../components/Modal.jsx'
import BranchMap from '../../components/BranchMap.jsx'
import DevNote from '../../components/DevNote.jsx'

// 화면(스테이지)별 개발 참고 설명. (지점선택/최종확인 스테이지는 노트 없음)
const DEV_NOTES = {
  apply: [
    '통화별 최소금액 / 지점별 최대금액(하드리밋) 적용됨 — 초과입력 시 자동보정(단위 올림 → 최대초과시 최대로 → 최소미만시 최소로)',
    '"신청하기" 버튼 클릭 시점에 환율이 픽스됨',
    '수령일 선택 최대 범위: 리드타임 이후 ~ 2주 이내',
    '기존 외화구매/외화판매 두 개 탭이었으나, 현재는 원화구매만 남음 (외화구매 탭 제거됨)',
    '자세히: 03_예약플로우_화면정의서_해외환전예약서비스.md',
  ],
  info: [
    '필수 항목은 예약자명 + 이메일만. 메신저ID, 휴대전화, 생년월일 수집 안 함 (온라인 최소수집 원칙)',
    '이메일 OTP 인증 완료해야 다음 단계 진행 (데모: 인증번호를 배너로 표시, 5분 유효·30초 후 재발송·5회 오답 시 무효화)',
    '자세히: 04_데이터정의서_해외환전예약서비스.md',
  ],
  consent: [
    '클릭 시 펼쳐지는 약관 전문은 프로토타입용 더미 텍스트, 실제 법무 검토 문구 아님',
    '자세히: 03_예약플로우_화면정의서_해외환전예약서비스.md',
  ],
  done: [
    '예약 완료 즉시 상태값 "예약"으로 저장됨',
    '자세히: 03_예약플로우_화면정의서_해외환전예약서비스.md',
  ],
}
import { BRANCHES, getBranch, branchCurrencies, currencyLimit } from '../../data/branches.js'
import { CURRENCY_META, toKrw } from '../../data/rates.js'
import { validateAmount, isValidEmail, isValidName, correctAmount } from '../../lib/validation.js'
import { pickupRange, timeSlots } from '../../lib/date.js'
import { formatKrw, formatForeign, formatNumber, formatDate, formatDateTime } from '../../lib/format.js'

// 재고 소진 시뮬레이션 (데모용, 결정성 유지):
// 인천공항 T1점(B003) + 베트남 동(VND) 조합은 재고 소진으로 처리해 예외 플로우를 시연한다.
// TODO: 실제 재고 API 연동으로 교체
function isSoldOut(branchId, currency) {
  return branchId === 'B003' && currency === 'VND'
}

// 이메일 OTP 정책 (프로토타입 시뮬레이션 — 실제 발송 없음)
const OTP_TTL_MS = 5 * 60 * 1000 // 코드 유효시간 5분
const OTP_RESEND_COOLDOWN_MS = 30 * 1000 // 재발송 쿨다운 30초
const OTP_MAX_ATTEMPTS = 5 // 오답 5회 시 코드 무효화
function fmtMMSS(ms) {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// 진행 단계: 지점선택(A) + 환전신청(B) 이 기존 8단계의 1~4단계를 흡수 통합.
const STAGES = ['branch', 'apply', 'info', 'review', 'consent', 'done']

const emptyDraft = {
  branchId: '',
  // 외국인 웹사이트는 원화구매(=매입, BUY)로 고정. (데이터 모델은 매입/매출 둘 다 유지)
  transactionType: 'BUY',
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
  const { today, createReservation, countNoShow } = useReservations()
  // 한도(최소/최대)·통화 노출은 CEMS 공유 상태에서 읽는다. (관리자 변경이 즉시 반영)
  const { minAmounts, getBranchMax, isWebExcluded } = useSettings()
  // 환율은 공유 상태(2분마다 자동 변동 + 관리자 "외국인 웹사이트" 수동값)에서 읽는다.
  const { getRate, lastUpdated } = useRates()
  // 이메일 발송(시뮬레이션) — 인증번호/신청완료 등
  const { sendEmail } = useEmail()

  const [stage, setStage] = useState('branch')
  const [draft, setDraft] = useState(emptyDraft)
  const [soldOut, setSoldOut] = useState(false) // 재고 소진(신청 시점, 데모 규칙: B003+VND)
  const [consent, setConsent] = useState({ noshow: false, privacy: false })
  const [emailVerified, setEmailVerified] = useState(false) // 이메일 OTP 인증 완료 여부
  const [result, setResult] = useState(null)

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const branch = getBranch(draft.branchId)
  // 한도 조합: 최소=통화별 공통(minAmounts), 최대=지점별(branchMaxAmounts), 단위=지점 정적값(unitStep).
  // 관리자가 CEMS 한도관리에서 값을 바꾸면 공유 상태를 통해 즉시 이 검증에 반영된다.
  const limit = useMemo(() => {
    if (!draft.branchId || !draft.currency) return null
    const stat = currencyLimit(draft.branchId, draft.currency)
    if (!stat) return null
    return {
      min: minAmounts[draft.currency] ?? stat.min,
      max: getBranchMax(draft.branchId)?.[draft.currency] ?? stat.max,
      unitStep: stat.unitStep,
    }
  }, [draft.branchId, draft.currency, minAmounts, getBranchMax])
  const amountCheck = validateAmount(draft.amount, limit)
  const rate = draft.currency ? getRate(draft.currency) : null
  const krw = amountCheck.ok ? toKrw(Number(draft.amount), rate) : 0
  const range = useMemo(
    () => (branch ? pickupRange(today, branch.leadTimeDays, 14) : null),
    [branch, today]
  )

  // 관리자 "매입제외"로 현재 선택 통화가 제외되면, 노출 가능한 첫 통화로 자동 교체
  const availableCurrencies = useMemo(
    () => (branch ? branchCurrencies(branch.id).filter((c) => !isWebExcluded(c)) : []),
    [branch, isWebExcluded]
  )
  useEffect(() => {
    if (draft.branchId && draft.currency && isWebExcluded(draft.currency)) {
      set({ currency: availableCurrencies[0] || '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.currency, availableCurrencies])

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
      transactionType: 'BUY', // 원화구매 고정
      amount: '',
      pickupDate: '',
      pickupTime: '',
    }))
    setStage('apply')
  }

  // STEP B: 신청하기 → 금액 자동보정 → 재고 확인 후 예약자정보로
  function submitApply() {
    // 다음 단계로 넘어가는 시점에 금액 자동 보정(단위→최대→최소)
    const corrected = correctAmount(draft.amount, limit)
    if (corrected.changed) set({ amount: corrected.value })
    if (isSoldOut(draft.branchId, draft.currency)) {
      setSoldOut(true)
      return
    }
    // "신청하기" 클릭 시점에 환율을 픽스한다. 이후 화면(최종확인 등)은 이 값을 표시만 함.
    set({ rate })
    setStage('info')
  }

  function goReview() {
    setStage('review')
  }

  // 최종확인 → 동의: 환율은 이미 STEP B에서 픽스됨. 여기서는 단계 전환만.
  function goConsent() {
    setStage('consent')
  }

  function submit() {
    // 예약완료(8단계): 예약 레코드(상태="예약")만 생성한다. 이 시점에는 재고를 반영하지 않는다.
    // 가용시재 차감(예약시재 반영)은 이후 리마인더 "방문 예정" 확인 시점(예약조회 화면)에 발생.
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
    // 신청 완료 이메일 발송 (예약 정보 포함) — 기존 예약 흐름과 독립
    sendEmail('applied', rec.email, {
      name: rec.customerName,
      reservationNo: rec.reservationNo,
      branch: branch?.name?.ko || rec.branchId,
      pickupDate: rec.pickupDate,
      currency: rec.currency,
      amount: formatNumber(rec.foreignAmount),
      krw: formatKrw(rec.krwAmount),
    })
  }

  function restart() {
    setDraft(emptyDraft)
    setConsent({ noshow: false, privacy: false })
    setEmailVerified(false)
    setSoldOut(false)
    setResult(null)
    setStage('branch')
  }

  // 금액은 양수이기만 하면 진행 가능(범위/단위는 신청 시 자동보정으로 맞춤)
  const applyValid =
    !!draft.currency &&
    Number(draft.amount) > 0 &&
    !!draft.pickupDate &&
    !!draft.pickupTime &&
    draft.pickupDate >= (range?.minDate || '') &&
    draft.pickupDate <= (range?.maxDate || '9999-12-31')
  // 노쇼(자동취소) 누적 N회 이상 이메일은 신규예약 차단
  const noshowBlocked = isValidEmail(draft.email) && countNoShow(draft.email) >= NOSHOW_LIMIT
  const infoValid =
    isValidName(draft.customerName) && isValidEmail(draft.email) && !noshowBlocked && emailVerified
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
      <DevNote items={DEV_NOTES[stage]} />
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
          <StepInfo
            draft={draft}
            set={set}
            noshowBlocked={noshowBlocked}
            emailVerified={emailVerified}
            setEmailVerified={setEmailVerified}
          />
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setStage('apply')}>
              {t('common.prev')}
            </button>
            <button className="btn primary" onClick={goReview} disabled={!infoValid}>
              {t('common.next')}
            </button>
          </div>
          {isValidName(draft.customerName) && isValidEmail(draft.email) && !noshowBlocked && !emailVerified && (
            <div className="tiny" style={{ marginTop: 8, color: 'var(--warn)' }}>
              {t('book.otp.needVerify')}
            </div>
          )}
        </div>
      )}

      {stage === 'review' && (
        <div className="card">
          <StepReview draft={draft} branch={branch} rate={rate} krw={krw} />
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setStage('info')}>
              {t('common.prev')}
            </button>
            <button className="btn primary" onClick={goConsent}>
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
              {t('book.complete')}
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
  const { getDisplayRates, getBankCompare } = useRates()
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

function ApplyCard({ branch, draft, set, limit, rate, krw, range, onApply, canApply }) {
  const { t, lang } = useI18n()
  const { lastUpdated } = useRates()
  const { isWebExcluded } = useSettings()
  // 관리자 "매입제외" 통화는 선택 목록에서 제외
  const currencies = branchCurrencies(branch.id).filter((c) => !isWebExcluded(c))
  const slots = timeSlots(branch.hours)
  const updatedLabel = new Date(lastUpdated).toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US')

  // 금액 자동보정: 포커스 아웃 시 단위→최대→최소 순으로 맞추고 안내 문구를 잠깐 표시
  const [adjust, setAdjust] = useState(null)
  const adjustTimer = useRef(null)
  function handleAmountBlur() {
    const res = correctAmount(draft.amount, limit)
    if (res.changed) {
      set({ amount: res.value })
      setAdjust(res.reason)
      if (adjustTimer.current) clearTimeout(adjustTimer.current)
      adjustTimer.current = setTimeout(() => setAdjust(null), 2500)
    }
  }

  return (
    <div className="detail-right">
      <div className="card apply-card">
        <h2 style={{ fontSize: 16 }}>{t('stepB.applyCardTitle')}</h2>

        {/* 환전구분: 원화구매(=매입) 고정. 선택 UI 없이 표시용 배지만 노출 */}
        <div className="pill-group" style={{ marginBottom: 16 }}>
          <div className="pill selected" aria-disabled="true" style={{ cursor: 'default' }}>
            <div className="pill-t">{t('stepB.sellFx')}</div>
            <div className="pill-d">{t('stepB.sellFxHint')}</div>
          </div>
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

        {/* 환전 금액 (통화는 드롭다운 한 곳에서만 표시) */}
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
              onBlur={handleAmountBlur}
              placeholder="0"
            />
          </div>
          {limit && (
            <div className="tiny" style={{ marginTop: 6 }}>
              {t('stepB.min')} {formatNumber(limit.min)} {draft.currency} · {t('stepB.max')}{' '}
              {formatNumber(limit.max)} {draft.currency}
              {limit.unitStep
                ? ` · ${formatNumber(limit.unitStep)} ${draft.currency} ${t('stepB.unitSuffix')}`
                : ''}
            </div>
          )}
          {adjust && (
            <div className="notice info" style={{ marginTop: 6, padding: '6px 10px' }}>
              {t(`stepB.adj.${adjust}`)}
            </div>
          )}
        </div>

        {/* 환산 원화 (참고용) — 통화 코드는 위 드롭다운에만 표시하고 여기선 숫자만 */}
        <div className="convert-box">
          <div className="cv-top">{draft.amount ? formatNumber(Number(draft.amount)) : '0'}</div>
          <div className="cv-arrow">↓</div>
          <div className="cv-krw">{formatKrw(krw)}</div>
        </div>
        <div className="tiny live-rate" style={{ margin: '8px 0 4px' }}>
          {t('common.rate')} 1 {draft.currency} ={' '}
          <span key={rate} className="live-rate-num">
            {formatNumber(rate)}
          </span>{' '}
          KRW
          <span className="live-rate-badge" title={t('stepB.liveRateHint')}>
            ● {t('stepB.liveRateLabel')} · {updatedLabel}
          </span>
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

/* ================= STEP 5: 예약자 정보 (+ 이메일 OTP 인증) ================= */
function StepInfo({ draft, set, noshowBlocked, emailVerified, setEmailVerified }) {
  const { t } = useI18n()
  const { sendEmail } = useEmail()
  const nameOk = draft.customerName === '' || isValidName(draft.customerName)
  const emailOk = draft.email === '' || isValidEmail(draft.email)
  // 노쇼 차단은 인증보다 먼저 판정. 차단 대상이면 OTP 절차 자체를 열지 않는다.
  const canStartOtp = isValidEmail(draft.email) && !noshowBlocked

  // OTP 로컬 상태 (새로고침/언마운트 시 자동 초기화 — 임시저장 없음 원칙)
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState(null) // 현재 유효한 6자리 코드 (null = 없음/무효화)
  const [input, setInput] = useState('')
  const [expiresAt, setExpiresAt] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [banner, setBanner] = useState(null) // { type, text }

  // 1초 틱 (발송 후 · 미인증 동안만)
  useEffect(() => {
    if (!sent || emailVerified) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [sent, emailVerified])

  const remainMs = Math.max(0, expiresAt - now)
  const expired = sent && !emailVerified && !!code && remainMs <= 0
  const cooldownMs = Math.max(0, cooldownUntil - now)
  const codeUnusable = !code || expired // 재발송 필요 상태 (무효화 or 만료)

  function genAndSend() {
    const c = String(Math.floor(100000 + Math.random() * 900000)) // 6자리
    const t0 = Date.now()
    setCode(c)
    setInput('')
    setAttempts(0)
    setSent(true)
    setExpiresAt(t0 + OTP_TTL_MS)
    setCooldownUntil(t0 + OTP_RESEND_COOLDOWN_MS)
    setNow(t0)
    setBanner({ type: 'info', text: `${t('book.otp.demoPrefix')} ${c}` })
    // 입력한 이메일로 인증번호 발송(시뮬레이션) → 이메일 발송 이력에 기록
    sendEmail('auth', draft.email.trim(), { name: draft.customerName, code: c })
  }
  function onSend() {
    if (!canStartOtp) return
    genAndSend()
  }
  function onResend() {
    if (cooldownMs > 0) return
    genAndSend() // 이전 코드 무효화 + 새 코드로 교체
  }
  function onVerify() {
    if (codeUnusable) {
      setBanner({ type: 'danger', text: t('book.otp.expired') })
      return
    }
    if (input.trim() === code) {
      setEmailVerified(true)
      setBanner({ type: 'success', text: t('book.otp.verified') })
    } else {
      const n = attempts + 1
      setAttempts(n)
      if (n >= OTP_MAX_ATTEMPTS) {
        setCode(null) // 무효화 → 재발송 필요
        setBanner({ type: 'danger', text: t('book.otp.locked') })
      } else {
        setBanner({
          type: 'danger',
          text: `${t('book.otp.wrong')} (${OTP_MAX_ATTEMPTS - n}/${OTP_MAX_ATTEMPTS})`,
        })
      }
    }
  }
  // 이메일 수정 → 인증/코드 상태 전체 초기화 (재인증 필요)
  function onEmailChange(v) {
    set({ email: v })
    setSent(false)
    setCode(null)
    setInput('')
    setAttempts(0)
    setBanner(null)
    if (emailVerified) setEmailVerified(false)
  }

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
        <span className="lbl">
          {t('common.email')}
          {emailVerified && <span className="otp-verified-badge">✔ {t('book.otp.badge')}</span>}
        </span>
        <input
          type="email"
          value={draft.email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
        />
        {!emailOk && <div className="err-text">{t('err.email')}</div>}
        {emailOk && noshowBlocked && <div className="err-text">{t('err.noshowBlocked')}</div>}
      </label>

      {/* 이메일 OTP 인증 — 노쇼 차단 대상이 아니고 이메일 형식 통과 시에만 노출 */}
      {canStartOtp && !emailVerified && (
        <div className="otp-box">
          {!sent ? (
            <button type="button" className="btn primary block" onClick={onSend}>
              {t('book.otp.send')}
            </button>
          ) : (
            <>
              <div className="otp-row">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="otp-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('book.otp.placeholder')}
                  disabled={codeUnusable}
                />
                <button
                  type="button"
                  className="btn primary"
                  onClick={onVerify}
                  disabled={codeUnusable || input.length < 6}
                >
                  {t('book.otp.verify')}
                </button>
              </div>
              <div className="otp-meta">
                <span className={`otp-timer ${expired ? 'expired' : ''}`}>
                  {expired ? t('book.otp.expiredShort') : `⏱ ${fmtMMSS(remainMs)}`}
                </span>
                <button
                  type="button"
                  className="otp-resend"
                  onClick={onResend}
                  disabled={cooldownMs > 0}
                >
                  {cooldownMs > 0
                    ? `${t('book.otp.resend')} (${Math.ceil(cooldownMs / 1000)}s)`
                    : t('book.otp.resend')}
                </button>
              </div>
            </>
          )}
          {banner && <div className={`notice ${banner.type} otp-banner`}>{banner.text}</div>}
        </div>
      )}

      {emailVerified && (
        <div className="notice success otp-banner">✔ {t('book.otp.verified')}</div>
      )}
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
    </div>
  )
}

/* ================= STEP 7: 정책 동의 ================= */
// 각 동의 항목: 체크박스 + 한 줄 요약 + "자세히보기" 토글 → 약관 전문(스크롤) 아코디언.
// 전문을 다 보지 않아도 체크 가능.
function ConsentItem({ checked, onChange, titleKey, summaryKey, fullKey }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <div className="check-row consent-item">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div style={{ flex: 1 }}>
        <div className="consent-head">
          <button type="button" className="consent-title" onClick={() => setOpen((o) => !o)}>
            {t(titleKey)}
          </button>
          <button type="button" className="consent-more" onClick={() => setOpen((o) => !o)}>
            {open ? t('book.step7.less') : t('book.step7.more')} {open ? '▴' : '▾'}
          </button>
        </div>
        <div className="cd">{t(summaryKey)}</div>
        {open && <div className="terms-full">{t(fullKey)}</div>}
      </div>
    </div>
  )
}

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
      <ConsentItem
        checked={consent.noshow}
        onChange={(e) => setConsent((c) => ({ ...c, noshow: e.target.checked }))}
        titleKey="book.step7.noshow.t"
        summaryKey="book.step7.noshow.d"
        fullKey="book.step7.noshow.full"
      />
      <ConsentItem
        checked={consent.privacy}
        onChange={(e) => setConsent((c) => ({ ...c, privacy: e.target.checked }))}
        titleKey="book.step7.privacy.t"
        summaryKey="book.step7.privacy.d"
        fullKey="book.step7.privacy.full"
      />
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
