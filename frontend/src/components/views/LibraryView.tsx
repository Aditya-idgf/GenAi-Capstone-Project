import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { deleteDocument, fetchDocuments, type ApiDocument } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`
}

export function LibraryView() {
  const { refreshStats, activeProjectId, projects } = useWorkspace()
  const [docs, setDocs]       = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const activeProject = projects.find((p) => p.id === activeProjectId)

  const load = () => {
    if (activeProjectId === null) return
    setLoading(true)
    fetchDocuments(activeProjectId)
      .then(setDocs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [activeProjectId]) // eslint-disable-line

  const handleDelete = async (id: number) => {
    await deleteDocument(id)
    load()
    refreshStats()
  }

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{activeProject?.name ?? 'No project selected'}</p>
          <h1>Documents</h1>
        </div>
        <p className="muted">{docs.length} file{docs.length !== 1 ? 's' : ''}</p>
      </header>

      {activeProjectId === null && (
        <p className="muted">Select a project from the sidebar to view its documents.</p>
      )}
      {loading && <p className="muted">Loading…</p>}
      {error   && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}
      {!loading && !error && activeProjectId !== null && docs.length === 0 && (
        <p className="muted">No documents yet. Upload a PDF to get started.</p>
      )}

      {docs.length > 0 && (
        <div className="table">
          <div className="table__row table__row--head">
            <span>Name</span>
            <span>Pages</span>
            <span>Chunks</span>
            <span>Size</span>
            <span></span>
          </div>
          {docs.map((doc) => (
            <div className="table__row table__row--lib" key={doc.id}>
              <strong>{doc.filename}</strong>
              <span>{doc.pages}</span>
              <span>{doc.chunks}</span>
              <span>{formatBytes(doc.size_bytes)}</span>
              <button
                className="icon-btn"
                style={{ border: 0, width: 28, height: 28 }}
                type="button"
                aria-label="Delete"
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
