import { createContext, useContext, useState, useRef, useCallback } from 'react'

// 이메일(mock) 공유 상태 — 템플릿 관리 + 발송 이력(Outbox).
// 실제 발송 없음. 외국인 웹사이트 예약 데이터와 연동해 "발송" 시 Outbox에 기록한다.
const EmailContext = createContext(null)

// 이메일 종류 메타 (표시 순서/라벨)
export const EMAIL_TYPES = [
  { key: 'auth', label: '인증번호 발송' },
  { key: 'applied', label: '신청 완료' },
  { key: 'reminder', label: '방문 하루 전 안내' },
  { key: 'branchCancel', label: '지점 취소' },
  { key: 'customerCancel', label: '고객 취소' },
]

// 기본 템플릿 (관리자 수정 가능). 본문의 {{token}} 은 발송 시 치환된다.
function seedTemplates() {
  return {
    auth: {
      subject: '[머니박스] 이메일 인증번호 안내',
      body:
        '안녕하세요, 머니박스입니다.\n\n' +
        '요청하신 이메일 인증번호는 [ {{code}} ] 입니다.\n' +
        '인증번호는 5분간 유효합니다.\n\n' +
        '본인이 요청하지 않았다면 이 메일을 무시해 주세요.',
    },
    applied: {
      subject: '[머니박스] 환전 예약이 완료되었습니다 ({{reservationNo}})',
      body:
        '{{name}} 고객님, 환전 예약이 완료되었습니다.\n\n' +
        '· 예약번호: {{reservationNo}}\n' +
        '· 수령지점: {{branch}}\n' +
        '· 방문일: {{pickupDate}}\n' +
        '· 통화/금액: {{currency}} {{amount}}\n' +
        '· 결제 예정 원화: {{krw}}\n\n' +
        '예약하신 날짜에 지점을 방문해 신분증 확인 후 수령해 주세요.',
    },
    reminder: {
      subject: '[머니박스] 내일 방문 예정 안내 ({{reservationNo}})',
      body:
        '{{name}} 고객님, 내일은 환전 수령 예정일입니다.\n\n' +
        '· 예약번호: {{reservationNo}}\n' +
        '· 수령지점: {{branch}}\n' +
        '· 방문일: {{pickupDate}}\n' +
        '· 통화/금액: {{currency}} {{amount}}\n\n' +
        '아래에서 방문 여부를 선택해 주세요.',
    },
    branchCancel: {
      subject: '[머니박스] 예약이 취소되었습니다 ({{reservationNo}})',
      body:
        '{{name}} 고객님께 안내드립니다.\n\n' +
        '지점 사정으로 예약({{reservationNo}})이 취소되었습니다.\n' +
        '이용에 불편을 드려 죄송합니다.\n\n' +
        '다시 예약해 주시면 정성껏 준비하겠습니다.',
    },
    customerCancel: {
      subject: '[머니박스] 예약 취소가 완료되었습니다 ({{reservationNo}})',
      body:
        '{{name}} 고객님, 요청하신 예약({{reservationNo}})이 정상적으로 취소되었습니다.\n\n' +
        '이용해 주셔서 감사합니다.',
    },
  }
}

const LABEL = Object.fromEntries(EMAIL_TYPES.map((t) => [t.key, t.label]))
function render(tpl, vars) {
  return String(tpl).replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''))
}

export function EmailProvider({ children }) {
  const [templates, setTemplates] = useState(seedTemplates)
  const [outbox, setOutbox] = useState([]) // 발송 이력 (최신순)
  const idRef = useRef(1)
  // 최신 templates를 sendEmail(안정 참조)에서 읽기 위한 ref 동기화
  const templatesRef = useRef(templates)
  templatesRef.current = templates

  const updateTemplate = useCallback((type, patch) => {
    setTemplates((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }, [])

  // 이메일 발송(시뮬레이션) → Outbox 기록. 반환: 생성된 레코드
  const sendEmail = useCallback((type, to, vars = {}) => {
    if (!to) return null
    const tpl = templatesRef.current[type] || { subject: '', body: '' }
    const rec = {
      id: idRef.current++,
      type,
      typeLabel: LABEL[type] || type,
      to,
      name: vars.name || '',
      subject: render(tpl.subject, vars),
      body: render(tpl.body, vars),
      sentAt: new Date().toISOString(),
      status: 'SENT', // SENT | RESPONDED
      reservationNo: vars.reservationNo || null,
      response: null, // reminder: 'CONFIRMED' | 'CANCELLED'
    }
    setOutbox((prev) => [rec, ...prev])
    return rec
  }, [])

  // 리마인더 응답 기록 (Outbox 표시용)
  const markReminderResponse = useCallback((id, response) => {
    setOutbox((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'RESPONDED', response } : r)))
  }, [])

  const value = { templates, outbox, updateTemplate, sendEmail, markReminderResponse }
  return <EmailContext.Provider value={value}>{children}</EmailContext.Provider>
}

export function useEmail() {
  const ctx = useContext(EmailContext)
  if (!ctx) throw new Error('useEmail must be used within EmailProvider')
  return ctx
}
