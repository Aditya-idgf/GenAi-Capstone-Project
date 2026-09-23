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
  const [activePage, setActivePage] = useState<number>(1)

  useEffect(() => {
    if (activeProjectId === null) { setProjectDocs([]); return }
    fetchDocuments(activeProjectId)
      .then(setProjectDocs)
      .catch(() => setProjectDocs([]))
  }, [activeProjectId, stats])

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

  // Auto-switch to cited page when opening or switching tabs
  const citedPageKey = activeSource?.pages?.join(',')
  useEffect(() => {
    if (activeSource?.pages && activeSource.pages.length > 0) {
      setActivePage(activeSource.pages[0])
    } else {
      setActivePage(1)
    }
  }, [activeSourceTabId, citedPageKey])

  if (openSourceIds.length === 0) return null

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

      {/* Content area - no redundant top bar, maximum window space for the document */}
      <div className="source-viewer__body">
        {activeSource ? (
          activeSource.docInfo ? (
            <div className="source-viewer__content">
              {/* Slim page numbers strip on the left side of the window */}
              {activeSource.docInfo.pages > 1 && (
                <div className="pdf-page-strip" title="Jump to page">
                  {Array.from({ length: activeSource.docInfo.pages }, (_, i) => i + 1).map((p) => {
                    const isCited = activeSource.pages.includes(p)
                    const isSelected = activePage === p
                    return (
                      <button
                        key={p}
                        className={`pdf-page-strip__btn${isSelected ? ' is-active' : ''}${isCited ? ' is-cited' : ''}`}
                        type="button"
                        title={`Page ${p}${isCited ? ' (Cited in answer)' : ''}`}
                        onClick={() => setActivePage(p)}
                      >
                        {p}
                        {isCited && <span className="pdf-page-strip__dot" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Full-width PDF with navpanes=0, pagemode=none, and view=FitH */}
              <iframe
                key={`${activeSource.docInfo.id}-${activePage}`}
                src={`/api/documents/${activeSource.docInfo.id}/file#page=${activePage}&navpanes=0&pagemode=none&view=FitH`}
                className="pdf-iframe"
                title={activeSource.title}
              />
            </div>
          ) : activeSource.excerpts.length > 0 ? (
            <div className="source-viewer__excerpts">
              {activeSource.excerpts.map((ex, i) => (
                <div key={i} className="source-viewer__excerpt">
                  {activeSource.excerpts.length > 1 && (
                    <p className="source-viewer__excerpt-label">Excerpt {i + 1}</p>
                  )}
                  <p>{ex}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="source-viewer__empty-state">
              <Info size={20} strokeWidth={1.7} style={{ color: 'var(--accent)', marginBottom: 8 }} />
              <p><strong>{activeSource.title}</strong> is attached to this project.</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Ask a question in chat, and relevant excerpts matching your query will be extracted and displayed here with cited page numbers.
              </p>
            </div>
          )
        ) : (
          <p className="source-viewer__empty">Select a tab to view source content.</p>
        )}
      </div>
    </div>
  )
}
