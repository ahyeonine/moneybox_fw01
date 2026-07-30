import { Routes, Route, Navigate } from 'react-router-dom'
import RootLayout from './components/RootLayout.jsx'
import CustomerSite from './components/CustomerSite.jsx'
import BookingFlow from './pages/booking/BookingFlow.jsx'
import LookupPage from './pages/LookupPage.jsx'
import AirportPage from './pages/AirportPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import EsimPage from './pages/EsimPage.jsx'
import CemsShell from './pages/operator/CemsShell.jsx'
import PosShell from './pages/operator/PosShell.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Navigate to="/site" replace />} />

        {/* 탭 1 · 외국인 웹사이트 (고객용) */}
        <Route path="site" element={<CustomerSite />}>
          <Route index element={<BookingFlow />} /> {/* 기본 진입 = 지점 수령 */}
          <Route path="airport" element={<AirportPage />} />
          <Route path="esim" element={<EsimPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="lookup" element={<LookupPage />} />
        </Route>

        {/* 탭 2 · CEMS (어드민) */}
        <Route path="cems" element={<CemsShell />} />

        {/* 탭 3 · POS */}
        <Route path="pos" element={<PosShell />} />

        <Route path="*" element={<Navigate to="/site" replace />} />
      </Route>
    </Routes>
  )
}
