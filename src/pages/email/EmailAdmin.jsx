import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo.jsx'
import DevNote from '../../components/DevNote.jsx'
import Modal from '../../components/Modal.jsx'
import { useEmail, EMAIL_TYPES } from '../../store/EmailContext.jsx'
import { useReservations } from '../../store/ReservationContext.jsx'
import { getBranch } from '../../data/branches.js'
import { formatNumber, formatKrw } from '../../lib/format.js'
import StaticBranchMap from '../../components/StaticBranchMap.jsx'

// 이메일에 지도(지점 위치)가 포함되는 템플릿
const MAP_TYPES = ['applied', 'reminder']

// 이메일 관리 화면 — 템플릿 편집 + 발송 이력(Outbox).
// 외국인 웹사이트 예약 데이터와 연동해 발송된 이메일을 기록/표시한다.
export default function EmailAdmin() {
  const nav = useNavigate()
  const { templates, outbox, updateTemplate, sendEmail, markReminderResponse } = useEmail()
  const { reservations, confirmVisit, cancelReservation } = useReservations()

  const [type, setType] = useState('auth')
  const [saved, setSaved] = useState(false)
  const [testRecNo, setTestRecNo] = useState(reservations[0]?.reservationNo || '')
  const [preview, setPreview] = useState(null) // 테스트 발송 미리보기(모달)
  const tpl = templates[type]

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1400)
  }

  // 목데이터 예약 기준 vars 빌드 (테스트 발송용)
  function buildVars(rec) {
    const branch = getBranch(rec.branchId)
    const v = {
      name: rec.customerName,
      reservationNo: rec.reservationNo,
      branchId: rec.branchId,
      branch: branch?.name?.ko || rec.branchId,
      pickupDate: rec.pickupDate,
      currency: rec.currency,
      amount: formatNumber(rec.foreignAmount),
      rate: formatNumber(rec.rate),
      krw: formatKrw(rec.krwAmount),
    }
    if (type === 'auth') v.code = String(Math.floor(100000 + Math.random() * 900000))
    return v
  }
  // 테스트 발송: 선택한 목데이터 예약 기준으로 현재 템플릿을 채워 발송(시뮬)하고 미리보기 표시
  function onTestSend() {
    const rec = reservations.find((r) => r.reservationNo === testRecNo) || reservations[0]
    if (!rec) return
    const sent = sendEmail(type, rec.email, buildVars(rec))
    setPreview(sent)
  }

  // 신청완료 메일 → 신청내역조회 화면(이름+이메일 자동조회, 해당 예약 상세로 진입)
  function gotoLookup(m) {
    const q = new URLSearchParams()
    if (m.name) q.set('name', m.name)
    q.set('email', m.to)
    if (m.reservationNo) q.set('no', m.reservationNo)
    nav(`/site/lookup?${q.toString()}`)
  }

  // 리마인더 이메일의 고객 응답(데모): 방문 예정 / 예약 취소
  function onReminderConfirm(rec) {
    const res = confirmVisit(rec.reservationNo)
    markReminderResponse(rec.id, 'CONFIRMED')
    if (res && !res.ok && res.reason === 'SOLD_OUT') {
      alert('다른 고객이 이미 확정하여 재고가 소진되었습니다.')
    }
  }
  function onReminderCancel(rec) {
    cancelReservation(rec.reservationNo)
    markReminderResponse(rec.id, 'CANCELLED')
    // 고객 취소 → 취소 완료 이메일 발송
    sendEmail('customerCancel', rec.to, { name: rec.name, reservationNo: rec.reservationNo })
  }

  return (
    <div className="admin">
      <DevNote
        items={[
          '이메일은 실제 발송 없이 시뮬레이션 — "발송" 시 아래 발송 이력(Outbox)에 기록됨',
          '발송 대상은 외국인 웹사이트 신청 시 입력한 이메일. 예약 데이터와 연동',
          '리마인더 이메일의 "방문 예정 / 예약 취소" 버튼은 고객 클릭을 시뮬레이션 — 실제 예약 상태에 반영',
          '"테스트 발송": 선택한 목데이터 예약 기준으로 템플릿을 채워 미리보기(모달)+발송 이력에 기록. 신청완료·전일리마인더는 지도 포함',
          '취소 안내 메일 3종 구분 — 자동취소: 수령 예정일이 지나도록 방문(수령완료)하지 않아 시스템이 자동 취소 / 지점취소: 지점 사정으로 지점(직원)이 고객 거래를 취소 / 고객취소: 고객이 신청내역조회에서 [예약취소]를 눌러 직접 취소',
          '자세히: 00_개발메모.md',
        ]}
      />
      <header className="admin-header">
        <div className="admin-header-inner">
          <Logo to="/email" className="logo cems-logo" />
          <span className="admin-brand" style={{ marginLeft: 12 }}>
            이메일 관리
          </span>
          <span className="spacer" />
          <button className="cems-logout" onClick={() => nav('/site')}>
            홈으로
          </button>
        </div>
      </header>

      <main className="content">
        {/* 템플릿 관리 */}
        <section className="cems-panel">
          <h2 className="cems-h2">이메일 템플릿 관리</h2>
          <div className="email-type-tabs">
            {EMAIL_TYPES.map((et) => (
              <button
                key={et.key}
                className={`email-type-tab ${type === et.key ? 'active' : ''}`}
                onClick={() => setType(et.key)}
              >
                {et.label}
              </button>
            ))}
          </div>

          <label className="field">
            <span className="lbl">제목</span>
            <input
              type="text"
              value={tpl.subject}
              onChange={(e) => updateTemplate(type, { subject: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="lbl">본문</span>
            <textarea
              className="email-body-input"
              rows={9}
              value={tpl.body}
              onChange={(e) => updateTemplate(type, { body: e.target.value })}
            />
          </label>
          <div className="tiny" style={{ marginBottom: 10 }}>
            치환 토큰: <code>{'{{name}}'}</code> <code>{'{{code}}'}</code>{' '}
            <code>{'{{reservationNo}}'}</code> <code>{'{{branch}}'}</code>{' '}
            <code>{'{{pickupDate}}'}</code> <code>{'{{currency}}'}</code> <code>{'{{amount}}'}</code>{' '}
            <code>{'{{rate}}'}</code> <code>{'{{krw}}'}</code> — 발송 시 예약 정보로 치환됩니다.
          </div>
          <div className="email-tpl-actions">
            <label className="email-test-pick">
              <span className="tiny">테스트 기준 예약</span>
              <select value={testRecNo} onChange={(e) => setTestRecNo(e.target.value)}>
                {reservations.map((r) => (
                  <option key={r.reservationNo} value={r.reservationNo}>
                    {r.reservationNo} · {r.customerName} · {r.currency} ·{' '}
                    {getBranch(r.branchId)?.name.ko}
                  </option>
                ))}
              </select>
            </label>
            <div className="email-tpl-btns">
              {saved && <span className="saved-flash">저장됨</span>}
              <button className="cems-btn" onClick={onTestSend}>
                ✉ 테스트 발송
              </button>
              <button className="cems-btn primary" onClick={save}>
                템플릿 저장
              </button>
            </div>
          </div>
        </section>

        {/* 발송 이력 (Outbox) */}
        <section className="cems-panel">
          <h2 className="cems-h2">
            발송 이력 <span className="tiny">({outbox.length}건)</span>
          </h2>
          {outbox.length === 0 ? (
            <div className="notice info">
              아직 발송된 이메일이 없습니다. 외국인 웹사이트에서 인증/신청/취소를 진행하거나
              시뮬레이션 바로 리마인더를 발송해 보세요.
            </div>
          ) : (
            <div className="email-outbox">
              {outbox.map((m) => (
                <div className="email-item" key={m.id}>
                  <div className="email-item-head">
                    <span className={`email-tag t-${m.type}`}>{m.typeLabel}</span>
                    <span className="email-to">{m.to}</span>
                    <span className="email-time">{fmtTime(m.sentAt)}</span>
                    <span className={`email-status ${m.status === 'RESPONDED' ? 'responded' : ''}`}>
                      {m.status === 'RESPONDED'
                        ? m.response === 'CONFIRMED'
                          ? '응답: 방문 예정'
                          : '응답: 예약 취소'
                        : '발송됨'}
                    </span>
                  </div>
                  <div className="email-subject">{m.subject}</div>
                  <pre className="email-body">{m.body}</pre>
                  {/* 신청완료·리마인더 메일에는 지점 위치 정적 지도 + 주소 포함 */}
                  {MAP_TYPES.includes(m.type) && m.branchId && (
                    <StaticBranchMap branchId={m.branchId} />
                  )}
                  {/* 신청완료 메일: 신청내역조회 화면으로 바로 이동(이름+이메일 자동조회) */}
                  {m.type === 'applied' && (
                    <div className="email-actions">
                      <button className="btn primary" onClick={() => gotoLookup(m)}>
                        신청내역조회
                      </button>
                    </div>
                  )}
                  {m.type === 'reminder' && m.status !== 'RESPONDED' && (
                    <div className="email-actions">
                      <button className="btn success" onClick={() => onReminderConfirm(m)}>
                        방문 예정
                      </button>
                      <button className="btn danger" onClick={() => onReminderCancel(m)}>
                        예약 취소
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 테스트 발송 미리보기 */}
      {preview && (
        <Modal onClose={() => setPreview(null)}>
          <div className="email-item-head" style={{ marginBottom: 8 }}>
            <span className={`email-tag t-${preview.type}`}>{preview.typeLabel}</span>
            <span className="email-to">{preview.to}</span>
            <span className="email-status">✔ 발송됨(테스트)</span>
          </div>
          <div className="email-subject">{preview.subject}</div>
          <pre className="email-body">{preview.body}</pre>
          {MAP_TYPES.includes(preview.type) && preview.branchId && (
            <StaticBranchMap branchId={preview.branchId} />
          )}
          <div className="btn-row">
            {preview.type === 'applied' && (
              <button className="btn primary" onClick={() => gotoLookup(preview)}>
                신청내역조회
              </button>
            )}
            <button className="btn ghost block" onClick={() => setPreview(null)}>
              닫기
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function fmtTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', { hour12: false })
  } catch {
    return iso
  }
}
