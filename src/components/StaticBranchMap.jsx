import { getBranch } from '../data/branches.js'

// 이메일용 정적 지점 지도 (인터랙션 없음 — 실제 이메일 클라이언트에서 JS 미동작 가정).
// 지점선택 화면의 더미 마커 방식(mapPos %)을 재사용한 정적 SVG + 주소 텍스트.
export default function StaticBranchMap({ branchId, lang = 'ko' }) {
  const b = getBranch(branchId)
  if (!b) return null
  const x = b.mapPos?.x ?? 50
  const y = b.mapPos?.y ?? 50
  return (
    <div className="email-map">
      <svg className="email-map-svg" viewBox="0 0 300 150" role="img" aria-label={b.name[lang]}>
        {/* 배경(더미 지도) */}
        <rect x="0" y="0" width="300" height="150" fill="#e8eef5" />
        {/* 그리드 라인(도로 느낌) */}
        {[60, 120, 180, 240].map((gx) => (
          <line key={`v${gx}`} x1={gx} y1="0" x2={gx} y2="150" stroke="#d3dce6" strokeWidth="1" />
        ))}
        {[38, 76, 114].map((gy) => (
          <line key={`h${gy}`} x1="0" y1={gy} x2="300" y2={gy} stroke="#d3dce6" strokeWidth="1" />
        ))}
        {/* 마커 */}
        <g transform={`translate(${(x / 100) * 300}, ${(y / 100) * 150})`}>
          <circle cx="0" cy="0" r="14" fill="#2563eb" opacity="0.18" />
          <circle cx="0" cy="0" r="6" fill="#2563eb" stroke="#fff" strokeWidth="2" />
        </g>
      </svg>
      <div className="email-map-name">📍 {b.name[lang]}</div>
      <div className="email-map-addr">{b.address[lang]}</div>
      <div className="email-map-tel tiny">☎ {b.phone}</div>
    </div>
  )
}
