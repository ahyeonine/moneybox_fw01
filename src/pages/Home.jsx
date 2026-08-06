import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { CURRENCY_ORDER, CURRENCY_META } from '../data/rates.js'
import { useRates } from '../store/RatesContext.jsx'
import { formatNumber } from '../lib/format.js'
import DevNote from '../components/DevNote.jsx'

// 외국인 웹사이트 랜딩 홈. 마케팅용 더미 데이터. 공항수령 관련 내용 없음.
const RATE_TICKER = CURRENCY_ORDER.slice(0, 8)

const REVIEWS = [
  { n: 'Y', tag: '#명동점에서 빠르게 환전', star: 5, text: '전날 저녁에 예약했는데 지점에서 5분 만에 받았어요. 줄 안 서서 좋았습니다.' },
  { n: 'O', tag: '#여행 전 간단하게 환전', star: 5, text: '환율도 미리 확정돼서 안심이었고 절차가 정말 간단했어요.' },
  { n: 'K', tag: '#입력 단위 자동 보정', star: 5, text: '금액을 잘못 넣어도 알아서 맞춰줘서 편했습니다. 다음에도 이용할게요.' },
  { n: 'T', tag: '#원화 구매도 간편', star: 5, text: '원화가 필요해서 이용했는데 방문 전에 준비돼 있어서 기다림이 없었어요.' },
  { n: 'S', tag: '#강남점 이용', star: 5, text: '앱 없이 웹에서 바로 예약돼서 좋았어요. 이메일로 확인도 오고요.' },
  { n: 'H', tag: '#처음 이용', star: 4, text: '처음이라 걱정했는데 안내가 친절해서 어렵지 않게 마쳤습니다.' },
  { n: 'R', tag: '#eSIM도 같이', star: 5, text: '환전이랑 eSIM을 한 곳에서 준비할 수 있어 편리했습니다.' },
  { n: 'L', tag: '#simple & fast', star: 5, text: 'Easy to reserve online and pick up at the branch. Highly recommend.' },
]

const REGIONS = [
  { name: '수도권', count: '30+', x: 44, y: 24 },
  { name: '영남권', count: '30+', x: 60, y: 55 },
  { name: '호남권', count: '10+', x: 34, y: 62 },
  { name: '제주권', count: '30+', x: 34, y: 90 },
]

