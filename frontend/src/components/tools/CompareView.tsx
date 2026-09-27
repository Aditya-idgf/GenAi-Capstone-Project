import { useEffect, useState } from 'react'
import {
  Scale,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRightLeft,
  Loader2,
  Search,
  Copy,
  Check,
} from 'lucide-react'
import {
  compareDocuments,
  fetchDocuments,
  type ApiDocument,
  type CompareResponse,
} from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'

export function CompareView() {
  const {
    activeProjectId,
    selectedSourcesForQuery,
    selectedSourceIds,
    activeSources,
  } = useWorkspace()

  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [docA, setDocA] = useState<string>('')
  const [docB, setDocB] = useState<string>('')
  const [focusTopic, setFocusTopic] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  // Load project docs
  useEffect(() => {
    if (activeProjectId === null) return
    fetchDocuments(activeProjectId)
      .then((d) => {
        setDocs(d)
        // Auto-select initial docs if available
        if (selectedSourcesForQuery.length >= 2) {
          setDocA(selectedSourcesForQuery[0])
          setDocB(selectedSourcesForQuery[1])
        } else if (d.length >= 2) {
          setDocA((prev) => prev || d[0].filename)
          setDocB((prev) => prev || d[1].filename)
        } else if (d.length === 1) {
          setDocA((prev) => prev || d[0].filename)
        }
      })
      .catch((err) => {
        console.error('Failed to load project docs for comparison:', err)
      })
  }, [activeProjectId, selectedSourcesForQuery])

  const handleCompare = async () => {
    if (activeProjectId === null) {
      setError('Please select an active project first.')
      return
    }
    if (!docA || !docB) {
      setError('Please select both Document A and Document B to compare.')
      return
    }
    if (docA === docB) {
      setError('Please select two different documents to compare.')
      return
    }

    setLoading(true)
    setError(null)

    // Pull selected excerpts for docA and docB if citations are checked
    const excerptsA = activeSources
      .filter((s) => s.title === docA && selectedSourceIds.includes(`${s.title}-${s.page}-${s.chunk}`))
      .map((s) => s.excerpt)
    const excerptsB = activeSources
      .filter((s) => s.title === docB && selectedSourceIds.includes(`${s.title}-${s.page}-${s.chunk}`))
      .map((s) => s.excerpt)

    try {
      const res = await compareDocuments({
        project_id: activeProjectId,
        doc_a: docA,
        doc_b: docB,
        focus: focusTopic.trim() || undefined,
        excerpts_a: excerptsA.length > 0 ? excerptsA : undefined,
        excerpts_b: excerptsB.length > 0 ? excerptsB : undefined,
      })
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'Comparison failed. Please verify documents and retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopySummary = () => {
    if (!result) return
    const text = `Document Comparison: ${result.doc_a_name} vs ${result.doc_b_name}\n\n` +
      `Summary:\n${result.executive_summary}\n\n` +
      `Matrix:\n${result.matrix.map((m) => `• ${m.dimension}: [${result.doc_a_name}]: ${m.doc_a_value} | [${result.doc_b_name}]: ${m.doc_b_value}`).join('\n')}\n\n` +
      `Consensus:\n${result.agreements.map((a) => `• ${a}`).join('\n')}\n\n` +
      `Divergences:\n${result.divergences.map((d) => `• ${d}`).join('\n')}`

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const swapDocs = () => {
    const temp = docA
    setDocA(docB)
    setDocB(temp)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Document Selection Control Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
          <Scale size={18} />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
            Compare Document Sources
          </h4>
        </div>

        {docs.length < 2 && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              fontSize: '12.5px',
              color: '#facc15',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>
              Upload at least 2 documents in your active project to run a full side-by-side comparison.
            </span>
          </div>
        )}

        {/* Source A vs Source B Selectors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {/* Doc A */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Source A (Base)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#0e1117', border: '1px solid #30363d', borderRadius: '8px', padding: '0 10px' }}>
              <FileText size={14} color="#38bdf8" style={{ marginRight: '8px', flexShrink: 0 }} />
              <select
                value={docA}
                onChange={(e) => setDocA(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '13px',
                  padding: '9px 0',
                  width: '100%',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" disabled>Select Document A…</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.filename} style={{ background: '#161b22', color: '#f8fafc' }}>
                    {d.filename}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            className="icon-btn"
            title="Swap Documents"
            onClick={swapDocs}
            style={{
              alignSelf: 'flex-end',
              marginBottom: '2px',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid #30363d',
              background: '#0e1117',
              color: '#94a3b8',
            }}
          >
            <ArrowRightLeft size={14} />
          </button>

          {/* Doc B */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Source B (Comparison)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#0e1117', border: '1px solid #30363d', borderRadius: '8px', padding: '0 10px' }}>
              <FileText size={14} color="#c084fc" style={{ marginRight: '8px', flexShrink: 0 }} />
              <select
                value={docB}
                onChange={(e) => setDocB(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '13px',
                  padding: '9px 0',
                  width: '100%',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" disabled>Select Document B…</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.filename} style={{ background: '#161b22', color: '#f8fafc' }}>
                    {d.filename}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Optional Focus Topic & Compare Action */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#0e1117',
              border: '1px solid #30363d',
              borderRadius: '8px',
              padding: '0 12px',
            }}
          >
            <Search size={14} color="#64748b" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Optional comparison focus (e.g. Performance, Methodology, Security)…"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '13px',
                padding: '9px 0',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            className="btn btn--primary"
            onClick={handleCompare}
            disabled={loading || !docA || !docB || docA === docB}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Compare Sources
              </>
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

      {/* Comparison Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Executive Summary Takeaway Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(192, 132, 252, 0.08) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '16px 20px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                <Sparkles size={15} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Executive Comparison Takeaway
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                title="Copy Summary"
                onClick={handleCopySummary}
                style={{ width: '26px', height: '26px' }}
              >
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#f1f5f9' }}>
              {result.executive_summary}
            </p>
          </div>

          {/* Side-by-Side Comparison Matrix Table */}
          <div
            style={{
              background: 'var(--panel-bg, #16181d)',
              border: '1px solid var(--border-color, #2a2f38)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color, #2a2f38)',
                background: '#0d1117',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                Structured Comparison Matrix
              </h4>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {result.matrix.length} Dimensions Analyzed
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
                    <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 600, width: '22%' }}>
                      Dimension
                    </th>
                    <th style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: 600, width: '34%' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', marginRight: 6 }} />
                      {result.doc_a_name}
                    </th>
                    <th style={{ padding: '10px 14px', color: '#c084fc', fontWeight: 600, width: '34%' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#c084fc', marginRight: 6 }} />
                      {result.doc_b_name}
                    </th>
                    <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 600, width: '10%' }}>
                      Takeaway
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.matrix.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx === result.matrix.length - 1 ? 'none' : '1px solid #21262d',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f8fafc', verticalAlign: 'top' }}>
                        {row.dimension}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1', lineHeight: 1.5, verticalAlign: 'top' }}>
                        {row.doc_a_value}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1', lineHeight: 1.5, verticalAlign: 'top' }}>
                        {row.doc_b_value}
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.takeaway}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agreements vs Divergences Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Agreements */}
            <div
              style={{
                background: 'var(--panel-bg, #16181d)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                <CheckCircle2 size={16} />
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                  Points of Consensus (Agreements)
                </h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.agreements.map((item, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Divergences */}
            <div
              style={{
                background: 'var(--panel-bg, #16181d)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
                <AlertCircle size={16} />
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
                  Points of Divergence (Key Contrasts)
                </h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.divergences.map((item, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
