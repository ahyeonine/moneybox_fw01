import { useState } from 'react'
import { usePolicy } from '../../store/PolicyContext.jsx'
import DevNote from '../../components/DevNote.jsx'

// 본사관리자 전용 · 예약 가능 기간 설정 화면.
// 기본은 "제한 없음(무제한)" — 고객은 오늘 이후 수령 예정일을 자유롭게 선택한다.
// 필요 시 본사가 상한(오늘부터 최대 N일)을 지정할 수 있다. 지점은 변경 불가.
// 설정값(maxWindowDays: null=무제한 | 숫자=N일)은 고객 사이트 수령일 선택 범위·예약조회 변경에 즉시 반영.

export default function HqReservationPolicy() {
  const { maxWindowDays, setMaxWindowDays, MIN_WINDOW } = usePolicy()
  // mode: 'unlimited' | 'limited'
  const [mode, setMode] = useState(maxWindowDays == null ? 'unlimited' : 'limited')
  const [winInput, setWinInput] = useState(String(maxWindowDays ?? 14))
  const [flash, setFlash] = useState(false)

  const parsed = Math.round(Number(winInput))
  const limitInvalid = mode === 'limited' && (!Number.isFinite(parsed) || parsed < MIN_WINDOW)

  function apply() {
    if (limitInvalid) return
    setMaxWindowDays(mode === 'unlimited' ? null : winInput)
    setFlash(true)
    setTimeout(() => setFlash(false), 2000)
  }

  return (
    <div>
      <DevNote
        items={[
          '예약 가능 기간(수령일 상한)은 본사에서만 설정 — 지점은 변경 불가',
          '기본은 "제한 없음(무제한)" — 고객은 오늘 이후 날짜를 자유롭게 선택. 필요 시 본사가 최대 N일 상한을 지정',
          '설정값은 고객 사이트 수령일 선택 범위와 예약조회 변경에 즉시 반영(무제한 또는 최소 1일 이상 일수 지정)',
          '자세히: 07_정책.md',
        ]}
      />
      <h1 className="cems-h1">본사관리자 · 예약 가능 기간 설정</h1>

      <div className="cems-panel hq-policy">
        <div className="hq-policy-head">
          <span className="hq-policy-label">예약 가능 기간</span>
          <span className="hq-policy-desc">
            고객이 수령 예정일을 <b>오늘부터 언제까지</b> 선택할 수 있는지 설정합니다.
            지점은 이 값을 변경할 수 없습니다.
          </span>
        </div>

        <div className="hq-policy-current">
          현재 설정:{' '}
          <strong>{maxWindowDays == null ? '제한 없음 (무제한)' : `오늘부터 최대 ${maxWindowDays}일`}</strong>
        </div>

        <div className="hq-policy-modes" role="radiogroup" aria-label="예약 가능 기간 방식">
          <label className="hq-policy-radio">
            <input
              type="radio"
              name="winmode"
              checked={mode === 'unlimited'}
              onChange={() => setMode('unlimited')}
            />
            <span>
              <b>제한 없음 (무제한)</b> — 오늘 이후 날짜를 자유롭게 선택
            </span>
          </label>
          <label className="hq-policy-radio">
            <input
              type="radio"
              name="winmode"
              checked={mode === 'limited'}
              onChange={() => setMode('limited')}
            />
            <span className="hq-policy-radio-limit">
              <b>일수 지정</b> — 오늘부터 최대
              <input
                type="number"
                min={MIN_WINDOW}
                value={winInput}
                onChange={(e) => setWinInput(e.target.value)}
                onFocus={() => setMode('limited')}
                className="hq-policy-input"
              />
              <span className="tiny">일</span>
            </span>
          </label>
        </div>

        <div className="hq-policy-edit">
          <button className="cems-btn primary" onClick={apply} disabled={limitInvalid}>
            저장
          </button>
          {flash && <span className="hq-policy-flash">✓ 저장됨</span>}
        </div>

        {limitInvalid && (
          <div className="hq-policy-err">
            {MIN_WINDOW}일 이상의 숫자를 입력해 주세요.
          </div>
        )}

        <div className="hq-policy-hint">
          예) "제한 없음"이면 고객이 먼 미래 날짜도 선택할 수 있고, "일수 지정 14일"이면 오늘부터 2주 이내만 선택할 수 있습니다.
        </div>
      </div>
    </div>
  )
}
