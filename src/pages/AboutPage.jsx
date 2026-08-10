import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'

// 회사 소개 페이지 — 외국인 웹사이트 "회사 소개" 메뉴 진입점.
// 기존 사이트 디자인 컴포넌트를 재사용하고, 모든 문구는 i18n(ko/en).
// 회사 정보는 프로젝트에 등록된 실제 정보만 사용(미등록 항목은 [TBD]).
export default function AboutPage() {
  const { t } = useI18n()
  const nav = useNavigate()

  const services = [
    { icon: '💱', t: 'about.svc.fx.t', d: 'about.svc.fx.d' },
    { icon: '🏦', t: 'about.svc.branch.t', d: 'about.svc.branch.d' },
    { icon: '🖥️', t: 'about.svc.kiosk.t', d: 'about.svc.kiosk.d' },
    { icon: '💳', t: 'about.svc.card.t', d: 'about.svc.card.d' },
    { icon: '🧳', t: 'about.svc.travel.t', d: 'about.svc.travel.d' },
  ]
  const features = [
    { icon: '🙋', t: 'about.feat.1.t', d: 'about.feat.1.d' },
    { icon: '🌐', t: 'about.feat.2.t', d: 'about.feat.2.d' },
    { icon: '🔗', t: 'about.feat.3.t', d: 'about.feat.3.d' },
    { icon: '📍', t: 'about.feat.4.t', d: 'about.feat.4.d' },
  ]

  return (
    <div>
      <h1>{t('about.title')}</h1>
      <p className="muted" style={{ maxWidth: 660 }}>
        {t('about.lead')}
      </p>

      {/* 주요 서비스 */}
      <section className="home-section">
        <h2 className="home-h2">{t('about.svc.h2')}</h2>
        <div className="hero-cards">
          {services.map((s) => (
            <div className="hero-card" key={s.t}>
              <div className="hc-icon">{s.icon}</div>
              <div className="hc-t">{t(s.t)}</div>
              <div className="hc-d">{t(s.d)}</div>
            </div>
          ))}
        </div>
        <div className="notice info" style={{ marginTop: 16, marginBottom: 0 }}>
          🔗 {t('about.svc.note')}
        </div>
      </section>

      {/* 서비스 특징 */}
      <section className="home-section">
        <h2 className="home-h2">{t('about.feat.h2')}</h2>
        <div className="hero-cards">
          {features.map((f) => (
            <div className="hero-card" key={f.t}>
              <div className="hc-icon">{f.icon}</div>
              <div className="hc-t">{t(f.t)}</div>
              <div className="hc-d">{t(f.d)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 운영 네트워크 */}
      <section className="home-section">
        <h2 className="home-h2">{t('about.net.h2')}</h2>
        <p className="home-sub">{t('about.net.d')}</p>
        <div className="hero-cards">
          <div className="hero-card">
            <div className="hc-icon">🏦</div>
            <div className="hc-t">{t('about.net.branch.t')}</div>
            <div className="hc-d">{t('about.net.branch.d')}</div>
            <button className="btn ghost" onClick={() => nav('/site/book')}>
              {t('about.net.cta.branch')}
            </button>
          </div>
          <div className="hero-card">
            <div className="hc-icon">🖥️</div>
            <div className="hc-t">{t('about.net.kiosk.t')}</div>
            <div className="hc-d">{t('about.net.kiosk.d')}</div>
            <button className="btn ghost" onClick={() => nav('/site')}>
              {t('about.net.cta.home')}
            </button>
          </div>
        </div>
        <p className="tiny" style={{ marginTop: 14, textAlign: 'center' }}>
          📍 {t('about.net.spots')}
        </p>
      </section>

      {/* 회사 정보 */}
      <section className="home-section">
        <h2 className="home-h2">{t('about.info.h2')}</h2>
        <div className="card">
          <div className="summary">
            <div className="row">
              <span className="k">{t('about.info.name.k')}</span>
              <span className="v">{t('about.info.name.v')}</span>
            </div>
            <div className="row">
              <span className="k">{t('about.info.ceo.k')}</span>
              <span className="v">{t('about.info.ceo.v')}</span>
            </div>
            <div className="row">
              <span className="k">{t('about.info.reg.k')}</span>
              <span className="v">{t('about.info.reg.v')}</span>
            </div>
            <div className="row">
              <span className="k">{t('about.info.addr.k')}</span>
              <span className="v">{t('about.info.addr.v')}</span>
            </div>
            <div className="row">
              <span className="k">{t('about.info.tel.k')}</span>
              <span className="v" style={{ color: 'var(--text-3)', fontWeight: 600 }}>
                {t('about.info.tel.v')}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
