import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'

// 공항 수령 — Out of Scope. 클릭 시 미운영 안내만.
export default function AirportPage() {
  const { t } = useI18n()
  const nav = useNavigate()
  return (
    <div>
      <h1>{t('airport.title')}</h1>
      <div className="card">
        <div className="notice warn">{t('airport.body')}</div>
        <button className="btn primary" onClick={() => nav('/site')}>
          {t('airport.goBranch')}
        </button>
      </div>
    </div>
  )
}
