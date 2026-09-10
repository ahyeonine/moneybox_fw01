import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { CURRENCY_ORDER, CURRENCY_META } from '../data/rates.js'
import { useRates } from '../store/RatesContext.jsx'
import { formatNumber } from '../lib/format.js'
import DevNote from '../components/DevNote.jsx'

// 외국인 웹사이트 랜딩 홈 (프로토타입).
// 히어로 + 실시간 기준환율 티커 + 외국인 대상 랜딩 섹션(이용방법·혜택·인기지점·FAQ·CTA).
// 하단 섹션은 외국인 대상 서비스(WOWPASS·Creatrip 등)를 참고한 임시 콘텐츠.
const RATE_TICKER = CURRENCY_ORDER.slice(0, 8)

// 히어로 순환 타이포 — 서비스 가치가 카드 넘기듯 바뀜 (가까운/간편한/신속한)
const HERO_CYCLE = ['near', 'easy', 'fast']

// 인기 지점 칩 (홈 하단) — 클릭 시 지점 페이지로 이동
const POPULAR_LOCS = [
  { key: 'myeongdong', emoji: '🛍️' },
  { key: 'hongdae', emoji: '🎨' },
  { key: 'gangnam', emoji: '🏙️' },
  { key: 'airport', emoji: '✈️' },
]

// 이용 방법 3단계 / 혜택 4종 / FAQ 4종 (i18n 키만 나열)
const HOW_STEPS = ['s1', 's2', 's3']
const WHY_ITEMS = [
  { k: '1', emoji: '🏆' },
  { k: '2', emoji: '🔒' },
  { k: '3', emoji: '🪪' },
  { k: '4', emoji: '🌏' },
]
const FAQ_ITEMS = ['q1', 'q2', 'q3', 'q4']

// 환전 금액 시나리오별 "머니박스 대비 덜 받는 금액"(원) — 예시 수치(실제 아님).
// 주요 인바운드 통화(USD·JPY) 기준으로 외국인이 체감할 수 있게 실제 금액으로 표현.
const COMPARE_SCENARIOS = [
  {
    key: 'usd',
    flag: '🇺🇸',
    amount: '$1,000',
    // bar = 상대적으로 받는 비율(예시), less = 머니박스보다 덜 받는 금액(원)
    rows: {
      bank: { bar: 80, less: 28000 },
      kiosk: { bar: 62, less: 55000 },
      airport: { bar: 38, less: 124000 },
    },
  },
  {
    key: 'jpy',
    flag: '🇯🇵',
    amount: '¥100,000',
    rows: {
      bank: { bar: 80, less: 18000 },
      kiosk: { bar: 62, less: 37000 },
      airport: { bar: 38, less: 83000 },
    },
  },
  {
    key: 'eur',
    flag: '🇪🇺',
    amount: '€1,000',
    rows: {
      bank: { bar: 80, less: 30000 },
      kiosk: { bar: 62, less: 60000 },
      airport: { bar: 38, less: 135000 },
    },
  },
  {
    key: 'twd',
    flag: '🇹🇼',
    amount: 'NT$10,000',
    rows: {
      bank: { bar: 80, less: 9000 },
      kiosk: { bar: 62, less: 17000 },
      airport: { bar: 38, less: 39000 },
    },
  },
  {
    key: 'hkd',
    flag: '🇭🇰',
    amount: 'HK$5,000',
    rows: {
      bank: { bar: 80, less: 18000 },
      kiosk: { bar: 62, less: 35000 },
      airport: { bar: 38, less: 79000 },
    },
  },
]

