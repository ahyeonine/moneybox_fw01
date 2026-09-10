import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo.jsx'
import DevNote from '../../components/DevNote.jsx'

// 탭 3 · POS 홈: 카드형 타일. "환전예약" 타일만 거래처리 화면으로 이동.
// 나머지 타일(SELL/BUY/MORE/ONLINE EXCHANGE)은 시각적으로만 존재(서비스 범위 밖).
// 지점명은 실제 이름 노출 없이 일반화된 더미 텍스트만 사용한다.
export default function PosHome() {
  const nav = useNavigate()
  return (
    <div className="pos-home">
      <DevNote
        items={['자세히: 00_개발메모.md']}
      />
      <div className="pos-top">
        <Logo to="/pos" className="logo pos-logo" />
      </div>

      <div className="pos-grid">
        {/* 1행: 큰 타일 2개 */}
        <div className="pos-tile big sell" aria-disabled="true">
          <div className="pt-icon">💴→🏦</div>
          <div className="pt-en">SELL</div>
          <div className="pt-ko">외화 파실 때</div>
        </div>
        <div className="pos-tile big buy" aria-disabled="true">
          <div className="pt-icon">🏦→💴</div>
          <div className="pt-en">BUY</div>
          <div className="pt-ko">외화 사실 때</div>
        </div>

        {/* 2행: 작은 타일 3개 */}
        <div className="pos-tile small t-more" aria-disabled="true">
          <div className="pt-icon gray">⋯</div>
          <div className="pt-en">MORE</div>
          <div className="pt-ko">더보기</div>
        </div>
        <button className="pos-tile small active t-resv" onClick={() => nav('/pos/reservation')}>
          <div className="pt-icon gray">📋</div>
          <div className="pt-en">RESERVATION</div>
          <div className="pt-ko">환전예약</div>
        </button>
        <div className="pos-tile small t-online" aria-disabled="true">
          <div className="pt-icon gray">🌐</div>
          <div className="pt-en">ONLINE EXCHANGE</div>
          <div className="pt-ko">온라인환전</div>
        </div>
      </div>

      <footer className="pos-footer">
        <span className="pf-left">머니박스 지점</span>
        <span className="pf-center">© MONEYBOX Corp.</span>
        <span className="pf-right">v1.0.0-demo</span>
      </footer>
    </div>
  )
}
