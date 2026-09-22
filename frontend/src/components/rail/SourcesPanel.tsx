import { FileText, MoreVertical } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchDocuments, type ApiDocument } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ApiSource } from '../../api'

const TONES = ['red', 'purple', 'teal', 'gray'] as const
type Tone = (typeof TONES)[number]

function PdfGlyph({ tone }: { tone: Tone }) {
  return (
    <span className={`pdf-glyph pdf-glyph--${tone}`}>
      <FileText size={15} strokeWidth={1.7} />
    </span>
  )
}

function toneForIndex(i: number): Tone {
  return TONES[i % TONES.length]
}

// Convert an uploaded document to a source-like display item
function docToSource(doc: ApiDocument, i: number): ApiSource {
  return {
    number: i + 1,
    title: doc.filename,
    page: 0,
    chunk: doc.chunks,
    excerpt: `${doc.pages} pages · ${doc.chunks} chunks`,
    collection: doc.collection,
  }
}

export function SourcesPanel() {
  const {
    activeSources,
    selectedSourceIds,
    toggleSource,
    setPreviewSourceId,
    activeProjectId,
    stats,
  } = useWorkspace()

  const [projectDocs, setProjectDocs] = useState<ApiDocument[]>([])

  // Load project documents whenever active project changes
  useEffect(() => {
    if (activeProjectId === null) { setProjectDocs([]); return }
    fetchDocuments(activeProjectId)
      .then(setProjectDocs)
      .catch(() => setProjectDocs([]))
  }, [activeProjectId, stats]) // re-fetch when stats change (new upload)

  // If we have real query sources — show those. Otherwise show uploaded docs.
  const showQuerySources = activeSources.length > 0
  const displaySources: ApiSource[] = showQuerySources
    ? activeSources
    : projectDocs.map(docToSource)

  const label = showQuerySources ? 'SOURCES' : 'DOCUMENTS'
  const emptyMsg = activeProjectId === null
    ? 'Select a project to see its documents.'
    : 'Upload PDFs to this project to get started.'

  return (
    <section className="panel sources-panel">
      <header className="panel__head">
        <div>
          <h2>{label}</h2>
          <span className="pill">{displaySources.length}</span>
        </div>
        {showQuerySources && (
          <button className="link" type="button">View all</button>
        )}
      </header>

      {displaySources.length === 0 ? (
        <p className="sources-panel__empty">{emptyMsg}</p>
      ) : (
        <ul className="source-list">
          {displaySources.map((source, i) => {
            const id = `${source.title}-${source.page}-${source.chunk}`
            const selected = selectedSourceIds.includes(id)
            return (
              <li key={id}>
                <button
                  className={`source-item${selected ? ' is-selected' : ''}`}
                  type="button"
                  onClick={() => toggleSource(id)}
                  onDoubleClick={() => showQuerySources && setPreviewSourceId(id)}
                >
                  <em>{source.number}</em>
                  <PdfGlyph tone={toneForIndex(i)} />
                  <span>
                    <strong>{source.title}</strong>
                    <small>
                      {showQuerySources
                        ? `Page ${source.page} • Chunk ${source.chunk}`
                        : source.excerpt
                      }
                    </small>
                  </span>
                </button>
                {showQuerySources && (
                  <button
                    className="icon-btn source-item__more"
                    type="button"
                    aria-label="Source actions"
                    onClick={() => setPreviewSourceId(id)}
                  >
                    <MoreVertical size={15} strokeWidth={1.75} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
