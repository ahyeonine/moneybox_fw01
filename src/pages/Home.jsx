import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function Home() {
  const { t } = useI18n()
  const nav = useNavigate()
  const features = [
    { i: '🔒', t: t('home.feature.1.t'), d: t('home.feature.1.d') },
    { i: '🏦', t: t('home.feature.2.t'), d: t('home.feature.2.d') },
    { i: '📍', t: t('home.feature.3.t'), d: t('home.feature.3.d') },
  ]
  return (
    <div>
      <section className="hero">
        <h1>{t('home.hero.title')}</h1>
        <p>{t('home.hero.sub')}</p>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn primary" onClick={() => nav('/book')}>
            {t('home.cta.book')}
          </button>
          <button className="btn ghost" onClick={() => nav('/lookup')}>
            {t('home.cta.lookup')}
          </button>
        </div>
      </section>

      <div className="features">
        {features.map((f, i) => (
          <div className="card feature" key={i}>
            <div className="fi">{f.i}</div>
            <div className="ft">{f.t}</div>
            <div className="fd">{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
