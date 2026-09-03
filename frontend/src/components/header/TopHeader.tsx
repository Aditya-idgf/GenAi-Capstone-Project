import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Menu, PanelRight, Plus, Search, Sun, Wrench } from 'lucide-react'
import { useWorkspace } from '../../state/WorkspaceContext'

export function TopHeader() {
  const {
    startNewChat,
    setSearchOpen,
    toggleTheme,
    setSidebarOpen,
    setRailOpen,
  } = useWorkspace()
  const [toolsOpen, setToolsOpen] = useState(false)
  const toolsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="icon-btn icon-btn--mobile"
          type="button"
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="topbar__right">
        <button className="search-chip" type="button" onClick={() => setSearchOpen(true)}>
          <Search size={16} strokeWidth={1.8} />
          <span>Search anything...</span>
          <kbd>⌘ K</kbd>
        </button>
        <button className="ghost-btn" type="button" onClick={startNewChat}>
          <Plus size={16} strokeWidth={1.8} />
          New Chat
        </button>
        <div className="tools-wrap" ref={toolsRef}>
          <button className="ghost-btn" type="button" onClick={() => setToolsOpen((v) => !v)}>
            <Wrench size={16} strokeWidth={1.8} />
            Tools
            <ChevronDown size={14} strokeWidth={1.8} />
          </button>
          {toolsOpen && (
            <div className="menu">
              <button type="button">Export conversation</button>
              <button type="button">Download sources</button>
              <button type="button">Clear composer</button>
            </div>
          )}
        </div>
        <button className="icon-btn" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
          <Sun size={18} strokeWidth={1.8} />
        </button>
        <button
          className="icon-btn icon-btn--mobile"
          type="button"
          aria-label="Open sources"
          onClick={() => setRailOpen(true)}
        >
          <PanelRight size={18} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  )
}
