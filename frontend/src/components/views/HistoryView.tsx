import { useEffect, useState } from 'react'
import { fetchSessions, type ApiChatSession } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function HistoryView() {
  const { setView } = useWorkspace()
  const [sessions, setSessions] = useState<ApiChatSession[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetchSessions(1)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">History</p>
          <h1>Previous conversations</h1>
        </div>
      </header>

      {loading && <p className="muted">Loading…</p>}

      {!loading && sessions.length === 0 && (
        <p className="muted">No conversations yet.</p>
      )}

      <ul className="history-list">
        {sessions.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => setView('chat')}>
              <strong>{s.title}</strong>
              <span>{formatTime(s.created_at)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
