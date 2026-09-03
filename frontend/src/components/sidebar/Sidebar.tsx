import { Brand } from './Brand'
import { KnowledgeOverview } from './KnowledgeOverview'
import { Navigation } from './Navigation'
import { ProfileCard } from './ProfileCard'
import { UploadButton } from './UploadButton'
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
        <UploadButton />
        <Navigation />
        <div className="sidebar__foot">
          <KnowledgeOverview />
          <ProfileCard />
        </div>
      </aside>
    </>
  )
}
