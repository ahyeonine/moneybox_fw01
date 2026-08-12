import { Outlet } from 'react-router-dom'
import TopTabs from './TopTabs.jsx'

// 최상위 셸: 3개 탭(외국인 웹사이트 / CEMS / POS) + 하위 화면 Outlet
export default function RootLayout() {
  return (
    <div className="app">
      <TopTabs />
      <Outlet />
    </div>
  )
}
