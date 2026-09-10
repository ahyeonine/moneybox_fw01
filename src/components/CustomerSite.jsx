import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useBooking } from '../store/BookingContext.jsx'
import LanguageDropdown from './LanguageDropdown.jsx'
import Logo from './Logo.jsx'

// 자사 eSIM 웹사이트 (외부) — 푸터 링크에서 사용
const ESIM_URL = 'https://imoneybox.cafe24.com/shop3/'

// 외국인 웹사이트 (고객용) 헤더 + 네비게이션.
// 그룹형 네비: 서비스 ▾(eSIM·카드) / 환전(→지점수령예약) / 위치 ▾(지점·키오스크) / 회사 / 문의
// 데스크톱: 드롭다운(호버 + 클릭). 모바일: 햄버거로 접히는 메뉴.
export default function CustomerSite() {
  const { t } = useI18n()
  const location = useLocation()
  const { setLastSitePath } = useBooking()

  // 외국인 웹사이트 내에서 머문 마지막 경로를 기억 → 다른 메뉴 갔다 복귀 시 이 경로로 바로 이동
  useEffect(() => {
    setLastSitePath(location.pathname + location.search)
  }, [location.pathname, location.search, setLastSitePath])

  // 네비 구성 (단독 링크 / 드롭다운 그룹 / 안내 노트)
  // 부가서비스·문의는 실제 이동 없이 "어디로 이동하는지"를 텍스트로만 안내(프로토타입).
  const NAV = [
    { type: 'link', to: '/site/book', label: t('site.nav.exchange') },
    { type: 'note', key: 'service', label: t('site.nav.group.service'), note: t('site.nav.service.note') },
    { type: 'link', to: '/site/about', label: t('site.nav.company') },
    { type: 'note', key: 'contact', label: t('site.nav.contact'), note: t('site.nav.contact.note') },
    { type: 'link', to: '/site/lookup', label: t('site.nav.lookup') },
  ]

  const [openGroup, setOpenGroup] = useState(null) // 클릭으로 열린 드롭다운 key
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef(null)

  // 라우트가 바뀌면 열린 메뉴/모바일 패널 닫기
  useEffect(() => {
    setOpenGroup(null)
    setMobileOpen(false)
  }, [location.pathname, location.search])

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!openGroup) return
    function onDoc(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenGroup(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openGroup])

  const groupActive = (item) => item.items.some((s) => location.pathname === s.to)

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <Logo to="/site" />

          {/* 데스크톱 네비 (그룹 드롭다운) */}
          <nav className="site-nav" ref={navRef} aria-label={t('site.nav.menu')}>
            {NAV.map((item) =>
              item.type === 'link' ? (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="site-nav-link"
                  >
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`}
                  >
                    {item.label}
                  </NavLink>
                )
              ) : item.type === 'note' ? (
                // 부가서비스·문의: 이동 없이 "어디로 이동" 안내 텍스트만 드롭다운으로 표시
                <div
                  key={item.key}
                  className={`site-nav-group ${openGroup === item.key ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className="site-nav-link site-nav-trigger"
                    aria-haspopup="true"
                    aria-expanded={openGroup === item.key}
                    onClick={() => setOpenGroup((k) => (k === item.key ? null : item.key))}
                  >
                    {item.label}
                    <span className="nav-caret" aria-hidden="true">▾</span>
                  </button>
                  <div className="site-nav-menu" role="menu">
                    <div className="site-nav-note">{item.note}</div>
                  </div>
                </div>
              ) : (
                <div
                  key={item.key}
                  className={`site-nav-group ${openGroup === item.key ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className={`site-nav-link site-nav-trigger ${groupActive(item) ? 'active' : ''}`}
                    aria-haspopup="true"
                    aria-expanded={openGroup === item.key}
                    onClick={() => setOpenGroup((k) => (k === item.key ? null : item.key))}
                  >
                    {item.label}
                    <span className="nav-caret" aria-hidden="true">▾</span>
                  </button>
                  <div className="site-nav-menu" role="menu">
                    {item.items.map((s) =>
                      s.external ? (
                        <a
                          key={s.href}
                          href={s.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          role="menuitem"
                          onClick={() => setOpenGroup(null)}
                        >
                          {s.label}
                        </a>
                      ) : (
                        <NavLink
                          key={s.to}
                          to={s.to}
                          role="menuitem"
                          className={({ isActive }) => (isActive ? 'active' : '')}
                          onClick={() => setOpenGroup(null)}
                        >
                          {s.label}
                        </NavLink>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </nav>

          <span className="spacer" />
          <LanguageDropdown />

          {/* 모바일 햄버거 */}
          <button
            type="button"
            className="site-burger"
            aria-label={t('site.nav.menu')}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className={`burger-ic ${mobileOpen ? 'x' : ''}`} aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* 모바일 접이식 메뉴 */}
        {mobileOpen && (
          <nav className="site-nav-mobile" aria-label={t('site.nav.menu')}>
            {NAV.map((item) =>
              item.type === 'link' ? (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="snm-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `snm-link ${isActive ? 'active' : ''}`}
                  >
                    {item.label}
                  </NavLink>
                )
              ) : item.type === 'note' ? (
                <div key={item.key} className="snm-group">
                  <div className="snm-group-label">{item.label}</div>
                  <div className="snm-note">{item.note}</div>
                </div>
              ) : (
                <div key={item.key} className="snm-group">
                  <div className="snm-group-label">{item.label}</div>
                  {item.items.map((s) =>
                    s.external ? (
                      <a
                        key={s.href}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="snm-link snm-sub"
                        onClick={() => setMobileOpen(false)}
                      >
                        {s.label}
                      </a>
                    ) : (
                      <NavLink
                        key={s.to}
                        to={s.to}
                        className={({ isActive }) => `snm-link snm-sub ${isActive ? 'active' : ''}`}
                      >
                        {s.label}
                      </NavLink>
                    )
                  )}
                </div>
              )
            )}
          </nav>
        )}
      </header>

      <main className="content site-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          {/* 브랜드 + 태그라인 */}
          <div className="sf-brand">
            <div className="sf-logo">
              MONEY<span>BOX</span>
            </div>
            <div className="sf-tagline">{t('footer.tagline')}</div>
            <div className="sf-langs">🌏 English · 中文 · 日本語 · 한국어</div>
          </div>

          {/* 그룹형 링크 (당근 about 페이지풍) */}
          <div className="sf-groups">
            <div className="sf-col">
              <div className="sf-col-h">{t('footer.g.company')}</div>
              <NavLink to="/site/about">{t('footer.l.about')}</NavLink>
              <NavLink to="/site/branches">{t('footer.l.branches')}</NavLink>
              <NavLink to="/site/kiosks">{t('footer.l.kiosk')}</NavLink>
            </div>
            <div className="sf-col">
              <div className="sf-col-h">{t('footer.g.service')}</div>
              <NavLink to="/site/book">{t('footer.l.book')}</NavLink>
              <NavLink to="/site/lookup">{t('footer.l.lookup')}</NavLink>
              <a href={ESIM_URL} target="_blank" rel="noreferrer noopener">
                {t('footer.l.esim')} ↗
              </a>
            </div>
            <div className="sf-col">
              <div className="sf-col-h">{t('footer.g.info')}</div>
              <NavLink to="/site">{t('footer.l.guide')}</NavLink>
              <NavLink to="/site">{t('footer.l.faq')}</NavLink>
              <NavLink to="/site">{t('footer.l.rates')}</NavLink>
            </div>
            <div className="sf-col">
              <div className="sf-col-h">{t('footer.g.support')}</div>
              <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.l.help')}</a>
              <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.l.contact')}</a>
              <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.terms')}</a>
              <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.privacy')}</a>
            </div>
          </div>
        </div>

        {/* 법인 정보 */}
        <div className="site-footer-legal">
          <div className="sf-legal-name">{t('footer.company')}</div>
          <div className="sf-legal-row">
            {t('footer.addr')} · {t('footer.tel')} · {t('footer.email')}
          </div>
          <div className="site-footer-copy">© 2026 MONEYBOX Corp. · Prototype (dummy data)</div>
        </div>
      </footer>
    </div>
  )
}
