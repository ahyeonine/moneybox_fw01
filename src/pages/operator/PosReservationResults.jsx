import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useReservations } from '../../store/ReservationContext.jsx'
import { CURRENCY_META } from '../../data/rates.js'
import { diffDays } from '../../lib/date.js'
import { formatDate, formatKrw, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'
import Modal from '../../components/Modal.jsx'
import DevNote from '../../components/DevNote.jsx'
import { POS_RESV_NOTES } from './PosReservationSearch.jsx'

// 리마인더 응답별 노출 기준 (05_어드민기능정의서 로직 재사용):
//  - 취소/자동취소(CANCELLED) → 미노출
//  - 수령예정일 당일 도달 건 → 토글과 무관하게 항상 노출
//  - "방문확인만 보기"(기본) → CONFIRMED(방문예정 확인)만 노출
//  - "전체보기" → 무응답/발송전 건도 함께 노출
function reminderVisible(rec, today, showAll) {
  if (rec.status === 'CANCELLED') return false
  if (diffDays(rec.pickupDate, today) === 0) return true // 당일 항상 노출
  if (showAll) return true
  return rec.reminderStatus === 'CONFIRMED'
}

// 화면 B · POS 환전예약 결과 리스트 (검색 후)
export default function PosReservationResults() {
  const nav = useNavigate()
  const { reservations, today } = useReservations()
  const [params, setParams] = useSearchParams()

  // 적용된 검색조건 (URL) 과 편집용 폼(로컬)
  const applied = {
    name: params.get('name') || '',
    date: params.get('date') || '',
    email: params.get('email') || '',
  }
  const [form, setForm] = useState(applied)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const [showAll, setShowAll] = useState(false) // false = 방문확인만 보기(기본)
  const [selected, setSelected] = useState(null) // 거래내용 확인 모달 대상

  // 모달 "확인" → 모달 닫고 기존 환전예약플로우(플레이스홀더)로 이동
  function confirmSelected() {
    setSelected(null)
    nav('/pos/reservation/flow')
  }

  function search(e) {
    e?.preventDefault()
    const q = new URLSearchParams()
    if (form.name.trim()) q.set('name', form.name.trim())
    if (form.date) q.set('date', form.date)
    if (form.email.trim()) q.set('email', form.email.trim())
    setParams(q)
  }

  const rows = useMemo(() => {
    const name = applied.name.toLowerCase()
    const email = applied.email.toLowerCase()
    return reservations
      .filter((r) => (name ? r.customerName.toLowerCase().includes(name) : true))
      .filter((r) => (applied.date ? r.pickupDate >= applied.date : true)) // 일치 또는 이후
      .filter((r) => (email ? r.email.toLowerCase().includes(email) : true))
      .filter((r) => reminderVisible(r, today, showAll))
      .sort((a, b) => (a.pickupDate < b.pickupDate ? -1 : a.pickupDate > b.pickupDate ? 1 : 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations, applied.name, applied.date, applied.email, showAll, today])

  return (
    <div className="pos-resv">
      <DevNote items={POS_RESV_NOTES} />
      <header className="pos-resv-head">
        <div className="prh-title">
          <span className="prh-icon">📋</span>
          <h1>환전예약</h1>
        </div>
        <div className="prh-actions">
          <button className="cems-btn" onClick={() => nav('/pos/reservation')}>
            이전
          </button>
          <button className="cems-btn" onClick={() => nav('/pos')}>
            홈
          </button>
        </div>
      </header>

      {/* 필터 행 (화면 A 값 유지, 재검색 가능) */}
      <form className="pos-result-filter" onSubmit={search}>
        <label>
          <span>이름</span>
          <input type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label>
          <span>수령일</span>
          <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
        </label>
        <label>
          <span>이메일</span>
          <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </label>
        <button type="submit" className="cems-btn primary">
          검색
        </button>

        {/* 방문확인만 보기 / 전체보기 토글 */}
        <div className="visit-toggle" role="group" aria-label="노출 범위">
          <button
            type="button"
            className={!showAll ? 'active' : ''}
            onClick={() => setShowAll(false)}
          >
            방문확인만 보기
          </button>
          <button
            type="button"
            className={showAll ? 'active' : ''}
            onClick={() => setShowAll(true)}
          >
            전체보기
          </button>
        </div>
      </form>

      <div className="pos-result-count">
        {rows.length}건 {showAll ? '(전체보기)' : '(방문확인만)'}
      </div>

      {/* 결과 테이블 */}
      {rows.length === 0 ? (
        <div className="notice info">조회된 예약이 없습니다.</div>
      ) : (
        <div className="pos-result-list">
          {rows.map((r) => (
            <button
              key={r.reservationNo}
              className="pos-result-row"
              onClick={() => setSelected(r)}
              title="거래내용 확인"
            >
              <span className="pr-no">{r.reservationNo}</span>
              <span className="pr-name">{r.customerName}</span>
              <span className="pr-email">{r.email}</span>
              <span className="pr-date">{formatDate(r.pickupDate, 'ko')}</span>
              <span className="pr-arrow">›</span>
            </button>
          ))}
        </div>
      )}

      {/* 거래내용 확인 모달 */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <h2>거래내용 확인</h2>
          <div className="summary" style={{ marginTop: 8 }}>
            <div className="row">
              <span className="k">예약번호</span>
              <span className="v">{selected.reservationNo}</span>
            </div>
            <div className="row">
              <span className="k">상태</span>
              <span className="v">
                <StatusBadge status={selected.status} />
              </span>
            </div>
            <div className="row">
              <span className="k">예약자명</span>
              <span className="v">{selected.customerName}</span>
            </div>
            <div className="row">
              <span className="k">이메일</span>
              <span className="v">{selected.email}</span>
            </div>
            <div className="row">
              <span className="k">통화</span>
              <span className="v">
                {CURRENCY_META[selected.currency]?.flag} {selected.currency}
              </span>
            </div>
            <div className="row">
              <span className="k">예약환율</span>
              <span className="v">
                1 {selected.currency} = {formatNumber(selected.rate)} KRW
              </span>
            </div>
            <div className="row">
              <span className="k">거래금액</span>
              <span className="v">
                {formatNumber(selected.foreignAmount)} {selected.currency}
              </span>
            </div>
            <div className="row">
              <span className="k">원화금액</span>
              <span className="v">{formatKrw(selected.krwAmount)}</span>
            </div>
            <div className="row">
              <span className="k">수령일자</span>
              <span className="v">{formatDate(selected.pickupDate, 'ko')}</span>
            </div>
            <div className="row">
              <span className="k">신청일시</span>
              <span className="v">{selected.createdAt.slice(0, 10)}</span>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setSelected(null)}>
              닫기
            </button>
            <button className="btn primary" onClick={confirmSelected}>
              확인
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
