import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import BookingFlow from './pages/booking/BookingFlow.jsx'
import LookupPage from './pages/LookupPage.jsx'
import OperatorConsole from './pages/operator/OperatorConsole.jsx'
import AboutPage from './pages/AboutPage.jsx'
import EsimPage from './pages/EsimPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="book" element={<BookingFlow />} />
        <Route path="lookup" element={<LookupPage />} />
        <Route path="operator" element={<OperatorConsole />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="esim" element={<EsimPage />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
