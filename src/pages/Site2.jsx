import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useRates } from '../store/RatesContext.jsx'
import { CURRENCY_META, CURRENCY_ORDER } from '../data/rates.js'
import { BRANCHES } from '../data/branches.js'
import { formatKrw } from '../lib/format.js'
import LanguageDropdown from '../components/LanguageDropdown.jsx'
import AboutPage from './AboutPage.jsx'

// 외국인 사이트 2안 (WOWPASS 참고) — 별도 surface.
// 플로우: ① 금액 입력 → ② 지점 선택 (실제 지도 검색 + 내 위치로 찾기 + 추천).
// 지도/검색은 키가 필요 없는 OpenStreetMap(Nominatim + Leaflet) 사용.

const SUPPORTED_CURRENCIES = CURRENCY_ORDER.filter((c) =>
  BRANCHES.some((b) => Object.prototype.hasOwnProperty.call(b.currencyLimits, c))
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
  const nav = useNavigate()

  const [view, setView] = useState('flow') // flow | about
  const [step, setStep] = useState('amount') // amount | branch
  const [currency, setCurrency] = useState('USD')
  const [amount, setAmount] = useState('')

  // 위치 검색 (Nominatim) + 내 위치(Geolocation)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [geoStatus, setGeoStatus] = useState('') // '' | 'locating' | 'error'
  const [loc, setLoc] = useState(null) // { name, lat, lng }

  const rate = getDisplayRates(currency)?.base || 0
  const krw = amount ? Math.round(Number(amount) * rate) : 0

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

  // 선택 통화를 취급하는 지점 (위치 있으면 가까운 순, 없으면 전체)
  const branches = useMemo(() => {
    const supported = BRANCHES.filter((b) =>
      Object.prototype.hasOwnProperty.call(b.currencyLimits, currency)
    )
    if (!loc) return supported.map((b) => ({ b, km: null }))
    return supported.map((b) => ({ b, km: distanceKm(loc, b) })).sort((x, y) => x.km - y.km)
  }, [loc, currency])

  const mapPoints = useMemo(
    () => branches.map(({ b }) => ({ lat: b.lat, lng: b.lng, label: b.name[lang] || b.name.ko })),
    [branches, lang]
  )

  const stepIdx = ['amount', 'branch'].indexOf(step)

  function reserveAt(branchId) {
    nav(`/site/book?branch=${branchId}&currency=${currency}&amount=${amount}`)
  }

  return (
    <div className="s2">
      <header className="s2-header">
        <div className="s2-header-inner">
          <button type="button" className="s2-logo" onClick={() => setView('flow')}>
            MONEY<span>BOX</span>
            <span className="s2-logo-tag">v2</span>
          </button>
          <nav className="s2-nav">
            <span className="s2-nav-langs">🌏 EN · 中文 · 日本語 · 한국어</span>
          </nav>
          <div className="s2-header-right">
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

      <main className={`s2-main${view === 'about' ? ' s2-main-wide' : ''}`}>
        {view === 'about' ? (
          <AboutPage />
        ) : (
        <>
        <section className="s2-hero">
          <div className="s2-hero-eyebrow">🛡️ {t('home.hero.grt.t')}</div>
          <h1 className="s2-hero-t">{t('s2.hero.t')}</h1>
          <p className="s2-hero-d">{t('s2.hero.d')}</p>
        </section>

        <div className="s2-steps">
          {[
            { key: 'amount', label: t('s2.step.amount') },
            { key: 'branch', label: t('s2.step.branch') },
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

        {/* STEP 1 · 금액 */}
        {step === 'amount' && (
          <section className="s2-card">
            <h2 className="s2-card-t">{t('s2.amount.title')}</h2>
            <div className="s2-field-label">{t('s2.amount.cur')}</div>
            <div className="s2-cur-chips">
              {SUPPORTED_CURRENCIES.map((c) => (
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
            <div className="s2-krw">
              <span className="s2-krw-label">{t('s2.amount.krw')}</span>
              <span className="s2-krw-val">≈ {krw ? formatKrw(krw) : '₩0'}</span>
            </div>

            <button
              className="btn s2-primary block"
              disabled={!amount || Number(amount) <= 0}
              onClick={() => setStep('branch')}
            >
              {t('s2.next')}
            </button>
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
                  <span className="s2-picked-cur">
                    · {CURRENCY_META[currency]?.flag} {amount} {currency}
                  </span>
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

            <button className="btn s2-ghost block" onClick={() => setStep('amount')}>
              {t('s2.back')}
            </button>
          </section>
        )}
        </>
        )}
      </main>

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
        <div className="s2-footer-copy">© 2026 MONEYBOX Corp. · Site v2 prototype (dummy data)</div>
      </footer>
    </div>
  )
}
