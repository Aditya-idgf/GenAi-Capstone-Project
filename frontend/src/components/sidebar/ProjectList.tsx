import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  MoreVertical,
  Plus,
  Trash2,
  FolderOpen,
  Pencil,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ApiProject, ApiChatSession } from '../../api'

// ── Inline rename input ───────────────────────────────────────────────────────
function InlineInput({
  value,
  onCommit,
  onCancel,
}: {
  value: string
  onCommit: (v: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(value)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  return (
    <input
      ref={ref}
      className="proj-inline-input"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit(text.trim() || value)
        if (e.key === 'Escape') onCancel()
      }}
      onBlur={() => onCommit(text.trim() || value)}
    />
  )
}

// ── Per-project row ───────────────────────────────────────────────────────────
function ProjectRow({ project }: { project: ApiProject }) {
  const {
    activeProjectId,
    setActiveProject,
    activeSessionId,
    openSession,
    startNewChat,
    sessions,
    loadSessions,
    renameProjectLocal,
    removeProject,
  } = useWorkspace()

  const isActive   = activeProjectId === project.id
  const expanded   = isActive
  const projSessions: ApiChatSession[] = sessions[project.id] ?? []

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [renaming,   setRenaming]   = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Load chats when project expands
  useEffect(() => {
    if (isActive) loadSessions(project.id)
  }, [isActive, project.id, loadSessions])

  const handleProjectClick = () => {
    setActiveProject(project.id)
    // If there are no chats yet, start one automatically
    if (!isActive) {
      // will load sessions; if empty, user can click + New Chat
    }
  }

  return (
    <div className="proj-group">
      {/* Project header row */}
      <div className={`proj-row${isActive ? ' is-active' : ''}`}>
        <button
          className="proj-row__main"
          type="button"
          onClick={handleProjectClick}
        >
          {expanded
            ? <ChevronDown size={13} strokeWidth={2} />
            : <ChevronRight size={13} strokeWidth={2} />
          }
          <FolderOpen size={15} strokeWidth={1.75} />
          {renaming ? (
            <InlineInput
              value={project.name}
              onCommit={(v) => { renameProjectLocal(project.id, v); setRenaming(false) }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <span className="proj-row__name">{project.name}</span>
          )}
        </button>

        {/* Context menu trigger */}
        <div className="proj-row__menu-wrap" ref={menuRef}>
          <button
            className="proj-row__more"
            type="button"
            aria-label="Project options"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
          >
            <MoreVertical size={14} strokeWidth={1.8} />
          </button>
          {menuOpen && (
            <div className="menu proj-menu">
              <button type="button" onClick={() => { setRenaming(true); setMenuOpen(false) }}>
                <Pencil size={13} strokeWidth={1.75} /> Rename
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => { removeProject(project.id); setMenuOpen(false) }}
              >
                <Trash2 size={13} strokeWidth={1.75} /> Delete project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat list under project */}
      {expanded && (
        <div className="proj-chats">
          {projSessions.map((sess) => (
            <ChatRow
              key={sess.id}
              session={sess}
              isActive={activeSessionId === sess.id}
              onOpen={() => openSession(sess)}
            />
          ))}

          {/* + New Chat button */}
          <button
            className="proj-new-chat"
            type="button"
            onClick={() => startNewChat(project.id)}
          >
            <Plus size={13} strokeWidth={2} />
            New Chat
          </button>
        </div>
      )}
    </div>
  )
}

// ── Per-chat row ──────────────────────────────────────────────────────────────
function ChatRow({
  session,
  isActive,
  onOpen,
}: {
  session: ApiChatSession
  isActive: boolean
  onOpen: () => void
}) {
  const { removeSession } = useWorkspace()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className={`chat-row${isActive ? ' is-active' : ''}`}>
      <button className="chat-row__main" type="button" onClick={onOpen}>
        <MessageSquare size={13} strokeWidth={1.75} />
        <span>{session.title}</span>
      </button>
      <div className="proj-row__menu-wrap" ref={menuRef}>
        <button
          className="proj-row__more"
          type="button"
          aria-label="Chat options"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
        >
          <MoreVertical size={13} strokeWidth={1.8} />
        </button>
        {menuOpen && (
          <div className="menu proj-menu">
            <button
              type="button"
              className="danger"
              onClick={() => { removeSession(session.id); setMenuOpen(false) }}
            >
              <Trash2 size={13} strokeWidth={1.75} /> Delete chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── New project modal ─────────────────────────────────────────────────────────
function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { addProject } = useWorkspace()
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await addProject(name.trim())
    onClose()
  }

  return (
    <div className="modal-root" role="dialog" aria-modal="true">
      <button className="scrim" type="button" onClick={onClose} />
      <div className="new-proj-modal">
        <h3>New Project</h3>
        <form onSubmit={submit}>
          <input
            ref={inputRef}
            className="new-proj-input"
            placeholder="Project name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="new-proj-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="send-btn" style={{ width: 'auto', padding: '0 16px' }}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ProjectList() {
  const { projects } = useWorkspace()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="proj-list">
      <div className="proj-list__head">
        <span className="nav__label" style={{ padding: 0 }}>PROJECTS</span>
        <button
          className="proj-list__add"
          type="button"
          aria-label="New project"
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="proj-list__body">
        {projects.length === 0 && (
          <p className="proj-list__empty">No projects yet. Create one to get started.</p>
        )}
        {projects.map((p) => (
          <ProjectRow key={p.id} project={p} />
        ))}
      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
