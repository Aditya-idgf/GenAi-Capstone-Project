import { Cpu, Link2, Paperclip, Send } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { MODELS, SOURCE_COUNTS } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'
import { ComposerSelect } from './ComposerSelect'

const LINE_H     = 23
const MIN_ROWS   = 1
const MAX_HEIGHT = LINE_H * 6 + 22

export function MessageComposer() {
  const {
    sourceCount, setSourceCount,
    model, setModel,
    composer, setComposer,
    sendMessage, isQuerying,
    activeProjectId,
  } = useWorkspace()

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [composer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composer.trim() || isQuerying || activeProjectId === null) return
    const text = composer
    setComposer('')
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const isDisabled = isQuerying || activeProjectId === null

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={composer}
        onChange={(e) => setComposer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          activeProjectId === null
            ? 'Select a project to start chatting…'
            : 'Ask anything about your documents…'
        }
        rows={MIN_ROWS}
        disabled={isDisabled}
      />
      <div className="composer__row">
        <div className="composer__selects">
          <ComposerSelect
            icon={<Link2 size={14} strokeWidth={1.75} />}
            title={String(sourceCount)}
            subtitle="Sources"
            value={String(sourceCount)}
            onChange={(v) => setSourceCount(Number(v))}
            options={SOURCE_COUNTS.map((c) => ({ label: `${c} Sources`, value: String(c) }))}
          />
          <ComposerSelect
            icon={<Cpu size={14} strokeWidth={1.75} />}
            title={model}
            subtitle="Model"
            value={model}
            onChange={setModel}
            options={MODELS.map((m) => ({ label: m, value: m }))}
          />
        </div>
        <div className="composer__actions">
          <label className={`icon-btn composer__attach${isQuerying ? ' disabled' : ''}`}>
            <Paperclip size={15} strokeWidth={1.8} />
            <input className="sr-only" type="file" disabled={isQuerying} />
          </label>
          <button
            className="send-btn"
            type="submit"
            aria-label="Send"
            disabled={isDisabled || !composer.trim()}
          >
            <Send size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </form>
  )
}
