import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useRates } from '../store/RatesContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { CURRENCY_META, CURRENCY_ORDER } from '../data/rates.js'
import { BRANCHES, getBranch, branchCurrencies, regionChips, branchMatchesRegion } from '../data/branches.js'
import { formatKrw } from '../lib/format.js'
import { isValidName, isValidEmail } from '../lib/validation.js'
import { pickupRange } from '../lib/date.js'
import { usePolicy } from '../store/PolicyContext.jsx'
import LanguageDropdown from '../components/LanguageDropdown.jsx'
import AboutPage from './AboutPage.jsx'
import LookupPage from './LookupPage.jsx'

// 외국인 웹사이트: 환율을 예약 시점에 고정하지 않는다(수령일 전광판 환율 적용).
// 최고가 보장 회원은 수령 시 현장에서 상황에 맞춰 최대한 우대(고정 우대율·자동적용 아님).

// 깔끔한 라인 아이콘 (이모지 대체) — 브랜드 블루 톤, currentColor 상속.
const ICON_PATHS = {
  bank: 'M3 10 12 4l9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18',
  kiosk: 'M6 3h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2 15h8m-4-3v3M8 6h8M8 9h5',
  airport: 'M21 15.5 3 10V6.5l2 .5 3 2 6-1L11 3l2-.5 5 6 2.5.7a1.2 1.2 0 0 1 0 2.3L21 12v3.5ZM6 20h9',
  shield: 'M12 3 5 6v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Zm-2.5 8.5 2 2 3.5-4',
  passport: 'M5 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm6 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM8.5 15h5',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  trophy: 'M7 4h10v3a5 5 0 0 1-10 0V4Zm0 1H4v1a3 3 0 0 0 3 3m10-4h3v1a3 3 0 0 1-3 3m-5 4v3m-3 3h6',
  chart: 'M4 20V10m5 10V4m5 16v-7m5 7V8',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3.5 2',
  phone: 'M15.5 20.5a12.5 12.5 0 0 1-12-12A2 2 0 0 1 5.4 6.4l2 .3a2 2 0 0 1 1.7 1.6l.3 1.5a2 2 0 0 1-.6 1.9l-.9.8a10 10 0 0 0 4 4l.8-.9a2 2 0 0 1 1.9-.6l1.5.3a2 2 0 0 1 1.6 1.7l.3 2a2 2 0 0 1-2.1 2.2Z',
  check: 'M5 12.5 10 17.5 19.5 7',
}

