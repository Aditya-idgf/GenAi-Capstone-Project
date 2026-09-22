import { Eye, FileText, MoreVertical, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { deleteDocument, fetchDocuments, type ApiDocument } from '../../api'
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
    selectedSourceIds,
    toggleSource,
    openSourceTab,
    activeProjectId,
    stats,
    setView,
    setSidebarOpen,
    showToast
  } = useWorkspace()

  const [projectDocs, setProjectDocs] = useState<ApiDocument[]>([])

  // Load project documents whenever active project changes
  useEffect(() => {
    if (activeProjectId === null) { setProjectDocs([]); return }
    fetchDocuments(activeProjectId)
      .then(setProjectDocs)
      .catch(() => setProjectDocs([]))
  }, [activeProjectId, stats])

  // Use all project documents
  const allSources: ApiSource[] = projectDocs.map((doc, idx) => docToSource(doc, idx))
  const displaySources = allSources.slice(0, 10)
  const hasMore = allSources.length > 10

  const label = 'DOCUMENTS'
  const emptyMsg = activeProjectId === null
    ? 'Select a project to see its documents.'
    : 'Upload PDFs to this project to get started.'

  const handleDelete = async (filename: string) => {
    const doc = projectDocs.find((d) => d.filename === filename)
    if (!doc) return
    try {
      await deleteDocument(doc.id)
      setProjectDocs((prev) => prev.filter((d) => d.id !== doc.id))
      showToast('Document deleted', 'success')
    } catch (err) {
      showToast('Failed to delete document', 'error')
    }
  }

  return (
    <section className="panel sources-panel">
      <header className="panel__head">
        <div>
          <h2>{label}</h2>
          <span className="pill">{allSources.length}</span>
        </div>
        {hasMore && (
          <button
            className="link"
            type="button"
            onClick={() => {
              setView('library')
              setSidebarOpen(false)
            }}
          >
            View all
          </button>
        )}
      </header>

      {allSources.length === 0 ? (
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
                      {source.excerpt}
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
