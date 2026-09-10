import { createContext, useContext, useState, useRef, useCallback } from 'react'

// 이메일(mock) 공유 상태 — 템플릿 관리 + 발송 이력(Outbox).
// 실제 발송 없음. 외국인 웹사이트 예약 데이터와 연동해 "발송" 시 Outbox에 기록한다.
const EmailContext = createContext(null)

// 지점(직원) 취소 시 고정 사유 문구 — 지점 취소 안내 메일의 {{branchReason}} 치환값
export const BRANCH_CANCEL_REASON = '지점 사정으로 인해 예약이 취소되었습니다.'

// 이메일 종류 메타 (표시 순서/라벨) — 01_IA.md 기준 6종
// (수령 당일 무응답 리마인더는 제거됨: 전일 리마인더 무응답 → 수령기한 경과 시 자동취소 안내로 처리)
export const EMAIL_TYPES = [
  { key: 'auth', label: '인증번호 발송' },
  { key: 'applied', label: '신청 완료' },
  { key: 'reminder', label: '수령 전일 리마인더' },
  { key: 'autoCancel', label: '자동취소 안내' },
  { key: 'branchCancel', label: '지점 취소 안내' },
  { key: 'customerCancel', label: '고객 취소완료' },
]

// 기본 템플릿 (관리자 수정 가능). 본문의 {{token}} 은 발송 시 치환된다.
// (문안은 docs-plan/01_IA.md 와 동일 정책)
function seedTemplates() {
  return {
    auth: {
      subject: '[MONEY BOX] 이메일 인증번호입니다',
      body:
        '인증번호: {{code}}\n5분 이내에 입력해 주세요.\n\n' +
        '본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.',
    },
    applied: {
      subject: '[MONEY BOX] 환전 예약이 완료되었습니다 (예약번호: {{reservationNo}})',
      body:
        '{{name}}님, 환전 예약이 완료되었습니다.\n\n' +
        '- 예약번호: {{reservationNo}}\n' +
        '- 지점: {{branch}}\n' +
        '- 통화/금액: {{currency}} {{amount}}\n' +
        '- 예약환율: {{rate}}\n' +
        '- 원화금액: {{krw}}\n' +
        '- 수령 예정일: {{pickupDate}}\n\n' +
        '💱 현재 적용된 환율이 지금 기준 가장 유리한 환율이에요. 혹시 방문하시는 날 환율이 더 좋아졌다면, 그날의 환율로 적용해드립니다.\n\n' +
        '🪪 수령 시 본인 확인을 위해 신분증(여권)을 꼭 지참해 주세요.\n\n' +
        '(아래 지점 위치 지도·주소 참고)\n\n' +
        '신청내역 조회/취소는 아래 [신청내역조회] 버튼에서 이름·이메일로 확인하실 수 있습니다.\n\n' +
        '⚠ 방문이 어려우실 경우 미리 취소해 주세요. 수령 예정일이 지나도록 방문하지 않으실 경우 예약이 자동 취소되며, 반복될 경우 서비스 이용에 제한이 있을 수 있습니다.',
    },
    reminder: {
      subject: '[MONEY BOX] 내일 환전 수령 예정이에요 (예약번호: {{reservationNo}})',
      body:
        '{{name}}님, 내일({{pickupDate}}) {{branch}}에서 환전 수령 예정입니다.\n\n' +
        '🪪 수령 시 본인 확인을 위해 신분증(여권)을 꼭 지참해 주세요.\n\n' +
        '(아래 지점 위치 지도·주소 참고)\n\n' +
        '아래에서 방문 여부를 선택해 주세요.\n[방문 예정] / [예약 취소]\n\n' +
        '오늘 안에는 취소되지 않습니다. 단, 수령 예정일 당일까지 응답이 없으면 자동으로 취소돼요.',
    },
    autoCancel: {
      subject: '[MONEY BOX] 예약이 자동 취소되었습니다 (예약번호: {{reservationNo}})',
      body:
        '{{name}}님의 예약({{reservationNo}})이 수령 예정일 경과로 자동 취소되었습니다.\n' +
        '다시 예약하시려면 예약 화면을 이용해 주세요.',
    },
    branchCancel: {
      subject: '[MONEY BOX] 예약이 취소되었습니다 (예약번호: {{reservationNo}})',
      body:
        '{{name}}님, 죄송합니다. 예약({{reservationNo}})이 취소되었습니다.\n' +
        '- 취소 사유: {{branchReason}}\n\n' +
        '이용에 불편을 드려 죄송합니다.\n\n' +
        '다시 예약하시려면 예약 화면을 이용해 주세요.',
    },
    customerCancel: {
      subject: '[MONEY BOX] 취소가 완료되었습니다 (예약번호: {{reservationNo}})',
      body:
        '{{name}}님의 예약({{reservationNo}})이 정상적으로 취소되었습니다.\n' +
        '언제든 다시 예약해 주세요.',
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
      branchId: vars.branchId || null, // 지점 지도/주소 표시용 (신청완료·리마인더 메일)
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
