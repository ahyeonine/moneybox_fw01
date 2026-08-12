import { useI18n } from '../i18n/I18nContext.jsx'

export function StatusBadge({ status }) {
  const { t } = useI18n()
  return <span className={`badge ${status}`}>{t(`status.${status}`)}</span>
}

// 직원용(CEMS/POS) 환전구분 뱃지 — 내부값 표기(매입/매출)
export function TxBadge({ type }) {
  const { t } = useI18n()
  return <span className={`badge ${type}`}>{t(`tx.${type}.short`)}</span>
}

// 고객용(외국인 웹사이트) 환전구분 뱃지 — 고객 라벨(외화 구매/원화 구매)
export function CustomerTxBadge({ type }) {
  const { t } = useI18n()
  return <span className={`badge ${type}`}>{t(`txc.${type}`)}</span>
}

export function ReminderBadge({ status }) {
  const { t } = useI18n()
  return <span className={`badge rem-${status}`}>{t(`reminder.${status}`)}</span>
}
