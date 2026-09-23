import {
  BarChart2,
  BookOpen,
  FileText,
  GitBranch,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useRef } from 'react'
import { KnowledgeOverview } from '../sidebar/KnowledgeOverview'
import { SourcesPanel } from './SourcesPanel'
import { ToolHint } from './ToolHint'
import { ToolsPanel } from './ToolsPanel'
import { useWorkspace } from '../../state/WorkspaceContext'

export function ContextRail() {
  const {
    railOpen,
    setRailOpen,
    railCollapsed,
    setRailCollapsed,
    openTool,
    stats,
    uploadFile,
    isUploading,
    activeProjectId,
    projects,
    setActiveProject,
    showToast,
  } = useWorkspace()

  const docCount = stats?.documents ?? 0
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    if (activeProjectId === null) {
      if (projects.length > 0) {
        setActiveProject(projects[0].id)
        showToast(`Switched to project "${projects[0].name}". Click Upload again.`, 'info')
      } else {
        showToast('Please create a project first before uploading documents.', 'info')
      }
      return
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadFile(file)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {railOpen && (
        <button
          className="scrim"
          type="button"
          aria-label="Close sources"
          onClick={() => setRailOpen(false)}
        />
      )}
      <aside className={`rail${railOpen ? ' is-open' : ''}${railCollapsed ? ' is-collapsed' : ''}`}>
        {railCollapsed ? (
          <div className="rail-collapsed">
            {/* Hidden file input for uploading from collapsed rail */}
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept=".pdf"
              disabled={isUploading}
              onChange={handleFileChange}
            />

            {/* Upload Button at the very top */}
            <button
              className="rail-collapsed__icon-btn"
              type="button"
              title={activeProjectId === null ? 'Select a project first to upload' : 'Upload Document'}
              disabled={isUploading}
              onClick={handleUploadClick}
              style={{
                background: 'var(--accent, #3b82f6)',
                color: '#ffffff',
                borderColor: 'var(--accent, #3b82f6)',
                marginBottom: '2px',
              }}
            >
              {isUploading ? (
                <Loader2 size={16} strokeWidth={2} className="spin" />
              ) : (
                <Upload size={17} strokeWidth={2} />
              )}
            </button>

            {/* Documents Button */}
            <button
              className="rail-collapsed__icon-btn"
              type="button"
              title={`Documents (${docCount}) - Click to expand`}
              onClick={() => setRailCollapsed(false)}
            >
              <FileText size={18} strokeWidth={1.8} />
              {docCount > 0 && (
                <span className="rail-collapsed__badge">{docCount}</span>
              )}
            </button>

            {/* Knowledge Overview / Stats Button */}
            <button
              className="rail-collapsed__icon-btn"
              type="button"
              title="Knowledge Overview - Click to expand"
              onClick={() => setRailCollapsed(false)}
            >
              <BarChart2 size={18} strokeWidth={1.8} />
            </button>

            <div className="rail-collapsed__divider" />

            {/* Tools Quick Action Buttons */}
            <button
              className="rail-collapsed__icon-btn"
              type="button"
              title="Tool: Summarize"
              onClick={() => {
                setRailCollapsed(false)
                openTool('summarize')
              }}
            >
              <Sparkles size={17} strokeWidth={1.8} />
            </button>

            <button
              className="rail-collapsed__icon-btn"
              type="button"
              title="Tool: Mind Map"
              onClick={() => {
                setRailCollapsed(false)
                openTool('mindmap')
              }}
            >
              <GitBranch size={17} strokeWidth={1.8} />
            </button>

            <button
              className="rail-collapsed__icon-btn"
              type="button"
              title="Tool: Key Points"
              onClick={() => {
                setRailCollapsed(false)
                openTool('keypoints')
              }}
            >
              <BookOpen size={17} strokeWidth={1.8} />
            </button>

            <div style={{ flex: 1 }} />

            {/* Expand button at bottom */}
            <button
              className="rail-collapsed__icon-btn expand-btn"
              type="button"
              aria-label="Expand panel"
              title="Expand panel"
              onClick={() => setRailCollapsed(false)}
            >
              <PanelRightOpen size={18} strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <>
            <SourcesPanel />
            <KnowledgeOverview />
            <ToolsPanel />
            <ToolHint />

            <div className="rail__collapse-btn-wrap">
              <button
                className="rail__collapse-btn"
                type="button"
                aria-label="Collapse panel"
                title="Collapse panel"
                onClick={() => setRailCollapsed(true)}
              >
                <PanelRightClose size={16} strokeWidth={1.75} />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
