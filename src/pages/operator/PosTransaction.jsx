import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import LanguageToggle from '../../components/LanguageToggle.jsx'
import SimBar from '../../components/SimBar.jsx'
import TransactionProcess from './TransactionProcess.jsx'
import DevNote from '../../components/DevNote.jsx'

// POS 거래처리 화면: 예약번호 조회 → 신분증 대조 → 거래완료. 자동취소 시뮬레이션 바 유지.
// POS 홈에서 "환전예약" 타일로 진입. "홈으로" 버튼으로 복귀.
export default function PosTransaction() {
  const { t } = useI18n()
  const nav = useNavigate()
  return (
    <div className="admin">
      <DevNote
        items={[
          '신분증 대조 시 예약자명과 실제 방문자 명의가 달라도 그대로 진행 가능 (정책상 동일성 요구 안 함)',
          '환전구분(매입/매출) 확인 후 처리',
          '자세히: 05_어드민기능정의서.md',
        ]}
      />
      <header className="admin-header">
        <div className="admin-header-inner">
          <button className="cems-logout" onClick={() => nav('/pos')}>
            ‹ 홈으로
          </button>
          <span className="admin-brand" style={{ marginLeft: 12 }}>
            POS · {t('op.tx.title')}
          </span>
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
