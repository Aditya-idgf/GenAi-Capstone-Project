import { useEffect, useRef, useState } from 'react'
import cytoscape, { type Core } from 'cytoscape'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Info,
  X,
  Loader2,
} from 'lucide-react'
import { fetchMindMap, type MindMapData, type MindMapNode } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'

const NODE_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  root:    { bg: '#0284c7', border: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)' },
  core:    { bg: '#7c3aed', border: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  concept: { bg: '#059669', border: '#34d399', glow: 'rgba(52, 211, 153, 0.4)' },
  detail:  { bg: '#d97706', border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)' },
}

export function InteractiveMindMap() {
  const {
    activeProjectId,
    selectedSourcesForQuery,
    selectedText,
    selectedSourceIds,
    activeSources,
  } = useWorkspace()

  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)

  const [data, setData] = useState<MindMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Load mind map from backend
  const loadGraph = async () => {
    if (activeProjectId === null) {
      setError('Please select an active project.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setSelectedNode(null)

    // Gather selected excerpts or text
    const selectedExcerpts = activeSources
      .filter((s) => selectedSourceIds.includes(`${s.title}-${s.page}-${s.chunk}`))
      .map((s) => s.excerpt)
    const contextText = selectedText || (selectedExcerpts.length > 0 ? selectedExcerpts.join('\n\n') : undefined)

    try {
      const res = await fetchMindMap({
        project_id: activeProjectId,
        filenames: selectedSourcesForQuery.length > 0 ? selectedSourcesForQuery : undefined,
        text: contextText,
      })
      setData(res)
    } catch (e: any) {
      setError(e.message || 'Failed to load mind map.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGraph()
  }, [activeProjectId, selectedSourcesForQuery.join(','), selectedText])

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || !data) return

    const elements = [
      ...data.nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          description: n.description,
          color: NODE_COLORS[n.type]?.bg || '#3b82f6',
          borderColor: NODE_COLORS[n.type]?.border || '#60a5fa',
          size: n.type === 'root' ? 52 : n.type === 'core' ? 42 : n.type === 'concept' ? 32 : 24,
        },
      })),
      ...data.edges.map((e, idx) => ({
        data: {
          id: `e-${idx}`,
          source: e.source,
          target: e.target,
          label: e.label,
        },
      })),
    ]

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      boxSelectionEnabled: false,
      autounselectify: false,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'border-width': 2,
            'border-color': 'data(borderColor)',
            'width': 'data(size)',
            'height': 'data(size)',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-family': 'Inter, system-ui, -apple-system, sans-serif',
            'font-size': '11px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-outline-color': '#0d1117',
            'text-outline-width': 2,
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'transition-property': 'background-color, border-color, width, height, opacity',
            'transition-duration': 200,
          },
        },
        {
          selector: 'node[type = "root"]',
          style: {
            'font-size': '13px',
            'font-weight': 700,
            'border-width': 3,
            'text-outline-width': 3,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#334155',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-margin-y': -6,
            'text-outline-color': '#0d1117',
            'text-outline-width': 1.5,
            'opacity': 0.75,
            'transition-property': 'line-color, opacity, width',
            'transition-duration': 200,
          },
        },
        {
          selector: '.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#ffffff',
            'opacity': 1,
            'z-index': 999,
          },
        },
        {
          selector: '.edge-highlighted',
          style: {
            'width': 2.5,
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'opacity': 1,
            'z-index': 998,
          },
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.15,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 800,
        nodeDimensionsIncludeLabels: true,
        fit: true,
        padding: 40,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: () => 450000,
        idealEdgeLength: () => 100,
        edgeElasticity: () => 100,
      } as any,
    })

    // Node click handler
    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      const nodeData = node.data()
      setSelectedNode({
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type,
        description: nodeData.description,
      })

      // Highlight neighborhood
      cy.batch(() => {
        cy.elements().removeClass('highlighted edge-highlighted faded')
        const neighborhood = node.neighborhood().add(node)
        cy.elements().difference(neighborhood).addClass('faded')
        node.addClass('highlighted')
        node.connectedEdges().addClass('edge-highlighted')
      })
    })

    // Background tap resets selection
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null)
        cy.batch(() => {
          cy.elements().removeClass('highlighted edge-highlighted faded')
        })
      }
    })

    cyRef.current = cy

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [data])

  // Search filter
  useEffect(() => {
    if (!cyRef.current) return
    const cy = cyRef.current
    if (!searchQuery.trim()) {
      cy.elements().removeClass('faded highlighted')
      return
    }

    const q = searchQuery.toLowerCase().trim()
    cy.batch(() => {
      const matching = cy.nodes().filter((n) => n.data('label').toLowerCase().includes(q))
      cy.elements().addClass('faded').removeClass('highlighted')
      matching.removeClass('faded').addClass('highlighted')
      matching.connectedEdges().removeClass('faded')
    })
  }, [searchQuery])

  // Zoom / Fit Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)
  const handleFit = () => cyRef.current?.fit(undefined, 40)
  const handleResetLayout = () => {
    const layout = cyRef.current?.layout({
      name: 'cose',
      animate: true,
      animationDuration: 600,
      fit: true,
      padding: 40,
    } as any)
    layout?.run()
  }

  return (
    <div
      className={`mindmap-graphify${isFullscreen ? ' is-fullscreen' : ''}`}
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '520px',
        zIndex: isFullscreen ? 9999 : 'auto',
        background: '#0d1117',
        borderRadius: isFullscreen ? 0 : '12px',
        border: isFullscreen ? 'none' : '1px solid #2a2f38',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Header & Interactive Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(22, 24, 29, 0.85)',
          borderBottom: '1px solid #2a2f38',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '13.5px', color: '#f8fafc', fontWeight: 600 }}>
              {data?.title || 'Interactive Knowledge Graph'}
            </h4>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {data ? `${data.nodes.length} Nodes • ${data.edges.length} Relationships` : 'Generating…'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Node Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '3px 8px',
              width: '160px',
            }}
          >
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder="Find concept…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '12px',
                width: '100%',
              }}
            />
          </div>

          <button
            type="button"
            className="icon-btn"
            title="Zoom In"
            onClick={handleZoomIn}
            style={{ width: 28, height: 28 }}
          >
            <ZoomIn size={15} />
          </button>

          <button
            type="button"
            className="icon-btn"
            title="Zoom Out"
            onClick={handleZoomOut}
            style={{ width: 28, height: 28 }}
          >
            <ZoomOut size={15} />
          </button>

          <button
            type="button"
            className="icon-btn"
            title="Center & Fit"
            onClick={handleFit}
            style={{ width: 28, height: 28 }}
          >
            <Maximize2 size={15} />
          </button>

          <button
            type="button"
            className="icon-btn"
            title="Re-run Physics Layout"
            onClick={handleResetLayout}
            style={{ width: 28, height: 28 }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            className="icon-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{ width: 28, height: 28 }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Main Cytoscape Canvas Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(13, 17, 23, 0.85)',
              zIndex: 20,
              gap: '12px',
            }}
          >
            <Loader2 size={32} className="spin" color="#38bdf8" />
            <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8' }}>
              Extracting concepts & building knowledge graph…
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0d1117',
              zIndex: 20,
              padding: '20px',
              textAlign: 'center',
              gap: '10px',
            }}
          >
            <Info size={28} color="#ef4444" />
            <p style={{ margin: 0, color: '#f8fafc', fontSize: '14px' }}>{error}</p>
            <button
              className="btn btn--primary"
              type="button"
              onClick={loadGraph}
              style={{ fontSize: '12px', padding: '6px 12px', marginTop: '8px' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Cytoscape Container */}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating Category Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'rgba(22, 24, 29, 0.8)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #2a2f38',
            borderRadius: '8px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10,
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
            Root Theme
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
            Core Pillars
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
            Concepts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
            Details
          </div>
        </div>

        {/* Selected Node Details Inspector Card */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: '280px',
              background: 'rgba(22, 24, 29, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${NODE_COLORS[selectedNode.type]?.border || '#38bdf8'}`,
              borderRadius: '10px',
              padding: '14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              zIndex: 15,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: NODE_COLORS[selectedNode.type]?.border || '#38bdf8',
                  }}
                >
                  {selectedNode.type}
                </span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#f8fafc', fontWeight: 600 }}>
                  {selectedNode.label}
                </h4>
              </div>
              <button
                type="button"
                className="icon-btn"
                style={{ width: 22, height: 22, border: 'none' }}
                onClick={() => {
                  setSelectedNode(null)
                  cyRef.current?.elements().removeClass('highlighted edge-highlighted faded')
                }}
              >
                <X size={13} />
              </button>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {selectedNode.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
