import { useEffect, useRef, useState, useMemo } from 'react'
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
  ChevronRight,
  Compass,
  Layers,
} from 'lucide-react'
import { fetchMindMap, type MindMapData, type MindMapNode } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'
import { globalToolCache } from '../../state/ToolCache'

const NODE_CONFIG: Record<
  string,
  {
    bgStops: string
    border: string
    glow: string
    size: number
    labelSize: string
    badgeColor: string
    displayName: string
  }
> = {
  root: {
    bgStops: '#67e8f9 #0284c7 #0f172a',
    border: '#38bdf8',
    glow: '#00f2fe',
    size: 56,
    labelSize: '12px',
    badgeColor: '#38bdf8',
    displayName: 'Root Theme',
  },
  core: {
    bgStops: '#d8b4fe #8b5cf6 #1e1b4b',
    border: '#c084fc',
    glow: '#a855f7',
    size: 42,
    labelSize: '11px',
    badgeColor: '#c084fc',
    displayName: 'Core Pillar',
  },
  concept: {
    bgStops: '#6ee7b7 #10b981 #064e3b',
    border: '#34d399',
    glow: '#34d399',
    size: 32,
    labelSize: '10.5px',
    badgeColor: '#34d399',
    displayName: 'Concept',
  },
  detail: {
    bgStops: '#fde68a #f59e0b #451a03',
    border: '#fbbf24',
    glow: '#fbbf24',
    size: 24,
    labelSize: '10px',
    badgeColor: '#fbbf24',
    displayName: 'Detail',
  },
}

