import { useEffect, useState } from 'react'
import { X, FileText, Info } from 'lucide-react'
import { fetchDocuments, type ApiDocument } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'

export function SourceViewer() {
  const {
    openSourceIds,
    activeSourceTabId,
    setActiveSourceTab,
    closeSourceTab,
    activeSources,
    activeProjectId,
    stats,
  } = useWorkspace()

  const [projectDocs, setProjectDocs] = useState<ApiDocument[]>([])

  useEffect(() => {
    if (activeProjectId === null) { setProjectDocs([]); return }
    fetchDocuments(activeProjectId)
      .then(setProjectDocs)
      .catch(() => setProjectDocs([]))
  }, [activeProjectId, stats])

  if (openSourceIds.length === 0) return null

  // Build a de-duped map of source data by id (title)
  const sourceMap = new Map<string, { title: string; pages: number[]; excerpts: string[]; docInfo?: ApiDocument }>()

  // 1. Populate from project documents
  for (const doc of projectDocs) {
    sourceMap.set(doc.filename, {
      title: doc.filename,
      pages: [],
      excerpts: [],
      docInfo: doc,
    })
  }

  // 2. Overlay with activeSources (query results with pages and excerpts)
  for (const s of activeSources) {
    const existing = sourceMap.get(s.title)
    if (!existing) {
      sourceMap.set(s.title, {
        title: s.title,
        pages: s.pages ? [...s.pages] : [s.page],
        excerpts: s.excerpts ? [...s.excerpts] : (s.excerpt ? [s.excerpt] : []),
      })
    } else {
      const newPages = s.pages ?? (s.page ? [s.page] : [])
      newPages.forEach((p) => { if (!existing.pages.includes(p)) existing.pages.push(p) })
      const newEx = s.excerpts ?? (s.excerpt ? [s.excerpt] : [])
      newEx.forEach((e) => { if (!existing.excerpts.includes(e)) existing.excerpts.push(e) })
    }
  }

  const activeSource = activeSourceTabId ? (sourceMap.get(activeSourceTabId) ?? { title: activeSourceTabId, pages: [], excerpts: [] }) : null

  return (
    <div className="source-viewer">
      {/* Tab bar */}
      <div className="source-viewer__tabs">
        {openSourceIds.map((id) => {
          const src = sourceMap.get(id)
          const label = src?.title ?? id
          const isActive = id === activeSourceTabId
          return (
            <button
              key={id}
              className={`source-viewer__tab${isActive ? ' is-active' : ''}`}
              type="button"
              onClick={() => setActiveSourceTab(id)}
              title={label}
            >
              <FileText size={12} strokeWidth={1.75} />
              <span className="source-viewer__tab-label">{label}</span>
              <span
                className="source-viewer__tab-close"
                role="button"
                tabIndex={0}
                aria-label="Close tab"
                onClick={(e) => { e.stopPropagation(); closeSourceTab(id) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); closeSourceTab(id) } }}
              >
                <X size={11} strokeWidth={2} />
              </span>
            </button>
          )
        })}
      </div>

      {/* Content area */}
      <div className="source-viewer__body">
        {activeSource ? (
          <>
            <div className="source-viewer__meta">
              <FileText size={14} strokeWidth={1.75} />
              <strong>{activeSource.title}</strong>
              {activeSource.pages.length > 0 && (
                <span className="source-viewer__pages">
                  {activeSource.pages.length === 1
                    ? `Page ${activeSource.pages[0]}`
                    : `Pages ${activeSource.pages.sort((a, b) => a - b).join(', ')}`}
                </span>
              )}
              {activeSource.docInfo && activeSource.pages.length === 0 && (
                <span className="source-viewer__pages">
                  {activeSource.docInfo.pages} pages · {activeSource.docInfo.chunks} chunks
                </span>
              )}
            </div>

            <div className="source-viewer__excerpts" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {activeSource.docInfo ? (
                <iframe
                  src={`/api/documents/${activeSource.docInfo.id}/file${
                    activeSource.pages.length > 0 ? `#page=${activeSource.pages[0]}` : ''
                  }`}
                  style={{ flex: 1, width: '100%', border: 'none', borderRadius: '4px', backgroundColor: '#fff', minHeight: '400px' }}
                  title={activeSource.title}
                />
              ) : activeSource.excerpts.length > 0 ? (
                activeSource.excerpts.map((ex, i) => (
                  <div key={i} className="source-viewer__excerpt">
                    {activeSource.excerpts.length > 1 && (
                      <p className="source-viewer__excerpt-label">Excerpt {i + 1}</p>
                    )}
                    <p>{ex}</p>
                  </div>
                ))
              ) : (
                <div className="source-viewer__empty-state">
                  <Info size={20} strokeWidth={1.7} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                  <p><strong>{activeSource.title}</strong> is attached to this project.</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Ask a question in chat, and relevant excerpts matching your query will be extracted and displayed here with cited page numbers.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="source-viewer__empty">Select a tab to view source content.</p>
        )}
      </div>
    </div>
  )
}
