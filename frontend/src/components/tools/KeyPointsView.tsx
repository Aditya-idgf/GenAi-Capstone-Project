import { useEffect, useState } from 'react'
import { Sparkles, AlertCircle, Loader2, ListTree, Copy, Check } from 'lucide-react'
import { extractKeyPoints } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'
import { globalToolCache } from '../../state/ToolCache'
import ReactMarkdown from 'react-markdown'

export function KeyPointsView() {
  const {
    activeProjectId,
    selectedSourcesForQuery,
    selectedSourceIds,
    activeSources,
    selectedText,
    activeSessionId,
  } = useWorkspace()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [markdownResult, setMarkdownResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  // Cache restore & save
  useEffect(() => {
    if (!activeSessionId) return
    const cacheKey = `keypoints_${activeSessionId}`
    const cached = globalToolCache[cacheKey]
    if (cached) {
      setMarkdownResult(cached.markdownResult)
      setHasTriggered(cached.hasTriggered)
    } else {
      setMarkdownResult(null)
      setHasTriggered(false)
    }
  }, [activeSessionId])

  useEffect(() => {
    if (activeSessionId) {
      globalToolCache[`keypoints_${activeSessionId}`] = { markdownResult, hasTriggered }
    }
  }, [markdownResult, hasTriggered, activeSessionId])

  const handleExtract = async () => {
    if (activeProjectId === null) {
      setError('Please select an active project.')
      return
    }

    setLoading(true)
    setError(null)
    setHasTriggered(true)

    // Gather text
    const selectedExcerpts = activeSources
      .filter((s) => selectedSourceIds.includes(s.title + '-' + s.page + '-' + s.chunk))
      .map((s) => s.excerpt)
    const contextText = selectedText || (selectedExcerpts.length > 0 ? selectedExcerpts.join('\n\n') : undefined)

    try {
      const res = await extractKeyPoints({
        project_id: activeProjectId,
        filenames: selectedSourcesForQuery.length > 0 ? selectedSourcesForQuery : undefined,
        text: contextText,
      })
      setMarkdownResult(res.markdown_content)
    } catch (err: any) {
      setError(err.message || 'Failed to extract key points.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-extract once on mount
  useEffect(() => {
    if (!hasTriggered && activeProjectId !== null) {
      handleExtract()
    }
  }, [activeProjectId, hasTriggered])

  const handleCopy = () => {
    if (markdownResult) {
      navigator.clipboard.writeText(markdownResult)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--panel-bg, #16181d)',
          border: '1px solid var(--border-color, #2a2f38)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
            <ListTree size={18} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
              Structured Key Points
            </h4>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleExtract}
            disabled={loading}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? (
              <><Loader2 size={13} className="spin" /> Extracting...</>
            ) : (
              <><Sparkles size={13} /> Re-run Extraction</>
            )}
          </button>
        </div>

        {error && (
          <div style={{ color: '#f87171', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Container */}
      <div
        style={{
          flex: 1,
          background: 'var(--panel-bg, #16181d)',
          border: '1px solid var(--border-color, #2a2f38)',
          borderRadius: '12px',
          padding: '24px',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {loading && !markdownResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#94a3b8' }}>
            <Loader2 size={32} className="spin" color="#10b981" />
            <span style={{ fontSize: '14px' }}>Structuring critical points...</span>
          </div>
        ) : markdownResult ? (
          <>
            <button
              type="button"
              className="icon-btn"
              title="Copy Key Points"
              onClick={handleCopy}
              style={{ position: 'absolute', top: 12, right: 12, width: '30px', height: '30px', background: 'var(--bg-app)' }}
            >
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            </button>
            <div className="markdown-body" style={{ color: '#f8fafc', fontSize: '14px', lineHeight: 1.6 }}>
              <ReactMarkdown>{markdownResult}</ReactMarkdown>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
            No key points extracted yet.
          </div>
        )}
      </div>
    </div>
  )
}
