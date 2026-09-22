import { useWorkspace } from '../../state/WorkspaceContext'

export function CollectionsView() {
  const { projects, activeProjectId, setActiveProject, setView } = useWorkspace()

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Collections</p>
          <h1>Projects</h1>
        </div>
        <p className="muted">Each project has its own documents and retrieval scope.</p>
      </header>

      {projects.length === 0 && (
        <p className="muted">No projects yet. Create one from the sidebar.</p>
      )}

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
      </div>
    </section>
  )
}
