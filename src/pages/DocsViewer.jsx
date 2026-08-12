import { useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import { screensForDoc } from '../data/docRefs.js'

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
  const mermaidRef = useRef(null)

  // .mermaid 파일은 mermaid.js로 실제 다이어그램 렌더 (라이브러리는 지연 로딩)
  const isMermaid = current?.name.endsWith('.mermaid')
  useEffect(() => {
    if (!isMermaid || !mermaidRef.current) return
    let cancelled = false
    mermaidRef.current.innerHTML = '<div class="tiny">다이어그램 렌더링 중…</div>'
    import('mermaid')
      .then(({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' })
        return mermaid.render('docsMermaidSvg', current.content)
      })
      .then(({ svg }) => {
        if (!cancelled && mermaidRef.current) mermaidRef.current.innerHTML = svg
      })
      .catch((e) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<pre class="docs-mermaid">${current.content}</pre>`
        }
        console.warn('mermaid render failed', e)
      })
    return () => {
      cancelled = true
    }
  }, [isMermaid, current?.name, current?.content])

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
            {/* 문서 → 메모(화면) 역참조: 이 문서를 참고하는 화면으로 바로 이동 */}
            {screensForDoc(current.name).length > 0 && (
              <div className="docs-related">
                <span className="docs-related-label">이 문서를 참고하는 화면(메모):</span>
                {screensForDoc(current.name).map((r) => (
                  <Link key={r.route} className="docs-related-link" to={r.route}>
                    {r.screen}
                  </Link>
                ))}
              </div>
            )}
            {isMermaid ? (
              <div className="docs-mermaid-render" ref={mermaidRef} />
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
