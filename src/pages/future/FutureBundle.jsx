import { useState } from 'react'
import { useRates } from '../../store/RatesContext.jsx'
import { CURRENCY_META, CURRENCY_ORDER } from '../../data/rates.js'
import { BRANCHES } from '../../data/branches.js'
import { formatKrw } from '../../lib/format.js'
import { diffDays } from '../../lib/date.js'
import DevNote from '../../components/DevNote.jsx'

// ── 미래형 통합예약 (컨셉 프로토타입) ─────────────────────────────
// 기존 환전예약과 분리된 별도 surface. 한국 여행 준비물을 한 번에 미리 신청·선결제.
// 흐름: 여정(입출국일) → 상품(환전·교통카드·유심/이심·숙박·쇼핑) → 수령 → 선결제 → 완료
// 완료 → 확인 메일 발송 → 고객 확인 → 시재 차감.

const CURRENCIES = CURRENCY_ORDER.filter((c) => BRANCHES.some((b) => b.currencies.includes(c)))

const TRANSIT_CARDS = [
  { id: 'tmoney', name: 'T-money 카드', desc: '전국 지하철·버스·택시' },
  { id: 'climate', name: '기후동행카드', desc: '서울 대중교통 무제한(기간권)' },
  { id: 'wowpass', name: '교통 겸용 선불카드', desc: '교통 + 가맹점 결제' },
]

// 유심/이심 — 체류일수 기준 요금(1일당)
const SIM_TYPES = [
  { id: 'esim', name: 'eSIM', desc: '즉시 발급 · QR 스캔으로 개통', perDay: 2500, emoji: '📲' },
  { id: 'usim', name: '유심(USIM)', desc: '수령 시 실물 지급 · 끼우면 개통', perDay: 2200, emoji: '📶' },
]

// 숙박 (야놀자 · 여기어때 연동)
const STAYS = [
  { id: 'md-hotel', name: '명동 시티 호텔', area: '명동', perNight: 120000, provider: '야놀자', emoji: '🏨' },
  { id: 'hd-guest', name: '홍대 감성 게스트하우스', area: '홍대', perNight: 55000, provider: '여기어때', emoji: '🛏️' },
  { id: 'gn-biz', name: '강남 비즈니스 호텔', area: '강남', perNight: 150000, provider: '야놀자', emoji: '🏙️' },
]

// 쇼핑 · 투어 · 티켓
const TOURS = [
  { id: 'lotteworld', name: '롯데월드 자유이용권', price: 62000, emoji: '🎢' },
  { id: 'hanbok', name: '경복궁 한복 체험', price: 25000, emoji: '👘' },
  { id: 'kbeauty', name: 'K-뷰티 쇼핑 패키지', price: 40000, emoji: '💄' },
  { id: 'dutyfree', name: '면세점 할인 쿠폰팩', price: 15000, emoji: '🛍️' },
]

const PICKUPS = [
  { id: 'branch', icon: '🏬', name: '지점 수령', desc: '예약 지점 방문, 여권 확인 후 수령' },
  { id: 'cabinet', icon: '🗄️', name: 'CU 스마트캐비넷 수령', desc: '편의점(CU) 무인 보관함에서 QR로 24시간 수령' },
  { id: 'airport', icon: '🛬', name: '공항 픽업', desc: '입국 시 공항 카운터에서 바로 수령' },
]

const STEPS = ['trip', 'bundle', 'pickup', 'pay', 'done']
const STEP_LABEL = { trip: '여정', bundle: '상품', pickup: '수령', pay: '결제', done: '완료' }

function genNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `NX-${ymd}-${String(Math.floor(1000 + Math.random() * 9000))}`
}

