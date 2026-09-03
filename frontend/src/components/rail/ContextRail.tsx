import { SourcesPanel } from './SourcesPanel'
import { ToolHint } from './ToolHint'
import { ToolsPanel } from './ToolsPanel'
import { useWorkspace } from '../../state/WorkspaceContext'

export function ContextRail() {
  const { railOpen, setRailOpen } = useWorkspace()

  return (
    <>
      {railOpen && (
        <button
          className="scrim"
          type="button"
          aria-label="Close sources"
          onClick={() => setRailOpen(false)}
        />
      )}
      <aside className={`rail${railOpen ? ' is-open' : ''}`}>
        <SourcesPanel />
        <ToolsPanel />
        <ToolHint />
      </aside>
    </>
  )
}
