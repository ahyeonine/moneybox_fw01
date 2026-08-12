import { useMemo, useState } from 'react'

// 위치 찾기 공용 컴포넌트 — 검색 + 지역칩 + 리스트(왼쪽) + 지도(오른쪽).
// 레퍼런스(moneybox-global-v5.html)의 #kiSearch/#kiChips/#kiList/#kiMap 레이아웃 패턴을 따른다.
// 지도는 구글맵 임베드(iframe, output=embed)로 선택 항목 좌표를 표시.
// showNearest=true 이면 "가까운 곳 찾기" 버튼(Geolocation)으로 최단거리 정렬 + 자동 선택.
//
// props.items: [{ id, name(str), address(str), region, lat, lng, badge?(str) }]  ← 페이지에서 현재 언어로 정규화해 전달
// props.labels: 각종 UI 문구(현재 언어)
// props.showNearest, props.actionLabel, props.onAction(item)

function haversineKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export default function LocationLocator({
  items,
  labels,
  showNearest = false,
  actionLabel,
  onAction,
}) {
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState('ALL')
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null)
  const [distById, setDistById] = useState(null) // { id: km } | null
  const [distOrder, setDistOrder] = useState(null) // [id, ...] | null (가까운 순)
  const [geoMsg, setGeoMsg] = useState(null) // { type:'info'|'warn', text }
  const [geoBusy, setGeoBusy] = useState(false)

  const regions = useMemo(() => {
    const set = []
    for (const it of items) if (it.region && !set.includes(it.region)) set.push(it.region)
    return set
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = items.filter((it) => {
      if (chip !== 'ALL' && it.region !== chip) return false
      if (!q) return true
      return (
        it.name.toLowerCase().includes(q) ||
        it.address.toLowerCase().includes(q) ||
        (it.region || '').toLowerCase().includes(q)
      )
    })
    if (distOrder) {
      list = [...list].sort((a, b) => distOrder.indexOf(a.id) - distOrder.indexOf(b.id))
    }
    return list
  }, [items, query, chip, distOrder])

  const selected = filtered.find((i) => i.id === selectedId) || filtered[0] || null
  const mapSrc = selected
    ? `https://www.google.com/maps?q=${selected.lat},${selected.lng}&hl=ko&z=16&output=embed`
    : null

  function findNearest() {
    if (!('geolocation' in navigator)) {
      setGeoMsg({ type: 'warn', text: labels.geoUnavailable })
      return
    }
    setGeoBusy(true)
    setGeoMsg({ type: 'info', text: labels.geoLocating })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const withDist = items.map((it) => ({ id: it.id, km: haversineKm(me, it) }))
        withDist.sort((a, b) => a.km - b.km)
        const order = withDist.map((d) => d.id)
        const dmap = {}
        withDist.forEach((d) => (dmap[d.id] = d.km))
        setDistById(dmap)
        setDistOrder(order)
        setChip('ALL')
        setQuery('')
        setSelectedId(order[0])
        setGeoBusy(false)
        const nearest = items.find((i) => i.id === order[0])
        setGeoMsg({ type: 'info', text: labels.geoFound(nearest?.name || '', dmap[order[0]]) })
      },
      () => {
        setGeoBusy(false)
        setGeoMsg({ type: 'warn', text: labels.geoDenied })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div className="loc">
      {showNearest && (
        <div className="loc-nearest">
          <button className="btn primary" onClick={findNearest} disabled={geoBusy}>
            📍 {labels.nearestBtn}
          </button>
          {geoMsg && <span className={`loc-geomsg ${geoMsg.type}`}>{geoMsg.text}</span>}
        </div>
      )}

      <div className="loc-search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchPlaceholder}
        />
      </div>

      {regions.length > 1 && (
        <div className="loc-chips" role="group" aria-label={labels.regionLabel}>
          <button className={chip === 'ALL' ? 'active' : ''} onClick={() => setChip('ALL')}>
            {labels.chipAll}
          </button>
          {regions.map((r) => (
            <button key={r} className={chip === r ? 'active' : ''} onClick={() => setChip(r)}>
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="loc-body">
        <ul className="loc-list">
          {filtered.length === 0 && <li className="loc-empty">{labels.emptyText}</li>}
          {filtered.map((it) => (
            <li
              key={it.id}
              className={`loc-item ${selected && it.id === selected.id ? 'active' : ''}`}
              onClick={() => setSelectedId(it.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedId(it.id)
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={selected && it.id === selected.id}
            >
              <div className="loc-item-head">
                <span className="loc-item-name">{it.name}</span>
                {it.badge && <span className="loc-item-badge">{it.badge}</span>}
                {distById && distById[it.id] != null && (
                  <span className="loc-item-dist">{distById[it.id].toFixed(1)}km</span>
                )}
              </div>
              <div className="loc-item-addr">{it.address}</div>
              {actionLabel && onAction && (
                <button
                  className="btn ghost loc-item-action"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAction(it)
                  }}
                >
                  {actionLabel}
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="loc-map">
          {mapSrc ? (
            <iframe
              title={labels.mapTitle}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="loc-map-empty">{labels.emptyText}</div>
          )}
          {selected && (
            <div className="loc-map-cap">
              <strong>{selected.name}</strong>
              <span>{selected.address}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
