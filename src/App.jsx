import { Routes, Route, Navigate } from 'react-router-dom'
import RootLayout from './components/RootLayout.jsx'
import Site2 from './pages/Site2.jsx'
import CemsShell from './pages/operator/CemsShell.jsx'
import PosShell from './pages/operator/PosShell.jsx'
import PosHome from './pages/operator/PosHome.jsx'
import PosTransaction from './pages/operator/PosTransaction.jsx'
import PosReservationSearch from './pages/operator/PosReservationSearch.jsx'
import PosReservationResults from './pages/operator/PosReservationResults.jsx'
import FxFlowPlaceholder from './pages/operator/FxFlowPlaceholder.jsx'
import ForeignReservationAdmin from './pages/cems/ForeignReservationAdmin.jsx'
import HqReservationAdmin from './pages/cems/HqReservationAdmin.jsx'
import HqReservationPolicy from './pages/cems/HqReservationPolicy.jsx'
import DocsViewer from './pages/DocsViewer.jsx'
import EmailAdmin from './pages/email/EmailAdmin.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Navigate to="/site" replace />} />

        {/* 탭 1 · 외국인 웹사이트 (고객용) */}
        <Route path="site" element={<Site2 />} />
        {/* 이전 링크 호환: /site2 → /site */}
        <Route path="site2" element={<Navigate to="/site" replace />} />

        {/* 탭 2 · CEMS (지점 어드민) */}
        <Route path="cems" element={<CemsShell />}>
          <Route index element={<Navigate to="/cems/reservations" replace />} />
          <Route path="reservations" element={<ForeignReservationAdmin />} />
          <Route path="hq" element={<HqReservationAdmin />} />
          {/* 설정 탭 = 예약 가능 기간 설정(본사) */}
          <Route path="settings" element={<Navigate to="/cems/settings/policy" replace />} />
          <Route path="settings/policy" element={<HqReservationPolicy />} />
          {/* 이전 링크 호환 */}
          <Route path="policy" element={<Navigate to="/cems/settings/policy" replace />} />
          <Route path="settings/rates" element={<Navigate to="/cems/settings/policy" replace />} />
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
