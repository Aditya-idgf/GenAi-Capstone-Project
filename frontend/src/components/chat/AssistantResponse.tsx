import { Bookmark, Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ChatMessage } from '../../types'

function LoadingDots() {
  return (
    <div className="a-card__loading">
      <span />
      <span />
      <span />
    </div>
  )
}

export function AssistantResponse({ message }: { message: ChatMessage }) {
  const { setSelectedText } = useWorkspace()

  if (message.isLoading) {
    return (
      <article className="a-card">
        <LoadingDots />
      </article>
    )
  }

  return (
    <article
      className="a-card"
      onMouseUp={() => {
        const text = window.getSelection()?.toString().trim() ?? ''
        setSelectedText(text)
      }}
    >
      {/* Render answer — preserve newlines */}
      <div className="a-card__body">
        {message.content.split('\n').map((line, i) => (
          <p key={i} className="a-card__para">
            {line || <br />}
          </p>
        ))}
      </div>

      <footer className="a-card__foot">
        <div className="a-card__meta">
          <time>{message.timestamp}</time>
          {message.sources.length > 0 && (
            <>
              <span>•</span>
              <span>{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>
        <div className="a-card__actions">
          <button
            type="button"
            aria-label="Copy"
            onClick={() => navigator.clipboard.writeText(message.content)}
          >
            <Copy size={15} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="Like">
            <ThumbsUp size={15} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="Dislike">
            <ThumbsDown size={15} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="Bookmark">
            <Bookmark size={15} strokeWidth={1.75} />
          </button>
        </div>
      </footer>
    </article>
  )
}
