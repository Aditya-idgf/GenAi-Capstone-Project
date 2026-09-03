import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { COLLECTIONS, SOURCES } from '../data'
import type { ExplainLevel, ThemeId, ToolId, ViewId } from '../types'

type WorkspaceContextValue = {
  view: ViewId
  setView: (view: ViewId) => void
  theme: ThemeId
  toggleTheme: () => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  collection: string
  setCollection: (value: string) => void
  sourceCount: number
  setSourceCount: (value: number) => void
  model: string
  setModel: (value: string) => void
  selectedSourceIds: string[]
  toggleSource: (id: string) => void
  selectedText: string
  setSelectedText: (value: string) => void
  activeTool: ToolId | null
  openTool: (tool: ToolId) => void
  closeTool: () => void
  explainLevel: ExplainLevel
  setExplainLevel: (level: ExplainLevel) => void
  translateLang: string
  setTranslateLang: (lang: string) => void
  hintVisible: boolean
  dismissHint: () => void
  previewSourceId: string | null
  setPreviewSourceId: (id: string | null) => void
  conversationTitle: string
  startNewChat: () => void
  composer: string
  setComposer: (value: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  railOpen: boolean
  setRailOpen: (open: boolean) => void
  visibleTools: ToolId[]
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>('chat')
  const [theme, setTheme] = useState<ThemeId>('dark')
  const [searchOpen, setSearchOpen] = useState(false)
  const [collection, setCollection] = useState(COLLECTIONS[0].name)
  const [sourceCount, setSourceCount] = useState(8)
  const [model, setModel] = useState('Llama 3.1 8B')
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [selectedText, setSelectedText] = useState('')
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [explainLevel, setExplainLevel] = useState<ExplainLevel>('Detailed')
  const [translateLang, setTranslateLang] = useState('Hindi')
  const [hintVisible, setHintVisible] = useState(true)
  const [previewSourceId, setPreviewSourceId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState('New Conversation')
  const [composer, setComposer] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [railOpen, setRailOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setActiveTool(null)
        setPreviewSourceId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const toggleSource = useCallback((id: string) => {
    setSelectedSourceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  const visibleTools = useMemo<ToolId[]>(() => {
    const count = selectedSourceIds.length
    if (count === 1) {
      return ['summarize', 'keypoints', 'explain', 'translate', 'mindmap']
    }
    if (count >= 2) {
      return ['summarize', 'keypoints', 'compare', 'translate', 'mindmap']
    }
    return ['summarize', 'keypoints', 'compare', 'explain', 'translate', 'mindmap']
  }, [selectedSourceIds.length])

  const value: WorkspaceContextValue = {
    view,
    setView,
    theme,
    toggleTheme,
    searchOpen,
    setSearchOpen,
    collection,
    setCollection,
    sourceCount,
    setSourceCount,
    model,
    setModel,
    selectedSourceIds,
    toggleSource,
    selectedText,
    setSelectedText,
    activeTool,
    openTool: setActiveTool,
    closeTool: () => setActiveTool(null),
    explainLevel,
    setExplainLevel,
    translateLang,
    setTranslateLang,
    hintVisible,
    dismissHint: () => setHintVisible(false),
    previewSourceId,
    setPreviewSourceId,
    conversationTitle,
    startNewChat: () => {
      setConversationTitle('New Conversation')
      setView('chat')
      setComposer('')
      setSelectedSourceIds([])
      setSelectedText('')
      setActiveTool(null)
    },
    composer,
    setComposer,
    sidebarOpen,
    setSidebarOpen,
    railOpen,
    setRailOpen,
    visibleTools,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider')
  }
  return context
}

export function selectedSources(ids: string[]) {
  return SOURCES.filter((source) => ids.includes(source.id))
}
