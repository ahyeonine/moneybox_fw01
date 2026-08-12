import { useI18n } from '../i18n/I18nContext.jsx'

export function StatusBadge({ status }) {
  const { t } = useI18n()
  return <span className={`badge ${status}`}>{t(`status.${status}`)}</span>
}
