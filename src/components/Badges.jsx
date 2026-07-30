import { useI18n } from '../i18n/I18nContext.jsx'

export function StatusBadge({ status }) {
  const { t } = useI18n()
  return <span className={`badge ${status}`}>{t(`status.${status}`)}</span>
}

export function TxBadge({ type }) {
  const { t } = useI18n()
  return <span className={`badge ${type}`}>{t(`tx.${type}.short`)}</span>
}

export function ReminderBadge({ status }) {
  const { t } = useI18n()
  return <span className={`badge rem-${status}`}>{t(`reminder.${status}`)}</span>
}
