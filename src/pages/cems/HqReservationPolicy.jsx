import { useState } from 'react'
import { usePolicy } from '../../store/PolicyContext.jsx'
import DevNote from '../../components/DevNote.jsx'

// 본사관리자 전용 · 예약 가능 기간 설정 화면.
// 고객이 수령 예정일을 오늘부터 최대 며칠 뒤까지 선택할 수 있는지(maxWindowDays)를 설정한다.
// 지점은 변경할 수 없고, 설정값은 고객 사이트 수령일 선택 범위·예약조회 변경에 즉시 반영된다.

export default function HqReservationPolicy() {
  const { maxWindowDays, setMaxWindowDays, MIN_WINDOW, MAX_WINDOW } = usePolicy()
  const [winInput, setWinInput] = useState(String(maxWindowDays))
  const [flash, setFlash] = useState(false)

  const parsed = Math.round(Number(winInput))
  const invalid = !Number.isFinite(parsed) || parsed < MIN_WINDOW || parsed > MAX_WINDOW

  function apply() {
    if (invalid) return
    setMaxWindowDays(winInput)
    setFlash(true)
    setTimeout(() => setFlash(false), 2000)
  }

  return (
    <div>
      <DevNote
        items={[
          '예약 가능 기간(수령일 최대 N일)은 본사에서만 설정 — 지점은 변경 불가',
          '설정값은 고객 사이트 수령일 선택 범위(오늘~N일)와 예약조회 변경에 즉시 반영(1~60일)',
          '자세히: 07_정책.md',
        ]}
      />
      <h1 className="cems-h1">본사관리자 · 예약 가능 기간 설정</h1>

      <div className="cems-panel hq-policy">
        <div className="hq-policy-head">
          <span className="hq-policy-label">예약 가능 기간</span>
          <span className="hq-policy-desc">
            고객이 수령 예정일을 <b>오늘부터 최대 며칠 뒤</b>까지 선택할 수 있는지 설정합니다.
            지점은 이 값을 변경할 수 없습니다.
          </span>
        </div>

        <div className="hq-policy-current">
          현재 설정: <strong>오늘부터 최대 {maxWindowDays}일</strong>
        </div>

        <div className="hq-policy-edit">
          <label className="hq-policy-field">
            <span>수령일 최대 일수</span>
            <span className="hq-policy-inputwrap">
              <input
                type="number"
                min={MIN_WINDOW}
                max={MAX_WINDOW}
                value={winInput}
                onChange={(e) => setWinInput(e.target.value)}
                className="hq-policy-input"
              />
              <span className="tiny">일</span>
            </span>
          </label>
          <button className="cems-btn primary" onClick={apply} disabled={invalid}>
            저장
          </button>
          {flash && <span className="hq-policy-flash">✓ 저장됨</span>}
        </div>

        {invalid && (
          <div className="hq-policy-err">
            {MIN_WINDOW}~{MAX_WINDOW}일 사이의 숫자를 입력해 주세요.
          </div>
        )}

        <div className="hq-policy-hint">
          예) 14일로 설정하면 고객은 오늘부터 2주 이내의 날짜만 수령일로 선택할 수 있습니다.
        </div>
      </div>
    </div>
  )
}
