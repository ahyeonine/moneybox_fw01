import { useI18n } from '../i18n/I18nContext.jsx'

// 회사소개 — 프로토타입에서는 더미 텍스트 (Out of Scope)
export default function AboutPage() {
  const { t } = useI18n()
  return (
    <div>
      <h1>{t('about.title')}</h1>
      <div className="card">
        <p className="muted">{t('about.body')}</p>
      </div>
    </div>
  )
}
