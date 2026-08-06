import { useState, useMemo } from 'react'
import { useReservations } from '../../store/ReservationContext.jsx'
import { CURRENCY_META } from '../../data/rates.js'
import { formatDate, formatKrw, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'
import DevNote from '../../components/DevNote.jsx'

// 화면 1 · 외국인 환전예약관리 — 기존 신규예약 리스트를 CEMS 레이아웃/컬럼으로 재구성.
// 컬럼: No | 상태 | 수령일자 | 예약자명 | 이메일 | 환전구분 | 통화 | 환율 | 거래금액 | 원화금액 | 신청일시
// (레퍼런스의 생년월일·휴대전화·입금상태·예약금 컬럼은 우리 서비스에 없어 제외)

const PAGE_SIZE = 10

const emptyFilter = {
  gubun: 'ALL', // 구분 (수령방식 — 지점수령 단일, 데모용 표시)
  appFrom: '',
  appTo: '',
  pickFrom: '',
  pickTo: '',
  status: 'ALL',
  currency: 'ALL',
  name: '',
}

export default function ForeignReservationAdmin() {
  const { reservations, today } = useReservations()

  // 진입 시 기본 필터: 수령예정일 = 오늘. ("전체 기간" 버튼으로 날짜 제한 해제 가능)
  const defaultFilter = { ...emptyFilter, pickFrom: today, pickTo: today }

  const [form, setForm] = useState(defaultFilter)
  const [applied, setApplied] = useState(defaultFilter)
  const [page, setPage] = useState(1)

  const setF = (patch) => setForm((f) => ({ ...f, ...patch }))

  const currencies = useMemo(
    () => Array.from(new Set(reservations.map((r) => r.currency))),
    [reservations]
  )

  const rows = useMemo(() => {
    const f = applied
    return reservations
      .filter((r) => (f.status === 'ALL' ? true : r.status === f.status))
      .filter((r) => (f.currency === 'ALL' ? true : r.currency === f.currency))
      .filter((r) => (f.name ? r.customerName.toLowerCase().includes(f.name.toLowerCase()) : true))
      .filter((r) => (f.appFrom ? r.createdAt.slice(0, 10) >= f.appFrom : true))
      .filter((r) => (f.appTo ? r.createdAt.slice(0, 10) <= f.appTo : true))
      .filter((r) => (f.pickFrom ? r.pickupDate >= f.pickFrom : true))
      .filter((r) => (f.pickTo ? r.pickupDate <= f.pickTo : true))
      // 신청일시 최신순 — 최근 신청 건이 1번 행으로 상단 노출
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  }, [reservations, applied])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const pageRows = rows.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  function search() {
    setApplied(form)
    setPage(1)
  }
  function reset() {
    setForm(defaultFilter)
    setApplied(defaultFilter)
    setPage(1)
  }
  // 전체 기간 보기 — 수령기간 날짜 제한을 해제하고 즉시 적용
  function showAllPeriod() {
    const next = { ...form, pickFrom: '', pickTo: '' }
    setForm(next)
    setApplied(next)
    setPage(1)
  }
  const allPeriod = !applied.pickFrom && !applied.pickTo

  return (
    <div>
      <DevNote
        items={[
          '본사관리자 화면은 이번 프로젝트에서 신규 개발 대상 아님 (예약금을 받지 않아 본사가 확인할 입금 건 자체가 없음)',
          '이 리스트의 목적은 입금확인이 아니라 시재 준비용',
          '기존 CEMS 컬럼(성명/생년월일/휴대전화/입금상태/예약금) 중 상당수가 이번 서비스에는 없음 — 이메일/여권영문명 등으로 대체',
          '정렬은 신청일시(createdAt) 최신순 — 새로 들어온 예약이 1번 행. "No" 컬럼은 화면 순번(예약번호 아님)',
          '기본 필터는 수령예정일=오늘(기준일)만 노출. "전체 기간" 버튼으로 날짜 제한 해제',
          '고객 신청 / POS 거래완료 / 고객 취소 / 자동취소가 모두 이 리스트에 실시간 반영됨(단일 공유 store)',
        ]}
      />
      <h1 className="cems-h1">외국인 환전예약관리</h1>

      {/* 필터 행 */}
      <div className="cems-filter">
        <label>
          <span>구분</span>
          <select value={form.gubun} onChange={(e) => setF({ gubun: e.target.value })}>
            <option value="ALL">전체</option>
            <option value="BRANCH">지점수령</option>
          </select>
        </label>
        <label>
          <span>신청기간</span>
          <div className="range">
            <input type="date" value={form.appFrom} onChange={(e) => setF({ appFrom: e.target.value })} />
            <em>~</em>
            <input type="date" value={form.appTo} onChange={(e) => setF({ appTo: e.target.value })} />
          </div>
        </label>
        <label>
          <span>수령기간</span>
          <div className="range">
            <input type="date" value={form.pickFrom} onChange={(e) => setF({ pickFrom: e.target.value })} />
            <em>~</em>
            <input type="date" value={form.pickTo} onChange={(e) => setF({ pickTo: e.target.value })} />
          </div>
        </label>
        <label>
          <span>상태</span>
          <select value={form.status} onChange={(e) => setF({ status: e.target.value })}>
            <option value="ALL">전체</option>
            <option value="BOOKED">예약</option>
            <option value="COMPLETED">완료</option>
            <option value="CANCELLED">취소</option>
          </select>
        </label>
        <label>
          <span>통화</span>
          <select value={form.currency} onChange={(e) => setF({ currency: e.target.value })}>
            <option value="ALL">전체</option>
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>예약자명</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setF({ name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="이름"
          />
        </label>
        <div className="cems-filter-btns">
          <button className="cems-btn primary" onClick={search}>
            검색
          </button>
          <button
            className={`cems-btn ${allPeriod ? 'active' : ''}`}
            onClick={showAllPeriod}
            title="수령기간 제한 없이 전체 예약 보기"
          >
            전체 기간
          </button>
          <button className="cems-btn" onClick={reset} title="기본값(오늘 수령예정일)으로 초기화">
            초기화
          </button>
          <button className="cems-btn" onClick={() => {}} title="데모: 동작 안 함">
            엑셀 다운로드
          </button>
        </div>
      </div>

      <div className="cems-count">
        총 <strong>{rows.length}</strong>건
      </div>

      {/* 테이블 */}
      <div className="table-wrap">
        <table className="cems-table">
          <thead>
            <tr>
              <th>No</th>
              <th>상태</th>
              <th>수령일자</th>
              <th>예약자명</th>
              <th>이메일</th>
              <th>통화</th>
              <th className="num">환율</th>
              <th className="num">거래금액</th>
              <th className="num">원화금액</th>
              <th>신청일시</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
                  조회된 예약이 없습니다.
                </td>
              </tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.reservationNo}>
                  <td>{(curPage - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{formatDate(r.pickupDate, 'ko')}</td>
                  <td>{r.customerName}</td>
                  <td>{r.email}</td>
                  <td>
                    {CURRENCY_META[r.currency]?.flag} {r.currency}
                  </td>
                  <td className="num">{formatNumber(r.rate)}</td>
                  <td className="num">{formatNumber(r.foreignAmount)}</td>
                  <td className="num">{formatKrw(r.krwAmount)}</td>
                  <td>{r.createdAt.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="cems-pagination">
        <button disabled={curPage <= 1} onClick={() => setPage(curPage - 1)}>
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} className={p === curPage ? 'active' : ''} onClick={() => setPage(p)}>
            {p}
          </button>
        ))}
        <button disabled={curPage >= totalPages} onClick={() => setPage(curPage + 1)}>
          ›
        </button>
      </div>
    </div>
  )
}
