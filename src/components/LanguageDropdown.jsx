import { useI18n } from '../i18n/I18nContext.jsx'

// 언어 선택 (외국인 웹사이트 헤더 우측)
// 외국인 친화: 현재 언어의 국기 + 이름 + ▾ 를 명확한 pill로 노출하고,
// 상호작용은 투명하게 겹쳐 둔 native <select> 가 담당한다(접근성·모바일 호환).
const LANGS = {
  ko: { flag: '🇰🇷', label: '한국어' },
  en: { flag: '🇺🇸', label: 'English' },
}

export default function LanguageDropdown() {
  const { lang, setLang, t } = useI18n()
  const cur = LANGS[lang] || LANGS.ko
  return (
    <div className="lang-dd">
      <span className="globe" aria-hidden="true">🌐</span>
      <span className="lang-cur">
        <span className="lang-flag" aria-hidden="true">{cur.flag}</span>
        <span className="lang-name">{cur.label}</span>
      </span>
      <span className="lang-caret" aria-hidden="true">▾</span>
      <select aria-label={t('site.lang')} value={lang} onChange={(e) => setLang(e.target.value)}>
        <option value="ko">🇰🇷 한국어</option>
        <option value="en">🇺🇸 English</option>
      </select>
    </div>
  )
}
