import { useI18n } from '../i18n/I18nContext.jsx'

// 언어 선택 드롭다운 (외국인 웹사이트 헤더 우측)
export default function LanguageDropdown() {
  const { lang, setLang, t } = useI18n()
  return (
    <label className="lang-dd" aria-label={t('site.lang')}>
      <span className="globe">🌐</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)}>
        <option value="ko">한국어</option>
        <option value="en">English</option>
      </select>
    </label>
  )
}
