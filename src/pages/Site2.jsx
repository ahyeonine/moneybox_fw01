import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useRates } from '../store/RatesContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { CURRENCY_META, CURRENCY_ORDER, WEB_COUPON_BONUS } from '../data/rates.js'
import { BRANCHES, getBranch, branchCurrencies, regionList } from '../data/branches.js'
import { formatKrw } from '../lib/format.js'
import { isValidName, isValidEmail } from '../lib/validation.js'
import { pickupRange } from '../lib/date.js'
import LanguageDropdown from '../components/LanguageDropdown.jsx'
import AboutPage from './AboutPage.jsx'
import LookupPage from './LookupPage.jsx'

// 외국인 웹사이트: 환율을 예약 시점에 고정하지 않는다(수령일 전광판 환율 적용).
// 회원가입 쿠폰 보유 시 전광판 환율보다 우대(더 많은 원화)를 적용한다.
const COUPON_BONUS = WEB_COUPON_BONUS

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
  { key: 'bank', emoji: '🏦' },
  { key: 'kiosk', emoji: '🏧' },
  { key: 'airport', emoji: '✈️' },
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
function CompareMini({ t, amount, board }) {
  const amt = Number(amount) || 0
  return (
    <div className="s2v-cmpmini">
      <div className="s2v-cmpmini-h">📈 {t('s2.home.cmp.mini')}</div>
      {CHANNEL_BARS.map((c) => {
        const won = amt > 0 && board > 0 ? Math.round(amt * board * c.less) : null
        return (
          <div key={c.key} className="s2v-cmpmini-row">
            <span className="s2v-cmpmini-name">{c.emoji} {t(`s2.home.cmp.${c.key}`)}</span>
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

  const [view, setView] = useState('home') // home | flow | about
  const [step, setStep] = useState('region') // region | branch | amount | info | done
  const howRef = useRef(null)
  const [region, setRegion] = useState('') // 선택 지역(ko)
  const [currency, setCurrency] = useState('USD')
  const [amount, setAmount] = useState('')

  // 위치 검색 (Nominatim) + 내 위치(Geolocation)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [geoStatus, setGeoStatus] = useState('') // '' | 'locating' | 'error'
  const [loc, setLoc] = useState(null) // { name, lat, lng }

  // 예약자 정보 + 수령일 (환율 고정 없음)
  const [pickedBranch, setPickedBranch] = useState('')
  const [custName, setCustName] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [result, setResult] = useState(null)

  // 쿠폰(회원가입 지급) — 보유 시 전광판보다 우대. couponMember != null = 쿠폰 보유
  const [couponMember, setCouponMember] = useState(null)
  const [showSignup, setShowSignup] = useState(false)
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suErr, setSuErr] = useState('')

  const couponOn = !!couponMember
  const board = getDisplayRates(currency)?.base || 0 // 전광판(오늘) 환율
  const effRate = couponOn ? board * (1 + COUPON_BONUS) : board // 예상용(실제는 수령일 적용)
  const krw = amount ? Math.round(Number(amount) * effRate) : 0

  const range = pickupRange(today, 0, 14) // 리드타임 0, 최대 2주
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
    if (region) list = list.filter((b) => b.region.ko === region)
    if (!loc) return list.map((b) => ({ b, km: null }))
    return list.map((b) => ({ b, km: distanceKm(loc, b) })).sort((x, y) => x.km - y.km)
  }, [loc, region])

  const mapPoints = useMemo(
    () => branches.map(({ b }) => ({ lat: b.lat, lng: b.lng, label: b.name[lang] || b.name.ko })),
    [branches, lang]
  )

  const REGIONS = regionList()
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

  // 금액 입력 완료 → 예약자 정보 단계로
  function goInfo() {
    if (!(Number(amount) > 0)) return
    if (couponMember) {
      setCustName((v) => v || couponMember.name)
      setCustEmail((v) => v || couponMember.email)
    }
    setStep('info')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 회원가입(쿠폰 지급) — 이름·이메일. 지급 즉시 전광판보다 우대 쿠폰 보유.
  function claimCoupon() {
    if (!isValidName(suName) || !isValidEmail(suEmail)) {
      setSuErr(t('s2v.signup.err'))
      return
    }
    setCouponMember({ name: suName.trim(), email: suEmail.trim() })
    setCustName((v) => v || suName.trim())
    setCustEmail((v) => v || suEmail.trim())
    setShowSignup(false)
    setSuErr('')
  }

  const infoValid =
    isValidName(custName) &&
    isValidEmail(custEmail) &&
    !!pickupDate &&
    pickupDate >= range.minDate &&
    pickupDate <= range.maxDate

  // 예약 생성 — 환율 미고정(rate=null, rateMode='BOARD'). 쿠폰 여부 기록.
  function submitV2() {
    if (!infoValid || !pickedBranch) return
    const rec = createReservation({
      transactionType: 'BUY',
      branchId: pickedBranch,
      currency,
      rate: null, // 환율 고정 없음 → 수령일 전광판 환율 적용
      rateMode: 'BOARD',
      coupon: couponOn,
      foreignAmount: Number(amount),
      krwAmount: null,
      customerName: custName.trim().toUpperCase(),
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
                <span className="s2-lp-eyebrow">{t('s2.home.hero.eyebrow')}</span>
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
                      <span className="s2-region-emoji" aria-hidden="true">📍</span>
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
                  <span className="s2-lp-cmp-name">🏆 {t('s2.home.cmp.mb')}</span>
                  <div className="s2-lp-cmp-bar">
                    <span className="s2-lp-cmp-fill mb" style={{ width: '100%' }} />
                  </div>
                  <span className="s2-lp-cmp-tag">{t('s2.home.cmp.mbtag')}</span>
                </div>
                {CHANNEL_BARS.map((c) => (
                  <div key={c.key} className="s2-lp-cmp-row">
                    <span className="s2-lp-cmp-name">{c.emoji} {t(`s2.home.cmp.${c.key}`)}</span>
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
                  { ic: '🛡️', t: 's2.home.val1.t', d: 's2.home.val1.d' },
                  { ic: '🛂', t: 's2.home.val2.t', d: 's2.home.val2.d' },
                  { ic: '📍', t: 's2.home.val3.t', d: 's2.home.val3.d' },
                ].map((v) => (
                  <div key={v.t} className="s2-lp-val">
                    <span className="s2-lp-val-ic" aria-hidden="true">{v.ic}</span>
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
                  <span className="s2-region-emoji" aria-hidden="true">📍</span>
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
            <CompareMini t={t} amount={amount} board={board} />
            <div className="s2v-rate-note">
              {couponOn ? t('s2v.rate.note.coupon') : t('s2v.rate.note')}
            </div>

            {/* 쿠폰(회원가입) 배너 — 전광판보다 좋은 환율 */}
            {couponOn ? (
              <div className="s2v-coupon on">🎟️ {t('s2v.coupon.applied')}</div>
            ) : (
              <button type="button" className="s2v-coupon" onClick={() => setShowSignup(true)}>
                <span className="s2v-coupon-t">🎟️ {t('s2v.coupon.cta.t')}</span>
                <span className="s2v-coupon-d">{t('s2v.coupon.cta.d')}</span>
              </button>
            )}

            <button
              className="btn s2-primary block"
              disabled={!amount || Number(amount) <= 0}
              onClick={goInfo}
            >
              {t('s2.next')}
            </button>
            <button className="btn s2-ghost block" onClick={() => setStep('branch')}>
              {t('s2.back')}
            </button>
          </section>
        )}

        {/* STEP 4 · 예약자 정보 + 수령일 (환율 고정 없음) */}
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
                <span>{t('s2v.sum.amount')}</span>
                <b>{CURRENCY_META[currency]?.flag} {formatKrw(Number(amount)).replace('₩', '')} {currency}</b>
              </div>
              <div className="s2v-sum-row">
                <span>{t('s2v.sum.rate')}</span>
                <b className={couponOn ? 's2v-rate-good' : ''}>
                  {couponOn ? t('s2v.sum.rate.coupon') : t('s2v.sum.rate.board')}
                </b>
              </div>
            </div>

            {!couponOn && (
              <button type="button" className="s2v-coupon" onClick={() => setShowSignup(true)}>
                <span className="s2v-coupon-t">🎟️ {t('s2v.coupon.cta.t')}</span>
                <span className="s2v-coupon-d">{t('s2v.coupon.cta.d')}</span>
              </button>
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

            <div className="s2-field-label">{t('s2v.info.pickup')}</div>
            <input
              className="s2-search"
              type="date"
              value={pickupDate}
              min={range.minDate}
              max={range.maxDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
            <div className="s2v-hint">{t('s2v.info.pickuphint')}</div>

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
            <span className="signup-badge">🎟️ {t('s2v.signup.badge')}</span>
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
