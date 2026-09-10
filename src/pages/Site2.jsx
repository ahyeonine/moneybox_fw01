import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useRates } from '../store/RatesContext.jsx'
import { CURRENCY_META, CURRENCY_ORDER } from '../data/rates.js'
import { BRANCHES } from '../data/branches.js'
import { formatKrw } from '../lib/format.js'
import LanguageDropdown from '../components/LanguageDropdown.jsx'

// 외국인 사이트 2안 (WOWPASS 참고) — CEMS/POS처럼 분리된 별도 surface.
// 플로우: 금액 입력 → 묵을 호텔/방문 예정 역 검색 → 가까운 지점 추천.

// 통화 칩 = 지점이 실제 취급하는 통화들의 합집합 (막다른 선택 방지)
const SUPPORTED_CURRENCIES = CURRENCY_ORDER.filter((c) =>
  BRANCHES.some((b) => Object.prototype.hasOwnProperty.call(b.currencyLimits, c))
)

// 호텔/역/장소 목데이터 (좌표 포함) — 검색 → 지점 추천에 사용
const LOCATIONS = [
  { id: 'myeongdong', name: { ko: '명동역', en: 'Myeongdong Station' }, kind: '🚇', lat: 37.5609, lng: 126.986 },
  { id: 'lotte', name: { ko: '롯데호텔 서울 (명동)', en: 'Lotte Hotel Seoul (Myeongdong)' }, kind: '🏨', lat: 37.5647, lng: 126.9814 },
  { id: 'seoulstn', name: { ko: '서울역', en: 'Seoul Station' }, kind: '🚉', lat: 37.5547, lng: 126.9707 },
  { id: 'hongdae', name: { ko: '홍대입구역', en: 'Hongik Univ. Station' }, kind: '🚇', lat: 37.5572, lng: 126.9245 },
  { id: 'gangnam', name: { ko: '강남역', en: 'Gangnam Station' }, kind: '🚇', lat: 37.4979, lng: 127.0276 },
  { id: 'coex', name: { ko: '코엑스 (삼성역)', en: 'COEX (Samseong Stn)' }, kind: '🏢', lat: 37.5121, lng: 127.0589 },
  { id: 'icn', name: { ko: '인천공항 T1', en: 'Incheon Airport T1' }, kind: '✈️', lat: 37.4491, lng: 126.4509 },
  { id: 'busanstn', name: { ko: '부산역', en: 'Busan Station' }, kind: '🚉', lat: 35.1152, lng: 129.0424 },
  { id: 'haeundae', name: { ko: '해운대', en: 'Haeundae' }, kind: '🏖️', lat: 35.1587, lng: 129.1604 },
]

// 두 좌표 사이 거리(km) — 하버사인
function distanceKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

const ESIM_URL = 'https://imoneybox.cafe24.com/shop3/'

