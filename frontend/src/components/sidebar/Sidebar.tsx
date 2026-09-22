import { Brand } from './Brand'
import { Navigation } from './Navigation'
import { ProfileCard } from './ProfileCard'
import { ProjectList } from './ProjectList'
import { useWorkspace } from '../../state/WorkspaceContext'

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useWorkspace()

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
      <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <Brand />
        <ProjectList />
        <Navigation />
        <div className="sidebar__foot">
          <ProfileCard />
        </div>
      </aside>
    </>
  )
}
