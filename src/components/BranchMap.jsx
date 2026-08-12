import { useI18n } from '../i18n/I18nContext.jsx'
import { BRANCHES } from '../data/branches.js'

// 더미 지도: 실제 지도 API 미연동. 지점별 mapPos(%)에 마커 표시, 클릭 시 선택.
// TODO: 실제 지도 API(카카오/구글) 연동
export default function BranchMap({ selectedId, onSelect }) {
  const { t, lang } = useI18n()
  return (
    <div className="map-box">
      <div className="map-canvas">
        {BRANCHES.map((b) => (
          <button
            key={b.id}
            className={`map-pin ${selectedId === b.id ? 'selected' : ''}`}
            style={{ left: `${b.mapPos.x}%`, top: `${b.mapPos.y}%` }}
            title={b.name[lang]}
            onClick={() => onSelect(b.id)}
          >
            <span className="pin-dot">📍</span>
            <span className="pin-label">{b.name[lang]}</span>
          </button>
        ))}
      </div>
      <div className="map-caption tiny">{t('stepA.mapDummy')}</div>
    </div>
  )
}
