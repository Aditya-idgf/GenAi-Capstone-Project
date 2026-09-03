import { Lightbulb, X } from 'lucide-react'
import { useWorkspace } from '../../state/WorkspaceContext'

export function ToolHint() {
  const { hintVisible, dismissHint } = useWorkspace()
  if (!hintVisible) return null

  return (
    <aside className="hint">
      <Lightbulb size={16} strokeWidth={1.75} />
      <p>Select text in the answer or choose sources to use tools effectively.</p>
      <button type="button" aria-label="Dismiss hint" onClick={dismissHint}>
        <X size={14} strokeWidth={1.8} />
      </button>
    </aside>
  )
}
