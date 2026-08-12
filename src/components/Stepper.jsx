// 진행 표시. steps: 라벨 문자열 배열, current: 1-based 현재 단계.
export default function Stepper({ steps, current }) {
  return (
    <div className="stepper" aria-label={`step ${current} of ${steps.length}`}>
      {steps.map((label, i) => {
        const n = i + 1
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`st ${n === current ? 'active' : ''} ${n < current ? 'done' : ''}`}>
              <span className="num">{n < current ? '✓' : n}</span>
              <span className="lb">{label}</span>
            </div>
            {i < steps.length - 1 && <span className="bar" />}
          </div>
        )
      })}
    </div>
  )
}
