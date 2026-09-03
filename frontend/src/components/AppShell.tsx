import { Conversation } from './chat/Conversation'
import { MessageComposer } from './composer/MessageComposer'
import { SearchModal } from './header/SearchModal'
import { TopHeader } from './header/TopHeader'
import { ContextRail } from './rail/ContextRail'
import { Sidebar } from './sidebar/Sidebar'
import { CollectionsView } from './views/CollectionsView'
import { HistoryView } from './views/HistoryView'
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
            {view === 'library' && <LibraryView />}
            {view === 'collections' && <CollectionsView />}
            {view === 'history' && <HistoryView />}
            {view === 'settings' && <SettingsView />}
          </div>
        )}
      </main>
      <ContextRail />
      <SearchModal />
    </div>
  )
}
