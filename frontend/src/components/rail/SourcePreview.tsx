import { X } from 'lucide-react'
import { useWorkspace } from '../../state/WorkspaceContext'

export function SourcePreview() {
  const { previewSourceId, setPreviewSourceId, activeSources } = useWorkspace()

  if (!previewSourceId) return null

  // Find matching source by composite id: "title-page-chunk"
  const source = activeSources.find(
    (s) => `${s.title}-${s.page}-${s.chunk}` === previewSourceId,
  )
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
        <button
          className="icon-btn"
          type="button"
          onClick={() => setPreviewSourceId(null)}
          aria-label="Close preview"
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      </header>
      <p className="sheet__body">{source.excerpt}</p>
    </div>
  )
}
