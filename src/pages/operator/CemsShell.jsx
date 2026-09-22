import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../../components/Logo.jsx'

// 탭 2 · CEMS (어드민) 셸: 실제 운영 CEMS 화면 골격 재현.
// 파란 헤더 / 상단 탭 / 좌측 사이드바 / 본문 Outlet.
// 프로토타입에서 실제 동작하는 화면만 노출한다(동작하지 않는 데모용 메뉴는 제거).
// 어드민 화면은 실제 CEMS와 동일하게 한국어 라벨을 고정 사용한다.

const TOP_TABS = [
  { key: 'reservation', label: '환전예약', enabled: true, to: '/cems/reservations' },
  { key: 'settings', label: '설정', enabled: true, to: '/cems/settings/policy' },
]

// 환전예약 탭 사이드바 — 동작하는 화면만
const RESV_MENU = [
  { label: '외국인 환전예약관리', to: '/cems/reservations', enabled: true },
  { label: '본사관리자 (전 지점)', to: '/cems/hq', enabled: true },
]

// 설정 탭 사이드바 — 예약 가능 기간 설정(본사)
const SETTINGS_MENU = [
  { label: '예약 가능 기간 설정 (본사)', to: '/cems/settings/policy', enabled: true },
]

export default function CemsShell() {
  const loc = useLocation()
  const inSettings = loc.pathname.startsWith('/cems/settings')
  const activeTop = inSettings ? 'settings' : 'reservation'
  const menu = inSettings ? SETTINGS_MENU : RESV_MENU

  return (
    <div className="cems">
      {/* 헤더 */}
      <header className="cems-header">
        <div className="cems-header-inner">
          <Logo to="/cems" className="logo cems-logo" />
          <span className="cems-title">환전 관리시스템 (강남신논현환전)</span>
          <span className="spacer" />
          <span className="cems-meta">
            접속 2026-07-30 09:12 · IP 10.0.12.34
          </span>
          <button className="cems-logout" onClick={() => {}}>
            로그아웃
          </button>
        </div>
      </header>

      {/* 상단 탭 */}
      <nav className="cems-toptabs">
        <div className="cems-toptabs-inner">
          {TOP_TABS.map((tab) =>
            tab.enabled ? (
              <NavLink
                key={tab.key}
                to={tab.to}
                className={activeTop === tab.key ? 'active' : ''}
              >
                {tab.label}
              </NavLink>
            ) : (
              <span key={tab.key} className="disabled">
                {tab.label}
              </span>
            )
          )}
        </div>
      </nav>

      {/* 사이드바 + 본문 */}
      <div className="cems-body">
        <aside className="cems-sidebar">
          <div className="cems-sidebar-h">{inSettings ? '설정' : '환전예약'}</div>
          <ul>
            {menu.map((m, i) =>
              m.enabled ? (
                <li key={i}>
                  <NavLink to={m.to} end className={({ isActive }) => (isActive ? 'active' : '')}>
                    {m.label}
                  </NavLink>
                </li>
              ) : (
                <li key={i}>
                  <span className="disabled">{m.label}</span>
                </li>
              )
            )}
          </ul>
        </aside>
        <main className="cems-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
