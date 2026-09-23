import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { KnowledgeOverview } from '../sidebar/KnowledgeOverview'
import { SourcesPanel } from './SourcesPanel'
import { ToolHint } from './ToolHint'
import { ToolsPanel } from './ToolsPanel'
import { useWorkspace } from '../../state/WorkspaceContext'

export function ContextRail() {
  const { railOpen, setRailOpen, railCollapsed, setRailCollapsed } = useWorkspace()

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
      <aside className={`rail${railOpen ? ' is-open' : ''}${railCollapsed ? ' is-collapsed' : ''}`}>
        <SourcesPanel />
        <KnowledgeOverview />
        <ToolsPanel />
        <ToolHint />
        
        {/* Collapse button always at bottom */}
        <div className="rail__collapse-btn-wrap">
          <button
            className="rail__collapse-btn"
            type="button"
            aria-label={railCollapsed ? 'Expand panel' : 'Collapse panel'}
            title={railCollapsed ? 'Expand panel' : 'Collapse panel'}
            onClick={() => setRailCollapsed(!railCollapsed)}
          >
            {railCollapsed
              ? <PanelRightOpen size={16} strokeWidth={1.75} />
              : <PanelRightClose size={16} strokeWidth={1.75} />
            }
          </button>
        </div>
      </aside>
    </>
  )
}
