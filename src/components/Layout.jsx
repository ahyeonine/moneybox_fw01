import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import LanguageToggle from './LanguageToggle.jsx'

export default function Layout() {
  const { t } = useI18n()
  const nav = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/book', label: t('nav.book') },
    { to: '/lookup', label: t('nav.lookup') },
    { to: '/esim', label: t('nav.esim') },
    { to: '/about', label: t('nav.about') },
    { to: '/operator', label: t('nav.operator') },
  ]
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <span className="dot" />
            MoneyBox
          </NavLink>
          <span className="spacer" />
          <LanguageToggle />
        </div>
      </header>
      <nav className="mainnav">
        <div className="mainnav-inner">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        MoneyBox FX Reservation · Prototype (mock data, no backend) · © 2026
      </footer>
    </div>
  )
}
