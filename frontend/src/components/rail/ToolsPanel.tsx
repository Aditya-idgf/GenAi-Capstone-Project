import {
  FileSearch,
  Globe,
  ListTree,
  Scale,
  Share2,
  TextSelect,
} from 'lucide-react'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ToolId } from '../../types'

const ALL_TOOLS: {
  id: ToolId
  label: string
  icon: typeof TextSelect
}[] = [
  { id: 'summarize', label: 'Summarize', icon: TextSelect },
  { id: 'keypoints', label: 'Key Points', icon: ListTree },
  { id: 'compare', label: 'Compare Sources', icon: Scale },
  { id: 'explain', label: 'Explain', icon: FileSearch },
  { id: 'translate', label: 'Translate', icon: Globe },
  { id: 'mindmap', label: 'Mind Map', icon: Share2 },
]

export function ToolsPanel() {
  const { openTool, activeTool } = useWorkspace()

  return (
    <section className="panel tools-panel">
      <header className="panel__head">
        <h2>TOOLS</h2>
      </header>
      <div className="tools-grid">
        {ALL_TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              className={`tool-tile${activeTool === tool.id ? ' is-active' : ''}`}
              type="button"
              onClick={() => openTool(tool.id)}
            >
              <Icon size={20} strokeWidth={1.7} />
              {tool.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
