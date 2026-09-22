/**
 * SourceFilterSelect — shows actual uploaded project documents as a checkbox list.
 * Users can select which sources the next message should reference.
 * Selecting none (or 'All') = refer to all uploaded project sources (default).
 */
import { ChevronDown, FileText, Link2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fetchDocuments, type ApiDocument } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'

export function SourceFilterSelect() {
  const {
    activeProjectId,
    selectedSourcesForQuery,
    setSelectedSourcesForQuery,
    stats,
  } = useWorkspace()

  const [open, setOpen] = useState(false)
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const ref = useRef<HTMLDivElement>(null)

  // Load project documents whenever active project or upload stats change
  useEffect(() => {
    if (activeProjectId === null) { setDocs([]); return }
    fetchDocuments(activeProjectId)
      .then(setDocs)
      .catch(() => setDocs([]))
  }, [activeProjectId, stats])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [])

  const selectedSet = new Set(selectedSourcesForQuery)

  const toggle = (filename: string) => {
    if (selectedSet.has(filename)) {
      setSelectedSourcesForQuery(selectedSourcesForQuery.filter((f) => f !== filename))
    } else {
      setSelectedSourcesForQuery([...selectedSourcesForQuery, filename])
    }
  }

  const selectAll = () => {
    setSelectedSourcesForQuery([])
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSourcesForQuery([])
  }

  const sourceNames: string[] = docs.map((d) => d.filename)
  const count = selectedSourcesForQuery.length
  const label = count === 0 ? 'All' : `${count} selected`
  const allSelected = count === 0

  return (
    <div className="c-select source-filter" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)}>
        <span className="c-select__icon"><Link2 size={14} strokeWidth={1.75} /></span>
        <span className="c-select__text">
          <strong>{label}</strong>
          <em>Sources</em>
        </span>
        {count > 0 && (
          <span
            className="source-filter__clear"
            role="button"
            tabIndex={0}
            aria-label="Clear selection"
            onClick={clearAll}
            onKeyDown={(e) => e.key === 'Enter' && clearAll(e as unknown as React.MouseEvent)}
          >
            <X size={11} strokeWidth={2} />
          </span>
        )}
        <ChevronDown
          size={14}
          strokeWidth={1.8}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms', flexShrink: 0 }}
        />
      </button>

      {open && (
        <div className="menu c-select__menu c-select__menu--up source-filter__menu">
          {sourceNames.length === 0 ? (
            <p className="source-filter__empty">No sources uploaded in this project yet.</p>
          ) : (
            <>
              <div className="source-filter__item source-filter__item--all">
                <label>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={selectAll}
                  />
                  <FileText size={12} strokeWidth={1.75} />
                  <span>All sources ({sourceNames.length})</span>
                </label>
              </div>
              <hr className="source-filter__divider" />
              {sourceNames.map((name) => (
                <div key={name} className="source-filter__item">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(name)}
                      onChange={() => toggle(name)}
                    />
                    <FileText size={12} strokeWidth={1.75} />
                    <span title={name}>{name}</span>
                  </label>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