export function InteractiveMindMap() {
  const {
    activeProjectId,
    selectedSourcesForQuery,
    selectedText,
    selectedSourceIds,
    activeSources,
    activeSessionId,
  } = useWorkspace()

  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)

  const [data, setData] = useState<MindMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Cache restore & save
  useEffect(() => {
    if (!activeSessionId) return
    const cacheKey = `mindmap_${activeSessionId}`
    const cached = globalToolCache[cacheKey]
    if (cached) {
      setData(cached.data)
      setLoading(false)
    } else {
      setData(null)
      setLoading(true) // will be overridden by initial load logic if we auto-load, but let's let the user press "Generate" or auto-load if it does that. Wait, the mind map auto-loads on mount!
    }
  }, [activeSessionId])

  useEffect(() => {
    if (activeSessionId && data) {
      globalToolCache[`mindmap_${activeSessionId}`] = { data }
    }
  }, [data, activeSessionId])

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
    // If we just restored from cache and haven't intentionally changed query parameters, skip auto-load
    const cacheKey = `mindmap_${activeSessionId}`
    if (globalToolCache[cacheKey] && globalToolCache[cacheKey].data) {
       return
    }
    loadGraph()
  }, [activeProjectId, selectedSourcesForQuery.join(','), selectedText, activeSessionId])

  // Get connected relations for selected node
  const connectedRelations = useMemo(() => {
    if (!selectedNode || !data) return []
    const rels: { id: string; targetId: string; targetLabel: string; type: string; relation: string; direction: 'outgoing' | 'incoming' }[] = []

    data.edges.forEach((e, idx) => {
      if (e.source === selectedNode.id) {
        const targetNode = data.nodes.find((n) => n.id === e.target)
        if (targetNode) {
          rels.push({
            id: `rel-${idx}`,
            targetId: targetNode.id,
            targetLabel: targetNode.label,
            type: targetNode.type,
            relation: e.label || 'connects to',
            direction: 'outgoing',
          })
        }
      } else if (e.target === selectedNode.id) {
        const sourceNode = data.nodes.find((n) => n.id === e.source)
        if (sourceNode) {
          rels.push({
            id: `rel-${idx}`,
            targetId: sourceNode.id,
            targetLabel: sourceNode.label,
            type: sourceNode.type,
            relation: e.label || 'connected by',
            direction: 'incoming',
          })
        }
      }
    })

    return rels
  }, [selectedNode, data])

  // Initialize Cytoscape with Graphify Cosmic aesthetic
  useEffect(() => {
    if (!containerRef.current || !data) return

    const elements = [
      ...data.nodes.map((n) => {
        const cfg = NODE_CONFIG[n.type] || NODE_CONFIG.concept
        return {
          data: {
            id: n.id,
            label: n.label,
            type: n.type,
            description: n.description,
            bgStops: cfg.bgStops,
            borderColor: cfg.border,
            glowColor: cfg.glow,
            size: cfg.size,
            labelSize: cfg.labelSize,
          },
        }
      }),
      ...data.edges.map((e, idx) => ({
        data: {
          id: `e-${idx}`,
          source: e.source,
          target: e.target,
          label: e.label || '',
        },
      })),
    ]

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      wheelSensitivity: 0.2,
      boxSelectionEnabled: false,
      autounselectify: false,
      style: [
        {
          selector: 'node',
          style: {
            'background-fill': 'radial-gradient',
            'background-gradient-stop-colors': 'data(bgStops)',
            'background-gradient-stop-positions': '0% 65% 100%',
            'border-width': 2.5,
            'border-color': 'data(borderColor)',
            'border-opacity': 0.9,
            'width': 'data(size)',
            'height': 'data(size)',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-family': 'Inter, -apple-system, system-ui, sans-serif',
            'font-size': 'data(labelSize)',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'text-background-color': '#0d1117',
            'text-background-opacity': 0.85,
            'text-background-padding': '4px',
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': 'rgba(148, 163, 184, 0.25)',
            'text-border-opacity': 0.8,
            'text-wrap': 'wrap',
            'text-max-width': '115px',
            'overlay-color': 'data(glowColor)',
            'overlay-padding': 8,
            'overlay-opacity': 0.4,
            'shadow-blur': 18,
            'shadow-color': 'data(glowColor)',
            'shadow-opacity': 0.65,
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
            'transition-property': 'background-color, border-color, width, height, opacity, overlay-opacity',
            'transition-duration': 220,
          },
        },
        {
          selector: 'node[type = "root"]',
          style: {
            'font-size': '12.5px',
            'font-weight': 700,
            'border-width': 3.5,
            'overlay-padding': 12,
            'overlay-opacity': 0.5,
            'text-background-color': 'rgba(2, 132, 199, 0.25)',
            'text-border-color': '#38bdf8',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.2,
            'line-color': 'rgba(100, 116, 139, 0.35)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'none',
            'opacity': 0.5,
            'transition-property': 'line-color, opacity, width',
            'transition-duration': 200,
          },
        },
        {
          selector: '.hover-highlight',
          style: {
            'border-width': 3,
            'border-color': '#ffffff',
            'overlay-opacity': 0.6,
            'overlay-padding': 12,
            'z-index': 990,
          },
        },
        {
          selector: '.hover-neighbor',
          style: {
            'border-color': '#f8fafc',
            'overlay-opacity': 0.3,
            'overlay-padding': 8,
          },
        },
        {
          selector: '.hover-edge-highlight',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'opacity': 0.8,
            'z-index': 989,
          },
        },
        {
          selector: '.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#ffffff',
            'overlay-opacity': 0.75,
            'overlay-padding': 14,
            'opacity': 1,
            'z-index': 999,
          },
        },
        {
          selector: '.edge-highlighted',
          style: {
            'width': 2.5,
            'line-color': '#38bdf8',
            'opacity': 1,
            'label': 'data(label)',
            'font-size': '9.5px',
            'color': '#e2e8f0',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'text-background-color': '#090d16',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': 'rgba(56, 189, 248, 0.3)',
            'z-index': 998,
          },
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.12,
            'overlay-opacity': 0,
          },
        },
      ] as any,
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        nodeDimensionsIncludeLabels: true,
        fit: true,
        padding: 50,
        randomize: false,
        componentSpacing: 120,
        nodeRepulsion: () => 650000,
        idealEdgeLength: () => 130,
        edgeElasticity: () => 80,
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

      // Smooth camera pan to selected node
      cy.animate({
        center: { eles: node },
        duration: 400,
        easing: 'ease-out-quad',
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

    
    // Hover effects (minimalistic premium highlight)
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target
      cy.container()!.style.cursor = 'pointer'
      if (node.hasClass('faded')) return // don't highlight if it's already faded out by selection/search
      cy.batch(() => {
        node.addClass('hover-highlight')
        node.connectedEdges().addClass('hover-edge-highlight')
        node.neighborhood('node').addClass('hover-neighbor')
      })
    })

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target
      cy.container()!.style.cursor = 'default'
      cy.batch(() => {
        node.removeClass('hover-highlight')
        node.connectedEdges().removeClass('hover-edge-highlight')
        node.neighborhood('node').removeClass('hover-neighbor')
      })
    })

    // Dynamic label sizing based on zoom
    cy.on('zoom', () => {
      const currentZoom = cy.zoom();
      // Base zoom is around 1. If we zoom out (e.g., 0.2), we want the font size to scale up so it remains legible.
      // We will adjust the font size inversely to zoom, up to a maximum multiplier.
      const multiplier = Math.min(Math.max(1 / currentZoom, 1), 5);
      cy.nodes().forEach(node => {
        const baseSize = parseFloat(node.data('labelSize'));
        node.style('font-size', `${baseSize * multiplier}px`);
      });
    });

    cyRef.current = cy


    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [data])

  // Select node programmatically
  const selectNodeById = (nodeId: string) => {
    if (!cyRef.current || !data) return
    const cy = cyRef.current
    const targetEle = cy.getElementById(nodeId)
    if (targetEle.length === 0) return

    const nodeData = targetEle.data()
    setSelectedNode({
      id: nodeData.id,
      label: nodeData.label,
      type: nodeData.type,
      description: nodeData.description,
    })

    cy.batch(() => {
      cy.elements().removeClass('highlighted edge-highlighted faded')
      const neighborhood = targetEle.neighborhood().add(targetEle)
      cy.elements().difference(neighborhood).addClass('faded')
      targetEle.addClass('highlighted')
      targetEle.connectedEdges().addClass('edge-highlighted')
    })

    cy.animate({
      center: { eles: targetEle },
      zoom: Math.max(cy.zoom(), 1.2),
      duration: 500,
      easing: 'ease-out-cubic',
    })
  }

  // Filter by category
  useEffect(() => {
    if (!cyRef.current) return
    const cy = cyRef.current

    if (filterType === 'all') {
      cy.elements().removeClass('faded highlighted edge-highlighted')
      return
    }

    cy.batch(() => {
      cy.elements().removeClass('highlighted edge-highlighted faded')
      const matchingNodes = cy.nodes(`[type = "${filterType}"]`)
      cy.nodes().difference(matchingNodes).addClass('faded')
      cy.edges().addClass('faded')
      matchingNodes.addClass('highlighted')
    })
  }, [filterType])

  // Search filter
  useEffect(() => {
    if (!cyRef.current) return
    const cy = cyRef.current
    if (!searchQuery.trim()) {
      if (filterType === 'all') {
        cy.elements().removeClass('faded highlighted edge-highlighted')
      }
      return
    }

    const q = searchQuery.toLowerCase()
    cy.batch(() => {
      cy.elements().removeClass('faded highlighted edge-highlighted')
      const matched = cy.nodes().filter((ele) => {
        const label = (ele.data('label') || '').toLowerCase()
        const desc = (ele.data('description') || '').toLowerCase()
        return label.includes(q) || desc.includes(q)
      })

      if (matched.length > 0) {
        cy.elements().difference(matched).addClass('faded')
        matched.addClass('highlighted')
        matched.connectedEdges().addClass('edge-highlighted')
      } else {
        cy.elements().addClass('faded')
      }
    })
  }, [searchQuery, filterType])

  // Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3)
  const handleFit = () => cyRef.current?.fit(undefined, 50)
  const handleResetLayout = () => {
    const layout = cyRef.current?.layout({
      name: 'cose',
      animate: true,
      animationDuration: 800,
      fit: true,
      padding: 50,
      nodeRepulsion: () => 650000,
      idealEdgeLength: () => 130,
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
        height: isFullscreen ? '100vh' : '620px',
        zIndex: isFullscreen ? 9999 : 'auto',
        background: 'radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.15) 0%, rgba(13, 17, 23, 0.8) 60%, #06080d 100%)',
        backgroundImage: `
          radial-gradient(rgba(148, 163, 184, 0.12) 1.2px, transparent 1.2px),
          radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.15) 0%, rgba(13, 17, 23, 0.8) 60%, #06080d 100%)
        `,
        backgroundSize: '28px 28px, 100% 100%',
        borderRadius: isFullscreen ? 0 : '14px',
        border: isFullscreen ? 'none' : '1px solid rgba(56, 189, 248, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Top Glassmorphic Navigation & Control Dock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 16px',
          background: 'rgba(13, 17, 23, 0.82)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
        }}
      >
        {/* Title and stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#f8fafc', fontWeight: 600 }}>
                {data?.title || 'Graphify Knowledge Map'}
              </h4>
              <span
                style={{
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 600,
                  letterSpacing: '0.4px',
                }}
              >
                LIVE GRAPH
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {data ? `${data.nodes.length} Nodes â€¢ ${data.edges.length} Relationships` : 'Extracting conceptsâ€¦'}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(22, 27, 34, 0.7)',
            padding: '3px',
            borderRadius: '20px',
            border: '1px solid rgba(48, 54, 61, 0.8)',
          }}
        >
          {[
            { id: 'all', label: 'All', color: '#94a3b8' },
            { id: 'root', label: 'Root', color: '#38bdf8' },
            { id: 'core', label: 'Pillars', color: '#c084fc' },
            { id: 'concept', label: 'Concepts', color: '#34d399' },
            { id: 'detail', label: 'Details', color: '#fbbf24' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterType(cat.id)}
              style={{
                background: filterType === cat.id ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: filterType === cat.id ? `1px solid ${cat.color}` : '1px solid transparent',
                borderRadius: '16px',
                padding: '3px 10px',
                fontSize: '11.5px',
                fontWeight: filterType === cat.id ? 600 : 500,
                color: filterType === cat.id ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(22, 27, 34, 0.85)',
              border: '1px solid #30363d',
              borderRadius: '8px',
              padding: '4px 10px',
              width: '160px',
            }}
          >
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder="Find conceptâ€¦"
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
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{ width: 30, height: 30, background: 'rgba(22, 27, 34, 0.85)', border: '1px solid #30363d' }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
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
              background: 'rgba(6, 8, 13, 0.88)',
              zIndex: 20,
              gap: '12px',
            }}
          >
            <Loader2 size={34} className="spin" color="#38bdf8" />
            <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8' }}>
              Building Graphify Knowledge Networkâ€¦
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
              background: '#06080d',
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
              style={{ fontSize: '12px', padding: '6px 14px', marginTop: '8px' }}
            >
              Retry Graph Build
            </button>
          </div>
        )}

        {/* Cytoscape Canvas Container */}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating Action Island (Bottom Right) */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            background: 'rgba(13, 17, 23, 0.85)',
            border: '1px solid rgba(48, 54, 61, 0.8)',
            borderRadius: '10px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 10,
            backdropFilter: 'blur(8px)',
          }}
        >
          <button
            type="button"
            className="icon-btn"
            title="Zoom In"
            onClick={handleZoomIn}
            style={{ width: 28, height: 28, border: 'none' }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Zoom Out"
            onClick={handleZoomOut}
            style={{ width: 28, height: 28, border: 'none' }}
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Fit to Screen"
            onClick={handleFit}
            style={{ width: 28, height: 28, border: 'none' }}
          >
            <Compass size={14} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Re-run Force Simulation"
            onClick={handleResetLayout}
            style={{ width: 28, height: 28, border: 'none' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Slide-in Inspector Drawer for Selected Node */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              bottom: 14,
              right: 14,
              width: '320px',
              background: 'rgba(13, 17, 23, 0.94)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${NODE_CONFIG[selectedNode.type]?.border || '#38bdf8'}`,
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
              zIndex: 25,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              gap: '14px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: `${NODE_CONFIG[selectedNode.type]?.badgeColor || '#38bdf8'}22`,
                    color: NODE_CONFIG[selectedNode.type]?.badgeColor || '#38bdf8',
                    border: `1px solid ${NODE_CONFIG[selectedNode.type]?.badgeColor || '#38bdf8'}55`,
                  }}
                >
                  {NODE_CONFIG[selectedNode.type]?.displayName || selectedNode.type}
                </span>
                <h3 style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#f8fafc', fontWeight: 600 }}>
                  {selectedNode.label}
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                style={{ width: 24, height: 24, border: 'none' }}
                onClick={() => {
                  setSelectedNode(null)
                  cyRef.current?.elements().removeClass('highlighted edge-highlighted faded')
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Explanation / Description */}
            <div
              style={{
                background: 'rgba(22, 27, 34, 0.6)',
                border: '1px solid rgba(48, 54, 61, 0.6)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Synthesized Meaning
              </span>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6 }}>
                {selectedNode.description}
              </p>
            </div>

            {/* Connected Relations (Interactive Traversal) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                <Layers size={13} />
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Connected Concepts ({connectedRelations.length})
                </span>
              </div>

              {connectedRelations.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                  No direct one-hop connections found.
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {connectedRelations.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => selectNodeById(rel.targetId)}
                      style={{
                        background: 'rgba(22, 27, 34, 0.8)',
                        border: '1px solid rgba(48, 54, 61, 0.8)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#38bdf8'
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.8)'
                        e.currentTarget.style.background = 'rgba(22, 27, 34, 0.8)'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '10px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600 }}>
                          {rel.relation}
                        </span>
                        <div style={{ fontSize: '12.5px', color: '#f8fafc', fontWeight: 500 }}>
                          {rel.targetLabel}
                        </div>
                      </div>
                      <ChevronRight size={14} color="#94a3b8" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
