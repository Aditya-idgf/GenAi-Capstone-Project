import { X } from 'lucide-react'
import { SOURCES } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'

export function SourcePreview() {
  const { previewSourceId, setPreviewSourceId } = useWorkspace()
  const source = SOURCES.find((item) => item.id === previewSourceId)
  if (!source) return null

  return (
    <div className="sheet">
      <header>
        <div>
          <p className="eyebrow">Source {source.number}</p>
          <h3>{source.title}</h3>
          <p className="muted">
            Page {source.page} • Chunk {source.chunk}
          </p>
        </div>
        <button className="icon-btn" type="button" onClick={() => setPreviewSourceId(null)}>
          <X size={16} strokeWidth={1.8} />
        </button>
      </header>
      <p className="sheet__body">{source.excerpt}</p>
    </div>
  )
}
