import { useI18n } from '../i18n/I18nContext.jsx'

export default function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button className={lang === 'ko' ? 'active' : ''} onClick={() => setLang('ko')}>
        한국어
      </button>
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
        EN
      </button>
    </div>
  )
}
