import { Conversation } from './chat/Conversation'
import { MessageComposer } from './composer/MessageComposer'
import { SearchModal } from './header/SearchModal'
import { TopHeader } from './header/TopHeader'
import { ContextRail } from './rail/ContextRail'
import { Sidebar } from './sidebar/Sidebar'
import { ToastContainer } from './ui/ToastContainer'
import { CollectionsView } from './views/CollectionsView'
import { LibraryView } from './views/LibraryView'
import { SettingsView } from './views/SettingsView'
import { useWorkspace } from '../state/WorkspaceContext'

export function AppShell() {
  const { view } = useWorkspace()

  return (
    <div className="shell">
      <Sidebar />
      <main className="workspace">
        <TopHeader />
        {view === 'chat' ? (
          <div className="workspace__chat">
            <Conversation />
            <MessageComposer />
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
