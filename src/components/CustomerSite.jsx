import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import LanguageDropdown from './LanguageDropdown.jsx'
import Logo from './Logo.jsx'

// 외국인 웹사이트 (고객용) 헤더 + 네비게이션.
// 좌측 로고 / 중앙 네비(지점수령·공항수령·eSIM·회사소개) / 우측 언어 드롭다운. 로그인 없음.
export default function CustomerSite() {
  const { t } = useI18n()
  const nav = [
    { to: '/site', label: t('site.nav.branch'), end: true },
    { to: '/site/airport', label: t('site.nav.airport') },
    { to: '/site/esim', label: t('site.nav.esim') },
    { to: '/site/about', label: t('site.nav.about') },
  ]
  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <Logo to="/site" />
          <nav className="site-nav">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <span className="spacer" />
          <LanguageDropdown />
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <NavLink to="/site/lookup">{t('nav.lookup')}</NavLink> · MoneyBox FX Reservation · Prototype
      </footer>
    </div>
  )
}
