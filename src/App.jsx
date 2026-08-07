import { Routes, Route, Navigate } from 'react-router-dom'
import RootLayout from './components/RootLayout.jsx'
import CustomerSite from './components/CustomerSite.jsx'
import Home from './pages/Home.jsx'
import BookingFlow from './pages/booking/BookingFlow.jsx'
import LookupPage from './pages/LookupPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import EsimPage from './pages/EsimPage.jsx'
import PrepaidCardPage from './pages/PrepaidCardPage.jsx'
import CemsShell from './pages/operator/CemsShell.jsx'
import PosShell from './pages/operator/PosShell.jsx'
import PosHome from './pages/operator/PosHome.jsx'
import PosTransaction from './pages/operator/PosTransaction.jsx'
import PosReservationSearch from './pages/operator/PosReservationSearch.jsx'
import PosReservationResults from './pages/operator/PosReservationResults.jsx'
import FxFlowPlaceholder from './pages/operator/FxFlowPlaceholder.jsx'
import ForeignReservationAdmin from './pages/cems/ForeignReservationAdmin.jsx'
import RateManagement from './pages/cems/RateManagement.jsx'
import LimitManagement from './pages/cems/LimitManagement.jsx'
import DocsViewer from './pages/DocsViewer.jsx'
import EmailAdmin from './pages/email/EmailAdmin.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Navigate to="/site" replace />} />

        {/* 탭 1 · 외국인 웹사이트 (고객용) */}
        <Route path="site" element={<CustomerSite />}>
          <Route index element={<Home />} /> {/* 기본 진입 = 랜딩 홈 */}
          <Route path="book" element={<BookingFlow />} /> {/* 지점 수령 예약 */}
          <Route path="prepaid" element={<PrepaidCardPage />} /> {/* 선불카드 안내(플레이스홀더) */}
          <Route path="esim" element={<EsimPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="lookup" element={<LookupPage />} />
        </Route>

        {/* 탭 2 · CEMS (어드민) */}
        <Route path="cems" element={<CemsShell />}>
          <Route index element={<Navigate to="/cems/reservations" replace />} />
          <Route path="reservations" element={<ForeignReservationAdmin />} />
          <Route path="settings" element={<Navigate to="/cems/settings/rates" replace />} />
          <Route path="settings/rates" element={<RateManagement />} />
          <Route path="settings/limits" element={<LimitManagement />} />
        </Route>

        {/* 탭 3 · POS */}
        <Route path="pos" element={<PosShell />}>
          <Route index element={<PosHome />} />
          <Route path="reservation" element={<PosReservationSearch />} />
          <Route path="reservation/results" element={<PosReservationResults />} />
          <Route path="reservation/flow" element={<FxFlowPlaceholder />} />
          <Route path="transaction" element={<PosTransaction />} />
        </Route>

        {/* 기획문서 뷰어 (내부 검토용) */}
        <Route path="docs" element={<DocsViewer />} />

        {/* 이메일 관리 (템플릿 + 발송 이력) */}
        <Route path="email" element={<EmailAdmin />} />

        <Route path="*" element={<Navigate to="/site" replace />} />
      </Route>
    </Routes>
  )
}
