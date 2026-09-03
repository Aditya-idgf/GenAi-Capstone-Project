import {
  FolderKanban,
  History,
  Library,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ViewId } from '../../types'

const MAIN_ITEMS = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'library' as const, label: 'Library', icon: Library },
  { id: 'collections' as const, label: 'Collections', icon: FolderKanban },
  { id: 'history' as const, label: 'History', icon: History },
]

export function Navigation() {
  const { view, setView, setSidebarOpen } = useWorkspace()

  const mainIndex = MAIN_ITEMS.findIndex((item) => item.id === view)
  const mainActive = mainIndex !== -1
  const settingsActive = view === 'settings'

  const go = (id: ViewId) => {
    setView(id)
    setSidebarOpen(false)
  }

  return (
    <nav className="nav" aria-label="Main">
      <p className="nav__label">MAIN</p>
      <div className="nav__list">
        {mainActive && (
          <span
            className="nav__indicator"
            style={{ transform: `translateY(${mainIndex * 46}px)` }}
          />
        )}
        {MAIN_ITEMS.map((item) => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button
              key={item.id}
              className={`nav__item${active ? ' is-active' : ''}`}
              type="button"
              onClick={() => go(item.id)}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="nav__rule" />
      <p className="nav__label">SETTINGS</p>
      <div className="nav__list nav__list--settings">
        {settingsActive && (
          <span className="nav__indicator" style={{ transform: 'translateY(0)' }} />
        )}
        <button
          className={`nav__item${settingsActive ? ' is-active' : ''}`}
          type="button"
          onClick={() => go('settings')}
        >
          <Settings size={18} strokeWidth={1.75} />
          Settings
        </button>
      </div>
    </nav>
  )
}
