import { useState, useMemo } from 'react'
import { useReservations } from '../../store/ReservationContext.jsx'
import { useEmail, BRANCH_CANCEL_REASON } from '../../store/EmailContext.jsx'
import { CURRENCY_META } from '../../data/rates.js'
import { getBranch } from '../../data/branches.js'
import { formatDate, formatKrw, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'
import Modal from '../../components/Modal.jsx'
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
  const { reservations, today, cancelByBranch } = useReservations()
  const { sendEmail } = useEmail()

  // 진입 시 기본 필터: 수령예정일 = 오늘. ("전체 기간" 버튼으로 날짜 제한 해제 가능)
  const defaultFilter = { ...emptyFilter, pickFrom: today, pickTo: today }

  const [form, setForm] = useState(defaultFilter)
  const [applied, setApplied] = useState(defaultFilter)
  const [page, setPage] = useState(1)
  // 응답상태 토글: false = 방문확인만 보기(기본, CONFIRMED만), true = 전체보기. 날짜 필터와 독립.
  const [showAll, setShowAll] = useState(false)
  const [selNo, setSelNo] = useState(null) // 행 클릭 → 예약 상세 모달 대상(예약번호)
  const [modalFlash, setModalFlash] = useState(null)

  // 항상 store 최신 상태를 참조 (취소 후 상태 갱신 반영)
  const selected = selNo ? reservations.find((r) => r.reservationNo === selNo) : null

  function openDetail(no) {
    setSelNo(no)
    setModalFlash(null)
  }
  function closeDetail() {
    setSelNo(null)
    setModalFlash(null)
  }

  // 지점(직원) 예약취소 — 사유입력/추가확인 없이 즉시 취소.
  //  · 상태→취소(사유=지점), 재고 복구(방문예정확인 건 포함), CEMS는 행 유지(상태만 취소).
  //  · 지점 취소 안내 이메일 발송(고정 사유 문구). 고객취소(고객 취소완료)와 구분되는 별도 템플릿.
  function cancelBranch() {
    if (!selected || selected.status !== 'BOOKED') return
    cancelByBranch(selected.reservationNo)
    sendEmail('branchCancel', selected.email, {
      name: selected.customerName,
      reservationNo: selected.reservationNo,
      branchReason: BRANCH_CANCEL_REASON,
    })
    setModalFlash('예약이 취소되었습니다. 고객에게 지점 취소 안내 이메일이 발송되었습니다.')
  }

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
      // 응답상태 필터: 방문확인만(CONFIRMED) / 전체보기 — 날짜 필터와 독립
      .filter((r) => (showAll ? true : r.reminderStatus === 'CONFIRMED'))
      // 신청일시 최신순 — 최근 신청 건이 1번 행으로 상단 노출
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  }, [reservations, applied, showAll])

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
          '이 화면은 (본인 지점 기준) 시재 준비용 예약 조회. 전 지점 통합 조회는 좌측 "본사관리자 (전 지점)" 화면 참고',
          '이 리스트의 목적은 입금확인이 아니라 시재 준비용',
          '기존 CEMS 컬럼(성명/생년월일/휴대전화/입금상태/예약금) 중 상당수가 이번 서비스에는 없음 — 이메일/여권영문명 등으로 대체',
          '진입 기본값: 수령예정일="오늘" + 응답상태="방문확인만 보기". 날짜(오늘/전체 기간)와 응답 토글은 독립 동작',
          '행 클릭 → 예약 상세 모달. [예약취소] 버튼으로 지점(직원) 취소 가능(사유입력 없이 즉시): 상태→취소, 재고 복구, 지점 취소 안내 이메일 발송. CEMS는 행 유지(상태만 취소), POS는 목록에서 제외',
          '자세히: 00_개발메모.md',
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

      <div className="cems-count-row">
        <div className="cems-count">
          총 <strong>{rows.length}</strong>건
        </div>
        {/* 응답상태 토글: 방문확인만 보기(기본) / 전체보기 — 날짜 필터와 독립 */}
        <div className="visit-toggle" role="group" aria-label="응답 범위">
          <button className={!showAll ? 'active' : ''} onClick={() => setShowAll(false)}>
            방문확인만 보기
          </button>
          <button className={showAll ? 'active' : ''} onClick={() => setShowAll(true)}>
            전체보기
          </button>
        </div>
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
                <tr
                  key={r.reservationNo}
                  className="cems-row-click"
                  onClick={() => openDetail(r.reservationNo)}
                  title="예약 상세 보기"
                >
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

      {/* 예약 상세 모달 (행 클릭) — 확인/예약취소 */}
      {selected && (
        <Modal onClose={closeDetail}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0 }}>{selected.reservationNo}</h2>
            <StatusBadge status={selected.status} />
          </div>
          <div className="summary" style={{ marginTop: 12 }}>
            <div className="row">
              <span className="k">예약자명</span>
              <span className="v">{selected.customerName}</span>
            </div>
            <div className="row">
              <span className="k">이메일</span>
              <span className="v">{selected.email}</span>
            </div>
            <div className="row">
              <span className="k">지점</span>
              <span className="v">{getBranch(selected.branchId)?.name.ko}</span>
            </div>
            <div className="row">
              <span className="k">수령일자</span>
              <span className="v">{formatDate(selected.pickupDate, 'ko')}</span>
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
            <div className="row total">
              <span className="k">원화금액</span>
              <span className="v">{formatKrw(selected.krwAmount)}</span>
            </div>
            <div className="row">
              <span className="k">신청일시</span>
              <span className="v">{selected.createdAt.slice(0, 10)}</span>
            </div>
          </div>

          {modalFlash && (
            <div className="notice warn" style={{ marginTop: 12 }}>
              {modalFlash}
            </div>
          )}

          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="btn ghost" onClick={closeDetail}>
              확인
            </button>
            {selected.status === 'BOOKED' && (
              <button
                className="btn"
                style={{ background: 'var(--danger)', color: '#fff' }}
                onClick={cancelBranch}
              >
                예약취소
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
