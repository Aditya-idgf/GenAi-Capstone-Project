import { Bookmark, Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import mermaid from 'mermaid'
import { useEffect, useState } from 'react'
import { useWorkspace } from '../../state/WorkspaceContext'
import type { ChatMessage } from '../../types'

function preprocessMarkdown(content: string): string {
  if (!content) return ''
  let text = content
  // 1. Convert HTML <br> to newlines to prevent weird tags rendering
  text = text.replace(/<br\s*\/?>/gi, '\n')
  // 2. Convert citations like [filename.pdf] or [filename.pdf, Page X] to Markdown links
  text = text.replace(/\[([^\]]+\.pdf(?:,\s*Page\s*\d+)?)\]/gi, (match, p1) => {
    return `[${match}](#cite-${encodeURIComponent(p1)})`
  })
  // 3. Convert \[ ... \] to $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `\n$$\n${eq.trim()}\n$$\n`)
  // 4. Convert \( ... \) to $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq.trim()}$`)
  // 5. Convert standalone bracketed equations [ \text{...} ] to $$ ... $$
  text = text.replace(/(?:^|\n)\s*\[\s*(\\([a-zA-Z]+)[\s\S]*?)\s*\]\s*(?:\n|$)/g, (_, eq) => `\n$$\n${eq.trim()}\n$$\n`)
  return text
}

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
  const { setSelectedText, openSourceTab } = useWorkspace()

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
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            a({ node, href, children, ...props }: any) {
              if (href && href.startsWith('#cite-')) {
                const sourceName = decodeURIComponent(href.replace('#cite-', ''))
                const filename = sourceName.split(',')[0].trim() // ignore page num for tab opening
                return (
                  <button
                    type="button"
                    className="citation-pill"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--bg-app)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0 6px',
                      fontSize: '0.85em',
                      cursor: 'pointer',
                      margin: '0 2px',
                      fontFamily: 'monospace'
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      openSourceTab(filename)
                    }}
                    title={`View ${filename} in split pane`}
                  >
                    {children}
                  </button>
                )
              }
              return <a href={href} {...props}>{children}</a>
            },
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
          {preprocessMarkdown(message.content)}
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
