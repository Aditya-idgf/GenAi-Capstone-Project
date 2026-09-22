import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Brand } from './Brand'
import { ProfileCard } from './ProfileCard'
import { ProjectList } from './ProjectList'
import { useWorkspace } from '../../state/WorkspaceContext'

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useWorkspace()

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
        {!sidebarCollapsed && (
          <>
            <Brand />
            <ProjectList />
          </>
        )}
        {/* Collapse button always at bottom */}
        <div className="sidebar__foot">
          {!sidebarCollapsed && <ProfileCard />}
          <div className="sidebar__collapse-btn-wrap">
            <button
              className="sidebar__collapse-btn"
              type="button"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed
                ? <PanelLeftOpen size={16} strokeWidth={1.75} />
                : <PanelLeftClose size={16} strokeWidth={1.75} />
              }
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
