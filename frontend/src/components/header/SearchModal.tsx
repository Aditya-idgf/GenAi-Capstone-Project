import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, FolderKanban, MessageSquare, Search } from 'lucide-react'
import { SEARCH_INDEX } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'

export function SearchModal() {
  const { searchOpen, setSearchOpen, setView } = useWorkspace()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SEARCH_INDEX
    return SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.kind.toLowerCase().includes(q) ||
        item.meta.toLowerCase().includes(q),
    )
  }, [query])

  useEffect(() => {
    if (searchOpen) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [searchOpen])

  if (!searchOpen) return null

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Search">
      <button className="scrim" type="button" onClick={() => setSearchOpen(false)} />
      <div className="search-modal">
        <div className="search-modal__bar">
          <Search size={18} strokeWidth={1.8} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, collections, conversations..."
          />
          <kbd>ESC</kbd>
        </div>
        <ul>
          {results.map((item) => {
            const Icon =
              item.kind === 'Document'
                ? FileText
                : item.kind === 'Collection'
                  ? FolderKanban
                  : MessageSquare
            return (
              <li key={`${item.kind}-${item.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.kind === 'Document') setView('library')
                    else if (item.kind === 'Collection') setView('collections')
                    else setView('history')
                    setSearchOpen(false)
                  }}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  <span>
                    <strong>{item.title}</strong>
                    <em>
                      {item.kind} · {item.meta}
                    </em>
                  </span>
                </button>
              </li>
            )
          })}
          {results.length === 0 && <li className="empty">No matches.</li>}
        </ul>
      </div>
    </div>
  )
}
