import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import DevNote from '../components/DevNote.jsx'

// 문의 페이지 — 간단한 폼(이름/이메일/문의유형/내용). 실제 전송 없이 접수 안내만 표시.
const TYPES = [
  { v: 'service', k: 'contact.type.service' },
  { v: 'card', k: 'contact.type.card' },
  { v: 'location', k: 'contact.type.location' },
  { v: 'biz', k: 'contact.type.biz' },
  { v: 'other', k: 'contact.type.other' },
]

export default function ContactPage() {
  const { t } = useI18n()
  const [form, setForm] = useState({ name: '', email: '', type: 'service', message: '' })
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErr(t('contact.required'))
      return
    }
    setErr('')
    setDone(true) // 실제 전송 없음 — 접수 안내만
  }

  function reset() {
    setForm({ name: '', email: '', type: 'service', message: '' })
    setDone(false)
    setErr('')
  }

  return (
    <div>
      <h1>{t('contact.title')}</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        {t('contact.lead')}
      </p>

      <div className="card contact-card" style={{ maxWidth: 560, marginTop: 16 }}>
        {done ? (
          <div>
            <div className="notice success" style={{ marginBottom: 0 }}>
              ✅ {t('contact.success')}
            </div>
            <button className="btn ghost" style={{ marginTop: 16 }} onClick={reset}>
              {t('contact.another')}
            </button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={submit}>
            <label className="field">
              <span className="lbl">{t('contact.name')}</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder={t('contact.name')}
              />
            </label>
            <label className="field">
              <span className="lbl">{t('contact.email')}</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="name@example.com"
              />
            </label>
            <label className="field">
              <span className="lbl">{t('contact.type')}</span>
              <select value={form.type} onChange={(e) => set({ type: e.target.value })}>
                {TYPES.map((ty) => (
                  <option key={ty.v} value={ty.v}>
                    {t(ty.k)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="lbl">{t('contact.message')}</span>
              <textarea
                className="field-input"
                value={form.message}
                onChange={(e) => set({ message: e.target.value })}
                rows={5}
              />
            </label>

            {err && (
              <div className="notice danger" style={{ marginBottom: 12 }}>
                {err}
              </div>
            )}
            <button className="btn primary block" type="submit">
              {t('contact.submit')}
            </button>
          </form>
        )}
      </div>

      <DevNote
        items={[
          '간단 문의 폼(이름/이메일/문의유형/내용). 제출 시 실제 전송 없이 "접수되었습니다" 안내만 표시(프로토타입).',
          '자세히: 02_사이트맵.md',
        ]}
      />
    </div>
  )
}
