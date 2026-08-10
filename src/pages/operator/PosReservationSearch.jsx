import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReservations } from '../../store/ReservationContext.jsx'
import DevNote from '../../components/DevNote.jsx'

// POS 환전예약 검색/결과 공통 개발 참고 설명
export const POS_RESV_NOTES = [
  '결과 화면 기본값: 날짜="오늘" + 응답상태="방문확인만 보기". 두 조건은 서로 독립(오늘+전체보기, 전체날짜+방문확인만 조합 가능)',
  '날짜 필터: "오늘"=수령예정일 당일만, "전체"=날짜 제한 없음',
  '응답 토글: "방문확인만 보기"=방문예정확인(CONFIRMED)만, "전체보기"=무응답·발송전 포함. 취소 건은 항상 제외',
  '무응답이어도 수령기한(수령예정일 당일) 전까지는 자동취소하지 않음, 그 이후 자동취소',
  '예약번호 끝 4자리 검색: 예약번호(RSV-YYYYMMDD-0001)의 끝자리(0001)만으로 단독 검색. 다른 필드·날짜·응답 토글과 무관하게 매칭(카운터에서 고객이 끝자리만 불러줄 때). 끝 4자리가 겹치면 여러 건이 리스트로 노출됨',
  '자세히: 06_알림리마인더_템플릿.md',
]

// 화면 A · POS 환전예약 검색 폼 (최초 진입)
// 좌상단: 아이콘 + "환전예약" / 우상단: "홈" 버튼(이전 없음)
// 폼: 이름 / 수령일(기본 오늘) / 이메일 / 검색 → 결과 리스트(화면 B)로 이동
export default function PosReservationSearch() {
  const nav = useNavigate()
  const { today } = useReservations()

  const [form, setForm] = useState({ name: '', pickupDate: today, email: '', no4: '' })
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  function search(e) {
    e?.preventDefault()
    const q = new URLSearchParams()
    const digits = form.no4.replace(/\D/g, '')
    if (digits) {
      // 예약번호 끝자리 단독 검색 — 다른 조건은 무시
      q.set('no4', digits)
    } else {
      if (form.name.trim()) q.set('name', form.name.trim())
      if (form.pickupDate) q.set('date', form.pickupDate)
      if (form.email.trim()) q.set('email', form.email.trim())
    }
    nav(`/pos/reservation/results?${q.toString()}`)
  }

  return (
    <div className="pos-resv">
      <DevNote items={POS_RESV_NOTES} />
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
        <label className="field">
          <span className="lbl">예약번호 끝 4자리</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={form.no4}
            onChange={(e) => set({ no4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            placeholder="예: 0001"
          />
          <span className="tiny" style={{ marginTop: 4, display: 'block' }}>
            끝 4자리만 입력하면 단독으로 검색돼요 (다른 조건 무시)
          </span>
        </label>
        <button type="submit" className="pos-search-btn">
          검색
        </button>
      </form>
    </div>
  )
}
