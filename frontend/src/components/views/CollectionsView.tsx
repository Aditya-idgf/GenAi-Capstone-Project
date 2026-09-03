import { COLLECTIONS } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'

export function CollectionsView() {
  const { collection, setCollection, setView } = useWorkspace()

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Collections</p>
          <h1>Retrieval scope</h1>
        </div>
        <p className="muted">Group documents to define what the retriever can see.</p>
      </header>
      <div className="cards">
        {COLLECTIONS.map((item) => (
          <button
            key={item.id}
            className={`card-btn${collection === item.name ? ' is-active' : ''}`}
            type="button"
            onClick={() => {
              setCollection(item.name)
              setView('chat')
            }}
          >
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <strong>{item.documents} documents</strong>
          </button>
        ))}
      </div>
    </section>
  )
}