export default function Site2() {
  const { t, lang } = useI18n()
  const { getDisplayRates } = useRates()
  const nav = useNavigate()

  const [step, setStep] = useState('amount') // amount | location | branch
  const [currency, setCurrency] = useState('USD')
  const [amount, setAmount] = useState('')
  const [query, setQuery] = useState('')
  const [loc, setLoc] = useState(null)

  // "이 지점으로 예약" → 실제 예약 플로우(/site/book)로 지점·통화·금액 전달
  function reserveAt(branchId) {
    nav(`/site/book?branch=${branchId}&currency=${currency}&amount=${amount}`)
  }

  const rate = getDisplayRates(currency)?.base || 0
  const krw = amount ? Math.round(Number(amount) * rate) : 0

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return LOCATIONS
    return LOCATIONS.filter(
      (l) => l.name.ko.toLowerCase().includes(q) || l.name.en.toLowerCase().includes(q)
    )
  }, [query])

  // 선택 통화를 취급하는 지점을 위치 기준 가까운 순으로
  const recommended = useMemo(() => {
    if (!loc) return []
    return BRANCHES.filter((b) =>
      Object.prototype.hasOwnProperty.call(b.currencyLimits, currency)
    )
      .map((b) => ({ b, km: distanceKm(loc, b) }))
      .sort((x, y) => x.km - y.km)
  }, [loc, currency])

  const steps = [
    { key: 'amount', label: t('s2.step.amount') },
    { key: 'location', label: t('s2.step.location') },
    { key: 'branch', label: t('s2.step.branch') },
  ]
  const stepIdx = ['amount', 'location', 'branch'].indexOf(step)

  return (
    <div className="s2">
      {/* 헤더 (WOWPASS풍 · 미니멀) */}
      <header className="s2-header">
        <div className="s2-header-inner">
          <div className="s2-logo">
            MONEY<span>BOX</span>
            <span className="s2-logo-tag">v2</span>
          </div>
          <nav className="s2-nav">
            <span className="s2-nav-langs">🌏 EN · 中文 · 日本語 · 한국어</span>
          </nav>
          <div className="s2-header-right">
            <LanguageDropdown />
          </div>
        </div>
      </header>

      <main className="s2-main">
        {/* 히어로 */}
        <section className="s2-hero">
          <div className="s2-hero-eyebrow">🛡️ {t('home.hero.grt.t')}</div>
          <h1 className="s2-hero-t">{t('s2.hero.t')}</h1>
          <p className="s2-hero-d">{t('s2.hero.d')}</p>
        </section>

        {/* 스텝 인디케이터 */}
        <div className="s2-steps">
          {steps.map((s, i) => (
            <div key={s.key} className={`s2-step${i === stepIdx ? ' on' : ''}${i < stepIdx ? ' done' : ''}`}>
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
              onClick={() => setStep('location')}
            >
              {t('s2.next')}
            </button>
            <div className="s2-note">{t('s2.note')}</div>
          </section>
        )}

        {/* STEP 2 · 위치 검색 */}
        {step === 'location' && (
          <section className="s2-card">
            <h2 className="s2-card-t">{t('s2.loc.title')}</h2>
            <p className="s2-card-sub">{t('s2.loc.sub')}</p>
            <input
              className="s2-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('s2.loc.placeholder')}
              autoFocus
            />
            <div className="s2-loc-list">
              {results.length === 0 && <div className="s2-empty">{t('s2.loc.none')}</div>}
              {results.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`s2-loc-item${loc?.id === l.id ? ' on' : ''}`}
                  onClick={() => {
                    setLoc(l)
                    setStep('branch')
                  }}
                >
                  <span className="s2-loc-kind" aria-hidden="true">{l.kind}</span>
                  <span className="s2-loc-name">{l.name[lang] || l.name.ko}</span>
                  <span className="s2-loc-go">→</span>
                </button>
              ))}
            </div>
            <button className="btn s2-ghost block" onClick={() => setStep('amount')}>
              {t('s2.back')}
            </button>
          </section>
        )}

        {/* STEP 3 · 지점 추천 */}
        {step === 'branch' && (
          <section className="s2-card">
            <h2 className="s2-card-t">{t('s2.br.title')}</h2>
            <p className="s2-card-sub">{t('s2.br.sub')}</p>
            {loc && (
              <div className="s2-picked">
                <span aria-hidden="true">{loc.kind}</span> {loc.name[lang] || loc.name.ko}
                <span className="s2-picked-cur">
                  · {CURRENCY_META[currency]?.flag} {amount} {currency}
                </span>
              </div>
            )}
            <div className="s2-branch-list">
              {recommended.length === 0 && <div className="s2-empty">{t('s2.br.none')}</div>}
              {recommended.map(({ b, km }, i) => (
                <div key={b.id} className={`s2-branch${i === 0 ? ' best' : ''}`}>
                  <div className="s2-branch-head">
                    <span className="s2-branch-name">{b.name[lang] || b.name.ko}</span>
                    {i === 0 && <span className="s2-branch-badge">{t('s2.br.best')}</span>}
                  </div>
                  <div className="s2-branch-addr">{b.address[lang] || b.address.ko}</div>
                  <div className="s2-branch-foot">
                    <span className="s2-branch-km">
                      📍 {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} {t('s2.br.away')}
                    </span>
                    <button
                      className="btn s2-primary s2-branch-pick"
                      onClick={() => reserveAt(b.id)}
                    >
                      {t('s2.br.pick')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn s2-ghost block" onClick={() => setStep('location')}>
              {t('s2.back')}
            </button>
          </section>
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
            <div className="s2-footer-contact">
              {t('s2.foot.cs')}: cs@moneybox.example
            </div>
            <div className="s2-footer-contact">
              {t('s2.foot.partner')}: contact@moneybox.example
            </div>
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
