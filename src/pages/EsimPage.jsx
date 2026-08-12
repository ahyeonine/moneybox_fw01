import { useI18n } from '../i18n/I18nContext.jsx'

// eSIM — 프로토타입에서는 외부 링크 자리만 (Out of Scope)
// TODO: 실제 파트너 eSIM 페이지 URL 로 교체
const ESIM_EXTERNAL_URL = 'https://example.com/esim'

export default function EsimPage() {
  const { t } = useI18n()
  return (
    <div>
      <h1>{t('esim.title')}</h1>
      <div className="card">
        <p className="muted">{t('esim.body')}</p>
        <a className="btn primary" href={ESIM_EXTERNAL_URL} target="_blank" rel="noreferrer">
          {t('esim.link')} ↗
        </a>
      </div>
    </div>
  )
}
