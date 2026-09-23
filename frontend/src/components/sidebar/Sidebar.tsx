import {
  FolderKanban,
  FolderOpen,
  Library,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from 'lucide-react'
import { HexLogo } from '../icons/HexLogo'
import { Brand } from './Brand'
import { Navigation } from './Navigation'
import { ProfileCard } from './ProfileCard'
import { ProjectList } from './ProjectList'
import { useWorkspace } from '../../state/WorkspaceContext'

export function Sidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    view,
    setView,
    projects,
    activeProjectId,
    setActiveProject,
    startNewChat,
  } = useWorkspace()

  return (
    <>
      {sidebarOpen && (
        <button
          className="scrim"
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`sidebar${sidebarOpen ? ' is-open' : ''}${sidebarCollapsed ? ' is-collapsed' : ''}`}
      >
        {sidebarCollapsed ? (
          <div className="sidebar-collapsed">
            {/* DocuMind Logo */}
            <button
              className="sidebar-collapsed__icon-btn"
              type="button"
              title="DocuMind - Expand sidebar"
              onClick={() => setSidebarCollapsed(false)}
              style={{ width: '36px', height: '36px', marginBottom: '4px' }}
            >
              <HexLogo />
            </button>

            {/* New Chat Button */}
            <button
              className="sidebar-collapsed__icon-btn new-chat-btn"
              type="button"
              title="New Chat"
              onClick={() => {
                if (activeProjectId !== null) startNewChat(activeProjectId)
                setView('chat')
              }}
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>

            <div className="sidebar-collapsed__divider" />

            {/* Main Navigation Views */}
            <button
              className={`sidebar-collapsed__icon-btn${view === 'chat' ? ' is-active' : ''}`}
              type="button"
              title="Chat"
              onClick={() => setView('chat')}
            >
              <MessageSquare size={17} strokeWidth={1.8} />
            </button>

            <button
              className={`sidebar-collapsed__icon-btn${view === 'library' ? ' is-active' : ''}`}
              type="button"
              title="Library"
              onClick={() => setView('library')}
            >
              <Library size={17} strokeWidth={1.8} />
            </button>

            <button
              className={`sidebar-collapsed__icon-btn${view === 'collections' ? ' is-active' : ''}`}
              type="button"
              title="Collections"
              onClick={() => setView('collections')}
            >
              <FolderKanban size={17} strokeWidth={1.8} />
            </button>

            <button
              className={`sidebar-collapsed__icon-btn${view === 'settings' ? ' is-active' : ''}`}
              type="button"
              title="Settings"
              onClick={() => setView('settings')}
            >
              <Settings size={17} strokeWidth={1.8} />
            </button>

            {/* Projects */}
            {projects.length > 0 && (
              <>
                <div className="sidebar-collapsed__divider" />
                <div className="sidebar-collapsed__projects">
                  {projects.map((p) => {
                    const isCurrent = p.id === activeProjectId
                    return (
                      <button
                        key={p.id}
                        className={`sidebar-collapsed__icon-btn${isCurrent ? ' is-active' : ''}`}
                        type="button"
                        title={`Project: ${p.name}`}
                        onClick={() => {
                          setActiveProject(p.id)
                          setView('chat')
                        }}
                      >
                        <FolderOpen size={16} strokeWidth={1.8} />
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div style={{ flex: 1 }} />

            {/* Expand sidebar button at bottom */}
            <button
              className="sidebar-collapsed__icon-btn expand-btn"
              type="button"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={() => setSidebarCollapsed(false)}
            >
              <PanelLeftOpen size={18} strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <>
            <Brand />
            <Navigation />
            <ProjectList />
            <div className="sidebar__foot">
              <ProfileCard />
              <div className="sidebar__collapse-btn-wrap">
                <button
                  className="sidebar__collapse-btn"
                  type="button"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <PanelLeftClose size={16} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
