import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import DevNote from '../components/DevNote.jsx'

// 선불카드 — 프로토타입에서는 안내(플레이스홀더) 페이지만 제공한다.
// 실제 구매/충전 기능은 구현하지 않음 (Out of Scope).
// TODO: 실제 선불카드 상품 상세/구매 플로우로 교체
export default function PrepaidCardPage() {
  const { t } = useI18n()
  const nav = useNavigate()

  return (
    <div>
      <h1>{t('prepaid.title')}</h1>
      <div className="card">
        <div className="hc-icon" style={{ fontSize: 40 }}>💳</div>
        <p className="lead">{t('prepaid.lead')}</p>
        <ul className="feature-list">
          <li>{t('prepaid.point1')}</li>
          <li>{t('prepaid.point2')}</li>
          <li>{t('prepaid.point3')}</li>
        </ul>
        <p className="muted">{t('prepaid.soon')}</p>
        <button className="btn ghost" onClick={() => nav('/site')}>
          ← {t('prepaid.back')}
        </button>
      </div>

      <DevNote
        items={[
          '"선불카드" 서비스 카드에서 진입하는 안내(플레이스홀더) 화면.',
          '실제 상품 상세·구매·충전 기능은 미구현 (Out of Scope).',
        ]}
      />
    </div>
  )
}
