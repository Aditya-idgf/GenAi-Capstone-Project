import { useWorkspace } from '../../state/WorkspaceContext'

const GB = 1024 ** 3
const MAX_STORAGE_GB = 20

function fmt(n: number) { return n.toLocaleString() }

function fmtStorage(bytes: number) {
  const gb = bytes / GB
  return gb < 1 ? `${(bytes / 1024 ** 2).toFixed(1)} MB` : `${gb.toFixed(1)} GB`
}

export function KnowledgeOverview() {
  const { stats, projects, activeProjectId } = useWorkspace()

  const documents = stats?.documents     ?? 0
  const pages     = stats?.pages         ?? 0
  const chunks    = stats?.chunks        ?? 0
  const storage   = stats?.storage_bytes ?? 0
  const pct       = Math.min(Math.round((storage / GB / MAX_STORAGE_GB) * 100), 100)

  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <section className="overview">
      <h2>{activeProject ? activeProject.name : 'Knowledge Overview'}</h2>
      <dl>
        <div><dt>Documents</dt><dd>{fmt(documents)}</dd></div>
        <div><dt>Pages</dt>    <dd>{fmt(pages)}</dd></div>
        <div><dt>Chunks</dt>   <dd>{fmt(chunks)}</dd></div>
        <div className="overview__storage">
          <dt>Storage</dt>
          <dd>
            <span>{fmtStorage(storage)} / {MAX_STORAGE_GB} GB</span>
            <strong>{pct}%</strong>
          </dd>
        </div>
      </dl>
      <div className="overview__bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
    </section>
  )
}
