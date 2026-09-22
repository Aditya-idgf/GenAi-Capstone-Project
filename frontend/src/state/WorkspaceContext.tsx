import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  createProject,
  deleteProject,
  deleteSession,
  fetchHistory,
  fetchProjectStats,
  fetchProjects,
  fetchSessions,
  parseSources,
  renameProject,
  sendQuery,
  uploadDocument,
  type ApiChatSession,
  type ApiProject,
  type ApiSource,
  type KnowledgeStats,
} from '../api'
import type { ChatMessage, ExplainLevel, ThemeId, ToolId, ViewId } from '../types'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type WorkspaceContextValue = {
  view: ViewId
  setView: (v: ViewId) => void
  theme: ThemeId
  toggleTheme: () => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  railOpen: boolean
  setRailOpen: (open: boolean) => void
  railCollapsed: boolean
  setRailCollapsed: (v: boolean) => void
  projects: ApiProject[]
  activeProjectId: number | null
  setActiveProject: (id: number) => void
  addProject: (name: string) => Promise<void>
  renameProjectLocal: (id: number, name: string) => Promise<void>
  removeProject: (id: number) => Promise<void>
  sessions: Record<number, ApiChatSession[]>
  loadSessions: (projectId: number) => Promise<void>
  activeSessionId: string | null
  openSession: (sess: ApiChatSession) => void
  removeSession: (sessionId: string) => Promise<void>
  messages: ChatMessage[]
  isQuerying: boolean
  sendMessage: (text: string) => Promise<void>
  startNewChat: (projectId: number) => void
  composer: string
  setComposer: (v: string) => void
  sourceCount: number
  setSourceCount: (v: number) => void
  model: string
  setModel: (v: string) => void
  uploadFile: (file: File) => Promise<void>
  isUploading: boolean
  uploadError: string | null
  activeSources: ApiSource[]
  selectedSourceIds: string[]
  toggleSource: (id: string) => void
  selectedSourcesForQuery: string[]
  setSelectedSourcesForQuery: (v: string[]) => void
  openSourceIds: string[]          // tabs open in split pane
  activeSourceTabId: string | null // which tab is focused
  openSourceTab: (id: string) => void
  closeSourceTab: (id: string) => void
  setActiveSourceTab: (id: string) => void
  // Legacy compat — keeps SourcePreview working
  previewSourceId: string | null
  setPreviewSourceId: (id: string | null) => void
  stats: KnowledgeStats | null
  refreshStats: () => void
  activeTool: ToolId | null
  openTool: (tool: ToolId) => void
  closeTool: () => void
  selectedText: string
  setSelectedText: (v: string) => void
  explainLevel: ExplainLevel
  setExplainLevel: (l: ExplainLevel) => void
  translateLang: string
  setTranslateLang: (l: string) => void
  hintVisible: boolean
  dismissHint: () => void
  collection: string
  setCollection: (v: string) => void
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>('chat')
  const [theme, setTheme] = useState<ThemeId>('dark')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null)
  const [sessions, setSessions] = useState<Record<number, ApiChatSession[]>>({})
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isQuerying, setIsQuerying] = useState(false)
  const [composer, setComposer] = useState('')
  const [collection, setCollection] = useState('default')
  const [sourceCount, setSourceCount] = useState(4)
  const [model, setModel] = useState('llama-3.1-8b-instant')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [selectedSourcesForQuery, setSelectedSourcesForQuery] = useState<string[]>([])
  const [previewSourceId, setPreviewSourceId] = useState<string | null>(null)
  const [openSourceIds, setOpenSourceIds] = useState<string[]>([])
  const [activeSourceTabId, setActiveSourceTabId] = useState<string | null>(null)
  const [stats, setStats] = useState<KnowledgeStats | null>(null)
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [explainLevel, setExplainLevel] = useState<ExplainLevel>('Detailed')
  const [translateLang, setTranslateLang] = useState('Hindi')
  const [hintVisible, setHintVisible] = useState(true)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setActiveTool(null)
        setPreviewSourceId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    fetchProjects()
      .then((ps) => {
        setProjects(ps)
        if (ps.length > 0 && activeProjectId === null) {
          setActiveProjectId(ps[0].id)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshStats = useCallback(() => {
    if (activeProjectId === null) return
    fetchProjectStats(activeProjectId)
      .then(setStats)
      .catch(() => {})
  }, [activeProjectId])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = uuidv4()
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const activeSources: ApiSource[] = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].sources.length > 0) {
        return messages[i].sources
      }
    }
    return []
  })()

  const addProject = useCallback(
    async (name: string) => {
      try {
        const p = await createProject(name)
        setProjects((prev) => [...prev, p])
        setActiveProjectId(p.id)
        setSessions((prev) => ({ ...prev, [p.id]: [] }))
        setMessages([])
        setActiveSessionId(null)
        setOpenSourceIds([])
        setActiveSourceTabId(null)
        setSelectedSourceIds([])
        setSelectedSourcesForQuery([])
        setPreviewSourceId(null)
        setStats(null)
        setComposer('')
        setView('chat')
        showToast(`Project "${p.name}" created`, 'success')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to create project', 'error')
      }
    },
    [showToast],
  )

  const renameProjectLocal = useCallback(
    async (id: number, name: string) => {
      try {
        const updated = await renameProject(id, name)
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
        showToast(`Renamed project to "${updated.name}"`, 'success')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to rename project', 'error')
      }
    },
    [showToast],
  )

  const removeProject = useCallback(
    async (id: number) => {
      try {
        await deleteProject(id)
        setProjects((prev) => {
          const next = prev.filter((p) => p.id !== id)
          if (activeProjectId === id) {
            setActiveProjectId(next.length > 0 ? next[0].id : null)
          }
          return next
        })
        setSessions((prev) => {
          const n = { ...prev }
          delete n[id]
          return n
        })
        if (activeProjectId === id) {
          setActiveSessionId(null)
          setMessages([])
          setStats(null)
          setOpenSourceIds([])
          setActiveSourceTabId(null)
          setSelectedSourceIds([])
          setSelectedSourcesForQuery([])
          setPreviewSourceId(null)
          setComposer('')
        }
        showToast('Project deleted successfully', 'success')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to delete project', 'error')
      }
    },
    [activeProjectId, showToast],
  )

  const setActiveProject = useCallback(
    (id: number) => {
      if (id === activeProjectId) return
      setActiveProjectId(id)
      setActiveSessionId(null)
      setMessages([])
      setComposer('')
      setSelectedSourceIds([])
      setSelectedSourcesForQuery([])
      setOpenSourceIds([])
      setActiveSourceTabId(null)
      setPreviewSourceId(null)
      setSelectedText('')
      setActiveTool(null)
      setView('chat')
    },
    [activeProjectId],
  )

  const loadSessions = useCallback(async (projectId: number) => {
    try {
      const list = await fetchSessions(projectId)
      setSessions((prev) => ({ ...prev, [projectId]: list }))
    } catch {}
  }, [])

  const openSession = useCallback(async (sess: ApiChatSession) => {
    setActiveSessionId(sess.id)
    setMessages([])
    setComposer('')
    setSelectedSourceIds([])
    setActiveTool(null)
    setView('chat')
    try {
      const history = await fetchHistory(sess.id)
      const formatted: ChatMessage[] = history.map((m) => ({
        id: String(m.id),
        role: m.role,
        content: m.content,
        timestamp: '',
        sources: parseSources(m.sources),
      }))
      setMessages(formatted)
    } catch {}
  }, [])

  const removeSession = useCallback(
    async (sessionId: string) => {
      let nextSessionId: string | null = null
      setSessions((prev) => {
        const updated = { ...prev }
        for (const pid in updated) {
          const filtered = updated[Number(pid)].filter((s) => s.id !== sessionId)
          updated[Number(pid)] = filtered
          if (activeProjectId !== null && Number(pid) === activeProjectId && filtered.length > 0) {
            nextSessionId = filtered[0].id
          }
        }
        return updated
      })

      if (activeSessionId === sessionId) {
        if (nextSessionId) {
          setActiveSessionId(nextSessionId)
          fetchHistory(nextSessionId)
            .then((history) => {
              setMessages(
                history.map((m) => ({
                  id: String(m.id),
                  role: m.role,
                  content: m.content,
                  timestamp: '',
                  sources: parseSources(m.sources),
                })),
              )
            })
            .catch(() => setMessages([]))
        } else {
          setActiveSessionId(null)
          setMessages([])
        }
      }

      showToast('Chat deleted', 'info')

      // Fire-and-forget the API call; ignore 404 for optimistic sessions
      try {
        await deleteSession(sessionId)
      } catch {}
    },
    [activeSessionId, activeProjectId, showToast],
  )

  const uploadFile = useCallback(
    async (file: File) => {
      if (activeProjectId === null) {
        showToast('Please select or create a project first', 'error')
        return
      }
      setIsUploading(true)
      setUploadError(null)
      try {
        const doc = await uploadDocument(activeProjectId, file)
        refreshStats()
        // Refresh project list so document_count updates immediately
        fetchProjects().then(setProjects).catch(() => {})
        showToast(`Uploaded ${doc.filename} successfully`, 'success')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed'
        setUploadError(errorMsg)
        showToast(errorMsg, 'error')
      } finally {
        setIsUploading(false)
      }
    },
    [activeProjectId, refreshStats, showToast],
  )

  const startNewChat = useCallback((projectId: number) => {
    const newId = uuidv4()
    setActiveProjectId(projectId)
    setActiveSessionId(newId)
    setMessages([])
    setComposer('')
    setSelectedSourceIds([])
    setSelectedText('')
    setActiveTool(null)
    setView('chat')
    const optimistic: ApiChatSession = {
      id: newId,
      project_id: projectId,
      title: 'New Chat',
      created_at: new Date().toISOString(),
    }
    setSessions((prev) => ({
      ...prev,
      [projectId]: [optimistic, ...(prev[projectId] ?? [])],
    }))
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isQuerying) return
      if (activeProjectId === null) return

      let currentSessionId = activeSessionId
      if (!currentSessionId) {
        currentSessionId = uuidv4()
        setActiveSessionId(currentSessionId)
        const optimistic: ApiChatSession = {
          id: currentSessionId,
          project_id: activeProjectId,
          title: 'New Chat',
          created_at: new Date().toISOString(),
        }
        setSessions((prev) => ({
          ...prev,
          [activeProjectId]: [optimistic, ...(prev[activeProjectId] ?? [])],
        }))
      }

      const userMsg: ChatMessage = {
        id: uuidv4(), role: 'user',
        content: text.trim(), timestamp: nowTime(), sources: [],
      }
      const loadingMsg: ChatMessage = {
        id: uuidv4(), role: 'assistant',
        content: '', timestamp: nowTime(), sources: [], isLoading: true,
      }
      setMessages((prev) => [...prev, userMsg, loadingMsg])
      setIsQuerying(true)

      try {
        const res = await sendQuery({
          session_id: currentSessionId,
          project_id: activeProjectId,
          question: text.trim(),
          source_count: sourceCount,
          filenames: selectedSourcesForQuery.length > 0 ? selectedSourcesForQuery : undefined,
        })

        const assistantMsg: ChatMessage = {
          id: uuidv4(), role: 'assistant',
          content: res.answer, timestamp: nowTime(), sources: res.sources,
        }
        setMessages((prev) => [...prev.slice(0, -1), assistantMsg])

        setSessions((prev) => {
          const list = prev[activeProjectId] ?? []
          return {
            ...prev,
            [activeProjectId]: list.map((s) =>
              s.id === currentSessionId && s.title === 'New Chat'
                ? { ...s, title: text.trim().slice(0, 60) }
                : s,
            ),
          }
        })

        refreshStats()
      } catch (err) {
        const errMsg: ChatMessage = {
          id: uuidv4(), role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
          timestamp: nowTime(), sources: [],
        }
        setMessages((prev) => [...prev.slice(0, -1), errMsg])
      } finally {
        setIsQuerying(false)
      }
    },
    [isQuerying, activeProjectId, activeSessionId, sourceCount, selectedSourcesForQuery, refreshStats],
  )

  const openSourceTab = useCallback((id: string) => {
    setOpenSourceIds((prev) => prev.includes(id) ? prev : [...prev, id])
    setActiveSourceTabId(id)
  }, [])

  const closeSourceTab = useCallback((id: string) => {
    setOpenSourceIds((prev) => {
      const next = prev.filter((x) => x !== id)
      setActiveSourceTabId((cur) => {
        if (cur !== id) return cur
        return next.length > 0 ? next[next.length - 1] : null
      })
      return next
    })
  }, [])

  const toggleSource = useCallback((id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value: WorkspaceContextValue = {
    view, setView,
    theme, toggleTheme,
    searchOpen, setSearchOpen,
    sidebarOpen, setSidebarOpen,
    sidebarCollapsed, setSidebarCollapsed,
    railOpen, setRailOpen,
    railCollapsed, setRailCollapsed,
    projects, activeProjectId,
    setActiveProject, addProject, renameProjectLocal, removeProject,
    sessions, loadSessions,
    activeSessionId, openSession, removeSession,
    messages, isQuerying,
    sendMessage, startNewChat,
    composer, setComposer,
    collection, setCollection,
    sourceCount, setSourceCount,
    model, setModel,
    uploadFile, isUploading, uploadError,
    activeSources,
    selectedSourceIds, toggleSource,
    selectedSourcesForQuery, setSelectedSourcesForQuery,
    openSourceIds, activeSourceTabId,
    openSourceTab, closeSourceTab,
    setActiveSourceTab: setActiveSourceTabId,
    previewSourceId, setPreviewSourceId,
    stats, refreshStats,
    activeTool,
    openTool: setActiveTool,
    closeTool: () => setActiveTool(null),
    selectedText, setSelectedText,
    explainLevel, setExplainLevel,
    translateLang, setTranslateLang,
    hintVisible,
    dismissHint: () => setHintVisible(false),
    toasts, showToast, removeToast,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}

export function selectedSources(ids: string[]) {
  return ids.map((id, i) => ({
    id, number: i + 1, title: id, page: 0, chunk: 0, iconTone: 'gray' as const, excerpt: '',
  }))
}
