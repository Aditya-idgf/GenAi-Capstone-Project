const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(detail || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Shared types ──────────────────────────────────────────────────────────────

export interface ApiSource {
  number: number
  title: string
  page: number
  chunk: number
  excerpt: string
  collection: string
  pages?: number[]
  excerpts?: string[]
}

export interface QueryResponse {
  answer: string
  sources: ApiSource[]
  session_id: string
}

export interface ApiMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources: string | null
}

export interface ApiDocument {
  id: number
  filename: string
  project_id: number
  collection: string
  pages: number
  chunks: number
  size_bytes: number
  uploaded_at: string
}

export interface ApiCollection {
  name: string
  documents: number
}

export interface KnowledgeStats {
  documents: number
  pages: number
  chunks: number
  storage_bytes: number
}

export interface ApiProject {
  id: number
  name: string
  description: string
  created_at: string
  document_count: number
  session_count: number
}

export interface ApiChatSession {
  id: string
  project_id: number
  title: string
  created_at: string
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function fetchProjects(): Promise<ApiProject[]> {
  return request('/projects')
}

export function createProject(name: string, description = ''): Promise<ApiProject> {
  return request('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
}

export function renameProject(id: number, name: string, description = ''): Promise<ApiProject> {
  return request(`/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
}

export function deleteProject(id: number): Promise<void> {
  return request(`/projects/${id}`, { method: 'DELETE' })
}

// ── Chat sessions ─────────────────────────────────────────────────────────────

export function fetchSessions(projectId: number): Promise<ApiChatSession[]> {
  return request(`/projects/${projectId}/sessions`)
}

export function deleteSession(sessionId: string): Promise<void> {
  return request(`/sessions/${sessionId}`, { method: 'DELETE' })
}

export function renameSession(sessionId: string, title: string): Promise<void> {
  return request(`/sessions/${sessionId}/title`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}

export function fetchHistory(sessionId: string): Promise<ApiMessage[]> {
  return request(`/history/${encodeURIComponent(sessionId)}`)
}

// ── Query ─────────────────────────────────────────────────────────────────────

export function sendQuery(payload: {
  session_id: string
  project_id: number
  question: string
  source_count?: number
  filenames?: string[]
}): Promise<QueryResponse> {
  return request('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// ── Documents ─────────────────────────────────────────────────────────────────

export function uploadDocument(projectId: number, file: File): Promise<ApiDocument> {
  const form = new FormData()
  form.append('file', file)
  return request(`/projects/${projectId}/upload`, { method: 'POST', body: form })
}

export function fetchDocuments(projectId: number): Promise<ApiDocument[]> {
  return request(`/projects/${projectId}/documents`)
}

export function deleteDocument(id: number): Promise<void> {
  return request(`/documents/${id}`, { method: 'DELETE' })
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function fetchProjectStats(projectId: number): Promise<KnowledgeStats> {
  return request(`/projects/${projectId}/stats`)
}

export function fetchStats(): Promise<KnowledgeStats> {
  return request('/stats')
}

// ── Collections ───────────────────────────────────────────────────────────────

export function fetchCollections(): Promise<ApiCollection[]> {
  return request('/collections')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parseSources(sourcesJson: string | null): ApiSource[] {
  if (!sourcesJson) return []
  try { return JSON.parse(sourcesJson) as ApiSource[] } catch { return [] }
}
