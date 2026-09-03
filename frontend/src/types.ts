export type ViewId = 'chat' | 'library' | 'collections' | 'history' | 'settings'

export type ThemeId = 'dark' | 'light'

export type ToolId =
  | 'summarize'
  | 'keypoints'
  | 'compare'
  | 'explain'
  | 'translate'
  | 'mindmap'

export type ExplainLevel = 'Simple' | 'Detailed' | 'Technical'

export type SourceItem = {
  id: string
  number: number
  title: string
  page: number
  chunk: number
  iconTone: 'red' | 'purple' | 'teal' | 'gray'
  excerpt: string
}

export type DocumentItem = {
  id: string
  name: string
  pages: number
  chunks: number
  size: string
  collection: string
  uploaded: string
}

export type CollectionItem = {
  id: string
  name: string
  documents: number
  description: string
}

export type HistoryItem = {
  id: string
  title: string
  collection: string
  time: string
  sources: number
}

export type SearchHit = {
  id: string
  kind: 'Document' | 'Collection' | 'Conversation'
  title: string
  meta: string
}