export default function Home() {
  const { t, lang } = useI18n()
  const { getDisplayRates } = useRates() // 실시간 환율(2분 주기 자동 변동)
  const nav = useNavigate()
  // 통화 시나리오를 카드 넘기듯 자동 회전(캐러셀). 클릭 시 해당 통화로 이동 후 다시 자동 진행.
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const scenario = COMPARE_SCENARIOS[scenarioIdx]

  useEffect(() => {
    // 현재 카드가 바뀔 때마다 다음 카드 예약 → 자동/수동 모두 일정한 간격 유지
    const id = setTimeout(
      () => setScenarioIdx((i) => (i + 1) % COMPARE_SCENARIOS.length),
      2000
    )
    return () => clearTimeout(id)
  }, [scenarioIdx])

  // 히어로 타이틀 순환(국가/통화) — 2초 간격
  const [cycleIdx, setCycleIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setCycleIdx((i) => (i + 1) % HERO_CYCLE.length), 2000)
    return () => clearInterval(id)
  }, [])
  const cycKey = HERO_CYCLE[cycleIdx]

  // 머니박스보다 덜 받는 금액 문구 (언어별)
  const lessLabel = (won) =>
    lang === 'en'
      ? `≈ ₩${formatNumber(won)} ${t('home.cmp.less')}`
      : `약 ${formatNumber(won)}원 ${t('home.cmp.less')}`

  return (
    <div className="home">
      <DevNote
        items={[
          '히어로+기준환율 아래 랜딩 섹션(이용방법·혜택·인기지점·FAQ·CTA)은 외국인 대상 서비스 참고로 구성한 임시 콘텐츠',
          '자세히: 02_사이트맵.md',
        ]}
      />

      {/* 1. 히어로 (WOWPASS풍 — 깨끗한 화이트 + 큰 타이포 + 카드 비주얼, 블루 포인트) */}
      <section className="wp-hero">
        <div className="wp-hero-grid">
          <div className="wp-hero-copy">
            <div className="hero-eyebrow">
              <span className="he-globe" aria-hidden="true">🌏</span>
              <span className="he-langs">English · 中文 · 日本語 · 한국어</span>
            </div>
            <h1 className="wp-title wp-title-cycle">
              <span className="wp-l1">
                {t('home.hero.pre')}{' '}
                <span className="wp-cycle-word" key={cycleIdx}>
                  {t(`home.cyc.${cycKey}`)}
                </span>
              </span>
              <span className="wp-l2">{t('home.hero.mid')}</span>
              <span className="wp-brand-line">{t('home.hero.brand')}</span>
            </h1>
            <p className="wp-sub">{t('home.hero.sub')}</p>
            <div className="wp-cta-row">
              <button className="btn wp-cta" onClick={() => nav('/site/book')}>
                {t('home.hero.cta')}
              </button>
            </div>
            {/* 신뢰 배지 — 외국인 방문객에게 안심 신호 (실제 회사 지표) */}
            <div className="hero-trust">
              <div className="ht-item">
                <span className="ht-num">⭐ 4.97</span>
                <span className="ht-label">{t('home.trust.rating')}</span>
              </div>
              <div className="ht-item">
                <span className="ht-num">1.7M+</span>
                <span className="ht-label">{t('home.trust.visitors')}</span>
              </div>
              <div className="ht-item">
                <span className="ht-num">40+</span>
                <span className="ht-label">{t('home.trust.branches')}</span>
              </div>
            </div>
          </div>

          {/* 환율 비교 비주얼 — 공항/무인기/은행 대비 머니박스가 실제로 얼마나 더 주는지(원) 강조 (예시 수치) */}
          <div className="wp-hero-visual">
            <div className="wp-compare">
              <div className="wp-compare-head">
                <span className="wpc-title">{t('home.cmp.title')}</span>
                <span className="wpc-sub">{t('home.cmp.sub')}</span>
                <span className="wpc-trust-chip">
                  <span className="wpc-lock" aria-hidden="true">🔒</span>
                  {t('home.cmp.trust')}
                </span>
              </div>

              {/* 현재 통화만 한 개씩 표시 (한 번에 모든 통화 X → 넘기듯 전환) */}
              <div className="wpc-current" key={`cur-${scenarioIdx}`}>
                <span className="wpc-current-flag" aria-hidden="true">{scenario.flag}</span>
                <span className="wpc-current-amt">{scenario.amount}</span>
              </div>

              {/* 카드 스테이지 — 통화가 바뀔 때마다 카드가 넘어가듯 슬라이드(key=scenarioIdx) */}
              <div className="wpc-stage" key={scenarioIdx}>
                <ul className="wpc-rows">
                  <li className="wpc-row is-best">
                    <div className="wpc-row-top">
                      <span className="wpc-name">
                        <span className="wpc-check" aria-hidden="true">✓</span>
                        {t('home.cmp.mb')}
                      </span>
                      <span className="wpc-tag">{t('home.cmp.best')}</span>
                    </div>
                    <span className="wpc-bar-wrap">
                      <span className="wpc-bar" style={{ width: '100%' }} />
                    </span>
                  </li>
                  {['bank', 'kiosk', 'airport'].map((key) => (
                    <li className="wpc-row" key={key}>
                      <div className="wpc-row-top">
                        <span className="wpc-name">{t(`home.cmp.${key}`)}</span>
                        <span className="wpc-tag wpc-neg">{lessLabel(scenario.rows[key].less)}</span>
                      </div>
                      <span className="wpc-bar-wrap">
                        <span className="wpc-bar" style={{ width: `${scenario.rows[key].bar}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 도트 인디케이터 (현재 통화 위치 · 클릭 시 이동) */}
              <div className="wpc-dots" role="tablist" aria-label="currency">
                {COMPARE_SCENARIOS.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    role="tab"
                    aria-selected={i === scenarioIdx}
                    aria-label={s.amount}
                    className={`wpc-dot${i === scenarioIdx ? ' on' : ''}`}
                    onClick={() => setScenarioIdx(i)}
                  />
                ))}
              </div>

              <div className="wpc-foot">
                <span className="wpc-foot-trust">
                  <span className="wpc-star" aria-hidden="true">⭐</span>
                  <strong>4.97</strong> · {t('home.cmp.trust2')}
                </span>
                <span className="wpc-note">{t('home.cmp.note')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 기준환율 티커 (기준환율=dr.base 노출) */}
      <section className="rate-ticker">
        <span className="rt-label">{t('home.rate.label')}</span>
        <div className="rt-items">
          {RATE_TICKER.map((c) => {
            const dr = getDisplayRates(c)
            return (
              <span className="rt-item" key={c}>
                <span className="rt-flag">{CURRENCY_META[c]?.flag}</span>
                <span className="rt-code">{c}</span>
                <span className="rt-val">{formatNumber(dr.base)}</span>
              </span>
            )
          })}
        </div>
      </section>

      {/* 3. 이용 방법 (3단계) */}
      <section className="home-sec how-sec">
        <div className="home-sec-head">
          <h2 className="home-sec-title">{t('home.how.title')}</h2>
          <p className="home-sec-sub">{t('home.how.sub')}</p>
        </div>
        <div className="how-steps">
          {HOW_STEPS.map((s, i) => (
            <div className="how-step" key={s}>
              <div className="how-step-num">{i + 1}</div>
              <div className="how-step-t">{t(`home.how.${s}t`)}</div>
              <div className="how-step-d">{t(`home.how.${s}d`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 왜 머니박스 (혜택 4) */}
      <section className="home-sec why-sec">
        <div className="home-sec-head">
          <h2 className="home-sec-title">{t('home.why.title')}</h2>
        </div>
        <div className="why-grid">
          {WHY_ITEMS.map((it) => (
            <div className="why-item" key={it.k}>
              <div className="why-emoji" aria-hidden="true">{it.emoji}</div>
              <div className="why-t">{t(`home.why.${it.k}t`)}</div>
              <div className="why-d">{t(`home.why.${it.k}d`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 인기 지점 */}
      <section className="home-sec loc-sec">
        <div className="home-sec-head">
          <h2 className="home-sec-title">{t('home.loc.title')}</h2>
          <p className="home-sec-sub">{t('home.loc.sub')}</p>
        </div>
        <div className="loc-chips">
          {POPULAR_LOCS.map((l) => (
            <button
              key={l.key}
              type="button"
              className="loc-chip"
              onClick={() => nav('/site/branches')}
            >
              <span className="loc-emoji" aria-hidden="true">{l.emoji}</span>
              {t(`home.loc.${l.key}`)}
            </button>
          ))}
        </div>
        <button className="btn ghost loc-all" onClick={() => nav('/site/branches')}>
          {t('home.loc.cta')} →
        </button>
      </section>

      {/* 6. FAQ */}
      <section className="home-sec faq-sec">
        <div className="home-sec-head">
          <h2 className="home-sec-title">{t('home.faq.title')}</h2>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((q, i) => (
            <details className="faq-item" key={q} open={i === 0}>
              <summary className="faq-q">{t(`home.faq.${q}`)}</summary>
              <div className="faq-a">{t(`home.faq.a${i + 1}`)}</div>
            </details>
          ))}
        </div>
      </section>

      {/* 7. 하단 CTA 밴드 */}
      <section className="home-cta">
        <div className="home-cta-inner">
          <h2 className="home-cta-title">{t('home.cta.title')}</h2>
          <p className="home-cta-sub">{t('home.cta.sub')}</p>
          <button className="btn home-cta-btn" onClick={() => nav('/site/book')}>
            {t('home.cta.btn')}
          </button>
        </div>
      </section>
    </div>
  )
}
