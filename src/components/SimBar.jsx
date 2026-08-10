import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useReservations } from '../store/ReservationContext.jsx'
import { useEmail } from '../store/EmailContext.jsx'
import { getBranch } from '../data/branches.js'
import { addDays, diffDays } from '../lib/date.js'
import { formatDate, formatNumber, formatKrw } from '../lib/format.js'

// 시뮬레이션 도구: 실제 스케줄러 대신 기준일을 흘려보내고 자동취소/리마인더 이메일을 발송한다.
export default function SimBar() {
  const { t, lang } = useI18n()
  const { today, reservations, advanceDay, runAutoCancel, resetData } = useReservations()
  const { outbox, sendEmail } = useEmail()
  const [msg, setMsg] = useState(null)

  // 예약 → 이메일 vars 공통 빌더
  function emailVars(r) {
    const branch = getBranch(r.branchId)
    return {
      name: r.customerName,
      reservationNo: r.reservationNo,
      branchId: r.branchId,
      branch: branch?.name?.ko || r.branchId,
      pickupDate: r.pickupDate,
      currency: r.currency,
      amount: formatNumber(r.foreignAmount),
      rate: formatNumber(r.rate),
      krw: formatKrw(r.krwAmount),
    }
  }
  // 특정 타입 이메일을 조건에 맞는 BOOKED 예약에 발송 (같은 타입 중복 발송 방지)
  function sendBatch(type, predicate) {
    const already = new Set(outbox.filter((m) => m.type === type).map((m) => m.reservationNo))
    let sent = 0
    for (const r of reservations) {
      if (r.status !== 'BOOKED' || already.has(r.reservationNo) || !predicate(r)) continue
      sendEmail(type, r.email, emailVars(r))
      sent += 1
    }
    return sent
  }

  function onAdvance() {
    const next = addDays(today, 1)
    advanceDay()
    // 하루 넘긴 뒤: (1) 수령 전일 리마인더  (2) 수령 당일 무응답 리마인더
    const rem = sendBatch('reminder', (r) => r.pickupDate === addDays(next, 1))
    const day = sendBatch(
      'dayOfNoResponse',
      (r) => r.pickupDate === next && r.reminderStatus !== 'CONFIRMED'
    )
    const parts = []
    if (rem) parts.push(`${t('sim.reminderSent')}: ${rem}`)
    if (day) parts.push(`${t('sim.dayReminderSent')}: ${day}`)
    setMsg(parts.join(' · ') || null)
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
        onClick={() => setMsg(`${t('sim.reminderSent')}: ${sendBatch('reminder', (r) => r.pickupDate === addDays(today, 1))}`)}
        title={`내일 수령 예정 ${dueTomorrow}건`}
      >
        {t('sim.sendReminder')}{dueTomorrow > 0 ? ` (${dueTomorrow})` : ''}
      </button>
      <button
        className="btn ghost"
        style={{ padding: '6px 10px' }}
        onClick={() => {
          const { cancelled, restored, records } = runAutoCancel()
          // 자동취소된 예약에 자동취소 안내 이메일 발송
          ;(records || []).forEach((r) => sendEmail('autoCancel', r.email, emailVars(r)))
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
