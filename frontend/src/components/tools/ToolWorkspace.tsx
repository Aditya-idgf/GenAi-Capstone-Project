import { X } from 'lucide-react'
import { LANGUAGES, PRINCIPLES } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ToolId } from '../../types'

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

function Compare({ excerpts }: { excerpts: string[] }) {
  const pair = excerpts.slice(0, 2)
  if (pair.length < 2) {
    return <p>Select at least two sources to compare.</p>
  }
  return (
    <div className="compare">
      {pair.map((excerpt, i) => (
        <article key={i}>
          <h4>Source {i + 1}</h4>
          <p>{excerpt}</p>
        </article>
      ))}
    </div>
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

function Translate({ text }: { text: string }) {
  const { translateLang, setTranslateLang } = useWorkspace()
  const samples: Record<string, string> = {
    English: text,
    Hindi:
      'RAG पहले प्रासंगिक दस्तावेज़ अंश खोजता है, फिर उसी साक्ष्य के आधार पर उत्तर लिखता है।',
    Marathi:
      'RAG आधी संबंधित दस्तऐवज शोधते आणि नंतर त्या पुराव्यावर आधारित उत्तर तयार करते.',
    Spanish:
      'RAG recupera pasajes relevantes y genera la respuesta a partir de esa evidencia.',
    French:
      "RAG récupère d'abord les passages utiles, puis rédige la réponse à partir de ces preuves.",
    German:
      'RAG sucht zuerst passende Textstellen und erzeugt die Antwort aus diesem Belegkontext.',
  }
  return (
    <div>
      <label className="field">
        <span>Language</span>
        <select value={translateLang} onChange={(e) => setTranslateLang(e.target.value)}>
          {LANGUAGES.map((lang) => (
            <option key={lang}>{lang}</option>
          ))}
        </select>
      </label>
      <p>{samples[translateLang] ?? samples.English}</p>
    </div>
  )
}

function MindMap() {
  return (
    <div className="mindmap">
      <div className="mindmap__root">RAG</div>
      <ul>
        {PRINCIPLES.map((item) => (
          <li key={item.n}>
            <span>{item.n}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.body}</small>
            </div>
          </li>
        ))}
      </ul>
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
        {activeTool === 'compare'   && <Compare excerpts={selectedExcerpts} />}
        {activeTool === 'explain'   && <Explain />}
        {activeTool === 'translate' && <Translate text={text} />}
        {activeTool === 'mindmap'   && <MindMap />}
      </div>
    </div>
  )
}
