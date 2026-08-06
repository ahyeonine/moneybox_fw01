import { useSearchParams, Link } from 'react-router-dom'
import { marked } from 'marked'

// 기획문서 뷰어 — docs-plan/ 폴더의 마크다운/머메이드 파일을 목록+렌더링으로 보여준다.
// 내부 검토용. 개발문서(docs/)와 별개인 기획문서(docs-plan/) 전용.
// Vite raw import로 빌드 시점에 문서 내용을 번들에 포함한다.
const RAW = import.meta.glob('../../docs-plan/*.{md,mermaid}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// { 파일명: 내용 } 으로 정규화 + 파일명 오름차순 정렬
const DOCS = Object.entries(RAW)
  .map(([path, content]) => ({ name: path.split('/').pop(), content }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

marked.setOptions({ gfm: true, breaks: false })

export default function DocsViewer() {
  const [params, setParams] = useSearchParams()
  const active = params.get('doc') || (DOCS[0] && DOCS[0].name)
  const current = DOCS.find((d) => d.name === active) || DOCS[0]

  const select = (name) => setParams({ doc: name })

  return (
    <div className="docs-page">
      <aside className="docs-sidebar">
        <div className="docs-side-title">기획문서</div>
        <div className="docs-side-sub">docs-plan/</div>
        <nav className="docs-nav">
          {DOCS.map((d) => (
            <button
              key={d.name}
              className={`docs-nav-item ${d.name === current?.name ? 'active' : ''}`}
              onClick={() => select(d.name)}
              title={d.name}
            >
              {d.name}
            </button>
          ))}
        </nav>
        <Link className="docs-back" to="/site">
          ← 프로토타입으로
        </Link>
      </aside>

      <main className="docs-content">
        {current ? (
          <>
            <div className="docs-filename">{current.name}</div>
            {current.name.endsWith('.mermaid') ? (
              <pre className="docs-mermaid">{current.content}</pre>
            ) : (
              <article
                className="docs-md"
                dangerouslySetInnerHTML={{ __html: marked.parse(current.content) }}
              />
            )}
          </>
        ) : (
          <p className="muted">docs-plan/ 폴더에 문서가 없습니다.</p>
        )}
      </main>
    </div>
  )
}
