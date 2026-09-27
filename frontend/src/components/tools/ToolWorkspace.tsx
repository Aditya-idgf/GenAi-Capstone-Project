import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { PRINCIPLES } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ToolId } from '../../types'
import { CompareView } from './CompareView'
import { InteractiveMindMap } from './InteractiveMindMap'
import { TranslateView } from './TranslateView'
import { KeyPointsView } from './KeyPointsView'

const TITLES: Record<ToolId, string> = {
  summarize: 'Summarize',
  keypoints: 'Key Points',
  compare:   'Compare Sources',
  explain:   'Explain',
  translate: 'Translate',
  mindmap:   'Mind Map',
}

function workingText(selectedText: string, excerpts: string[]) {
  if (selectedText) return selectedText
  if (excerpts.length) return excerpts.join(' ')
  return PRINCIPLES.map((p) => `${p.title}: ${p.body}`).join(' ')
}

function Summary({ text }: { text: string }) {
  return (
    <p>
      Condensed from the current selection: RAG retrieves evidence first, injects that evidence
      into the prompt, generates an answer from the combined context, and keeps every claim
      traceable to a source. {text.slice(0, 180)}
    </p>
  )
}

function Explain() {
  const { explainLevel, setExplainLevel } = useWorkspace()
  const copy = {
    Simple:
      'RAG looks up the right pages in your files, then writes an answer using those pages so it is less likely to invent facts.',
    Detailed:
      'The retriever scores chunks against the question, the highest-ranked passages are appended to the prompt, and the generator must stay consistent with that evidence.',
    Technical:
      'Query and document encoders produce dense vectors; top-k ANN hits become context tokens. Generation is a conditional LM P(y | q, C).',
  }
  return (
    <div>
      <div className="seg">
        {(['Simple', 'Detailed', 'Technical'] as const).map((level) => (
          <button
            key={level}
            className={explainLevel === level ? 'is-active' : ''}
            type="button"
            onClick={() => setExplainLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>
      <p>{copy[explainLevel]}</p>
    </div>
  )
}

export function ToolWorkspace() {
  const { activeTool, closeTool, selectedText, selectedSourceIds, activeSources } = useWorkspace()
  const [mountedTools, setMountedTools] = useState<Set<ToolId>>(new Set())

  useEffect(() => {
    if (activeTool) {
      setMountedTools((prev) => {
        if (prev.has(activeTool)) return prev
        const next = new Set(prev)
        next.add(activeTool)
        return next
      })
    }
  }, [activeTool])

  // Clear mounted tools if we fully close the workspace
  useEffect(() => {
    if (!activeTool) {
      setMountedTools(new Set())
    }
  }, [activeTool])

  if (!activeTool) return null

  const selectedExcerpts = activeSources
    .filter((s) => selectedSourceIds.includes(`${s.title}-${s.page}-${s.chunk}`))
    .map((s) => s.excerpt)

  const text = workingText(selectedText, selectedExcerpts)

  return (
    <div className="sheet" style={{ display: 'flex', flexDirection: 'column' }}>
      <header>
        <div>
          <p className="eyebrow">Tool</p>
          <h3>{TITLES[activeTool]}</h3>
          <p className="muted">
            {selectedText
              ? 'Operating on selected answer text'
              : selectedSourceIds.length
                ? `Operating on ${selectedSourceIds.length} selected source${selectedSourceIds.length > 1 ? 's' : ''}`
                : 'Operating on the current answer'}
          </p>
        </div>
        <button className="icon-btn" type="button" onClick={closeTool} aria-label="Close tool">
          <X size={16} strokeWidth={1.8} />
        </button>
      </header>
      <div className="sheet__body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {mountedTools.has('summarize') && (
          <div style={{ display: activeTool === 'summarize' ? 'block' : 'none' }}>
            <Summary text={text} />
          </div>
        )}
        {mountedTools.has('keypoints') && (
          <div style={{ display: activeTool === 'keypoints' ? 'block' : 'none', height: '100%' }}>
            <KeyPointsView />
          </div>
        )}
        {mountedTools.has('compare') && (
          <div style={{ display: activeTool === 'compare' ? 'block' : 'none', height: '100%' }}>
            <CompareView />
          </div>
        )}
        {mountedTools.has('explain') && (
          <div style={{ display: activeTool === 'explain' ? 'block' : 'none' }}>
            <Explain />
          </div>
        )}
        {mountedTools.has('translate') && (
          <div style={{ display: activeTool === 'translate' ? 'block' : 'none', height: '100%' }}>
            <TranslateView initialText={text} />
          </div>
        )}
        {mountedTools.has('mindmap') && (
          <div style={{ display: activeTool === 'mindmap' ? 'block' : 'none', height: '100%' }}>
            <InteractiveMindMap />
          </div>
        )}
      </div>
    </div>
  )
}
