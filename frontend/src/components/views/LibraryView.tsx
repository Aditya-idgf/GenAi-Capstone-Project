import { DOCUMENTS } from '../../data'

export function LibraryView() {
  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Library</p>
          <h1>All documents</h1>
        </div>
        <p className="muted">{DOCUMENTS.length} files in the knowledge base</p>
      </header>
      <div className="table">
        <div className="table__row table__row--head">
          <span>Name</span>
          <span>Collection</span>
          <span>Pages</span>
          <span>Chunks</span>
          <span>Size</span>
        </div>
        {DOCUMENTS.map((doc) => (
          <div className="table__row" key={doc.id}>
            <strong>{doc.name}</strong>
            <span>{doc.collection}</span>
            <span>{doc.pages}</span>
            <span>{doc.chunks}</span>
            <span>{doc.size}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
