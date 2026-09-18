import { useMemo, useState } from 'react'
import { useRates } from '../../store/RatesContext.jsx'
import { CURRENCY_META, CURRENCY_ORDER } from '../../data/rates.js'
import { BRANCHES } from '../../data/branches.js'
import { formatKrw } from '../../lib/format.js'
import DevNote from '../../components/DevNote.jsx'

// ── 미래형 통합예약 (컨셉 프로토타입) ─────────────────────────────
// 기존 환전예약과 분리된 별도 surface. 로드맵 비전을 클릭 가능한 컨셉으로 시연.
// 흐름: 여정(입출국일) → 번들(환전 + 교통 선불카드) → 수령방법 → 선결제 → 완료(메일→확인→시재 차감)
// 쇼핑·숙박(야놀자·여기어때) 연동은 '예정'으로만 표시.

const CURRENCIES = CURRENCY_ORDER.filter((c) => BRANCHES.some((b) => b.currencies.includes(c)))

const TRANSIT_CARDS = [
  { id: 'tmoney', name: 'T-money 카드', desc: '전국 지하철·버스·택시' },
  { id: 'climate', name: '기후동행카드', desc: '서울 대중교통 무제한(기간권)' },
  { id: 'wowpass', name: '교통 겸용 선불카드', desc: '교통 + 가맹점 결제' },
]

const PICKUPS = [
  {
    id: 'branch',
    icon: '🏬',
    name: '지점 수령',
    desc: '예약 지점 방문, 여권 확인 후 수령',
    tag: '운영중',
  },
  {
    id: 'cabinet',
    icon: '🗄️',
    name: 'CU 스마트캐비넷 수령',
    desc: '편의점(CU) 무인 보관함에서 QR로 24시간 수령',
    tag: '예정',
  },
  {
    id: 'airport',
    icon: '🛬',
    name: '공항 픽업',
    desc: '입국 전 선불카드 구매 → 공항에서 수령. 송금업체 연계 구조 검토',
    tag: '법률 검토',
  },
]

const STEPS = ['trip', 'bundle', 'pickup', 'pay', 'done']
const STEP_LABEL = { trip: '여정', bundle: '상품', pickup: '수령', pay: '결제', done: '완료' }

function genNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rnd = String(Math.floor(1000 + Math.random() * 9000))
  return `NX-${ymd}-${rnd}`
}

