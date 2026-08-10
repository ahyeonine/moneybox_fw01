import { useI18n } from '../i18n/I18nContext.jsx'
import { KIOSKS } from '../data/kiosks.js'
import LocationLocator from '../components/LocationLocator.jsx'
import DevNote from '../components/DevNote.jsx'

// 키오스크(무인 환전기) 찾기 페이지 — 검색 + 지역칩 + 리스트 + 지도(구글맵 임베드) + 가까운 곳 찾기(Geolocation).
export default function KiosksPage() {
  const { t, lang } = useI18n()

  const items = KIOSKS.map((k) => ({
    id: k.id,
    name: k.name[lang] || k.name.ko,
    address: k.address[lang] || k.address.ko,
    region: k.region,
    lat: k.lat,
    lng: k.lng,
    badge: k.hours24 ? t('kiosks.badge24') : null,
  }))

  const labels = {
    searchPlaceholder: t('kiosks.search'),
    nearestBtn: t('kiosks.nearest'),
    regionLabel: t('loc.region'),
    chipAll: t('loc.chipAll'),
    emptyText: t('loc.empty'),
    mapTitle: t('loc.map'),
    geoLocating: t('loc.geo.locating'),
    geoUnavailable: t('loc.geo.unavailable'),
    geoDenied: t('loc.geo.denied'),
    geoFound: (name, km) =>
      lang === 'en'
        ? `${name} — about ${km.toFixed(1)}km away`
        : `${name} — 약 ${km.toFixed(1)}km 거리예요`,
  }

  return (
    <div>
      <h1>{t('kiosks.title')}</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        {t('kiosks.lead')}
      </p>
      <LocationLocator items={items} labels={labels} showNearest />
      <DevNote
        items={[
          '외국인 웹사이트 "키오스크" 메뉴 → 이 페이지(/site/kiosks).',
          '검색 + 지역칩 + 리스트 + 구글맵 임베드(iframe). "가까운 키오스크 찾기"는 브라우저 Geolocation으로 최단거리 자동 정렬/선택.',
          '키오스크 목데이터(24시간)와 위경도는 프로토타입 근사값 — 실제 위치/운영정보로 교체 필요.',
          '자세히: 02_사이트맵.md',
        ]}
      />
    </div>
  )
}
