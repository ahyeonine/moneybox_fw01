import { useNavigate } from 'react-router-dom'

// 플레이스홀더 — 나중에 기존 실제 거래처리 플로우로 연결될 자리.
// 별도 기능 없이 안내 텍스트만 크게 표시.
export default function FxFlowPlaceholder() {
  const navigate = useNavigate()
  return (
    <div className="pos-resv">
      <div className="fxflow-placeholder">
        <div className="fxflow-text">기존 환전예약플로우</div>
        <button className="cems-btn" onClick={() => navigate('/pos/reservation')}>
          ‹ 검색으로
        </button>
      </div>
    </div>
  )
}
