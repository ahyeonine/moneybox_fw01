import DevNote from '../../components/DevNote.jsx'

// CEMS · 설정 탭 랜딩(플레이스홀더).
// 환전율관리는 예약 시 환율 미고정(수령일 전광판 환율) 모델로 전환되며 제거됨.
// 설정 탭 자체는 향후 항목(휴일/가상계좌 등)을 위해 유지한다.
export default function CemsSettings() {
  return (
    <div>
      <DevNote
        items={[
          '예약 시 환율을 고정하지 않고 수령일 전광판 환율을 적용하므로 별도 환율관리 화면은 없음',
          '설정 탭은 향후 항목(휴일관리·가상계좌 등)을 위한 자리',
          '자세히: 07_정책.md',
        ]}
      />
      <h1 className="cems-h1">설정</h1>
      <div className="cems-panel">
        <div className="cems-empty">
          <div className="cems-empty-t">설정 항목이 없습니다</div>
          <p className="cems-empty-d">
            환전율관리는 예약 시 환율을 고정하지 않는 모델(수령일 전광판 환율 적용)로 전환되어 제거되었습니다.
            향후 휴일관리·가상계좌 등 설정 항목이 이곳에 추가됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
