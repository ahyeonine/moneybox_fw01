import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { useEmail } from '../store/EmailContext.jsx'
import { getBranch } from '../data/branches.js'
import { addDays, diffDays } from '../lib/date.js'
import { formatDate, formatNumber, formatKrw } from '../lib/format.js'

// 시뮬레이션 도구: 실제 스케줄러 대신 기준일을 흘려보내고 자동취소/리마인더를 실행한다.
export default function SimBar() {
  const { t, lang } = useI18n()
  const { today, reservations, advanceDay, runAutoCancel, resetData } = useReservations()
  const { outbox, sendEmail } = useEmail()
  const [msg, setMsg] = useState(null)

  // 방문 하루 전 리마인더 발송 — 수령예정일이 targetDay 인 BOOKED 예약에 (중복 발송 방지)
  function sendReminders(targetDay) {
    const already = new Set(
      outbox.filter((m) => m.type === 'reminder').map((m) => m.reservationNo)
    )
    let sent = 0
    for (const r of reservations) {
      if (r.status !== 'BOOKED') continue
      if (r.pickupDate !== targetDay) continue
      if (already.has(r.reservationNo)) continue
      const branch = getBranch(r.branchId)
      sendEmail('reminder', r.email, {
        name: r.customerName,
        reservationNo: r.reservationNo,
        branch: branch?.name?.ko || r.branchId,
        pickupDate: r.pickupDate,
        currency: r.currency,
        amount: formatNumber(r.foreignAmount),
        krw: formatKrw(r.krwAmount),
      })
      sent += 1
    }
    return sent
  }

  function onAdvance() {
    const next = addDays(today, 1)
    advanceDay()
    // 하루 넘긴 뒤 "방문 하루 전"(= 다음날 수령예정) 건에 리마인더 자동 발송
    const remindTarget = addDays(next, 1)
    const n = sendReminders(remindTarget)
    setMsg(n > 0 ? `${t('sim.reminderSent')}: ${n}` : null)
  }

  // 참고 표시: 지금 시점에서 "내일 수령"인 건 수
  const dueTomorrow = reservations.filter(
    (r) => r.status === 'BOOKED' && diffDays(r.pickupDate, today) === 1
  ).length

  return (
    <div className="sim-bar">
      <span>🧪 {t('sim.title')}</span>
      <span>
        {t('sim.today')}: <span className="today">{formatDate(today, lang)}</span>
      </span>
      <button className="btn ghost" style={{ padding: '6px 10px' }} onClick={onAdvance}>
        {t('sim.advance')}
      </button>
      <button
        className="btn ghost"
        style={{ padding: '6px 10px' }}
        onClick={() => {
          const n = sendReminders(addDays(today, 1))
          setMsg(`${t('sim.reminderSent')}: ${n}`)
        }}
        title={`내일 수령 예정 ${dueTomorrow}건`}
      >
        {t('sim.sendReminder')}{dueTomorrow > 0 ? ` (${dueTomorrow})` : ''}
      </button>
      <button
        className="btn ghost"
        style={{ padding: '6px 10px' }}
        onClick={() => {
          const { cancelled, restored } = runAutoCancel()
          const base = `${cancelled} ${t('sim.autoCancelled')}`
          setMsg(restored > 0 ? `${base} (${t('sim.restored')}: ${restored})` : base)
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
