import type { ApiSource } from './api'

export type ViewId = 'chat' | 'library' | 'collections' | 'settings'
export type ThemeId = 'dark' | 'light'
export type ToolId = 'summarize' | 'keypoints' | 'compare' | 'explain' | 'translate' | 'mindmap'
export type ExplainLevel = 'Simple' | 'Detailed' | 'Technical'

// ── Live chat message ─────────────────────────────────────────────────────────
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources: ApiSource[]
  isLoading?: boolean
}

// ── Project / Chat ────────────────────────────────────────────────────────────
export type Project = {
  id: number
  name: string
  description: string
  created_at: string
}

export type ChatSession = {
  id: string          // session_id UUID
  title: string       // first user message truncated
  project_id: number
  created_at: string
}

// ── Source item (right rail) ──────────────────────────────────────────────────
export type SourceItem = {
  id: string
  number: number
  title: string
  page: number
  chunk: number
  iconTone: 'red' | 'purple' | 'teal' | 'gray'
  excerpt: string
}

// ── Library ───────────────────────────────────────────────────────────────────
export type DocumentItem = {
  id: string
  name: string
  pages: number
  chunks: number
  size: string
  collection: string
  uploaded: string
}

// ── Collections ───────────────────────────────────────────────────────────────
export type CollectionItem = {
  id: string
  name: string
  documents: number
  description: string
}

// ── Search ────────────────────────────────────────────────────────────────────
export type SearchHit = {
  id: string
  kind: 'Document' | 'Collection' | 'Conversation'
  title: string
  meta: string
}
