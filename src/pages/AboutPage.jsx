import { useI18n } from '../i18n/I18nContext.jsx'

// 회사 소개 페이지 (프로토타입).
// 내용은 기존 사이트와 동일하므로 별도 구현 없이 안내 문구만 표시한다.
// (회사소개서·광고문의 등 상세 내용 삭제 → 디자인 참고)
export default function AboutPage() {
  const { t } = useI18n()

  return (
    <div>
      <h1>{t('about.title')}</h1>
      <div className="notice info same-as-existing" style={{ marginTop: 12 }}>
        {t('about.same')}
      </div>
    </div>
  )
}
