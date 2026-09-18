import { NavLink, Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'

// 최상위 탭: 외국인 웹사이트 / CEMS(어드민) / POS (+ 이메일 · 기획문서)
// 데모 편의를 위한 화면 전환. 실제로는 서로 다른 사용자용 별도 시스템.
export default function TopTabs() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const tabs = [
    { base: '/site', to: '/site', label: t('top.site') },
    { base: '/cems', to: '/cems', label: t('top.cems') },
    { base: '/pos', to: '/pos', label: t('top.pos') },
    { base: '/future', to: '/future', label: '🧳 통합예약(컨셉)' },
  ]
  return (
    <div className="toptabs">
      <div className="toptabs-inner">
        {tabs.map((tab) => {
          const active = pathname === tab.base || pathname.startsWith(tab.base + '/')
          return (
            <Link key={tab.base} to={tab.to} className={active ? 'active' : ''}>
              {tab.label}
            </Link>
          )
        })}
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
