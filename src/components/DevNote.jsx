import { useState } from 'react'

// 개발 참고 설명(플로팅 포스트잇) — 실제 서비스 UI가 아니라 프로토타입 검토용 주석.
// 화면마다 items 배열만 다르게 넘겨 사용: <DevNote items={[...]} />
// 우측 상단 고정, 기본 펼침, 접기/펼치기 토글.
export default function DevNote({ items = [] }) {
  const [open, setOpen] = useState(true)
  if (!items.length) return null
  return (
    <aside className={`devnote ${open ? 'open' : 'collapsed'}`} aria-label="개발 참고 설명">
      <div className="devnote-head">
        <span className="devnote-label">📌 DEV NOTE</span>
        <button
          className="devnote-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={open ? '접기' : '펼치기'}
        >
          {open ? '─' : '＋'}
        </button>
      </div>
      {open && (
        <ul className="devnote-body">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </aside>
  )
}
