import { HISTORY } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'

export function HistoryView() {
  const { setView } = useWorkspace()

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">History</p>
          <h1>Previous conversations</h1>
        </div>
      </header>
      <ul className="history-list">
        {HISTORY.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => setView('chat')}>
              <strong>{item.title}</strong>
              <span>
                {item.collection} · {item.time} · {item.sources} sources
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
