import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../../components/Logo.jsx'

// 탭 2 · CEMS (어드민) 셸: 실제 운영 CEMS 화면 골격 재현.
// 파란 헤더(로고+시스템 타이틀) / 상단 5탭(환전예약·설정만 동작) / 좌측 사이드바 / 본문 Outlet.
// 어드민 화면은 실제 CEMS와 동일하게 한국어 라벨을 고정 사용한다.

const TOP_TABS = [
  { key: 'exchange', label: '머니 익스체인지', enabled: false },
  { key: 'money24', label: '머니 24h', enabled: false },
  { key: 'reservation', label: '환전예약', enabled: true, to: '/cems/reservations' },
  { key: 'online', label: '온라인환전', enabled: false },
  { key: 'settings', label: '설정', enabled: true, to: '/cems/settings/rates' },
]

// 환전예약 탭 사이드바
const RESV_MENU = [
  { label: '외국인 환전예약관리', to: '/cems/reservations', enabled: true },
  { label: '본사관리자 (전 지점)', to: '/cems/hq', enabled: true },
  { label: '가상계좌입금조회', enabled: false },
  { label: '가상계좌설정', enabled: false },
  { label: '휴일관리', enabled: false },
  { label: '환전율관리', enabled: false }, // (설정 탭의 환전율관리와 이름만 같은 다른 화면)
  { label: '기간별매출조회', enabled: false },
]

// 설정 탭 사이드바
const SETTINGS_MENU = [
  { label: '환전율관리', to: '/cems/settings/rates', enabled: true },
  { label: '외국인서비스 한도관리', to: '/cems/settings/limits', enabled: true },
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

      {/* 상단 5탭 */}
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
