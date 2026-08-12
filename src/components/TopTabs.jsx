import { NavLink, Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useBooking } from '../store/BookingContext.jsx'

// 최상위 3개 탭: 외국인 웹사이트 / CEMS(어드민) / POS
// 데모 편의를 위한 화면 전환. 실제로는 서로 다른 사용자용 별도 시스템.
export default function TopTabs() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const { lastSitePath } = useBooking()
  // 외국인 웹사이트 탭은 마지막으로 머문 /site 하위 경로로 이동(첫 화면을 거치지 않음)
  const tabs = [
    { base: '/site', to: lastSitePath || '/site', label: t('top.site') },
    { base: '/cems', to: '/cems', label: t('top.cems') },
    { base: '/pos', to: '/pos', label: t('top.pos') },
  ]
  return (
    <div className="toptabs">
      <div className="toptabs-inner">
        {tabs.map((tab) => (
          <Link
            key={tab.base}
            to={tab.to}
            className={pathname.startsWith(tab.base) ? 'active' : ''}
          >
            {tab.label}
          </Link>
        ))}
        <NavLink to="/email" className={({ isActive }) => `toptabs-docs ${isActive ? 'active' : ''}`}>
          ✉️ 이메일
        </NavLink>
        <NavLink to="/docs" className={({ isActive }) => `toptabs-docs ${isActive ? 'active' : ''}`}>
          📄 기획문서
        </NavLink>
        <span className="toptabs-hint">{t('top.hint')}</span>
      </div>
    </div>
  )
}
