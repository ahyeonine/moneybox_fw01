import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { CURRENCY_ORDER, CURRENCY_META } from '../data/rates.js'
import { useRates } from '../store/RatesContext.jsx'
import { formatNumber } from '../lib/format.js'
import DevNote from '../components/DevNote.jsx'

// 외국인 웹사이트 랜딩 홈 (프로토타입).
// 히어로 + 실시간 기준환율 티커까지만 노출하고, 그 아래는 기존 사이트와 동일하므로
// 별도 구현 없이 안내 문구만 표시한다(공항수령 제외 → 디자인 참고).
const RATE_TICKER = CURRENCY_ORDER.slice(0, 8)

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
      2600
    )
    return () => clearTimeout(id)
  }, [scenarioIdx])

  // 머니박스보다 덜 받는 금액 문구 (언어별)
  const lessLabel = (won) =>
    lang === 'en'
      ? `≈ ₩${formatNumber(won)} ${t('home.cmp.less')}`
      : `약 ${formatNumber(won)}원 ${t('home.cmp.less')}`

  return (
    <div className="home">
      <DevNote
        items={[
          '환율 아래 영역은 기존 사이트와 동일 — 프로토타입에서는 안내 문구로 대체(공항수령 제외, 디자인 참고)',
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
            <h1 className="wp-title">{t('home.hero.title')}</h1>
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
              </div>

              {/* 환전 금액 시나리오 토글 (자동 회전 + 클릭 선택) */}
              <div className="wpc-toggle" role="tablist" aria-label="amount">
                {COMPARE_SCENARIOS.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    role="tab"
                    aria-selected={i === scenarioIdx}
                    className={`wpc-toggle-btn${i === scenarioIdx ? ' is-on' : ''}`}
                    onClick={() => setScenarioIdx(i)}
                  >
                    <span className="wpc-toggle-flag" aria-hidden="true">{s.flag}</span>
                    {s.amount}
                  </button>
                ))}
              </div>

              <ul className="wpc-rows">
                <li className="wpc-row is-best">
                  <div className="wpc-row-top">
                    <span className="wpc-name">{t('home.cmp.mb')}</span>
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
                      {/* key에 scenarioIdx를 넣어 통화가 바뀔 때마다 금액이 카드 넘기듯 갱신 */}
                      <span className="wpc-tag wpc-neg" key={scenarioIdx}>
                        {lessLabel(scenario.rows[key].less)}
                      </span>
                    </div>
                    <span className="wpc-bar-wrap">
                      <span className="wpc-bar" style={{ width: `${scenario.rows[key].bar}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
              <div className="wpc-note">{t('home.cmp.note')}</div>
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

      {/* 환율 아래 영역: 기존 페이지와 동일 → 안내 문구로 대체 */}
      <div className="same-as-existing">{t('home.rate.same')}</div>
    </div>
  )
}
