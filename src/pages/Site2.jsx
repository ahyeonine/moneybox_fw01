import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useRates } from '../store/RatesContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { useEmail } from '../store/EmailContext.jsx'
import { CURRENCY_META, CURRENCY_ORDER } from '../data/rates.js'
import { BRANCHES, getBranch, branchCurrencies, regionChips, branchMatchesRegion } from '../data/branches.js'
import { formatKrw } from '../lib/format.js'
import { isValidName, isValidEmail } from '../lib/validation.js'
import { pickupRange } from '../lib/date.js'
import { usePolicy } from '../store/PolicyContext.jsx'
import LanguageDropdown from '../components/LanguageDropdown.jsx'
import DevNote from '../components/DevNote.jsx'
import AboutPage from './AboutPage.jsx'
import LookupPage from './LookupPage.jsx'

// 외국인 웹사이트: 환율을 예약 시점에 고정하지 않는다(수령일 전광판 환율 적용).
// 회원 우대 대상은 수령 시 현장에서 상황에 맞춰 최대한 우대(고정 우대율·자동적용 아님).

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
  store: 'M4 9 5.2 4h13.6L20 9M4 9h16M4 9v11h16V9M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0M9.5 20v-5h5v5',
  money: 'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm9 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM6 8v8m12-8v8',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3.5 2',
  phone: 'M15.5 20.5a12.5 12.5 0 0 1-12-12A2 2 0 0 1 5.4 6.4l2 .3a2 2 0 0 1 1.7 1.6l.3 1.5a2 2 0 0 1-.6 1.9l-.9.8a10 10 0 0 0 4 4l.8-.9a2 2 0 0 1 1.9-.6l1.5.3a2 2 0 0 1 1.6 1.7l.3 2a2 2 0 0 1-2.1 2.2Z',
  check: 'M5 12.5 10 17.5 19.5 7',
}

