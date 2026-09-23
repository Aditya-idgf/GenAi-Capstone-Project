import { Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useWorkspace } from '../../state/WorkspaceContext'

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { addProject } = useWorkspace()
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await addProject(name.trim())
    onClose()
  }

  return (
    <div className="modal-root" role="dialog" aria-modal="true">
      <button className="scrim" type="button" onClick={onClose} />
      <div className="new-proj-modal">
        <h3>New Project</h3>
        <form onSubmit={submit}>
          <input
            ref={inputRef}
            className="new-proj-input"
            placeholder="Project name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="new-proj-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="send-btn" style={{ width: 'auto', padding: '0 16px' }}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CollectionsView() {
  const { projects, activeProjectId, setActiveProject, setView } = useWorkspace()
  const [showModal, setShowModal] = useState(false)

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Collections</p>
          <h1>Projects</h1>
        </div>
        <p className="muted">Each project has its own documents and retrieval scope.</p>
      </header>

      <div className="cards">
        {projects.map((p) => (
          <button
            key={p.id}
            className={`card-btn${activeProjectId === p.id ? ' is-active' : ''}`}
            type="button"
            onClick={() => { setActiveProject(p.id); setView('chat') }}
          >
            <h3>{p.name}</h3>
            <p>{p.description || 'No description.'}</p>
            <strong>{p.document_count} document{p.document_count !== 1 ? 's' : ''}</strong>
          </button>
        ))}

        {/* Large + Button card identical in size to project cards */}
        <button
          className="card-btn card-btn--new"
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            border: '2px dashed var(--border, #2a2f38)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            minHeight: '140px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--accent-subtle, rgba(59, 130, 246, 0.15))',
              color: 'var(--accent, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={22} strokeWidth={2} />
          </div>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>New Project</h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>Create a new workspace</p>
        </button>
      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </section>
  )
}