export default function FutureBundle() {
  const { getDisplayRates } = useRates()
  const [step, setStep] = useState('trip')

  // 여정
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')

  // 환전
  const [currency, setCurrency] = useState('USD')
  const [fxAmount, setFxAmount] = useState('')

  // 교통 선불카드
  const [transitOn, setTransitOn] = useState(true)
  const [transitCard, setTransitCard] = useState('tmoney')
  const [transitCharge, setTransitCharge] = useState('30000')

  // 유심/이심
  const [simOn, setSimOn] = useState(true)
  const [simType, setSimType] = useState('esim')

  // 숙박
  const [stayOn, setStayOn] = useState(false)
  const [stayId, setStayId] = useState('md-hotel')

  // 쇼핑·투어
  const [shopSel, setShopSel] = useState([])

  // 수령
  const [pickup, setPickup] = useState('branch')
  const [branchId, setBranchId] = useState(BRANCHES[0]?.id || '')
  const [pickupDate, setPickupDate] = useState('')

  // 완료
  const [result, setResult] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  // ── 계산 ──
  const nights = arrival && departure ? Math.max(1, diffDays(departure, arrival)) : 1
  const simDays = arrival && departure ? Math.max(1, diffDays(departure, arrival) + 1) : 1

  const rate = getDisplayRates(currency)?.base || 0
  const fxKrw = Number(fxAmount) > 0 && rate > 0 ? Math.round(Number(fxAmount) * rate) : 0
  const chargeKrw = transitOn ? Number(transitCharge) || 0 : 0
  const simObj = SIM_TYPES.find((s) => s.id === simType)
  const simKrw = simOn ? simObj.perDay * simDays : 0
  const stayObj = STAYS.find((s) => s.id === stayId)
  const stayKrw = stayOn ? stayObj.perNight * nights : 0
  const shopKrw = TOURS.filter((t) => shopSel.includes(t.id)).reduce((a, t) => a + t.price, 0)
  const totalKrw = fxKrw + chargeKrw + simKrw + stayKrw + shopKrw

  const tripValid = !!arrival && !!departure && departure >= arrival
  const bundleValid = totalKrw > 0
  const pickupValid = pickup !== 'branch' || !!branchId

  const stepIdx = STEPS.indexOf(step)
  const go = (s) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const toggleShop = (id) =>
    setShopSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  function submit() {
    setResult({
      no: genNo(),
      arrival,
      departure,
      nights,
      simDays,
      fx: fxKrw > 0 ? { currency, amount: Number(fxAmount), krw: fxKrw } : null,
      transit: transitOn && chargeKrw > 0 ? { card: transitCard, charge: chargeKrw } : null,
      sim: simOn ? { type: simType, days: simDays, krw: simKrw } : null,
      stay: stayOn ? { id: stayId, nights, krw: stayKrw } : null,
      shop: TOURS.filter((t) => shopSel.includes(t.id)),
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
    setSimOn(true)
    setStayOn(false)
    setShopSel([])
    setPickup('branch')
    setPickupDate('')
    go('trip')
  }

  const branchName = (id) => BRANCHES.find((b) => b.id === id)?.name.ko || id
  const cardName = (id) => TRANSIT_CARDS.find((c) => c.id === id)?.name || id
  const simName = (id) => SIM_TYPES.find((s) => s.id === id)?.name || id
  const stayName = (id) => STAYS.find((s) => s.id === id)?.name || id
  const pickupName = (id) => PICKUPS.find((p) => p.id === id)?.name || id

  return (
    <div className="nx">
      <DevNote
        items={[
          '컨셉 프로토타입 — 기존 환전예약과 분리된 별도 서비스(한국 여행 준비물 통합예약)',
          '상품: 환전 + 교통 선불카드 + 유심/이심(체류일수 기준) + 숙박(야놀자·여기어때) + 쇼핑·투어',
          '입국 전에 미리 신청·선결제(신용카드) → 지점·CU 스마트캐비넷·공항에서 수령',
          '유심/이심은 입출국일로 체류일수를 계산해 일수만큼 요금 산정',
          '신청 완료 → 확인 메일 발송 → 고객 확인 시 시재(재고)에서 차감',
        ]}
      />

      <div className="nx-wrap">
        <header className="nx-head">
          <div className="nx-badge">CONCEPT · 미래형 통합예약</div>
          <h1 className="nx-title">한 번에 준비하는 한국 여행 지갑</h1>
          <p className="nx-sub">
            환전 · 교통카드 · 유심/이심 · 숙박 · 쇼핑까지 입국 전에 미리 담고 결제하세요. 도착하면 받기만 하면 돼요.
          </p>
        </header>

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
            <p className="nx-card-d">입국·출국 일정에 맞춰 유심·숙박 기간을 자동으로 계산해 드려요.</p>
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
            {tripValid && (
              <div className="nx-note">체류 {simDays}일 · {nights}박 일정으로 준비할게요.</div>
            )}
            <button className="nx-btn primary" disabled={!tripValid} onClick={() => { setPickupDate(pickupDate || arrival); go('bundle') }}>
              다음
            </button>
          </section>
        )}

        {/* STEP 2 · 상품 */}
        {step === 'bundle' && (
          <section className="nx-card">
            <h2 className="nx-card-t">무엇을 준비할까요?</h2>
            <p className="nx-card-d">필요한 것만 골라 담으세요. 체류 {simDays}일 · {nights}박 기준으로 계산됩니다.</p>

            {/* 환전 */}
            <div className="nx-mod">
              <div className="nx-mod-h"><span className="nx-thumb">💱</span> 환전</div>
              <div className="nx-chips">
                {CURRENCIES.map((c) => (
                  <button key={c} type="button" className={`nx-chip${c === currency ? ' on' : ''}`} onClick={() => setCurrency(c)}>
                    {CURRENCY_META[c]?.flag} {c}
                  </button>
                ))}
              </div>
              <label className="nx-field">
                <span>환전 금액 ({currency})</span>
                <input type="text" inputMode="numeric" value={fxAmount}
                  onChange={(e) => setFxAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
              </label>
              {fxKrw > 0 && <div className="nx-note">≈ {formatKrw(fxKrw)} 상당 · 참고 시세</div>}
            </div>

            {/* 교통 선불카드 */}
            <div className="nx-mod">
              <div className="nx-mod-h">
                <span className="nx-thumb">🚇</span> 교통 선불카드
                <label className="nx-toggle"><input type="checkbox" checked={transitOn} onChange={(e) => setTransitOn(e.target.checked)} /><span>추가</span></label>
              </div>
              {transitOn && (
                <>
                  <div className="nx-cards">
                    {TRANSIT_CARDS.map((c) => (
                      <button key={c.id} type="button" className={`nx-pick${c.id === transitCard ? ' on' : ''}`} onClick={() => setTransitCard(c.id)}>
                        <b>{c.name}</b><span>{c.desc}</span>
                      </button>
                    ))}
                  </div>
                  <label className="nx-field">
                    <span>충전 금액 (원)</span>
                    <input type="text" inputMode="numeric" value={transitCharge}
                      onChange={(e) => setTransitCharge(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
                  </label>
                </>
              )}
            </div>

            {/* 유심 / 이심 */}
            <div className="nx-mod">
              <div className="nx-mod-h">
                <span className="nx-thumb">📱</span> 유심 / 이심
                <label className="nx-toggle"><input type="checkbox" checked={simOn} onChange={(e) => setSimOn(e.target.checked)} /><span>추가</span></label>
              </div>
              {simOn && (
                <>
                  <div className="nx-note" style={{ marginBottom: 10 }}>체류 {simDays}일 데이터 요금으로 계산돼요.</div>
                  <div className="nx-cards">
                    {SIM_TYPES.map((s) => (
                      <button key={s.id} type="button" className={`nx-pick wide${s.id === simType ? ' on' : ''}`} onClick={() => setSimType(s.id)}>
                        <span className="nx-pick-ic">{s.emoji}</span>
                        <span className="nx-pick-body">
                          <b>{s.name} <span className="nx-price">{formatKrw(s.perDay * simDays)}</span></b>
                          <span>{s.desc} · {formatKrw(s.perDay)}/일 × {simDays}일</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 숙박 */}
            <div className="nx-mod">
              <div className="nx-mod-h">
                <span className="nx-thumb">🏨</span> 숙박
                <label className="nx-toggle"><input type="checkbox" checked={stayOn} onChange={(e) => setStayOn(e.target.checked)} /><span>추가</span></label>
              </div>
              {stayOn && (
                <>
                  <div className="nx-note" style={{ marginBottom: 10 }}>{nights}박 기준 · 야놀자·여기어때 연동</div>
                  <div className="nx-cards">
                    {STAYS.map((s) => (
                      <button key={s.id} type="button" className={`nx-pick wide${s.id === stayId ? ' on' : ''}`} onClick={() => setStayId(s.id)}>
                        <span className="nx-pick-ic">{s.emoji}</span>
                        <span className="nx-pick-body">
                          <b>{s.name} <span className="nx-price">{formatKrw(s.perNight * nights)}</span></b>
                          <span><span className="nx-prov">{s.provider}</span> {s.area} · {formatKrw(s.perNight)}/박 × {nights}박</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 쇼핑 · 투어 */}
            <div className="nx-mod">
              <div className="nx-mod-h"><span className="nx-thumb">🎫</span> 쇼핑 · 투어 · 티켓</div>
              <div className="nx-cards">
                {TOURS.map((t) => {
                  const on = shopSel.includes(t.id)
                  return (
                    <button key={t.id} type="button" className={`nx-pick wide multi${on ? ' on' : ''}`} onClick={() => toggleShop(t.id)}>
                      <span className="nx-pick-ic">{t.emoji}</span>
                      <span className="nx-pick-body">
                        <b>{t.name} <span className="nx-price">{formatKrw(t.price)}</span></b>
                      </span>
                      <span className="nx-check" aria-hidden="true">{on ? '✓' : '+'}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 담긴 금액 */}
            <div className="nx-cart">
              <span>담긴 금액</span>
              <b>{formatKrw(totalKrw)}</b>
            </div>

            <button className="nx-btn primary" disabled={!bundleValid} onClick={() => go('pickup')}>다음</button>
            <button className="nx-btn ghost" onClick={() => go('trip')}>이전</button>
          </section>
        )}

        {/* STEP 3 · 수령 */}
        {step === 'pickup' && (
          <section className="nx-card">
            <h2 className="nx-card-t">어디서 받으실래요?</h2>
            <div className="nx-cards">
              {PICKUPS.map((p) => (
                <button key={p.id} type="button" className={`nx-pick wide${p.id === pickup ? ' on' : ''}`} onClick={() => setPickup(p.id)}>
                  <span className="nx-pick-ic">{p.icon}</span>
                  <span className="nx-pick-body"><b>{p.name}</b><span>{p.desc}</span></span>
                </button>
              ))}
            </div>
            {pickup === 'branch' && (
              <label className="nx-field">
                <span>수령 지점</span>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  {BRANCHES.map((b) => (<option key={b.id} value={b.id}>{b.name.ko}</option>))}
                </select>
              </label>
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
                <div className="nx-sum-row"><span>환전 {CURRENCY_META[currency]?.flag} {formatKrw(Number(fxAmount)).replace('₩', '')} {currency}</span><b>{formatKrw(fxKrw)}</b></div>
              )}
              {chargeKrw > 0 && (
                <div className="nx-sum-row"><span>{cardName(transitCard)} 충전</span><b>{formatKrw(chargeKrw)}</b></div>
              )}
              {simKrw > 0 && (
                <div className="nx-sum-row"><span>{simName(simType)} · {simDays}일</span><b>{formatKrw(simKrw)}</b></div>
              )}
              {stayKrw > 0 && (
                <div className="nx-sum-row"><span>{stayName(stayId)} · {nights}박</span><b>{formatKrw(stayKrw)}</b></div>
              )}
              {TOURS.filter((t) => shopSel.includes(t.id)).map((t) => (
                <div key={t.id} className="nx-sum-row"><span>{t.name}</span><b>{formatKrw(t.price)}</b></div>
              ))}
              <div className="nx-sum-row total"><span>선결제 총액</span><b>{formatKrw(totalKrw)}</b></div>
            </div>
            <label className="nx-field">
              <span>카드 번호 (데모)</span>
              <input type="text" placeholder="0000 0000 0000 0000" />
            </label>
            <button className="nx-btn primary" disabled={totalKrw <= 0} onClick={submit}>{formatKrw(totalKrw)} 선결제하기</button>
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
              <div className="nx-sum-row"><span>여정</span><b>{result.arrival} ~ {result.departure} ({result.nights}박)</b></div>
              {result.fx && (<div className="nx-sum-row"><span>환전</span><b>{CURRENCY_META[result.fx.currency]?.flag} {result.fx.amount} {result.fx.currency}</b></div>)}
              {result.transit && (<div className="nx-sum-row"><span>교통카드</span><b>{cardName(result.transit.card)} · {formatKrw(result.transit.charge)}</b></div>)}
              {result.sim && (<div className="nx-sum-row"><span>유심/이심</span><b>{simName(result.sim.type)} · {result.sim.days}일</b></div>)}
              {result.stay && (<div className="nx-sum-row"><span>숙박</span><b>{stayName(result.stay.id)} · {result.stay.nights}박</b></div>)}
              {result.shop.length > 0 && (<div className="nx-sum-row"><span>쇼핑·투어</span><b>{result.shop.map((t) => t.name).join(', ')}</b></div>)}
              <div className="nx-sum-row"><span>수령</span><b>{pickupName(result.pickup)}{result.pickup === 'branch' ? ` · ${branchName(result.branchId)}` : ''}</b></div>
              <div className="nx-sum-row"><span>수령 예정일</span><b>{result.pickupDate}</b></div>
              <div className="nx-sum-row total"><span>선결제 총액</span><b>{formatKrw(result.totalKrw)}</b></div>
            </div>
            <div className={`nx-status${confirmed ? ' ok' : ''}`}>
              {confirmed
                ? <>✅ 고객 확인 완료 — 시재(재고)에서 차감됨. 수령일에 준비돼요.</>
                : <>📧 확인 메일을 보냈어요. 고객이 확인하면 시재에서 차감됩니다. <span className="nx-status-wait">(확인 대기)</span></>}
            </div>
            {!confirmed && (
              <button className="nx-btn primary" onClick={() => setConfirmed(true)}>고객 이메일 확인 (데모)</button>
            )}
            <button className="nx-btn ghost" onClick={reset}>새 신청</button>
          </section>
        )}
      </div>
    </div>
  )
}
