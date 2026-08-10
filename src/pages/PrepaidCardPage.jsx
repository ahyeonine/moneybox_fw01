import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import DevNote from '../components/DevNote.jsx'

// 선불카드(카드) 페이지 — 외국인 웹사이트 "카드" 메뉴 진입점.
// 기존 사이트 디자인 컴포넌트(.home-section/.card/.summary/.hero-cards/.feature-list)를 재사용.
// 모든 문구는 i18n(ko/en). 실제 구매/충전 기능은 프로토타입 범위 밖(안내 위주).
export default function PrepaidCardPage() {
  const { t } = useI18n()
  const nav = useNavigate()

  return (
    <div>
      <h1>{t('prepaid.title')}</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        {t('prepaid.lead')}
      </p>

      {/* 두 지갑 */}
      <section className="home-section">
        <h2 className="home-h2">{t('prepaid.wallets.h2')}</h2>
        <p className="home-sub">{t('prepaid.wallets.sub')}</p>
        <div className="hero-cards">
          <div className="hero-card mb-wallet mb-wallet-pay">
            <div className="hc-icon">💳</div>
            <div className="hc-t">{t('prepaid.wallet.pay.t')}</div>
            <div className="hc-d">{t('prepaid.wallet.pay.d')}</div>
          </div>
          <div className="hero-card mb-wallet mb-wallet-transit">
            <div className="hc-icon">🚇</div>
            <div className="hc-t">{t('prepaid.wallet.transit.t')}</div>
            <div className="hc-d">{t('prepaid.wallet.transit.d')}</div>
          </div>
        </div>
      </section>

      {/* 카드 기본 정보 */}
      <section className="home-section">
        <h2 className="home-h2">{t('prepaid.basics.h2')}</h2>
        <div className="card">
          <div className="summary">
            <div className="row">
              <span className="k">{t('prepaid.basics.fee.k')}</span>
              <span className="v">{t('prepaid.basics.fee.v')}</span>
            </div>
            <div className="row">
              <span className="k">{t('prepaid.basics.max.k')}</span>
              <span className="v">{t('prepaid.basics.max.v')}</span>
            </div>
            <div className="row">
              <span className="k">{t('prepaid.basics.name.k')}</span>
              <span className="v">{t('prepaid.basics.name.v')}</span>
            </div>
            <div className="row">
              <span className="k">{t('prepaid.basics.over.k')}</span>
              <span className="v">{t('prepaid.basics.over.v')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 충전 방법 */}
      <section className="home-section">
        <h2 className="home-h2">{t('prepaid.topup.h2')}</h2>
        <div className="card">
          <div className="summary">
            <div className="row">
              <span className="k">{t('prepaid.topup.cash.k')}</span>
              <span className="v">{t('prepaid.topup.both')}</span>
            </div>
            <div className="row">
              <span className="k">{t('prepaid.topup.fx.k')}</span>
              <span className="v">{t('prepaid.topup.both')}</span>
            </div>
            <div className="row">
              <span className="k">{t('prepaid.topup.pay.k')}</span>
              <span className="v">{t('prepaid.topup.transitOnly')}</span>
            </div>
          </div>
          <div className="notice info" style={{ marginTop: 14, marginBottom: 0 }}>
            💡 {t('prepaid.topup.note')}
          </div>
        </div>
      </section>

      {/* 어디에서 받나요 */}
      <section className="home-section">
        <h2 className="home-h2">{t('prepaid.where.h2')}</h2>
        <div className="hero-cards">
          <div className="hero-card">
            <div className="hc-icon">🖥️</div>
            <div className="hc-t">{t('prepaid.where.kiosk.t')}</div>
            <div className="hc-d">{t('prepaid.where.kiosk.d')}</div>
            <ul className="feature-list mb-feature">
              <li>{t('prepaid.where.kiosk.f1')}</li>
              <li>{t('prepaid.where.kiosk.f2')}</li>
              <li>{t('prepaid.where.kiosk.f3')}</li>
            </ul>
          </div>
          <div className="hero-card">
            <div className="hc-icon">🏪</div>
            <div className="hc-t">{t('prepaid.where.branch.t')}</div>
            <div className="hc-d">{t('prepaid.where.branch.d')}</div>
            <ul className="feature-list mb-feature">
              <li>{t('prepaid.where.branch.f1')}</li>
              <li>{t('prepaid.where.branch.f2')}</li>
              <li>{t('prepaid.where.branch.f3')}</li>
              <li>{t('prepaid.where.branch.f4')}</li>
            </ul>
          </div>
        </div>
        <p className="tiny" style={{ marginTop: 14, textAlign: 'center' }}>
          {t('prepaid.where.note')}
        </p>
        <div className="btn-row" style={{ maxWidth: 460, margin: '18px auto 0' }}>
          <button className="btn ghost" onClick={() => nav('/site')}>
            {t('prepaid.cta.kiosk')}
          </button>
          <button className="btn primary" onClick={() => nav('/site/book')}>
            {t('prepaid.cta.branch')}
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section">
        <h2 className="home-h2">{t('prepaid.faq.h2')}</h2>
        <div className="card mb-faq">
          {[1, 2, 3, 4].map((i) => (
            <details className="mb-faq-item" key={i}>
              <summary>
                {t(`prepaid.faq.q${i}`)}
                <span className="mb-faq-chev" aria-hidden="true">⌄</span>
              </summary>
              <div className="mb-faq-a">{t(`prepaid.faq.a${i}`)}</div>
            </details>
          ))}
        </div>
      </section>

      <DevNote
        items={[
          '올인원 선불카드 소개 페이지. 기존 사이트 디자인 컴포넌트 재사용, 문구는 i18n(ko/en).',
          '실제 상품 구매·충전 기능은 프로토타입 범위 밖(안내 위주).',
          '자세히: 02_사이트맵.md',
        ]}
      />
    </div>
  )
}
