import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { BRANCHES } from '../data/branches.js'
import LocationLocator from '../components/LocationLocator.jsx'
import DevNote from '../components/DevNote.jsx'

// 지점(오프라인, 직원 상주) 정보 페이지 — 정보 열람용. 검색 + 리스트 + 지도.
// 예약 플로우의 STEP A(지점선택)와는 별개이며, 리스트의 "환전 예약하기"로 예약 플로우에 진입한다.
function regionOf(b) {
  const a = b.address.ko || ''
  if (a.startsWith('서울')) return '서울'
  if (a.startsWith('인천')) return '인천'
  if (a.startsWith('부산')) return '부산'
  return '기타'
}

export default function BranchesPage() {
  const { t, lang } = useI18n()
  const nav = useNavigate()

  const items = BRANCHES.map((b) => ({
    id: b.id,
    name: b.name[lang] || b.name.ko,
    address: b.address[lang] || b.address.ko,
    region: regionOf(b),
    lat: b.lat,
    lng: b.lng,
    badge: b.hours ? `${b.hours.open}–${b.hours.close}` : null,
  }))

  const labels = {
    searchPlaceholder: t('branches.search'),
    regionLabel: t('loc.region'),
    chipAll: t('loc.chipAll'),
    emptyText: t('loc.empty'),
    mapTitle: t('loc.map'),
    geoLocating: t('loc.geo.locating'),
    geoUnavailable: t('loc.geo.unavailable'),
    geoDenied: t('loc.geo.denied'),
    geoFound: () => '',
  }

  return (
    <div>
      <h1>{t('branches.title')}</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        {t('branches.lead')}
      </p>
      <LocationLocator
        items={items}
        labels={labels}
        actionLabel={t('branches.reserve')}
        onAction={(it) => nav(`/site/book?branch=${it.id}`)}
      />
      <DevNote
        items={[
          '직원 상주 오프라인 지점 정보 열람용 페이지. 예약 플로우의 지점선택 단계와는 별개.',
          '리스트의 "환전 예약하기"를 누르면 해당 지점이 선택된 상태로 환전 예약 플로우에 진입.',
          '기존 지점 목데이터 재사용 + 위경도(lat/lng) 추가. 지도는 구글맵 임베드(iframe).',
          '자세히: 02_사이트맵.md',
        ]}
      />
    </div>
  )
}
