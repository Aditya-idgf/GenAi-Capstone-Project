import { useRef, useState } from 'react'
import { Conversation } from './chat/Conversation'
import { SourceViewer } from './chat/SourceViewer'
import { MessageComposer } from './composer/MessageComposer'
import { SearchModal } from './header/SearchModal'
import { ContextRail } from './rail/ContextRail'
import { Sidebar } from './sidebar/Sidebar'
import { ToastContainer } from './ui/ToastContainer'
import { CollectionsView } from './views/CollectionsView'
import { LibraryView } from './views/LibraryView'
import { SettingsView } from './views/SettingsView'
import { useWorkspace } from '../state/WorkspaceContext'

export function AppShell() {
  const { view, sidebarCollapsed, railCollapsed, openSourceIds, messages } = useWorkspace()
  const splitActive = openSourceIds.length > 0

  // Drag-to-resize state
  const containerRef = useRef<HTMLDivElement>(null)
  const [splitPercent, setSplitPercent] = useState(55) // chat takes 55% by default
  const [isDragging, setIsDragging] = useState(false)

  const gridCols = `${sidebarCollapsed ? '52px' : 'var(--sidebar-w)'} minmax(0,1fr) ${railCollapsed ? '52px' : 'var(--rail-w)'}`

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    setIsDragging(true)
    const rect = container.getBoundingClientRect()
    const onMove = (mv: MouseEvent) => {
      const pct = Math.min(80, Math.max(20, ((mv.clientX - rect.left) / rect.width) * 100))
      setSplitPercent(pct)
    }
    const onUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="shell" style={{ gridTemplateColumns: gridCols }}>
      <Sidebar />
      <main className="workspace">
        {view === 'chat' ? (
          <div
            className={`workspace__chat${splitActive ? ' is-split' : ''}`}
            ref={containerRef}
          >
            {/* Left: chat area */}
            <div
              className={`workspace__chat-pane${messages.length === 0 ? ' is-empty' : ''}`}
              style={splitActive ? { width: `${splitPercent}%` } : undefined}
            >
              <Conversation />
              <MessageComposer />
            </div>

            {/* Drag handle + right source pane */}
            {splitActive && (
              <>
                <div
                  className={`workspace__split-handle${isDragging ? ' is-dragging' : ''}`}
                  onMouseDown={startDrag}
                  title="Drag to resize"
                />
                <div
                  className="workspace__source-pane"
                  style={{ width: `${100 - splitPercent}%`, pointerEvents: isDragging ? 'none' : 'auto' }}
                >
                  <SourceViewer />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="workspace__page">
            {view === 'library'     && <LibraryView />}
            {view === 'collections' && <CollectionsView />}
            {view === 'settings'    && <SettingsView />}
          </div>
        )}
      </main>
      <ContextRail />
      <SearchModal />
      <ToastContainer />
    </div>
  )
}
