import { X } from 'lucide-react'
import { useWorkspace } from '../../state/WorkspaceContext'

export function SourcePreview() {
  const { previewSourceId, setPreviewSourceId, activeSources } = useWorkspace()

  if (!previewSourceId) return null

  // Find matching source by title or composite id
  const matching = activeSources.filter(
    (s) => s.title === previewSourceId || `${s.title}-${s.page}-${s.chunk}` === previewSourceId,
  )
  if (matching.length === 0) return null

  const primary = matching[0]
  const allPages = new Set<number>()
  const allExcerpts: string[] = []

  for (const s of matching) {
    if (s.pages) s.pages.forEach((p) => allPages.add(p))
    else if (s.page) allPages.add(s.page)

    if (s.excerpts && s.excerpts.length > 0) {
      s.excerpts.forEach((e) => { if (!allExcerpts.includes(e)) allExcerpts.push(e) })
    } else if (s.excerpt && !allExcerpts.includes(s.excerpt)) {
      allExcerpts.push(s.excerpt)
    }
  }

  const pagesSorted = Array.from(allPages).sort((a, b) => a - b)
  const pageLabel = pagesSorted.length > 0
    ? (pagesSorted.length === 1 ? `Page ${pagesSorted[0]}` : `Pages ${pagesSorted.join(', ')}`)
    : `Page ${primary.page}`

  return (
    <div className="sheet">
      <header>
        <div>
          <p className="eyebrow">Document Source</p>
          <h3>{primary.title}</h3>
          <p className="muted">
            {pageLabel} • {allExcerpts.length} excerpt{allExcerpts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="icon-btn"
          type="button"
          onClick={() => setPreviewSourceId(null)}
          aria-label="Close preview"
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      </header>
      <div className="sheet__body">
        {allExcerpts.map((excerpt, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: idx < allExcerpts.length - 1 ? 14 : 0,
              paddingBottom: idx < allExcerpts.length - 1 ? 14 : 0,
              borderBottom: idx < allExcerpts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            {allExcerpts.length > 1 && (
              <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Excerpt {idx + 1}
              </small>
            )}
            <p style={{ margin: 0, lineHeight: 1.55 }}>{excerpt}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
