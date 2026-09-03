import { Bookmark, Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import { PRINCIPLES } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'

export function AssistantResponse() {
  const { setSelectedText } = useWorkspace()

  return (
    <article
      className="a-card"
      onMouseUp={() => {
        const text = window.getSelection()?.toString().trim() ?? ''
        setSelectedText(text)
      }}
    >
      <p className="a-card__lead">
        Retrieval-Augmented Generation (RAG) combines the strengths of information retrieval
        and generative models to produce accurate, contextually relevant responses grounded in
        external knowledge sources. The key principles include:
      </p>

      <ol className="principles">
        {PRINCIPLES.map((item) => (
          <li key={item.n}>
            <span>{item.n}</span>
            <p>
              <strong>{item.title}:</strong> {item.body}
            </p>
          </li>
        ))}
      </ol>

      <p className="a-card__close">
        This approach helps reduce hallucinations and keeps the model outputs up-to-date with
        external knowledge.
      </p>

      <footer className="a-card__foot">
        <div className="a-card__meta">
          <time>10:42 PM</time>
          <span>•</span>
          <span>4 sources</span>
        </div>
        <div className="a-card__actions">
          <button type="button" aria-label="Copy" onClick={() => navigator.clipboard.writeText(document.querySelector('.a-card')?.textContent ?? '')}>
            <Copy size={16} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="Like">
            <ThumbsUp size={16} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="Dislike">
            <ThumbsDown size={16} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="Bookmark">
            <Bookmark size={16} strokeWidth={1.75} />
          </button>
        </div>
      </footer>
    </article>
  )
}
