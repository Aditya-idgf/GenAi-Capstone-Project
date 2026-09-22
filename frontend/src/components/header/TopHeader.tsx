import { Loader2, Menu, PanelRight, Search, Sun, Upload } from 'lucide-react'
import { useRef } from 'react'
import { useWorkspace } from '../../state/WorkspaceContext'

export function TopHeader() {
  const {
    setSearchOpen,
    toggleTheme,
    setSidebarOpen,
    setRailOpen,
    activeProjectId,
    projects,
    uploadFile,
    isUploading,
  } = useWorkspace()

  const fileRef = useRef<HTMLInputElement>(null)
  const activeProject = projects.find((p) => p.id === activeProjectId)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    if (fileRef.current) fileRef.current.value = ''
  }

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
        {activeProject && (
          <span className="topbar__project">{activeProject.name}</span>
        )}
      </div>

      <div className="topbar__right">
        <button className="search-chip" type="button" onClick={() => setSearchOpen(true)}>
          <Search size={16} strokeWidth={1.8} />
          <span>Search anything...</span>
          <kbd>⌘ K</kbd>
        </button>

        <input
          ref={fileRef}
          className="sr-only"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={isUploading || activeProjectId === null}
        />
        <button
          className="topbar__upload-btn"
          type="button"
          disabled={isUploading || activeProjectId === null}
          title={activeProjectId === null ? 'Select a project first' : 'Upload PDF to project'}
          onClick={() => fileRef.current?.click()}
        >
          {isUploading
            ? <Loader2 size={15} strokeWidth={1.8} className="spin" />
            : <Upload size={15} strokeWidth={1.8} />
          }
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>

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
