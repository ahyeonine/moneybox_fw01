import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import LanguageToggle from '../../components/LanguageToggle.jsx'
import SimBar from '../../components/SimBar.jsx'
import TransactionProcess from './TransactionProcess.jsx'
import DevNote from '../../components/DevNote.jsx'

// POS 거래처리 화면: 예약번호 조회 → 거래완료. 자동취소 시뮬레이션 바 유지.
// POS 홈에서 "환전예약" 타일로 진입. "홈으로" 버튼으로 복귀.
export default function PosTransaction() {
  const { t } = useI18n()
  const nav = useNavigate()
  return (
    <div className="admin">
      <DevNote
        items={[
          '별도 본인인증·신분증 OCR 대조 없음 — 예약번호로 조회 후 바로 거래완료 (회원/로그인 없는 비대면 예약)',
          '베스트레이트 정산: 거래완료 시 예약환율 vs 오늘환율 비교 → 유리한 쪽 적용(실제적용환율/최종원화금액 별도 기록)',
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
