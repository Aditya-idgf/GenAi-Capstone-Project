import { Eye, FileText, MoreVertical, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fetchDocuments, type ApiDocument } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ApiSource } from '../../api'

const TONES = ['red', 'purple', 'teal', 'gray'] as const
type Tone = (typeof TONES)[number]

function PdfGlyph({ tone }: { tone: Tone }) {
  return (
    <span className={`pdf-glyph pdf-glyph--${tone}`}>
      <FileText size={15} strokeWidth={1.7} />
    </span>
  )
}

function toneForIndex(i: number): Tone {
  return TONES[i % TONES.length]
}

// Convert an uploaded document to a source-like display item
function docToSource(doc: ApiDocument, i: number): ApiSource {
  return {
    number: i + 1,
    title: doc.filename,
    page: 0,
    chunk: doc.chunks,
    excerpt: `${doc.pages} pages · ${doc.chunks} chunks`,
    collection: doc.collection,
  }
}

function formatPages(source: ApiSource): string {
  if (source.pages && source.pages.length > 0) {
    const pStr = source.pages.join(', ')
    const count = source.excerpts?.length || source.chunk || 1
    return source.pages.length === 1
      ? `Page ${pStr} • ${count} excerpt${count !== 1 ? 's' : ''}`
      : `Pages ${pStr} • ${count} excerpts`
  }
  return `Page ${source.page} • Chunk ${source.chunk}`
}

// ── Source 3-dots context menu ──────────────────────────────────────────────
function SourceMenu({
  onView,
  onDelete,
}: {
  onView: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="source-item__menu-wrap" ref={ref}>
      <button
        className="icon-btn source-item__more"
        type="button"
        aria-label="Source actions"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
      >
        <MoreVertical size={15} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="menu source-item__menu">
          <button
            type="button"
            onClick={() => { onView(); setOpen(false) }}
          >
            <Eye size={13} strokeWidth={1.75} /> View source
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => { onDelete(); setOpen(false) }}
          >
            <Trash2 size={13} strokeWidth={1.75} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function SourcesPanel() {
  const {
    activeSources,
    selectedSourceIds,
    toggleSource,
    openSourceTab,
    activeProjectId,
    stats,
  } = useWorkspace()

  const [projectDocs, setProjectDocs] = useState<ApiDocument[]>([])
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // Load project documents whenever active project changes
  useEffect(() => {
    if (activeProjectId === null) { setProjectDocs([]); return }
    fetchDocuments(activeProjectId)
      .then(setProjectDocs)
      .catch(() => setProjectDocs([]))
  }, [activeProjectId, stats])

  // Group active query sources by file so same file NEVER repeats
  const groupedQuerySources: ApiSource[] = (() => {
    const map = new Map<string, ApiSource>()
    for (const s of activeSources) {
      if (!map.has(s.title)) {
        map.set(s.title, {
          ...s,
          pages: s.pages ? [...s.pages] : [s.page],
          excerpts: s.excerpts ? [...s.excerpts] : (s.excerpt ? [s.excerpt] : []),
        })
      } else {
        const existing = map.get(s.title)!
        const allPages = new Set(existing.pages ?? [existing.page])
        if (s.pages) s.pages.forEach((p) => allPages.add(p))
        else allPages.add(s.page)
        existing.pages = Array.from(allPages).sort((a, b) => a - b)
        existing.page = existing.pages[0]

        const allExcerpts = existing.excerpts ?? (existing.excerpt ? [existing.excerpt] : [])
        if (s.excerpts) {
          s.excerpts.forEach((e) => { if (!allExcerpts.includes(e)) allExcerpts.push(e) })
        } else if (s.excerpt && !allExcerpts.includes(s.excerpt)) {
          allExcerpts.push(s.excerpt)
        }
        existing.excerpts = allExcerpts
        existing.chunk = allExcerpts.length
      }
    }
    return Array.from(map.values()).map((s, idx) => ({ ...s, number: idx + 1 }))
  })()

  // Filter out locally deleted sources
  const visibleQuerySources = groupedQuerySources.filter((s) => !deletedIds.has(s.title))

  // If we have real query sources — show those. Otherwise show uploaded docs.
  const showQuerySources = visibleQuerySources.length > 0
  const displaySources: ApiSource[] = showQuerySources
    ? visibleQuerySources
    : projectDocs.map(docToSource)

  const label = showQuerySources ? 'SOURCES' : 'DOCUMENTS'
  const emptyMsg = activeProjectId === null
    ? 'Select a project to see its documents.'
    : 'Upload PDFs to this project to get started.'

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]))
  }

  return (
    <section className="panel sources-panel">
      <header className="panel__head">
        <div>
          <h2>{label}</h2>
          <span className="pill">{displaySources.length}</span>
        </div>
        {showQuerySources && (
          <button className="link" type="button">View all</button>
        )}
      </header>

      {displaySources.length === 0 ? (
        <p className="sources-panel__empty">{emptyMsg}</p>
      ) : (
        <ul className="source-list">
          {displaySources.map((source, i) => {
            const id = source.title
            const selected = selectedSourceIds.includes(id)
            return (
              <li key={id}>
                <button
                  className={`source-item${selected ? ' is-selected' : ''}`}
                  type="button"
                  onClick={() => {
                    toggleSource(id)
                    // Instantly open in split pane
                    openSourceTab(id)
                  }}
                >
                  <em>{source.number}</em>
                  <PdfGlyph tone={toneForIndex(i)} />
                  <span>
                    <strong>{source.title}</strong>
                    <small>
                      {showQuerySources
                        ? formatPages(source)
                        : source.excerpt
                      }
                    </small>
                  </span>
                </button>
                <SourceMenu
                  onView={() => openSourceTab(id)}
                  onDelete={() => handleDelete(id)}
                />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
