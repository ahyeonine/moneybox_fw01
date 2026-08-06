import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'

// 최상위 3개 탭: 외국인 웹사이트 / CEMS(어드민) / POS
// 데모 편의를 위한 화면 전환. 실제로는 서로 다른 사용자용 별도 시스템.
export default function TopTabs() {
  const { t } = useI18n()
  const tabs = [
    { to: '/site', label: t('top.site') },
    { to: '/cems', label: t('top.cems') },
    { to: '/pos', label: t('top.pos') },
  ]
  return (
    <div className="toptabs">
      <div className="toptabs-inner">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {tab.label}
          </NavLink>
        ))}
        <NavLink to="/docs" className={({ isActive }) => `toptabs-docs ${isActive ? 'active' : ''}`}>
          📄 기획문서
        </NavLink>
        <span className="toptabs-hint">{t('top.hint')}</span>
      </div>
    </div>
  )
}