export default function Home() {
  const { t, lang } = useI18n()
  const { getDisplayRates } = useRates() // 실시간 환율(2분 주기 자동 변동)
  const nav = useNavigate()
  const [svcTab, setSvcTab] = useState('branch')

  return (
    <div className="home">
      <DevNote
        items={[
          '공항수령 서비스는 이번 버전에서 제외됨',
          '서비스 카드 3종: 지점수령(예약 플로우) · 선불카드(안내 플레이스홀더) · eSIM(외부 더미링크)',
          '상단 "실시간 환율" 티커는 공유 환율 상태(2분마다 ±0.1~0.5% 자동 변동) 값을 표시 — 관리자(CEMS 환전율관리) 변경도 반영됨',
        ]}
      />

      {/* 1. 히어로 */}
      <section className="hero-hd">
        <div className="hero-hd-copy">
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
            <div className="hc-icon">💳</div>
            <div className="hc-t">{t('home.card.prepaid.t')}</div>
            <div className="hc-d">{t('home.card.prepaid.d')}</div>
            <button className="btn primary" onClick={() => nav('/site/prepaid')}>
              {t('home.card.prepaid.cta')}
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

      {/* 2. 실시간 환율 티커 */}
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

      {/* 3. 서비스 소개 */}
      <section className="home-section">
        <h2 className="home-h2">{t('home.svc.title')}</h2>
        <div className="visit-toggle svc-toggle">
          <button className={svcTab === 'branch' ? 'active' : ''} onClick={() => setSvcTab('branch')}>
            {t('home.svc.tab.branch')}
          </button>
          <button className={svcTab === 'esim' ? 'active' : ''} onClick={() => setSvcTab('esim')}>
            {t('home.svc.tab.esim')}
          </button>
        </div>
        <div className="svc-showcase">
          <div className="svc-device">
            <div className="svc-device-screen">{svcTab === 'branch' ? '🏦💱' : '📶'}</div>
          </div>
          <div className="svc-cap">
            <div className="svc-cap-t">
              {svcTab === 'branch' ? t('home.svc.branch.cap') : t('home.svc.esim.cap')}
            </div>
            <div className="svc-cap-d">
              {svcTab === 'branch' ? t('home.svc.branch.sub') : t('home.svc.esim.sub')}
            </div>
          </div>
        </div>
      </section>

      {/* 4. 통계 + 후기 */}
      <section className="home-section stats-section">
        <h2 className="home-h2">{t('home.stats.title')}</h2>
        <div className="stat-row">
          <div className="stat-item">
            <div className="si-icon">👥</div>
            <div className="si-l">{t('home.stats.customers.l')}</div>
            <div className="si-v">{t('home.stats.customers.v')}</div>
          </div>
          <div className="stat-item">
            <div className="si-icon">⏱️</div>
            <div className="si-l">{t('home.stats.time.l')}</div>
            <div className="si-v">{t('home.stats.time.v')}</div>
          </div>
          <div className="stat-item">
            <div className="si-icon">💬</div>
            <div className="si-l">{t('home.stats.sat.l')}</div>
            <div className="si-v">{t('home.stats.sat.v')}</div>
          </div>
        </div>
        <div className="review-grid">
          {REVIEWS.map((r, i) => (
            <div className="review-card" key={i}>
              <div className="rv-head">
                <span className={`rv-avatar a${i % 4}`}>{r.n}</span>
                <div>
                  <div className="rv-tag">{r.tag}</div>
                  <div className="rv-star">{'★'.repeat(r.star)}</div>
                </div>
              </div>
              <div className="rv-text">{r.text}</div>
            </div>
          ))}
        </div>
        <div className="tiny stats-note">{t('home.stats.note')}</div>
      </section>

      {/* 5. 전국 지점/무인기 */}
      <section className="home-section map-section">
        <h2 className="home-h2">{t('home.map.title')}</h2>
        <p className="home-sub">{t('home.map.sub')}</p>
        <div className="map-split">
          <div className="kr-map">
            {REGIONS.map((rg) => (
              <div className="kr-pin" key={rg.name} style={{ left: `${rg.x}%`, top: `${rg.y}%` }}>
                <span className="kr-pin-name">{rg.name}</span>
                <span className="kr-pin-count">{rg.count}</span>
              </div>
            ))}
          </div>
          <div className="map-cards">
            <div className="map-card">
              <div className="mc-thumb">🏦</div>
              <div>
                <div className="mc-l">{t('home.map.branch.l')}</div>
                <div className="mc-v">{t('home.map.branch.v')}</div>
                <button className="btn ghost" onClick={() => nav('/site/book')}>
                  {t('home.map.branch.cta')}
                </button>
              </div>
            </div>
            <div className="map-card">
              <div className="mc-thumb">🏧</div>
              <div>
                <div className="mc-l">{t('home.map.kiosk.l')}</div>
                <div className="mc-v">{t('home.map.kiosk.v')}</div>
                <button className="btn ghost" onClick={() => {}}>
                  {t('home.map.kiosk.cta')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 도움 */}
      <section className="home-section help-section">
        <h2 className="home-h2">{t('home.help.title')}</h2>
        <div className="help-btns">
          <button className="btn ghost" onClick={() => {}}>
            ✉️ {t('home.help.email')}
          </button>
          <button className="btn ghost" onClick={() => {}}>
            ☎️ {t('home.help.call')}
          </button>
        </div>
      </section>

      {/* 7. 비즈니스 CTA */}
      <section className="biz-cta">
        <div className="biz-mark">M</div>
        <div className="biz-copy">
          <div className="biz-t">{t('home.biz.title')}</div>
          <div className="biz-d">{t('home.biz.sub')}</div>
        </div>
        <button className="btn primary" onClick={() => nav('/site/about')}>
          {t('home.biz.cta')}
        </button>
      </section>
    </div>
  )
}