// 최고가 보장 회원 유도 배너. quick=true(정보 입력 후)면 "비밀번호만 추가" 후킹으로 전환.
function GuaranteeCTA({ t, onClick, quick = false }) {
  return (
    <button type="button" className="s2v-guar" onClick={onClick}>
      <span className="s2v-guar-seal"><Ic name="shield" /></span>
      <span className="s2v-guar-body">
        <span className="s2v-guar-t">{t(quick ? 's2v.coupon.quick.t' : 's2v.coupon.cta.t')}</span>
        <span className="s2v-guar-d">{t(quick ? 's2v.coupon.quick.d' : 's2v.coupon.cta.d')}</span>
        <span className="s2v-guar-fine">{t('s2v.coupon.fine')}</span>
      </span>
      <span className="s2v-guar-arrow" aria-hidden="true">→</span>
    </button>
  )
}
function GuaranteeApplied({ t }) {
  return (
    <div className="s2v-guar on">
      <span className="s2v-guar-seal on"><Ic name="check" /></span>
      <span className="s2v-guar-body">
        <span className="s2v-guar-t">{t('s2v.coupon.applied')}</span>
        <span className="s2v-guar-fine">{t('s2v.coupon.fine')}</span>
      </span>
    </div>
  )
}
function Ic({ name, className = '' }) {
  const d = ICON_PATHS[name]
  if (!d) return null
  return (
    <svg
      className={`ic ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

// 은행·키오스크·공항이 머니박스보다 "덜 주는" 비율(예시 수치, V1 비교 카드와 동일 톤).
// 원화 환산액 대신 "평균 몇 % 더 많이 받는지"를 노출하기 위한 산출용.
const CHANNEL_LESS = { bank: 0.021, kiosk: 0.041, airport: 0.093 }
// 각 채널 대비 머니박스가 더 주는 비율 = p/(1-p)
const CHANNEL_MORE_PCT = Object.fromEntries(
  Object.entries(CHANNEL_LESS).map(([k, p]) => [k, Math.round((p / (1 - p)) * 1000) / 10])
)
// 세 채널 평균 (소수 1자리 %)
const AVG_MORE_PCT = (() => {
  const mores = Object.values(CHANNEL_MORE_PCT)
  const avg = mores.reduce((a, b) => a + b, 0) / mores.length
  return Math.round(avg * 10) / 10
})()
// 비교 막대: 각 채널이 머니박스(100%) 대비 받는 비율(%)
const CHANNEL_BARS = [
  { key: 'bank', icon: 'bank' },
  { key: 'kiosk', icon: 'kiosk' },
  { key: 'airport', icon: 'airport' },
].map((c) => ({
  ...c,
  more: CHANNEL_MORE_PCT[c.key],
  rel: Math.round((1 - CHANNEL_LESS[c.key]) * 100),
  less: CHANNEL_LESS[c.key],
}))

// 외국인 사이트 2안 (WOWPASS 참고) — 별도 surface.
// 플로우: ① 금액 입력 → ② 지점 선택 (실제 지도 검색 + 내 위치로 찾기 + 추천).
// 지도/검색은 키가 필요 없는 OpenStreetMap(Nominatim + Leaflet) 사용.

const SUPPORTED_CURRENCIES = CURRENCY_ORDER.filter((c) =>
  BRANCHES.some((b) => b.currencies.includes(c))
)

// 인기 위치 (검색 없이 바로 고를 수 있는 빠른 선택 + 오프라인 폴백)
const POPULAR = [
  { id: 'myeongdong', name: { ko: '명동역', en: 'Myeongdong Station' }, lat: 37.5609, lng: 126.986 },
  { id: 'hongdae', name: { ko: '홍대입구역', en: 'Hongik Univ. Station' }, lat: 37.5572, lng: 126.9245 },
  { id: 'gangnam', name: { ko: '강남역', en: 'Gangnam Station' }, lat: 37.4979, lng: 127.0276 },
  { id: 'icn', name: { ko: '인천공항 T1', en: 'Incheon Airport T1' }, lat: 37.4491, lng: 126.4509 },
  { id: 'busanstn', name: { ko: '부산역', en: 'Busan Station' }, lat: 35.1152, lng: 129.0424 },
  { id: 'haeundae', name: { ko: '해운대', en: 'Haeundae' }, lat: 35.1587, lng: 129.1604 },
]

function distanceKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

const ESIM_URL = 'https://imoneybox.cafe24.com/shop3/'

// 컴팩트 환율 비교 — 은행·키오스크·공항보다 "약 얼마 더 받는지"(원화).
// 금액 입력 시 원화 차액, 미입력 시 %로 폴백. 히어로 위젯·신청화면에서 강조 노출.
function CompareMini({ t, amount, board, direction = 'BUY' }) {
  const amt = Number(amount) || 0
  // 원화 차액 표기는 "외화→원화(BUY, 원화 수령)"일 때만. 원화→외화는 % 표기.
  const showWon = direction === 'BUY'
  return (
    <div className="s2v-cmpmini">
      <div className="s2v-cmpmini-h">
        <Ic name="chart" /> {t('s2.home.cmp.mini')}
      </div>
      {CHANNEL_BARS.map((c) => {
        const won = showWon && amt > 0 && board > 0 ? Math.round(amt * board * c.less) : null
        return (
          <div key={c.key} className="s2v-cmpmini-row">
            <span className="s2v-cmpmini-name">
              <Ic name={c.icon} /> {t(`s2.home.cmp.${c.key}`)}
            </span>
            <span className="s2v-cmpmini-bar">
              <span className="s2v-cmpmini-fill" style={{ width: `${c.rel}%` }} />
            </span>
            <span className="s2v-cmpmini-pct">
              {won != null
                ? t('s2.home.cmp.wonmore').replace('{won}', formatKrw(won))
                : `+${c.more}%`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Leaflet 지도 (실제 OpenStreetMap). 라이브러리/타일 로드 실패해도 앱은 계속 동작.
function Site2Map({ center, points }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mod = await import('leaflet')
        await import('leaflet/dist/leaflet.css')
        const L = mod.default || mod
        if (cancelled || !elRef.current) return
        if (!mapRef.current) {
          mapRef.current = L.map(elRef.current, { scrollWheelZoom: false }).setView(
            [center.lat, center.lng],
            12
          )
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
          }).addTo(mapRef.current)
          layerRef.current = L.layerGroup().addTo(mapRef.current)
        }
        const map = mapRef.current
        const layer = layerRef.current
        layer.clearLayers()
        const bounds = []
        L.circleMarker([center.lat, center.lng], {
          radius: 9,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(layer)
          .bindPopup(center.label)
        bounds.push([center.lat, center.lng])
        points.forEach((p) => {
          L.circleMarker([p.lat, p.lng], {
            radius: 8,
            color: '#1f6bff',
            fillColor: '#1f6bff',
            fillOpacity: 0.85,
            weight: 2,
          })
            .addTo(layer)
            .bindPopup(p.label)
          bounds.push([p.lat, p.lng])
        })
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 })
        else map.setView([center.lat, center.lng], 13)
        setTimeout(() => map && map.invalidateSize(), 120)
      } catch (e) {
        /* 지도 로드 실패 → 조용히 무시(리스트/추천은 정상 동작) */
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [center, points])

  useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    },
    []
  )

  return <div ref={elRef} className="s2-map" aria-label="map" />
}

export default function Site2() {
  const { t, lang } = useI18n()
  const { getDisplayRates } = useRates()
  const { today, createReservation } = useReservations()
  const { maxWindowDays } = usePolicy() // 본사 설정 예약 가능 기간(수령일 최대 N일)

  const [view, setView] = useState('home') // home | flow | about
  const [step, setStep] = useState('region') // region | branch | amount | info | done
  const howRef = useRef(null)
  const [region, setRegion] = useState('') // 선택 지역(ko)
  const [direction, setDirection] = useState('BUY') // BUY(외화→원화·매입) | SELL(원화→외화·매각)
  const [currency, setCurrency] = useState('USD')
  const [amount, setAmount] = useState('')

  // 위치 검색 (Nominatim) + 내 위치(Geolocation)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [geoStatus, setGeoStatus] = useState('') // '' | 'locating' | 'error'
  const [loc, setLoc] = useState(null) // { name, lat, lng }
  const [detailBranch, setDetailBranch] = useState('') // 상세(영업시간·전화·지도) 펼친 지점 id

  // 예약자 정보 + 수령일 (환율 고정 없음)
  const [pickedBranch, setPickedBranch] = useState('')
  const [custName, setCustName] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [result, setResult] = useState(null)

  // 최고가 보장 회원가입 — couponMember != null = 회원(수령 시 현장 우대)
  const [couponMember, setCouponMember] = useState(null)
  const [showSignup, setShowSignup] = useState(false)
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPw, setSuPw] = useState('') // 비밀번호
  const [suErr, setSuErr] = useState('')

  const couponOn = !!couponMember // 최고가 보장 회원 여부(수령 시 현장 우대)
  const board = getDisplayRates(currency)?.base || 0 // 현재(전광판/기준) 환율

  const range = pickupRange(today, 0, maxWindowDays) // 리드타임 0, 본사 설정 예약 가능 기간
  const pickBranchObj = pickedBranch ? getBranch(pickedBranch) : null

  // 실제 지오코딩 검색 (OpenStreetMap Nominatim, 키 불필요) — 디바운스
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const id = setTimeout(async () => {
      try {
        const url =
          'https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=6&countrycodes=kr' +
          `&accept-language=${lang}&q=${encodeURIComponent(q)}`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const data = await res.json()
        if (cancelled) return
        setResults(
          (data || []).map((d) => ({
            id: `n${d.place_id}`,
            name: d.display_name,
            lat: Number(d.lat),
            lng: Number(d.lon),
          }))
        )
      } catch (e) {
        if (!cancelled) setResults([]) // 실패 시 인기 위치로 폴백(아래 렌더)
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 550)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [query, lang])

  function findNearMe() {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ name: t('s2.geo.here'), lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoStatus('')
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  // 지역(선택 시) 기준 지점. 위치 있으면 가까운 순, 없으면 등장 순.
  const branches = useMemo(() => {
    let list = BRANCHES
    if (region) list = list.filter((b) => branchMatchesRegion(b, region))
    if (!loc) return list.map((b) => ({ b, km: null }))
    return list.map((b) => ({ b, km: distanceKm(loc, b) })).sort((x, y) => x.km - y.km)
  }, [loc, region])

  const mapPoints = useMemo(
    () => branches.map(({ b }) => ({ lat: b.lat, lng: b.lng, label: b.name[lang] || b.name.ko })),
    [branches, lang]
  )

  const REGIONS = regionChips()
  const stepIdx = ['region', 'branch', 'amount', 'info'].indexOf(step)

  // 지역 선택 → 지점 선택 단계로
  function selectRegion(regionKo) {
    setRegion(regionKo)
    setLoc(null)
    setQuery('')
    setStep('branch')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 지점 선택 → 금액 입력 단계로. 선택 지점의 취급통화로 통화 보정.
  function reserveAt(branchId) {
    setPickedBranch(branchId)
    const curs = branchCurrencies(branchId)
    if (!curs.includes(currency)) setCurrency(curs[0] || 'USD')
    setStep('amount')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 금액·수령일 입력 완료 → 다음 단계.
  // 회원(최고가 보장)은 이름·이메일이 이미 있으므로 예약자 정보 입력 단계를 건너뛰고 바로 예약.
  // 비회원은 예약자 정보(이름·이메일) 입력 단계로 이동.
  function goNext() {
    if (!amountValid) return
    if (couponMember) {
      submitV2()
      return
    }
    setStep('info')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 회원가입 — 이름·이메일·비밀번호. 가입 즉시 최고가 보장 회원(수령 시 현장 우대).
  function claimCoupon() {
    if (!isValidName(suName) || !isValidEmail(suEmail) || suPw.length < 6) {
      setSuErr(t('s2v.signup.err'))
      return
    }
    setCouponMember({
      name: suName.trim(),
      email: suEmail.trim(),
    })
    setCustName((v) => v || suName.trim())
    setCustEmail((v) => v || suEmail.trim())
    setShowSignup(false)
    setSuErr('')
  }

  // 회원가입 모달 열기 — 이미 입력한 이름·이메일을 미리 채워 "비밀번호만 추가"하면 되게 한다.
  function openSignup() {
    setSuName((v) => v || custName)
    setSuEmail((v) => v || custEmail)
    setSuErr('')
    setShowSignup(true)
  }

  // 정보 단계에서 이름·이메일을 이미 채웠으면 "비밀번호만 추가" 후킹
  const nameEmailReady = isValidName(custName) && isValidEmail(custEmail)

  // 수령 예정일이 예약 가능 기간(오늘~최대 N일) 안인지
  const dateValid = !!pickupDate && pickupDate >= range.minDate && pickupDate <= range.maxDate
  // 금액 단계 완료 조건: 금액 양수 + 수령일 유효
  const amountValid = Number(amount) > 0 && dateValid

  const infoValid = isValidName(custName) && isValidEmail(custEmail) && dateValid

  // 예약 생성 — 환율 미고정(rate=null, rateMode='BOARD'). 쿠폰 여부 기록.
  function submitV2() {
    if (!infoValid || !pickedBranch) return
    const rec = createReservation({
      transactionType: direction, // BUY(외화→원화) | SELL(원화→외화)
      branchId: pickedBranch,
      currency,
      rate: null, // 환율 고정 없음 → 수령일 전광판 환율 적용
      rateMode: 'BOARD',
      coupon: couponOn,
      foreignAmount: Number(amount),
      krwAmount: null,
      customerName: custName.trim().toUpperCase(),
      birthDate: null, // 웹 예약은 생년월일 미수집(POS 신분증 대조 시 확인)
      email: custEmail.trim(),
      pickupDate,
      pickupTime: '10:00',
    })
    setResult(rec)
    setStep('done')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function restartV2() {
    setResult(null)
    setPickedBranch('')
    setRegion('')
    setDirection('BUY')
    setLoc(null)
    setCustName(couponMember?.name || '')
    setCustEmail(couponMember?.email || '')
    setPickupDate('')
    setAmount('')
    setStep('region')
    setView('flow')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 첫화면(랜딩) → 플로우 진입. 지역을 주면 지점선택부터, 없으면 지역선택부터.
  function enterFlow(regionKo) {
    if (regionKo) {
      setRegion(regionKo)
      setLoc(null)
      setQuery('')
      setStep('branch')
    } else {
      setStep('region')
    }
    setView('flow')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 오늘의 환율 미리보기용 통화 (취급 통화 중 대표 6종)
  const RATE_PREVIEW = ['USD', 'JPY', 'EUR', 'CNY', 'TWD', 'HKD'].filter((c) =>
    SUPPORTED_CURRENCIES.includes(c)
  )

  return (
    <div className="s2">
      <header className="s2-header">
        <div className="s2-header-inner">
          <button type="button" className="s2-logo" onClick={() => setView('home')}>
            MONEY<span>BOX</span>
          </button>
          <nav className="s2-nav">
            <span className="s2-nav-langs">🌏 EN · 中文 · 日本語 · 한국어</span>
          </nav>
          <div className="s2-header-right">
            <button
              type="button"
              className={`s2-about-link${view === 'lookup' ? ' on' : ''}`}
              onClick={() => setView('lookup')}
            >
              {t('s2.nav.lookup')}
            </button>
            <button
              type="button"
              className={`s2-about-link${view === 'about' ? ' on' : ''}`}
              onClick={() => setView('about')}
            >
              {t('about.title')}
            </button>
            <LanguageDropdown />
          </div>
        </div>
      </header>

      <main
        className={`s2-main${view === 'about' || view === 'lookup' ? ' s2-main-wide' : ''}${
          view === 'home' ? ' s2-main-home' : ''
        }`}
      >
        {view === 'about' ? (
          <AboutPage />
        ) : view === 'lookup' ? (
          <LookupPage />
        ) : view === 'home' ? (
          <>
            {/* 랜딩 히어로 + 환율 위젯 */}
            <section className="s2-lp-hero">
              <div className="s2-lp-hero-copy">
                <span className="s2-lp-eyebrow">
                  <Ic name="shield" /> {t('s2.home.hero.eyebrow')}
                </span>
                <h1 className="s2-lp-title">{t('s2.home.hero.t')}</h1>
                <p className="s2-lp-desc">{t('s2.home.hero.d')}</p>
                <div className="s2-lp-cta-row">
                  <button
                    className="btn s2-lp-ghost"
                    onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    {t('s2.home.hero.how')}
                  </button>
                </div>
                <ul className="s2-lp-trust">
                  <li>✓ {t('s2.home.trust.rate')}</li>
                  <li>✓ {t('s2.home.trust.pay')}</li>
                  <li>✓ {t('s2.home.trust.branch')}</li>
                </ul>
              </div>

              {/* 환율 위젯 (금액 입력 → 지점 찾기) */}
              <div className="s2-lp-widget">
                <div className="s2-lp-widget-t">{t('s2v.region.title')}</div>
                <div className="s2-region-chips">
                  {REGIONS.map((r) => (
                    <button
                      key={r.ko}
                      type="button"
                      className="s2-region-chip"
                      onClick={() => enterFlow(r.ko)}
                    >
                      <Ic name="pin" className="s2-region-ic" />
                      <span className="s2-region-name">{r[lang] || r.ko}</span>
                    </button>
                  ))}
                </div>
                <CompareMini t={t} amount={amount} board={board} />
                <button className="btn s2-primary block" onClick={() => enterFlow()}>
                  {t('s2.nav.book')} →
                </button>
              </div>
            </section>

            {/* 환율 비교 강조 — 은행·키오스크·공항보다 얼마나 더 받는지 */}
            <section className="s2-lp-cmp-sec">
              <h2 className="s2-lp-cmp-h">{t('s2.home.cmp.title')}</h2>
              <p className="s2-lp-cmp-sub">
                {t('s2.home.cmp.sub').replace('{pct}', AVG_MORE_PCT)}
              </p>
              <div className="s2-lp-cmp-card">
                <div className="s2-lp-cmp-row mb">
                  <span className="s2-lp-cmp-name">
                    <Ic name="trophy" /> {t('s2.home.cmp.mb')}
                  </span>
                  <div className="s2-lp-cmp-bar">
                    <span className="s2-lp-cmp-fill mb" style={{ width: '100%' }} />
                  </div>
                  <span className="s2-lp-cmp-tag">{t('s2.home.cmp.mbtag')}</span>
                </div>
                {CHANNEL_BARS.map((c) => (
                  <div key={c.key} className="s2-lp-cmp-row">
                    <span className="s2-lp-cmp-name">
                      <Ic name={c.icon} /> {t(`s2.home.cmp.${c.key}`)}
                    </span>
                    <div className="s2-lp-cmp-bar">
                      <span className="s2-lp-cmp-fill" style={{ width: `${c.rel}%` }} />
                    </div>
                    <span className="s2-lp-cmp-more">
                      +{c.more}% {t('s2.home.cmp.more')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="s2-lp-cmp-note">{t('s2.home.cmp.note')}</div>
            </section>

            {/* 가치 3종 */}
            <section className="s2-lp-sec">
              <h2 className="s2-lp-sec-t">{t('s2.home.val.title')}</h2>
              <div className="s2-lp-vals">
                {[
                  { ic: 'shield', t: 's2.home.val1.t', d: 's2.home.val1.d' },
                  { ic: 'passport', t: 's2.home.val2.t', d: 's2.home.val2.d' },
                  { ic: 'pin', t: 's2.home.val3.t', d: 's2.home.val3.d' },
                ].map((v) => (
                  <div key={v.t} className="s2-lp-val">
                    <span className="s2-lp-val-ic">
                      <Ic name={v.ic} />
                    </span>
                    <div className="s2-lp-val-t">{t(v.t)}</div>
                    <div className="s2-lp-val-d">{t(v.d)}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 이용 방법 3단계 */}
            <section className="s2-lp-sec" ref={howRef}>
              <h2 className="s2-lp-sec-t">{t('s2.home.how.title')}</h2>
              <div className="s2-lp-steps">
                {[
                  { n: 1, t: 's2.home.how.s1t', d: 's2.home.how.s1d' },
                  { n: 2, t: 's2.home.how.s2t', d: 's2.home.how.s2d' },
                  { n: 3, t: 's2.home.how.s3t', d: 's2.home.how.s3d' },
                ].map((s) => (
                  <div key={s.n} className="s2-lp-step">
                    <span className="s2-lp-step-n">{s.n}</span>
                    <div className="s2-lp-step-t">{t(s.t)}</div>
                    <div className="s2-lp-step-d">{t(s.d)}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 오늘의 환율 */}
            <section className="s2-lp-sec">
              <h2 className="s2-lp-sec-t">{t('s2.home.rates.title')}</h2>
              <div className="s2-lp-rates">
                {RATE_PREVIEW.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="s2-lp-rate"
                    onClick={() => {
                      setCurrency(c)
                      enterFlow(false)
                    }}
                  >
                    <span className="s2-lp-rate-cur">
                      <span aria-hidden="true">{CURRENCY_META[c]?.flag}</span> {c}
                    </span>
                    <span className="s2-lp-rate-val">{formatKrw(Math.round(getDisplayRates(c)?.base || 0))}</span>
                    <span className="s2-lp-rate-unit">{t('s2.home.rates.unit')}</span>
                  </button>
                ))}
              </div>
              <div className="s2-lp-rates-note">{t('s2v.rate.disclaimer')}</div>
            </section>

            {/* 최종 CTA */}
            <section className="s2-lp-band">
              <div className="s2-lp-band-t">{t('s2.home.final.t')}</div>
              <div className="s2-lp-band-d">{t('s2.home.final.d')}</div>
              <button className="btn s2-lp-band-btn" onClick={() => enterFlow(false)}>
                {t('s2.home.hero.cta')} →
              </button>
            </section>
          </>
        ) : (
        <>
        <section className="s2-hero">
          <div className="s2-hero-eyebrow">{t('s2.home.hero.eyebrow')}</div>
          <h1 className="s2-hero-t">{t('s2.hero.t')}</h1>
          <p className="s2-hero-d">{t('s2.hero.d')}</p>
        </section>

        <div className="s2-steps">
          {[
            { key: 'region', label: t('s2v.step.region') },
            { key: 'branch', label: t('s2.step.branch') },
            { key: 'amount', label: t('s2.step.amount') },
          ].map((s, i) => (
            <div
              key={s.key}
              className={`s2-step${i === stepIdx ? ' on' : ''}${i < stepIdx ? ' done' : ''}`}
            >
              <span className="s2-step-num">{i < stepIdx ? '✓' : i + 1}</span>
              <span className="s2-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1 · 지역 선택 */}
        {step === 'region' && (
          <section className="s2-card">
            <h2 className="s2-card-t">{t('s2v.region.title')}</h2>
            <p className="s2-card-sub">{t('s2v.region.sub')}</p>
            <div className="s2-region-chips">
              {REGIONS.map((r) => (
                <button
                  key={r.ko}
                  type="button"
                  className="s2-region-chip"
                  onClick={() => selectRegion(r.ko)}
                >
                  <Ic name="pin" className="s2-region-ic" />
                  <span className="s2-region-name">{r[lang] || r.ko}</span>
                </button>
              ))}
            </div>
            <button
              className="btn s2-geo-btn block"
              onClick={() => {
                findNearMe()
                setStep('branch')
              }}
            >
              {geoStatus === 'locating' ? t('s2.geo.locating') : t('s2.geo.btn')}
            </button>
            {geoStatus === 'error' && <div className="s2-geo-err">{t('s2.geo.error')}</div>}
            <div className="s2-note">{t('s2.note')}</div>
          </section>
        )}

        {/* STEP 2 · 지점 선택 (검색 + 찾아드릴게요) */}
        {step === 'branch' && (
          <section className="s2-card">
            <h2 className="s2-card-t">{t('s2.br2.title')}</h2>
            <p className="s2-card-sub">{t('s2.br2.sub')}</p>

            {/* 검색 */}
            <input
              className="s2-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('s2.search.placeholder')}
            />

            {/* 저희가 찾아드릴게요! (내 위치) */}
            <button className="btn s2-geo-btn block" onClick={findNearMe}>
              {geoStatus === 'locating' ? t('s2.geo.locating') : t('s2.geo.btn')}
            </button>
            {geoStatus === 'error' && <div className="s2-geo-err">{t('s2.geo.error')}</div>}

            {/* 검색 결과 or 인기 위치 */}
            {query.trim().length >= 2 ? (
              <div className="s2-loc-list">
                {searching && <div className="s2-empty">{t('s2.search.searching')}</div>}
                {!searching && results.length === 0 && (
                  <div className="s2-empty">{t('s2.loc.none')}</div>
                )}
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`s2-loc-item${loc && loc.lat === r.lat && loc.lng === r.lng ? ' on' : ''}`}
                    onClick={() => setLoc({ name: r.name, lat: r.lat, lng: r.lng })}
                  >
                    <span className="s2-loc-kind" aria-hidden="true">📍</span>
                    <span className="s2-loc-name">{r.name}</span>
                    <span className="s2-loc-go">→</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="s2-field-label">{t('s2.popular')}</div>
                <div className="s2-pop-chips">
                  {POPULAR.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="s2-pop-chip"
                      onClick={() => setLoc({ name: p.name[lang] || p.name.ko, lat: p.lat, lng: p.lng })}
                    >
                      {p.name[lang] || p.name.ko}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 지도 + 추천 지점 (위치 선택 시) */}
            {loc && (
              <div className="s2-reco">
                <div className="s2-picked">
                  <span aria-hidden="true">📍</span> {loc.name}
                </div>
                <Site2Map center={{ lat: loc.lat, lng: loc.lng, label: loc.name }} points={mapPoints} />
                <div className="s2-map-attr">{t('s2.mapattr')}</div>
                <div className="s2-reco-title">{t('s2.reco.title')}</div>
              </div>
            )}

            {/* 지점 리스트 (위치 있으면 가까운 순, 없으면 전체) */}
            {!loc && <div className="s2-field-label">{t('s2.all.title')}</div>}
            <div className="s2-branch-list">
              {branches.length === 0 && <div className="s2-empty">{t('s2.br.none')}</div>}
              {branches.map(({ b, km }, i) => (
                <div key={b.id} className={`s2-branch${loc && i === 0 ? ' best' : ''}`}>
                  <div className="s2-branch-head">
                    <span className="s2-branch-name">{b.name[lang] || b.name.ko}</span>
                    {loc && i === 0 && <span className="s2-branch-badge">{t('s2.br.best')}</span>}
                  </div>
                  <div className="s2-branch-addr">{b.address[lang] || b.address.ko}</div>

                  {/* 지점 상세 토글 (영업시간·전화·지도) */}
                  <button
                    type="button"
                    className="s2-branch-more"
                    aria-expanded={detailBranch === b.id}
                    onClick={() => setDetailBranch((cur) => (cur === b.id ? '' : b.id))}
                  >
                    {detailBranch === b.id ? t('s2.br.detail.hide') : t('s2.br.detail')}
                    <span className="s2-branch-more-caret" aria-hidden="true">
                      {detailBranch === b.id ? '▴' : '▾'}
                    </span>
                  </button>
                  {detailBranch === b.id && (
                    <div className="s2-branch-detail">
                      <div className="s2-branch-detail-row">
                        <Ic name="clock" />
                        <span>{t('s2.br.hours')}</span>
                        <b>{b.hours.open} – {b.hours.close}</b>
                      </div>
                      <div className="s2-branch-detail-row">
                        <Ic name="phone" />
                        <span>{t('s2.br.phone')}</span>
                        <b><a href={`tel:${b.phone}`}>{b.phone}</a></b>
                      </div>
                      <Site2Map
                        center={{ lat: b.lat, lng: b.lng, label: b.name[lang] || b.name.ko }}
                        points={[]}
                      />
                      <div className="s2-map-attr">{t('s2.mapattr')}</div>
                    </div>
                  )}

                  <div className="s2-branch-foot">
                    <span className="s2-branch-km">
                      {km == null
                        ? b.address[lang]?.split(',').pop()?.trim() || ''
                        : `📍 ${km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} ${t('s2.br.away')}`}
                    </span>
                    <button className="btn s2-primary s2-branch-pick" onClick={() => reserveAt(b.id)}>
                      {t('s2.br.pick')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn s2-ghost block" onClick={() => setStep('region')}>
              {t('s2.back')}
            </button>
          </section>
        )}

        {/* STEP 3 · 금액 입력 */}
        {step === 'amount' && (
          <section className="s2-card">
            <h2 className="s2-card-t">{t('s2.amount.title')}</h2>

            {/* 선택 지점 요약 */}
            <div className="s2v-summary">
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.branch')}</span>
                <b>{pickBranchObj ? pickBranchObj.name[lang] || pickBranchObj.name.ko : '-'}</b>
              </div>
            </div>

            {/* 환전 방향 — 외화→원화(매입) / 원화→외화(매각) */}
            <div className="s2-field-label">{t('s2.dir.label')}</div>
            <div className="s2-dir-toggle" role="group" aria-label={t('s2.dir.label')}>
              <button
                type="button"
                className={`s2-dir-btn${direction === 'BUY' ? ' on' : ''}`}
                onClick={() => setDirection('BUY')}
              >
                {t('s2.dir.buy')}
              </button>
              <button
                type="button"
                className={`s2-dir-btn${direction === 'SELL' ? ' on' : ''}`}
                onClick={() => setDirection('SELL')}
              >
                {t('s2.dir.sell')}
              </button>
            </div>

            <div className="s2-field-label">{t('s2.amount.cur')}</div>
            <div className="s2-cur-chips">
              {branchCurrencies(pickedBranch).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`s2-cur-chip${c === currency ? ' on' : ''}`}
                  onClick={() => setCurrency(c)}
                >
                  <span aria-hidden="true">{CURRENCY_META[c]?.flag}</span> {c}
                </button>
              ))}
            </div>

            {/* 현재 환율 (참고 표시) */}
            {board > 0 && (
              <div className="s2v-baserate">
                <div className="s2v-baserate-row">
                  <span className="s2v-baserate-l">{t('s2v.baserate.label')}</span>
                  <span className="s2v-baserate-v">
                    1 {currency} = {formatKrw(Math.round(board))}
                  </span>
                </div>
                <div className="s2v-baserate-note">{t('s2v.rate.disclaimer')}</div>
              </div>
            )}

            <div className="s2-field-label">{t('s2.amount.amt')}</div>
            <div className="s2-amount-row">
              <span className="s2-amount-flag" aria-hidden="true">{CURRENCY_META[currency]?.flag}</span>
              <input
                className="s2-amount-input"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="0"
              />
              <span className="s2-amount-cur">{currency}</span>
            </div>
            <div className="s2v-hint">
              {direction === 'BUY' ? t('s2.dir.buy.hint') : t('s2.dir.sell.hint')}
            </div>
            <CompareMini t={t} amount={amount} board={board} direction={direction} />
            <div className="s2v-rate-note">
              {couponOn ? t('s2v.rate.note.coupon') : t('s2v.rate.note')}
            </div>

            {/* 수령 예정일 — 예약 가능 기간(오늘~본사 설정 N일) 내 선택 */}
            <div className="s2-field-label">{t('s2v.info.pickup')}</div>
            <input
              className="s2-search"
              type="date"
              value={pickupDate}
              min={range.minDate}
              max={range.maxDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
            <div className="s2v-hint">
              {t('s2v.info.pickuphint').replace('{days}', maxWindowDays)}
            </div>

            {/* 최고가 보장 배너 — 회원가입 시 주변 시세보다 무조건 우대 */}
            {couponOn ? (
              <GuaranteeApplied t={t} />
            ) : (
              <GuaranteeCTA t={t} onClick={openSignup} />
            )}

            <button
              className="btn s2-primary block"
              disabled={!amountValid}
              onClick={goNext}
            >
              {couponOn ? t('s2v.info.submit') : t('s2.next')}
            </button>
            <button className="btn s2-ghost block" onClick={() => setStep('branch')}>
              {t('s2.back')}
            </button>
          </section>
        )}

        {/* STEP 4 · 예약자 정보 (비회원만 · 회원은 건너뜀. 환율 고정 없음) */}
        {step === 'info' && (
          <section className="s2-card">
            <h2 className="s2-card-t">{t('s2v.info.title')}</h2>

            {/* 예약 요약 */}
            <div className="s2v-summary">
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.branch')}</span>
                <b>{pickBranchObj ? pickBranchObj.name[lang] || pickBranchObj.name.ko : '-'}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.direction')}</span>
                <b>{direction === 'BUY' ? t('s2.dir.buy') : t('s2.dir.sell')}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.amount')}</span>
                <b>{CURRENCY_META[currency]?.flag} {formatKrw(Number(amount)).replace('₩', '')} {currency}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.pickup')}</span>
                <b>{pickupDate || '-'}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.rate')}</span>
                <b className={couponOn ? 's2v-rate-good' : ''}>
                  {couponOn ? t('s2v.sum.rate.coupon') : t('s2v.sum.rate.board')}
                </b>
              </div>
            </div>
            <div className="s2v-sum-note">{t('s2v.rate.disclaimer')}</div>

            {!couponOn && (
              <GuaranteeCTA t={t} onClick={openSignup} quick={nameEmailReady} />
            )}

            <div className="s2-field-label">{t('common.name')}</div>
            <input
              className="s2-search"
              type="text"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="HONG GILDONG"
            />
            <div className="s2v-hint">{t('s2v.info.namehint')}</div>

            <div className="s2-field-label">{t('common.email')}</div>
            <input
              className="s2-search"
              type="email"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <button className="btn s2-primary block" disabled={!infoValid} onClick={submitV2}>
              {t('s2v.info.submit')}
            </button>
            <button className="btn s2-ghost block" onClick={() => setStep('amount')}>
              {t('s2.back')}
            </button>
          </section>
        )}

        {/* STEP 4 · 완료 */}
        {step === 'done' && result && (
          <section className="s2-card s2v-done">
            <div className="s2v-done-ic" aria-hidden="true">🎉</div>
            <h2 className="s2-card-t">{t('s2v.done.title')}</h2>
            <div className="s2v-resno">{result.reservationNo}</div>
            <div className="s2v-summary">
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.branch')}</span>
                <b>{pickBranchObj ? pickBranchObj.name[lang] || pickBranchObj.name.ko : '-'}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.direction')}</span>
                <b>{result.transactionType === 'SELL' ? t('s2.dir.sell') : t('s2.dir.buy')}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.amount')}</span>
                <b>{CURRENCY_META[currency]?.flag} {formatKrw(Number(amount)).replace('₩', '')} {currency}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.pickup')}</span>
                <b>{result.pickupDate}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.rate')}</span>
                <b className={couponOn ? 's2v-rate-good' : ''}>
                  {couponOn ? t('s2v.sum.rate.coupon') : t('s2v.sum.rate.board')}
                </b>
              </div>
            </div>
            <div className="s2v-sum-note">{t('s2v.rate.disclaimer')}</div>
            <div className="s2v-done-note">{t('s2v.done.note')}</div>
            <button className="btn s2-ghost block" onClick={restartV2}>
              {t('s2v.done.again')}
            </button>
          </section>
        )}
        </>
        )}
      </main>

      {/* 회원가입(쿠폰) 모달 — 가입 시 전광판보다 우대 쿠폰 지급 */}
      {showSignup && (
        <div className="coupon-overlay" onClick={() => setShowSignup(false)}>
          <div className="signup-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <span className="signup-badge"><Ic name="shield" /> {t('s2v.signup.badge')}</span>
            <h3 className="signup-title">{t('s2v.signup.title')}</h3>
            <p className="signup-d">{t('s2v.signup.d')}</p>

            <label className="signup-label">{t('common.name')}</label>
            <input
              className="signup-input"
              type="text"
              value={suName}
              onChange={(e) => setSuName(e.target.value)}
              placeholder="HONG GILDONG"
            />

            <label className="signup-label">{t('common.email')}</label>
            <input
              className="signup-input"
              type="email"
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <label className="signup-label">{t('s2v.signup.pw')}</label>
            <input
              className="signup-input"
              type="password"
              value={suPw}
              onChange={(e) => setSuPw(e.target.value)}
              placeholder={t('s2v.signup.pw.ph')}
            />
            {suErr && <div className="err-text">{suErr}</div>}
            <button className="btn primary block" onClick={claimCoupon}>
              {t('s2v.signup.cta')}
            </button>
            <button className="signup-skip" onClick={() => setShowSignup(false)}>
              {t('s2v.signup.skip')}
            </button>
            <div className="signup-note">{t('signup.note')}</div>
          </div>
        </div>
      )}

      {/* 다크 푸터 (OrangeSquare 참고) */}
      <footer className="s2-footer">
        <div className="s2-footer-inner">
          <div className="s2-footer-left">
            <div className="s2-footer-logo">
              MONEY<span>BOX</span>
            </div>
            <div className="s2-footer-links">
              <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.l.about')}</a>
              <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.terms')}</a>
              <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.privacy')}</a>
              <a href="#" onClick={(e) => e.preventDefault()}>{t('footer.l.faq')}</a>
              <a href={ESIM_URL} target="_blank" rel="noreferrer noopener">eSIM ↗</a>
            </div>
          </div>
          <div className="s2-footer-right">
            <div className="s2-footer-contact">{t('s2.foot.cs')}: cs@moneybox.example</div>
            <div className="s2-footer-contact">{t('s2.foot.partner')}: contact@moneybox.example</div>
            <div className="s2-footer-contact">{t('s2.foot.tel')}: +82-1833-0000</div>
            <div className="s2-footer-addr">{t('s2.foot.addr')}</div>
            <div className="s2-footer-social">
              <LanguageDropdown />
              <span className="s2-social-ic" aria-hidden="true">📷</span>
              <span className="s2-social-ic" aria-hidden="true">🧵</span>
              <span className="s2-social-ic" aria-hidden="true">✖️</span>
            </div>
          </div>
        </div>
        <div className="s2-footer-copy">{t('s2.foot.copy')}</div>
      </footer>
    </div>
  )
}
