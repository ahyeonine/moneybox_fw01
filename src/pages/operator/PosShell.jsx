import { useI18n } from '../../i18n/I18nContext.jsx'
import LanguageToggle from '../../components/LanguageToggle.jsx'
import SimBar from '../../components/SimBar.jsx'
import TransactionProcess from './TransactionProcess.jsx'

// 탭 3 · POS: 예약번호 조회 → 신분증 대조 → 거래처리. 자동취소 시뮬레이션 바 유지.
export default function PosShell() {
  const { t } = useI18n()
  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header-inner">
          <span className="admin-brand">POS · {t('op.tx.title')}</span>
          <span className="spacer" />
          <LanguageToggle />
        </div>
      </header>
      <main className="content">
        <SimBar />
        <div style={{ marginTop: 16 }}>
          <TransactionProcess />
        </div>
      </main>
    </div>
  )
}
