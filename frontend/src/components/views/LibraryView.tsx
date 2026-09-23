import { Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  const { refreshStats, activeProjectId, projects, uploadFile, isUploading, showToast } = useWorkspace()
  const [docs, setDocs]       = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const handleUploadClick = () => {
    if (activeProjectId === null) {
      showToast('Please select a project first to upload documents.', 'info')
      return
    }
    if (fileRef.current) {
      fileRef.current.value = ''
      fileRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadFile(file)
      load()
      refreshStats()
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="page">
      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept=".pdf"
        disabled={isUploading}
        onChange={handleFileChange}
      />

      <header className="page__head">
        <div>
          <p className="eyebrow">{activeProject?.name ?? 'No project selected'}</p>
          <h1>Documents</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <p className="muted">{docs.length} file{docs.length !== 1 ? 's' : ''}</p>
          {activeProjectId !== null && (
            <button
              className="btn btn--primary"
              type="button"
              disabled={isUploading}
              onClick={handleUploadClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                borderRadius: '8px',
                background: 'var(--accent, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isUploading ? (
                <Loader2 size={15} strokeWidth={2} className="spin" />
              ) : (
                <Upload size={15} strokeWidth={2} />
              )}
              {isUploading ? 'Uploading…' : 'Upload Document'}
            </button>
          )}
        </div>
      </header>

      {activeProjectId === null && (
        <p className="muted">Select a project from the sidebar to view its documents.</p>
      )}
      {loading && <p className="muted">Loading…</p>}
      {error   && <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p>}

      {!loading && !error && activeProjectId !== null && docs.length === 0 && (
        <div
          className="lib-empty-drop"
          onClick={handleUploadClick}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            border: '2px dashed var(--border, #2a2f38)',
            borderRadius: '12px',
            background: 'var(--card-bg, #16181d)',
            cursor: 'pointer',
            textAlign: 'center',
            marginTop: '16px',
            transition: 'border-color 150ms ease, background 150ms ease',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'var(--accent-subtle, rgba(59, 130, 246, 0.15))',
              color: 'var(--accent, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}
          >
            {isUploading ? <Loader2 size={26} className="spin" /> : <Plus size={28} strokeWidth={2} />}
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
            {isUploading ? 'Uploading document…' : 'Upload your first document'}
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Click here to choose a PDF file to add to <strong>{activeProject?.name}</strong>
          </p>
        </div>
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
