import { X } from 'lucide-react'
import { PRINCIPLES } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ToolId } from '../../types'
import { CompareView } from './CompareView'
import { InteractiveMindMap } from './InteractiveMindMap'
import { TranslateView } from './TranslateView'

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

function KeyPoints() {
  return (
    <ul className="result-list">
      {PRINCIPLES.map((item) => (
        <li key={item.n}>
          <span>{item.n}</span>
          <p>
            <strong>{item.title}: </strong>
            {item.body}
          </p>
        </li>
      ))}
    </ul>
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
  if (!activeTool) return null

  const selectedExcerpts = activeSources
    .filter((s) => selectedSourceIds.includes(`${s.title}-${s.page}-${s.chunk}`))
    .map((s) => s.excerpt)

  const text = workingText(selectedText, selectedExcerpts)

  return (
    <div className="sheet">
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
      <div className="sheet__body">
        {activeTool === 'summarize' && <Summary text={text} />}
        {activeTool === 'keypoints' && <KeyPoints />}
        {activeTool === 'compare'   && <CompareView />}
        {activeTool === 'explain'   && <Explain />}
        {activeTool === 'translate' && <TranslateView initialText={text} />}
        {activeTool === 'mindmap'   && <InteractiveMindMap />}
      </div>
    </div>
  )
}
