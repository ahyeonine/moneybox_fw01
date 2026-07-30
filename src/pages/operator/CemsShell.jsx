import { useI18n } from '../../i18n/I18nContext.jsx'
import LanguageToggle from '../../components/LanguageToggle.jsx'
import PrepList from './PrepList.jsx'

// 탭 2 · CEMS (어드민): 지점 운영자 신규예약 리스트 (시재 준비용 조회 화면)
export default function CemsShell() {
  const { t } = useI18n()
  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header-inner">
          <span className="admin-brand">CEMS · {t('op.title')}</span>
          <span className="spacer" />
          <LanguageToggle />
        </div>
      </header>
      <main className="content">
        <PrepList />
      </main>
    </div>
  )
}
