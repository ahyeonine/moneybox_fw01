import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReservations } from '../../store/ReservationContext.jsx'

// 화면 A · POS 환전예약 검색 폼 (최초 진입)
// 좌상단: 아이콘 + "환전예약" / 우상단: "홈" 버튼(이전 없음)
// 폼: 이름 / 수령일(기본 오늘) / 이메일 / 검색 → 결과 리스트(화면 B)로 이동
export default function PosReservationSearch() {
  const nav = useNavigate()
  const { today } = useReservations()

  const [form, setForm] = useState({ name: '', pickupDate: today, email: '' })
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  function search(e) {
    e?.preventDefault()
    const q = new URLSearchParams()
    if (form.name.trim()) q.set('name', form.name.trim())
    if (form.pickupDate) q.set('date', form.pickupDate)
    if (form.email.trim()) q.set('email', form.email.trim())
    nav(`/pos/reservation/results?${q.toString()}`)
  }

  return (
    <div className="pos-resv">
      <header className="pos-resv-head">
        <div className="prh-title">
          <span className="prh-icon">📋</span>
          <h1>환전예약</h1>
        </div>
        <div className="prh-actions">
          <button className="cems-btn" onClick={() => nav('/pos')}>
            홈
          </button>
        </div>
      </header>

      <form className="pos-search-form" onSubmit={search}>
        <label className="field">
          <span className="lbl">이름</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="예약자명"
            autoFocus
          />
        </label>
        <label className="field">
          <span className="lbl">수령일</span>
          <input
            type="date"
            value={form.pickupDate}
            onChange={(e) => set({ pickupDate: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="lbl">이메일</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </label>
        <button type="submit" className="pos-search-btn">
          검색
        </button>
      </form>
    </div>
  )
}
