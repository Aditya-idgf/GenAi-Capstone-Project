import { FileText, MoreVertical } from 'lucide-react'
import { SOURCES } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { SourceItem } from '../../types'

function PdfGlyph({ tone }: { tone: SourceItem['iconTone'] }) {
  return (
    <span className={`pdf-glyph pdf-glyph--${tone}`}>
      <FileText size={16} strokeWidth={1.7} />
    </span>
  )
}

export function SourcesPanel() {
  const { selectedSourceIds, toggleSource, setPreviewSourceId } = useWorkspace()

  return (
    <section className="panel sources-panel">
      <header className="panel__head">
        <div>
          <h2>SOURCES</h2>
          <span className="pill">{SOURCES.length}</span>
        </div>
        <button className="link" type="button">
          View all
        </button>
      </header>
      <ul className="source-list">
        {SOURCES.map((source) => {
          const selected = selectedSourceIds.includes(source.id)
          return (
            <li key={source.id}>
              <button
                className={`source-item${selected ? ' is-selected' : ''}`}
                type="button"
                onClick={() => toggleSource(source.id)}
                onDoubleClick={() => setPreviewSourceId(source.id)}
              >
                <em>{source.number}</em>
                <PdfGlyph tone={source.iconTone} />
                <span>
                  <strong>{source.title}</strong>
                  <small>
                    Page {source.page} • Chunk {source.chunk}
                  </small>
                </span>
              </button>
              <button
                className="icon-btn source-item__more"
                type="button"
                aria-label="Source actions"
                onClick={() => setPreviewSourceId(source.id)}
              >
                <MoreVertical size={16} strokeWidth={1.75} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
