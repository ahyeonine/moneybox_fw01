import { useI18n } from '../i18n/I18nContext.jsx'

// 8단계 진행 표시. current: 1..8
export default function Stepper({ current }) {
  const { t } = useI18n()
  const steps = [1, 2, 3, 4, 5, 6, 7, 8]
  return (
    <div className="stepper" aria-label={`step ${current} of 8`}>
      {steps.map((n, i) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`st ${n === current ? 'active' : ''} ${n < current ? 'done' : ''}`}>
            <span className="num">{n < current ? '✓' : n}</span>
            <span className="lb">{t(`step.${n}`)}</span>
          </div>
          {i < steps.length - 1 && <span className="bar" />}
        </div>
      ))}
    </div>
  )
}
