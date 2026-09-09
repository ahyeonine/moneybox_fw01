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

export default function Home() {
  const { t } = useI18n()
  const { getDisplayRates } = useRates() // 실시간 환율(2분 주기 자동 변동)
  const nav = useNavigate()

  return (
    <div className="home">
      <DevNote
        items={[
          '환율 아래 영역은 기존 사이트와 동일 — 프로토타입에서는 안내 문구로 대체(공항수령 제외, 디자인 참고)',
          '자세히: 02_사이트맵.md',
        ]}
      />

      {/* 1. 히어로 */}
      <section className="hero-hd">
        <div className="hero-hd-copy">
          {/* 외국인 친화: 다국어 지원을 한눈에 보여주는 배지 */}
          <div className="hero-eyebrow">
            <span className="he-globe" aria-hidden="true">🌏</span>
            <span className="he-langs">English · 中文 · 日本語 · 한국어</span>
          </div>
          <h1>{t('home.hero.title')}</h1>
          <p>{t('home.hero.sub')}</p>
        </div>
        <div className="hero-cards">
          <div className="hero-card">
            <div className="hc-icon">🏦</div>
            <div className="hc-t">{t('home.card.branch.t')}</div>
            <div className="hc-d">{t('home.card.branch.d')}</div>
            <button className="btn primary" onClick={() => nav('/site/book')}>
              {t('home.card.branch.cta')}
            </button>
          </div>
          <div className="hero-card">
            <div className="hc-icon">📶</div>
            <div className="hc-t">{t('home.card.esim.t')}</div>
            <div className="hc-d">{t('home.card.esim.d')}</div>
            <button className="btn primary" onClick={() => nav('/site/esim')}>
              {t('home.card.esim.cta')}
            </button>
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
