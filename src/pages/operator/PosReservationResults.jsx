import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useReservations } from '../../store/ReservationContext.jsx'
import { CURRENCY_META } from '../../data/rates.js'
import { formatDate, formatKrw, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'
import Modal from '../../components/Modal.jsx'
import DevNote from '../../components/DevNote.jsx'
import { POS_RESV_NOTES } from './PosReservationSearch.jsx'

// 리마인더 응답별 노출 기준 (날짜 필터와 독립적으로 동작):
//  - 취소/자동취소(CANCELLED) → 미노출
//  - "방문확인만 보기"(기본) → CONFIRMED(방문예정 확인)만 노출
//  - "전체보기" → 무응답/발송전 건도 함께 노출
function reminderVisible(rec, showAll) {
  if (rec.status === 'CANCELLED') return false
  return showAll ? true : rec.reminderStatus === 'CONFIRMED'
}

// 예약번호(RSV-YYYYMMDD-0001) 끝자리 매칭 — 마지막 세그먼트가 입력 숫자로 끝나면 매칭.
function matchNo4(reservationNo, digits) {
  if (!digits) return false
  const seq = reservationNo.split('-').pop() || reservationNo
  return seq.endsWith(digits)
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
    no4: params.get('no4') || '',
  }
  const [form, setForm] = useState(applied)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const [showAll, setShowAll] = useState(false) // 응답 토글: false = 방문확인만 보기(기본)
  const [dateAll, setDateAll] = useState(false) // 날짜 토글: false = 오늘(해당일)만(기본), true = 전체 날짜
  const [selected, setSelected] = useState(null) // 거래내용 확인 모달 대상

  // 날짜 필터 기준: 검색된 수령일(없으면 오늘). 두 토글은 서로 독립.
  const dateBase = applied.date || today
  const dateLabel = dateBase === today ? '오늘' : formatDate(dateBase, 'ko')

  // 모달 "확인" → 모달 닫고 기존 환전예약플로우(플레이스홀더)로 이동
  function confirmSelected() {
    setSelected(null)
    nav('/pos/reservation/flow')
  }

  function search(e) {
    e?.preventDefault()
    const q = new URLSearchParams()
    const digits = form.no4.replace(/\D/g, '')
    if (digits) {
      // 예약번호 끝자리 단독 검색 — 다른 조건 무시
      q.set('no4', digits)
    } else {
      if (form.name.trim()) q.set('name', form.name.trim())
      if (form.date) q.set('date', form.date)
    }
    setParams(q)
  }

  const rows = useMemo(() => {
    // 예약번호 끝자리 단독 검색: 이름/이메일/날짜/응답 토글과 무관하게 끝자리만으로 매칭
    if (applied.no4) {
      const digits = applied.no4.replace(/\D/g, '')
      return reservations
        .filter((r) => matchNo4(r.reservationNo, digits))
        .sort((a, b) => (a.pickupDate < b.pickupDate ? -1 : a.pickupDate > b.pickupDate ? 1 : 0))
    }
    const name = applied.name.toLowerCase()
    return reservations
      .filter((r) => (name ? r.customerName.toLowerCase().includes(name) : true))
      // 날짜 필터: 오늘(해당일) 정확히 일치 / 전체 → 제한 없음 (응답 토글과 독립)
      .filter((r) => (dateAll ? true : r.pickupDate === dateBase))
      // 응답 필터: 방문확인만(CONFIRMED) / 전체보기 (날짜와 독립)
      .filter((r) => reminderVisible(r, showAll))
      .sort((a, b) => (a.pickupDate < b.pickupDate ? -1 : a.pickupDate > b.pickupDate ? 1 : 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations, applied.no4, applied.name, dateAll, dateBase, showAll])

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
          <span>예약번호 끝 4자리</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={form.no4}
            onChange={(e) => set({ no4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            placeholder="예: 0001"
          />
        </label>
        <button type="submit" className="cems-btn primary">
          검색
        </button>

        {/* 날짜 필터: 오늘(해당일) / 전체 — 응답 토글과 독립 (끝자리 검색 시 무시) */}
        <div className="visit-toggle" role="group" aria-label="날짜 필터">
          <button
            type="button"
            className={!dateAll ? 'active' : ''}
            onClick={() => setDateAll(false)}
            disabled={!!applied.no4}
          >
            {dateLabel}
          </button>
          <button
            type="button"
            className={dateAll ? 'active' : ''}
            onClick={() => setDateAll(true)}
            disabled={!!applied.no4}
          >
            전체
          </button>
        </div>

        {/* 응답상태 토글: 방문확인만 보기(기본) / 전체보기 — 날짜 필터와 독립 (끝자리 검색 시 무시) */}
        <div className="visit-toggle" role="group" aria-label="응답 범위">
          <button
            type="button"
            className={!showAll ? 'active' : ''}
            onClick={() => setShowAll(false)}
            disabled={!!applied.no4}
          >
            방문확인만 보기
          </button>
          <button
            type="button"
            className={showAll ? 'active' : ''}
            onClick={() => setShowAll(true)}
            disabled={!!applied.no4}
          >
            전체보기
          </button>
        </div>
      </form>

      <div className="pos-result-count">
        {applied.no4
          ? `예약번호 끝자리 "${applied.no4}" · ${rows.length}건`
          : `${rows.length}건 · ${dateAll ? '전체 날짜' : dateLabel} · ${showAll ? '전체보기' : '방문확인만'}`}
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
