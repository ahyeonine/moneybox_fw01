import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import DevNote from '../components/DevNote.jsx'

// 회사 소개 (프로토타입 · 임시) — 당근 about 페이지풍(큰 서술형 문장·스토리텔링·큰 숫자).
const STATS = [
  { key: 'tx', value: '₩5.2T+' },
  { key: 'visitors', value: '1.7M+' },
  { key: 'rating', value: '4.97' },
  { key: 'branches', value: '40+' },
]
const VALUES = [
  { k: 'v1', emoji: '🤝' },
  { k: 'v2', emoji: '🛡️' },
  { k: 'v3', emoji: '⚡' },
]
const DO_ITEMS = [
  { k: '1', emoji: '🏦' },
  { k: '2', emoji: '🏧' },
  { k: '3', emoji: '🧳' },
]

export default function AboutPage() {
  const { t } = useI18n()
  const nav = useNavigate()

  return (
    <div className="about about-k">
      <DevNote
        items={[
          '회사 소개 — 당근 about 페이지풍으로 구성한 임시 콘텐츠(스토리텔링·큰 숫자). 회사소개서 상세는 추후 반영',
          '자세히: 01_IA.md',
        ]}
      />

      {/* 큰 서술형 히어로 */}
      <section className="ak-hero">
        <div className="ak-hero-eyebrow">{t('about.hero.eyebrow')}</div>
        <h1 className="ak-hero-t">{t('about.hero.t')}</h1>
        <p className="ak-hero-d">{t('about.hero.d')}</p>
      </section>

      {/* 숫자로 보는 머니박스 (큰 숫자 · 틴트 밴드) */}
      <section className="ak-stats-band">
        <div className="ak-eyebrow center">{t('about.statlead')}</div>
        <div className="ak-stats">
          {STATS.map((s) => (
            <div className="ak-stat" key={s.key}>
              <div className="ak-stat-num">{s.value}</div>
              <div className="ak-stat-label">{t(`about.stats.${s.key}`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 스토리 */}
      <section className="ak-story">
        <div className="ak-eyebrow">{t('about.story.t')}</div>
        <p className="ak-story-d">{t('about.story.d')}</p>
      </section>

      {/* 미션 밴드 (블루) */}
      <section className="ak-mission">
        <div className="ak-mission-eyebrow">{t('about.mission.t')}</div>
        <p className="ak-mission-d">{t('about.mission.d')}</p>
      </section>

      {/* 우리가 지키는 것 (가치 3) */}
      <section className="ak-values-sec">
        <h2 className="ak-h2">{t('about.values.title')}</h2>
        <div className="ak-values">
          {VALUES.map((v) => (
            <div className="ak-value" key={v.k}>
              <div className="ak-value-emoji" aria-hidden="true">{v.emoji}</div>
              <div className="ak-value-t">{t(`about.${v.k}.t`)}</div>
              <div className="ak-value-d">{t(`about.${v.k}.d`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 우리가 하는 일 */}
      <section className="ak-do-sec">
        <h2 className="ak-h2">{t('about.do.title')}</h2>
        <div className="ak-do">
          {DO_ITEMS.map((it) => (
            <div className="ak-do-item" key={it.k}>
              <div className="ak-do-emoji" aria-hidden="true">{it.emoji}</div>
              <div className="ak-do-text">
                <div className="ak-do-t">{t(`about.do.${it.k}t`)}</div>
                <div className="ak-do-d">{t(`about.do.${it.k}d`)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 문의 */}
      <section className="about-contact">
        <div className="about-contact-t">{t('about.contact.title')}</div>
        <p className="about-contact-d">{t('about.contact.d')}</p>
        <div className="about-contact-rows">
          <div>✉️ {t('footer.email')}</div>
          <div>📍 {t('footer.addr')}</div>
          <div>☎️ {t('footer.tel')}</div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="home-cta-inner">
          <h2 className="home-cta-title">{t('home.cta.title')}</h2>
          <p className="home-cta-sub">{t('home.cta.sub')}</p>
          <button className="btn home-cta-btn" onClick={() => nav('/site/book')}>
            {t('home.cta.btn')}
          </button>
        </div>
      </section>

      <div className="about-note">{t('about.note')}</div>
    </div>
  )
}
