import { Bookmark, Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { useEffect, useState } from 'react'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ChatMessage } from '../../types'

function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    if (chart) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' })
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
      mermaid.render(id, chart).then((result) => {
        setSvg(result.svg)
      }).catch((e) => {
        setSvg(`<div style="color:red">Error rendering chart: ${e.message}</div>`)
      })
    }
  }, [chart])

  return <div className="mermaid-wrapper" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }} dangerouslySetInnerHTML={{ __html: svg }} />
}

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
      {/* Render answer using react-markdown for proper formatting */}
      <div className="a-card__body markdown-body">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '')
              if (!inline && match && match[1] === 'mermaid') {
                return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
              }
              return !inline ? (
                <pre className={className}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {message.content}
        </ReactMarkdown>
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