// 회원 우대 유도 배너. quick=true(정보 입력 후)면 "비밀번호만 추가" 후킹으로 전환.
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
// 이메일 인증(수신 가능 여부 확인) — 프로토타입: 인증번호를 생성해 이메일(mock)로 "발송"하고
// 데모 편의를 위해 화면에 인증번호를 노출한다. 입력한 이메일이 바뀌면 인증은 자동으로 무효화된다.
function EmailVerify({ email, verified, onVerify, sendEmail, t }) {
  const [sentTo, setSentTo] = useState('') // 인증번호를 보낸 이메일
  const [code, setCode] = useState('') // 발송된 인증번호(데모)
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')

  if (verified) {
    return (
      <div className="s2v-verify ok">
        <Ic name="check" /> {t('s2v.verify.done')}
      </div>
    )
  }

  const emailOk = isValidEmail(email)
  const showCode = !!sentTo && sentTo === email.trim()

  function send() {
    if (!emailOk) {
      setErr(t('s2v.verify.err.email'))
      return
    }
    const c = String(Math.floor(100000 + Math.random() * 900000))
    setCode(c)
    setSentTo(email.trim())
    setInput('')
    setErr('')
    sendEmail('auth', email.trim(), { code: c }) // 이메일 Outbox에 기록
  }
  function confirm() {
    if (input.trim() === code) {
      setErr('')
      onVerify(email.trim())
    } else {
      setErr(t('s2v.verify.err.code'))
    }
  }

  return (
    <div className="s2v-verify">
      {!showCode ? (
        <button type="button" className="s2v-verify-send" disabled={!emailOk} onClick={send}>
          {t('s2v.verify.send')}
        </button>
      ) : (
        <>
          <div className="s2v-verify-row">
            <input
              className="s2v-verify-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder={t('s2v.verify.ph')}
            />
            <button type="button" className="s2v-verify-confirm" onClick={confirm}>
              {t('s2v.verify.confirm')}
            </button>
          </div>
          <div className="s2v-verify-sent">{t('s2v.verify.sent').replace('{email}', sentTo)}</div>
          <div className="s2v-verify-demo">{t('s2v.verify.demo').replace('{code}', code)}</div>
          <button type="button" className="s2v-verify-resend" onClick={send}>
            {t('s2v.verify.resend')}
          </button>
        </>
      )}
      {err && <div className="err-text">{err}</div>}
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

// 타 환전 채널·키오스크·공항이 머니박스보다 "덜 주는" 비율(예시 수치, V1 비교 카드와 동일 톤).
// 원화 환산액 대신 "평균 몇 % 더 많이 받는지"를 노출하기 위한 산출용.
const CHANNEL_LESS = { other: 0.021, kiosk: 0.041, airport: 0.093 }
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
  { key: 'other', icon: 'store' },
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

// 머니24h 무인환전기(24시간·예약 없이 이용) 위치 — 위치 안내용 목데이터.
// 예약·수령은 지점에서만. 무인기는 지도에 "어디에 있다" 정도만 표시한다.
const MONEY24H = [
  { id: 'k-mdong', name: { ko: '명동 눈스퀘어', en: 'Myeongdong Noon Square' }, addr: { ko: '서울 중구 명동8길 27', en: '27 Myeongdong 8-gil, Jung-gu, Seoul' }, lat: 37.5638, lng: 126.9827 },
  { id: 'k-hongdae', name: { ko: '홍대입구역 9번 출구', en: 'Hongdae Stn Exit 9' }, addr: { ko: '서울 마포구 양화로 지하 160', en: 'B160 Yanghwa-ro, Mapo-gu, Seoul' }, lat: 37.5571, lng: 126.9235 },
  { id: 'k-gangnam', name: { ko: '강남역 지하상가', en: 'Gangnam Stn Mall' }, addr: { ko: '서울 강남구 강남대로 지하 396', en: 'B396 Gangnam-daero, Gangnam-gu, Seoul' }, lat: 37.4972, lng: 127.0286 },
  { id: 'k-dongdaemun', name: { ko: '동대문 DDP', en: 'Dongdaemun DDP' }, addr: { ko: '서울 중구 을지로 281', en: '281 Eulji-ro, Jung-gu, Seoul' }, lat: 37.5663, lng: 127.0092 },
  { id: 'k-icn', name: { ko: '인천공항 T1 입국장', en: 'Incheon Airport T1 Arrivals' }, addr: { ko: '인천 중구 공항로 272 T1 입국장', en: 'T1 Arrivals, 272 Gonghang-ro, Jung-gu, Incheon' }, lat: 37.4487, lng: 126.4526 },
  { id: 'k-seomyeon', name: { ko: '부산 서면역', en: 'Busan Seomyeon Stn' }, addr: { ko: '부산 부산진구 중앙대로 지하 730', en: 'B730 Jungang-daero, Busanjin-gu, Busan' }, lat: 35.1578, lng: 129.0596 },
  { id: 'k-haeundae', name: { ko: '해운대 해수욕장', en: 'Haeundae Beach' }, addr: { ko: '부산 해운대구 해운대해변로 264', en: '264 Haeundaehaebyeon-ro, Haeundae-gu, Busan' }, lat: 35.1587, lng: 129.1604 },
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

// 컴팩트 환율 비교 — 타 환전 채널·키오스크·공항보다 "약 얼마 더 받는지"(원화).
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
// kiosks: 머니24h 무인환전기 위치(위치 안내용 · 예약 불가) — 지점(파랑)과 다른 색으로 표시.
function Site2Map({ center, points, kiosks = [], onPick }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const pickRef = useRef(onPick) // 최신 onPick을 이펙트 재실행 없이 참조
  pickRef.current = onPick

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mod = await import('leaflet')
        await import('leaflet/dist/leaflet.css')
        const L = mod.default || mod
        if (cancelled || !elRef.current) return
        // 초기/폴백 중심점: 내 위치 → 첫 지점 → 첫 무인기 → 서울 시청
        const fb = center || points[0] || kiosks[0] || { lat: 37.5665, lng: 126.978 }
        if (!mapRef.current) {
          mapRef.current = L.map(elRef.current, { scrollWheelZoom: false }).setView(
            [fb.lat, fb.lng],
            12
          )
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'OpenStreetMap contributors',
          }).addTo(mapRef.current)
          layerRef.current = L.layerGroup().addTo(mapRef.current)
        }
        const map = mapRef.current
        const layer = layerRef.current
        layer.clearLayers()
        const bounds = []
        // 예쁜 핀(divIcon): 색 + 아이콘. 지점=파란 핀(), 무인기=청록 핀().
        const pin = (cls, glyph) =>
          L.divIcon({
            className: 's2mk-wrap',
            html: `<div class="s2mk ${cls}"><i>${glyph}</i></div>`,
            iconSize: [34, 42],
            iconAnchor: [17, 36],
            popupAnchor: [0, -32],
            tooltipAnchor: [0, -28],
          })
        // 내 위치(선택 시)만 펄스 도트로 표시. 없으면 지점·무인기만 표시.
        if (center) {
          L.marker([center.lat, center.lng], {
            icon: L.divIcon({ className: 's2mk-wrap', html: '<div class="s2mk-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] }),
          })
            .addTo(layer)
            .bindPopup(center.label)
          bounds.push([center.lat, center.lng])
        }
        points.forEach((p) => {
          const m = L.marker([p.lat, p.lng], { icon: pin('s2mk-branch', '') }).addTo(layer)
          // 지점 마커: 클릭하면 바로 선택(예약 단계로). 호버 시 지점명 툴팁.
          if (p.id && pickRef.current) {
            m.bindTooltip(p.label)
            m.on('click', () => pickRef.current(p.id))
            const el = m.getElement && m.getElement()
            if (el) el.style.cursor = 'pointer'
          } else {
            m.bindPopup(p.label)
          }
          bounds.push([p.lat, p.lng])
        })
        // 머니24h 무인환전기 — 위치 안내용(예약 불가). 청록 핀().
        kiosks.forEach((k) => {
          L.marker([k.lat, k.lng], { icon: pin('s2mk-kiosk', '') })
            .addTo(layer)
            .bindPopup(k.label)
          bounds.push([k.lat, k.lng])
        })
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 })
        else map.setView([fb.lat, fb.lng], 13)
        setTimeout(() => map && map.invalidateSize(), 120)
      } catch (e) {
        /* 지도 로드 실패 → 조용히 무시(리스트/추천은 정상 동작) */
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [center, points, kiosks])

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
  const { sendEmail } = useEmail() // 이메일 인증번호 발송(mock) → Outbox 기록
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
  const [verifiedEmail, setVerifiedEmail] = useState('') // 인증 완료된 이메일(수신 가능 확인)
  const [marketingOptIn, setMarketingOptIn] = useState(false) // 마케팅 정보 수신 동의(선택)
  const [custPw, setCustPw] = useState('') // 정보 단계 인라인 회원가입 비밀번호(선택)
  const [joinedNow, setJoinedNow] = useState(false) // 이번 예약과 함께 회원가입했는지
  const [result, setResult] = useState(null)

  // 회원가입 — couponMember != null = 회원(수령 시 현장 우대)
  const [couponMember, setCouponMember] = useState(null)
  const [showSignup, setShowSignup] = useState(false)
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPw, setSuPw] = useState('') // 비밀번호
  const [suVerifiedEmail, setSuVerifiedEmail] = useState('') // 회원가입 이메일 인증 완료값
  const [suMarketing, setSuMarketing] = useState(true) // 회원가입 마케팅 수신 동의(기본 동의)
  const [suErr, setSuErr] = useState('')

  const couponOn = !!couponMember // 회원 우대 대상 여부(수령 시 현장 우대)
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
    () => branches.map(({ b }) => ({ id: b.id, lat: b.lat, lng: b.lng, label: b.name[lang] || b.name.ko })),
    [branches, lang]
  )

  // 지도에 함께 표시할 머니24h 무인환전기 — 현재 지역 지점 주변(50km 내). 위치 안내용(예약 불가).
  // 마커 클릭 시 위치정보 팝업(이름·유형·주소·24시간/예약 불가)을 HTML로 표시.
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const mapKiosks = useMemo(() => {
    const bs = branches.map((x) => x.b)
    if (!bs.length) return []
    const near = MONEY24H.filter((k) => bs.some((b) => distanceKm(k, b) <= 50))
    const list = near.length ? near : MONEY24H
    return list.map((k) => {
      const nm = esc(k.name[lang] || k.name.ko)
      const ad = esc(k.addr[lang] || k.addr.ko)
      const label =
        `<div class="s2-kpop">` +
        `<b class="s2-kpop-t">${nm}</b>` +
        `<span class="s2-kpop-type">${esc(t('s2.kiosk.pop.type'))}</span>` +
        `<span class="s2-kpop-addr">${ad}</span>` +
        `<span class="s2-kpop-hours">${esc(t('s2.kiosk.pop.hours'))}</span>` +
        `</div>`
      return { lat: k.lat, lng: k.lng, label }
    })
  }, [branches, lang, t])

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
  // 회원(회원 우대)은 이름·이메일이 이미 있으므로 예약자 정보 입력 단계를 건너뛰고 바로 예약.
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

  // 회원가입 — 이름·이메일·비밀번호. 가입 즉시 회원 우대 대상(수령 시 현장 우대).
  // 이메일 인증(수신 가능 확인) 완료 필수. 회원은 예약 시 정보 단계를 건너뛰므로
  // 여기서 확인한 인증·마케팅 동의를 예약 흐름(custEmail/verifiedEmail/marketingOptIn)에 넘겨준다.
  function claimCoupon() {
    if (!isValidName(suName) || !isValidEmail(suEmail) || suPw.length < 6) {
      setSuErr(t('s2v.signup.err'))
      return
    }
    if (!suEmailVerified) {
      setSuErr(t('s2v.signup.verifyerr'))
      return
    }
    const em = suEmail.trim()
    setCouponMember({
      name: suName.trim(),
      email: em,
      marketing: suMarketing,
    })
    setCustName((v) => v || suName.trim())
    setCustEmail(em)
    setVerifiedEmail(em) // 회원가입 시 인증한 이메일 → 예약 흐름에서도 인증됨으로 처리
    setMarketingOptIn(suMarketing)
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

  // 이메일 인증 완료 여부 — 인증한 이메일과 현재 입력값이 같아야 유효(이메일 바꾸면 재인증)
  const emailVerified =
    isValidEmail(custEmail) && !!verifiedEmail && verifiedEmail === custEmail.trim()
  const suEmailVerified =
    isValidEmail(suEmail) && !!suVerifiedEmail && suVerifiedEmail === suEmail.trim()

  // 수령 예정일이 예약 가능 기간(오늘~ · 상한 없으면 무제한) 안인지
  const dateValid =
    !!pickupDate &&
    pickupDate >= range.minDate &&
    (range.maxDate == null || pickupDate <= range.maxDate)
  // 금액 단계 완료 조건: 금액 양수 + 수령일 유효
  const amountValid = Number(amount) > 0 && dateValid

  const infoValid =
    isValidName(custName) && isValidEmail(custEmail) && emailVerified && dateValid

  // 정보 단계 인라인 회원가입: 이름·이메일 인증을 이미 마쳤으므로 비밀번호(6자+)만 추가하면 가입
  const joinPwOk = custPw.length >= 6
  const willJoin = !couponMember && joinPwOk && emailVerified

  // 예약 생성 — 환율 미고정(rate=null, rateMode='BOARD'). 쿠폰 여부 기록.
  function submitV2() {
    if (!infoValid || !pickedBranch) return
    // 비회원이 비밀번호를 설정했으면 이번 예약과 함께 회원가입 처리(가입 즉시 회원 우대 대상)
    const joining = willJoin
    const isMember = couponOn || joining
    if (joining) {
      setCouponMember({ name: custName.trim(), email: custEmail.trim(), marketing: marketingOptIn })
    }
    setJoinedNow(joining)
    const rec = createReservation({
      transactionType: direction, // BUY(외화→원화) | SELL(원화→외화)
      branchId: pickedBranch,
      currency,
      rate: null, // 환율 고정 없음 → 수령일 전광판 환율 적용
      rateMode: 'BOARD',
      coupon: isMember, // 회원(기존/이번 가입)이면 회원 우대 대상
      foreignAmount: Number(amount),
      krwAmount: null,
      customerName: custName.trim().toUpperCase(),
      birthDate: null, // 웹 예약은 생년월일 미수집(POS 신분증 대조 시 확인)
      email: custEmail.trim(),
      emailVerified: true, // 인증 완료된 이메일(제출 조건에 포함)
      marketingConsent: marketingOptIn, // 마케팅 정보 수신 동의(선택)
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
    // 회원은 회원가입 시 인증한 이메일·마케팅 동의를 유지, 비회원은 초기화
    setVerifiedEmail(couponMember?.email || '')
    setMarketingOptIn(couponMember ? !!couponMember.marketing : false)
    setCustPw('')
    setJoinedNow(false)
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
      <DevNote
        items={[
          '외국인 전용 페이지(외국인 웹사이트). 통합웹(m-box.com)에서 언어를 외국어(EN·中文·日本語 등)로 선택하면 이 페이지로 자동 이동한다 — 국내 고객은 통합웹, 외국인은 이 페이지로 분기.',
          '이 프로토타입의 [Customer Website] 탭이 그 외국인 페이지에 해당한다. (통합웹 화면 자체는 프로토타입 범위 밖 — 진입 경로 설명용 메모)',
          '자세히: 01_IA.md',
        ]}
      />
      <header className="s2-header">
        <div className="s2-header-inner">
          <button type="button" className="s2-logo" onClick={() => setView('home')}>
            MONEY<span>BOX</span>
          </button>
          <nav className="s2-nav">
            <span className="s2-nav-langs">EN · 中文 · 日本語 · 한국어</span>
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
        }${view === 'flow' ? ' s2-main-flow' : ''}`}
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
                  <li>{t('s2.home.trust.rate')}</li>
                  <li>{t('s2.home.trust.pay')}</li>
                  <li>{t('s2.home.trust.branch')}</li>
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
                <button className="btn s2-primary block" onClick={() => enterFlow()}>
                  {t('s2.nav.book')} →
                </button>
              </div>
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
              <span className="s2-step-num">{i < stepIdx ? '' : i + 1}</span>
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
          <section className="s2-card s2-card-wide">
            <h2 className="s2-card-t">{t('s2.br2.title')}</h2>
            <p className="s2-card-sub">{t('s2.br2.sub')}</p>

            <div className="s2-branch-cols">
            {/* 좌측: 검색 + 지점 리스트 (검색은 좁게) */}
            <div className="s2-branch-left">
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
                    <span className="s2-loc-kind" aria-hidden="true"></span>
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

            {/* 지점 리스트 (위치 있으면 가까운 순, 없으면 전체) */}
            <div className="s2-field-label">{loc ? t('s2.reco.title') : t('s2.all.title')}</div>
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
                        center={null}
                        points={[{ lat: b.lat, lng: b.lng, label: b.name[lang] || b.name.ko }]}
                      />
                      <div className="s2-map-attr">{t('s2.mapattr')}</div>
                    </div>
                  )}

                  <div className="s2-branch-foot">
                    <span className="s2-branch-km">
                      {km == null
                        ? b.address[lang]?.split(',').pop()?.trim() || ''
                        : `${km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} ${t('s2.br.away')}`}
                    </span>
                    <button className="btn s2-primary s2-branch-pick" onClick={() => reserveAt(b.id)}>
                      {t('s2.br.pick')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>{/* /s2-branch-left */}

            {/* 우측: 지도 — 지점 + 무인기(머니24h) 항상 표시 */}
            <div className="s2-branch-right">
              {loc && (
                <div className="s2-picked"><span aria-hidden="true"></span> {loc.name}</div>
              )}
              <Site2Map
                center={loc ? { lat: loc.lat, lng: loc.lng, label: loc.name } : null}
                points={mapPoints}
                kiosks={mapKiosks}
                onPick={reserveAt}
              />
              <div className="s2-map-help">{t('s2.map.pickhint')}</div>
              <div className="s2-map-attr">{t('s2.mapattr')}</div>
              <div className="s2-maplegend">
                <span className="s2-maplegend-item"><span className="s2-dot branch" aria-hidden="true" /> {t('s2.kiosk.legend.branch')}</span>
                <span className="s2-maplegend-item"><span className="s2-dot kiosk" aria-hidden="true" /> {t('s2.kiosk.legend.kiosk')}</span>
              </div>
              <div className="s2-kiosk-note">{t('s2.kiosk.note')}</div>
            </div>
            </div>{/* /s2-branch-cols */}

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
            <div className="s2v-rate-note">
              {couponOn ? t('s2v.rate.note.coupon') : t('s2v.rate.note')}
            </div>

            {/* 수령 예정일 — 오늘 이후 자유 선택(본사가 상한을 지정한 경우에만 제한) */}
            <div className="s2-field-label">{t('s2v.info.pickup')}</div>
            <input
              className="s2-search"
              type="date"
              value={pickupDate}
              min={range.minDate}
              max={range.maxDate || undefined}
              onChange={(e) => setPickupDate(e.target.value)}
            />
            <div className="s2v-hint">
              {range.maxDate == null
                ? t('s2v.info.pickuphint.unlimited')
                : t('s2v.info.pickuphint').replace('{days}', maxWindowDays)}
            </div>

            {/* 회원 우대 배너 — 회원가입 시 수령 현장에서 우대 */}
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
            <div className="s2v-hint">{t('s2v.verify.hint')}</div>
            <EmailVerify
              email={custEmail}
              verified={emailVerified}
              onVerify={setVerifiedEmail}
              sendEmail={sendEmail}
              t={t}
            />

            {/* 인라인 회원가입 유도 — 이름·이메일 인증을 이미 마쳤으니 비밀번호만 추가하면 가입 */}
            <div className={`s2v-join${joinPwOk ? ' ready' : ''}`}>
              <div className="s2v-join-head">
                <span className="s2v-join-seal"><Ic name="shield" /></span>
                <span className="s2v-join-htext">
                  <span className="s2v-join-badge">{t('s2v.join.badge')}</span>
                  <span className="s2v-join-t">{t('s2v.join.title')}</span>
                  <span className="s2v-join-d">{t('s2v.join.desc')}</span>
                </span>
              </div>
              <ul className="s2v-join-benes">
                <li><Ic name="check" /> {t('s2v.join.b1')}</li>
                <li><Ic name="check" /> {t('s2v.join.b2')}</li>
                <li><Ic name="check" /> {t('s2v.join.b3')}</li>
              </ul>
              <input
                className="s2-search"
                type="password"
                value={custPw}
                onChange={(e) => setCustPw(e.target.value)}
                placeholder={t('s2v.join.pw.ph')}
                autoComplete="new-password"
              />
              <div className={`s2v-hint${joinPwOk ? ' ok' : ''}`}>
                {joinPwOk ? `${t('s2v.join.ready')}` : t('s2v.join.hint')}
              </div>
            </div>

            {/* 마케팅 정보 수신 동의(선택) */}
            <label className="s2v-consent">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
              />
              <span className="s2v-consent-body">
                <span className="s2v-consent-t">{t('s2v.marketing.label')}</span>
                <span className="s2v-consent-d">{t('s2v.marketing.desc')}</span>
              </span>
            </label>

            <button className="btn s2-primary block" disabled={!infoValid} onClick={submitV2}>
              {willJoin ? t('s2v.join.submit') : t('s2v.info.submit')}
            </button>
            <button className="btn s2-ghost block" onClick={() => setStep('amount')}>
              {t('s2.back')}
            </button>
          </section>
        )}

        {/* STEP 4 · 완료 */}
        {step === 'done' && result && (
          <section className="s2-card s2v-done">
            <div className="s2v-done-ic" aria-hidden="true"></div>
            <h2 className="s2-card-t">{t('s2v.done.title')}</h2>
            {joinedNow && (
              <div className="s2v-done-member"><Ic name="shield" /> {t('s2v.join.done')}</div>
            )}
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
            <EmailVerify
              email={suEmail}
              verified={suEmailVerified}
              onVerify={setSuVerifiedEmail}
              sendEmail={sendEmail}
              t={t}
            />

            <label className="signup-label">{t('s2v.signup.pw')}</label>
            <input
              className="signup-input"
              type="password"
              value={suPw}
              onChange={(e) => setSuPw(e.target.value)}
              placeholder={t('s2v.signup.pw.ph')}
            />

            {/* 마케팅 정보 수신 동의(선택) — 회원 기본 동의 */}
            <label className="s2v-consent">
              <input
                type="checkbox"
                checked={suMarketing}
                onChange={(e) => setSuMarketing(e.target.checked)}
              />
              <span className="s2v-consent-body">
                <span className="s2v-consent-t">{t('s2v.marketing.label')}</span>
                <span className="s2v-consent-d">{t('s2v.marketing.desc')}</span>
              </span>
            </label>

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
              <a href={ESIM_URL} target="_blank" rel="noreferrer noopener">eSIM</a>
            </div>
          </div>
          <div className="s2-footer-right">
            <div className="s2-footer-contact">{t('s2.foot.cs')}: cs@moneybox.example</div>
            <div className="s2-footer-contact">{t('s2.foot.partner')}: contact@moneybox.example</div>
            <div className="s2-footer-contact">{t('s2.foot.tel')}: +82-1833-0000</div>
            <div className="s2-footer-addr">{t('s2.foot.addr')}</div>
            <div className="s2-footer-social">
              <LanguageDropdown />
              <span className="s2-social-ic" aria-hidden="true"></span>
              <span className="s2-social-ic" aria-hidden="true"></span>
              <span className="s2-social-ic" aria-hidden="true"></span>
            </div>
          </div>
        </div>
        <div className="s2-footer-copy">{t('s2.foot.copy')}</div>
      </footer>
    </div>
  )
}
