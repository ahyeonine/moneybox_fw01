import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReservations } from '../../store/ReservationContext.jsx'
import { CURRENCY_META } from '../../data/rates.js'
import { formatDate, formatNumber } from '../../lib/format.js'
import { StatusBadge } from '../../components/Badges.jsx'
import DevNote from '../../components/DevNote.jsx'

// 한글 이름 여부 — 국내예약(한국인) / 해외예약(외국인) 목록 구분용.
const isKoreanName = (n = '') => /[가-힣]/.test(n)

export const POS_RESV_NOTES = [
  '환전예약 = 국내예약(기본) / 해외예약 토글 — 예약 목록에서 예약을 선택해 거래처리',
  '목록 구분: 국내예약=한국인(한글 이름), 해외예약=외국인(영문 이름)',
  '회원 우대 대상 예약은 목록에 🏅 회원 우대 배지로 표시 — 수령 시 현장에서 우대',
  '신분증 대조는 수령 시점에 지점에서 육안 확인(온라인 사전 수집·본인인증 없음)',
  '거래진행은 기존 거래처리 화면으로 연결(프로토타입은 플레이스홀더)',
  '자세히: 01_IA.md',
]

// 화면 A · POS 환전예약 — 국내/해외 토글 · 예약 목록에서 선택해 거래처리
export default function PosReservationSearch() {
  const nav = useNavigate()
  const { reservations } = useReservations()

  const [tab, setTab] = useState('domestic') // 'domestic'(국내) | 'foreign'(해외)

  function proceed() {
    nav('/pos/reservation/flow')
  }

  // 목록 구분: 국내=한국인(한글 이름), 해외=외국인(영문 이름)
  const list = reservations.filter((r) =>
    tab === 'domestic' ? isKoreanName(r.customerName) : !isKoreanName(r.customerName)
  )

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

      {/* 국내예약(기본) / 해외예약 토글 */}
      <div className="visit-toggle pos-resv-tab" role="group" aria-label="예약 구분">
        <button
          type="button"
          className={tab === 'domestic' ? 'active' : ''}
          onClick={() => setTab('domestic')}
        >
          국내예약
        </button>
        <button
          type="button"
          className={tab === 'foreign' ? 'active' : ''}
          onClick={() => setTab('foreign')}
        >
          해외예약
        </button>
      </div>

      <div className="pos-scan" style={{ marginTop: 16 }}>
        <div className="card scan-panel">
          <h3 className="scan-h">📋 예약 목록 ({list.length})</h3>
          <p className="muted">예약을 선택하면 거래처리 화면으로 이동합니다.</p>
          <div className="scan-matches">
            {list.length === 0 && (
              <div className="notice" style={{ marginTop: 6 }}>예약이 없습니다.</div>
            )}
            {list.map((m) => (
              <button key={m.reservationNo} type="button" className="scan-match" onClick={proceed}>
                <span className="sm-no">
                  {m.reservationNo}
                  <span className="sm-name">
                    {m.customerName}
                    {m.coupon && <span className="sm-member">🏅 회원 우대</span>}
                  </span>
                </span>
                <span className="sm-cur">
                  {CURRENCY_META[m.currency]?.flag} {formatNumber(m.foreignAmount)} {m.currency}
                </span>
                <span className="sm-date">{formatDate(m.pickupDate, 'ko')}</span>
                <StatusBadge status={m.status} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
