import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useBooking } from '../store/BookingContext.jsx'
import LanguageDropdown from './LanguageDropdown.jsx'
import Logo from './Logo.jsx'

// 외국인 웹사이트 (고객용) 헤더 + 네비게이션.
// 좌측 로고 / 중앙 네비(지점수령·eSIM·회사소개) / 우측 언어 드롭다운. 공항수령 없음, 로그인 없음.
export default function CustomerSite() {
  const { t } = useI18n()
  const location = useLocation()
  const { setLastSitePath } = useBooking()
  // 외국인 웹사이트 내에서 머문 마지막 경로를 기억 → 다른 메뉴 갔다 복귀 시 이 경로로 바로 이동
  useEffect(() => {
    setLastSitePath(location.pathname + location.search)
  }, [location.pathname, location.search, setLastSitePath])
  const nav = [
    { to: '/site/book', label: t('site.nav.branch') },
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
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <span className="spacer" />
          <LanguageDropdown />
        </div>
      </header>
      <main className="content site-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="sf-brand">
            <div className="sf-logo">
              MONEY<span>BOX</span>
            </div>
            <div className="sf-company">{t('footer.company')}</div>
            <div className="sf-addr">{t('footer.addr')}</div>
            <div className="sf-addr">{t('footer.tel')}</div>
            <div className="sf-addr">{t('footer.email')}</div>
          </div>
          <div className="sf-cols">
            <div className="sf-col">
              <div className="sf-col-h">{t('footer.col.service')}</div>
              <NavLink to="/site/book">{t('site.nav.branch')}</NavLink>
              <NavLink to="/site/esim">{t('site.nav.esim')}</NavLink>
              <NavLink to="/site/lookup">{t('nav.lookup')}</NavLink>
            </div>
            <div className="sf-col">
              <div className="sf-col-h">{t('footer.col.company')}</div>
              <NavLink to="/site/about">{t('site.nav.about')}</NavLink>
              <a href="#" onClick={(e) => e.preventDefault()}>
                {t('footer.terms')}
              </a>
              <a href="#" onClick={(e) => e.preventDefault()}>
                {t('footer.privacy')}
              </a>
            </div>
          </div>
        </div>
        <div className="site-footer-copy">© 2026 MONEYBOX Corp. · Prototype (dummy data)</div>
      </footer>
    </div>
  )
}