export default function FutureBundle() {
  const { getDisplayRates } = useRates()

  const [step, setStep] = useState('trip')

  // 여정
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')

  // 번들 - 환전
  const [currency, setCurrency] = useState('USD')
  const [fxAmount, setFxAmount] = useState('')

  // 번들 - 교통 선불카드
  const [transitOn, setTransitOn] = useState(true)
  const [transitCard, setTransitCard] = useState('tmoney')
  const [transitCharge, setTransitCharge] = useState('30000')

  // 수령
  const [pickup, setPickup] = useState('branch')
  const [branchId, setBranchId] = useState(BRANCHES[0]?.id || '')
  const [pickupDate, setPickupDate] = useState('')

  // 완료
  const [result, setResult] = useState(null)
  const [confirmed, setConfirmed] = useState(false) // 이메일 확인 → 시재 차감

  const rate = getDisplayRates(currency)?.base || 0
  const fxKrw = Number(fxAmount) > 0 && rate > 0 ? Math.round(Number(fxAmount) * rate) : 0
  const chargeKrw = transitOn ? Number(transitCharge) || 0 : 0
  const totalKrw = fxKrw + chargeKrw

  const tripValid = !!arrival && !!departure && departure >= arrival
  const bundleValid = Number(fxAmount) > 0 || (transitOn && chargeKrw > 0)
  const pickupValid = pickup !== 'branch' || !!branchId

  const stepIdx = STEPS.indexOf(step)
  const go = (s) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function submit() {
    setResult({
      no: genNo(),
      arrival,
      departure,
      currency,
      fxAmount: Number(fxAmount) || 0,
      fxKrw,
      transit: transitOn ? { card: transitCard, charge: chargeKrw } : null,
      pickup,
      branchId,
      pickupDate: pickupDate || arrival,
      totalKrw,
    })
    setConfirmed(false)
    go('done')
  }

  function reset() {
    setResult(null)
    setConfirmed(false)
    setArrival('')
    setDeparture('')
    setFxAmount('')
    setTransitOn(true)
    setTransitCharge('30000')
    setPickup('branch')
    setPickupDate('')
    go('trip')
  }

  const branchName = (id) => BRANCHES.find((b) => b.id === id)?.name.ko || id
  const cardName = (id) => TRANSIT_CARDS.find((c) => c.id === id)?.name || id
  const pickupName = (id) => PICKUPS.find((p) => p.id === id)?.name || id

  return (
    <div className="nx">
      <DevNote
        items={[
          '컨셉 프로토타입 — 기존 환전예약과 분리된 별도 서비스(미래 로드맵 시연용)',
          '1차는 환전예약만. 이 화면은 향후 확장 비전: 환전 + 교통 선불카드(선결제) + 무인 수령',
          '교통 선불카드: 미리 예약·충전 → CU 스마트캐비넷(무인)에서 수령. 선결제(신용카드) 포함',
          '공항 픽업: 현행법상 공항 현장 수령 제한 → 입국 전 선불카드 구매 + 송금업체 연계 구조로 검토',
          '쇼핑·숙박(야놀자·여기어때 등) 연동은 추후 예정 — 지금은 자리만 표시',
          '신청 완료 → 확인 메일 발송 → 고객 확인 시 시재(재고)에서 차감',
        ]}
      />

      <div className="nx-wrap">
        <header className="nx-head">
          <div className="nx-badge">CONCEPT · 미래형 통합예약</div>
          <h1 className="nx-title">한 번에 준비하는 한국 여행 지갑</h1>
          <p className="nx-sub">환전 · 교통 선불카드를 입국 전에 미리 신청·결제하고, 지점 또는 무인 캐비넷에서 받아요.</p>
        </header>

        {/* 진행 표시 */}
        <ol className="nx-steps">
          {STEPS.map((s, i) => (
            <li key={s} className={`nx-step${i === stepIdx ? ' on' : ''}${i < stepIdx ? ' done' : ''}`}>
              <span className="nx-step-n">{i < stepIdx ? '✓' : i + 1}</span>
              <span className="nx-step-l">{STEP_LABEL[s]}</span>
            </li>
          ))}
        </ol>

        {/* STEP 1 · 여정 */}
        {step === 'trip' && (
          <section className="nx-card">
            <h2 className="nx-card-t">여정 정보</h2>
            <p className="nx-card-d">입국·출국 일정을 알려주시면 일정에 맞춰 상품을 추천해요.</p>
            <label className="nx-field">
              <span>입국일</span>
              <input type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} />
            </label>
            <label className="nx-field">
              <span>출국일</span>
              <input type="date" value={departure} min={arrival} onChange={(e) => setDeparture(e.target.value)} />
            </label>
            {arrival && departure && departure < arrival && (
              <div className="nx-err">출국일은 입국일 이후여야 해요.</div>
            )}
            <button className="nx-btn primary" disabled={!tripValid} onClick={() => go('bundle')}>
              다음
            </button>
          </section>
        )}

        {/* STEP 2 · 번들 */}
        {step === 'bundle' && (
          <section className="nx-card">
            <h2 className="nx-card-t">무엇을 준비할까요?</h2>

            {/* 환전 */}
            <div className="nx-mod">
              <div className="nx-mod-h">💱 환전 <span className="nx-mod-tag">운영중</span></div>
              <div className="nx-chips">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`nx-chip${c === currency ? ' on' : ''}`}
                    onClick={() => setCurrency(c)}
                  >
                    {CURRENCY_META[c]?.flag} {c}
                  </button>
                ))}
              </div>
              <label className="nx-field">
                <span>환전 금액 ({currency})</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fxAmount}
                  onChange={(e) => setFxAmount(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="0"
                />
              </label>
              {fxKrw > 0 && <div className="nx-note">≈ {formatKrw(fxKrw)} 상당 · 참고 시세</div>}
            </div>

            {/* 교통 선불카드 */}
            <div className="nx-mod">
              <div className="nx-mod-h">
                🚇 교통 선불카드
                <label className="nx-toggle">
                  <input type="checkbox" checked={transitOn} onChange={(e) => setTransitOn(e.target.checked)} />
                  <span>추가</span>
                </label>
              </div>
              {transitOn && (
                <>
                  <div className="nx-cards">
                    {TRANSIT_CARDS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`nx-pick${c.id === transitCard ? ' on' : ''}`}
                        onClick={() => setTransitCard(c.id)}
                      >
                        <b>{c.name}</b>
                        <span>{c.desc}</span>
                      </button>
                    ))}
                  </div>
                  <label className="nx-field">
                    <span>충전 금액 (원)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={transitCharge}
                      onChange={(e) => setTransitCharge(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="0"
                    />
                  </label>
                </>
              )}
            </div>

            {/* 쇼핑·숙박 (예정) */}
            <div className="nx-mod muted">
              <div className="nx-mod-h">🧳 쇼핑 · 숙박 <span className="nx-mod-tag soon">연동 예정</span></div>
              <div className="nx-soon">야놀자 · 여기어때 등 숙박/액티비티 예약을 함께 연결할 예정이에요.</div>
            </div>

            <button className="nx-btn primary" disabled={!bundleValid} onClick={() => { setPickupDate(pickupDate || arrival); go('pickup') }}>
              다음
            </button>
            <button className="nx-btn ghost" onClick={() => go('trip')}>이전</button>
          </section>
        )}

        {/* STEP 3 · 수령 방법 */}
        {step === 'pickup' && (
          <section className="nx-card">
            <h2 className="nx-card-t">어디서 받으실래요?</h2>
            <div className="nx-cards">
              {PICKUPS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`nx-pick wide${p.id === pickup ? ' on' : ''}`}
                  onClick={() => setPickup(p.id)}
                >
                  <span className="nx-pick-ic" aria-hidden="true">{p.icon}</span>
                  <span className="nx-pick-body">
                    <b>{p.name} <span className={`nx-mod-tag${p.tag !== '운영중' ? ' soon' : ''}`}>{p.tag}</span></b>
                    <span>{p.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            {pickup === 'branch' && (
              <label className="nx-field">
                <span>수령 지점</span>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  {BRANCHES.map((b) => (
                    <option key={b.id} value={b.id}>{b.name.ko}</option>
                  ))}
                </select>
              </label>
            )}
            {pickup === 'airport' && (
              <div className="nx-warn">
                ⚠ 현행법상 공항 현장 환전 수령은 제한돼요. 입국 전 선불카드를 신용카드로 구매하고,
                송금업체와 연계해 공항에서 카드·충전액을 받는 구조로 검토 중입니다.
              </div>
            )}

            <label className="nx-field">
              <span>수령 예정일</span>
              <input type="date" value={pickupDate} min={arrival} onChange={(e) => setPickupDate(e.target.value)} />
            </label>

            <button className="nx-btn primary" disabled={!pickupValid} onClick={() => go('pay')}>다음</button>
            <button className="nx-btn ghost" onClick={() => go('bundle')}>이전</button>
          </section>
        )}

        {/* STEP 4 · 선결제 */}
        {step === 'pay' && (
          <section className="nx-card">
            <h2 className="nx-card-t">미리 결제하기</h2>
            <p className="nx-card-d">입국 전 신용카드로 선결제하면, 수령일에 받기만 하면 돼요.</p>

            <div className="nx-summary">
              {fxKrw > 0 && (
                <div className="nx-sum-row">
                  <span>환전 {CURRENCY_META[currency]?.flag} {formatKrw(Number(fxAmount)).replace('₩', '')} {currency}</span>
                  <b>{formatKrw(fxKrw)}</b>
                </div>
              )}
              {transitOn && chargeKrw > 0 && (
                <div className="nx-sum-row">
                  <span>{cardName(transitCard)} 충전</span>
                  <b>{formatKrw(chargeKrw)}</b>
                </div>
              )}
              <div className="nx-sum-row total">
                <span>선결제 총액</span>
                <b>{formatKrw(totalKrw)}</b>
              </div>
            </div>

            <label className="nx-field">
              <span>카드 번호 (데모)</span>
              <input type="text" placeholder="0000 0000 0000 0000" />
            </label>

            <button className="nx-btn primary" disabled={totalKrw <= 0} onClick={submit}>
              {formatKrw(totalKrw)} 선결제하기
            </button>
            <button className="nx-btn ghost" onClick={() => go('pickup')}>이전</button>
            <div className="nx-fine">※ 데모 — 실제 결제되지 않습니다.</div>
          </section>
        )}

        {/* STEP 5 · 완료 */}
        {step === 'done' && result && (
          <section className="nx-card nx-done">
            <div className="nx-done-ic" aria-hidden="true">🎉</div>
            <h2 className="nx-card-t">신청이 완료됐어요!</h2>
            <div className="nx-resno">{result.no}</div>

            <div className="nx-summary">
              <div className="nx-sum-row"><span>여정</span><b>{result.arrival} ~ {result.departure}</b></div>
              {result.fxKrw > 0 && (
                <div className="nx-sum-row"><span>환전</span><b>{CURRENCY_META[result.currency]?.flag} {result.fxAmount} {result.currency}</b></div>
              )}
              {result.transit && (
                <div className="nx-sum-row"><span>교통카드</span><b>{cardName(result.transit.card)} · {formatKrw(result.transit.charge)}</b></div>
              )}
              <div className="nx-sum-row"><span>수령</span><b>{pickupName(result.pickup)}{result.pickup === 'branch' ? ` · ${branchName(result.branchId)}` : ''}</b></div>
              <div className="nx-sum-row"><span>수령 예정일</span><b>{result.pickupDate}</b></div>
              <div className="nx-sum-row total"><span>선결제 총액</span><b>{formatKrw(result.totalKrw)}</b></div>
            </div>

            {/* 완료 → 메일 발송 → 확인 → 시재 차감 */}
            <div className={`nx-status${confirmed ? ' ok' : ''}`}>
              {confirmed ? (
                <>✅ 고객 확인 완료 — 시재(재고)에서 차감됨. 수령일에 준비돼요.</>
              ) : (
                <>📧 확인 메일을 보냈어요. 고객이 확인하면 시재에서 차감됩니다. <span className="nx-status-wait">(확인 대기)</span></>
              )}
            </div>
            {!confirmed && (
              <button className="nx-btn primary" onClick={() => setConfirmed(true)}>
                고객 이메일 확인 (데모)
              </button>
            )}
            <button className="nx-btn ghost" onClick={reset}>새 신청</button>
          </section>
        )}
      </div>
    </div>
  )
}
