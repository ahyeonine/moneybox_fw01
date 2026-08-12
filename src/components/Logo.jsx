import { NavLink } from 'react-router-dom'

// MONEY BOX 로고 (외국인 웹사이트 헤더 + CEMS 헤더에서 공통 재사용)
export default function Logo({ to = '/site', className = 'logo' }) {
  return (
    <NavLink to={to} end className={className}>
      MONEY<span>BOX</span>
    </NavLink>
  )
}
