import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { formatDate } from '../lib/format.js'

// 시뮬레이션 도구: 실제 스케줄러 대신 기준일을 흘려보내고 자동취소를 실행한다.
export default function SimBar() {
  const { t, lang } = useI18n()
  const { today, advanceDay, runAutoCancel, resetData } = useReservations()
  const [msg, setMsg] = useState(null)

  return (
    <div className="sim-bar">
      <span>🧪 {t('sim.title')}</span>
      <span>
        {t('sim.today')}: <span className="today">{formatDate(today, lang)}</span>
      </span>
      <button className="btn ghost" style={{ padding: '6px 10px' }} onClick={advanceDay}>
        {t('sim.advance')}
      </button>
      <button
        className="btn ghost"
        style={{ padding: '6px 10px' }}
        onClick={() => {
          const n = runAutoCancel()
          setMsg(`${n} ${t('sim.autoCancelled')}`)
        }}
      >
        {t('sim.runAutoCancel')}
      </button>
      <button className="btn ghost" style={{ padding: '6px 10px' }} onClick={resetData}>
        {t('sim.reset')}
      </button>
      {msg && <span className="tiny">{msg}</span>}
      <div className="tiny" style={{ flexBasis: '100%' }}>
        {t('sim.hint')}
      </div>
    </div>
  )
}
