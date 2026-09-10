import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import DevNote from '../components/DevNote.jsx'

// 회사 소개 페이지 (프로토타입 · 임시 콘텐츠).
// 외국인 대상 서비스를 참고해 미션·지표·서비스·문의를 구성한다.
const STATS = [
  { key: 'tx', value: '₩5.2T+' },
  { key: 'visitors', value: '1.7M+' },
  { key: 'rating', value: '⭐ 4.97' },
  { key: 'branches', value: '40+' },
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
    <div className="about">
      <DevNote
        items={[
          '회사 소개 — 외국인 대상 서비스 참고로 구성한 임시 콘텐츠(회사소개서·광고문의 등 상세는 추후 반영)',
          '자세히: 02_사이트맵.md',
        ]}
      />

      {/* 인트로 */}
      <section className="about-hero">
        <h1 className="about-title">{t('about.title')}</h1>
        <p className="about-lead">{t('about.lead')}</p>
      </section>

      {/* 지표 */}
      <section className="about-stats">
        {STATS.map((s) => (
          <div className="about-stat" key={s.key}>
            <div className="about-stat-num">{s.value}</div>
            <div className="about-stat-label">{t(`about.stats.${s.key}`)}</div>
          </div>
        ))}
      </section>

      {/* 미션 */}
      <section className="about-mission">
        <div className="about-mission-t">{t('about.mission.t')}</div>
        <p className="about-mission-d">{t('about.mission.d')}</p>
      </section>

      {/* 우리가 하는 일 */}
      <section className="home-sec">
        <div className="home-sec-head">
          <h2 className="home-sec-title">{t('about.do.title')}</h2>
        </div>
        <div className="why-grid about-do">
          {DO_ITEMS.map((it) => (
            <div className="why-item" key={it.k}>
              <div className="why-emoji" aria-hidden="true">{it.emoji}</div>
              <div className="why-t">{t(`about.do.${it.k}t`)}</div>
              <div className="why-d">{t(`about.do.${it.k}d`)}</div>
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
