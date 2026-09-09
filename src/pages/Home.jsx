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

          {/* 카드 비주얼 (WOWPASS의 떠있는 카드 자리 — 블루 그라데이션) */}
          <div className="wp-hero-visual" aria-hidden="true">
            <div className="wp-card">
              <div className="wp-card-head">
                <span className="wp-card-brand">
                  MONEY<span>BOX</span>
                </span>
                <span className="wp-card-chip">💳</span>
              </div>
              <div className="wp-card-benefit">
                <div className="wp-card-bt">{t('home.card2.t')}</div>
                <div className="wp-card-bd">{t('home.card2.d')}</div>
              </div>
              <div className="wp-card-langs">🌏 EN · 中文 · 日本語 · 한국어</div>
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
