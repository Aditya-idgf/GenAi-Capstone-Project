import { Cpu, Paperclip, Send } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { MODELS } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'
import { ComposerSelect } from './ComposerSelect'
import { SourceFilterSelect } from './SourceFilterSelect'

const LINE_H     = 23
const MIN_ROWS   = 1
const MAX_HEIGHT = LINE_H * 6 + 22

export function MessageComposer() {
  const {
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
    <form className="composer" onSubmit={handleSubmit} style={{ flexDirection: 'row', alignItems: 'flex-end', padding: '8px 14px', gap: '12px' }}>
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
        style={{ flex: 1, marginTop: '10px', marginBottom: '10px' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px' }}>
        <SourceFilterSelect />

        <ComposerSelect
          icon={<Cpu size={14} strokeWidth={1.75} />}
          title={model.replace('llama-3.1-', 'Llama 3.1 ')}
          subtitle="Model"
          value={model}
          onChange={setModel}
          options={MODELS.map((m) => ({
            label: m === 'llama-3.1-8b-instant' ? 'Llama 3.1 8B (Groq)' : m,
            value: m,
          }))}
        />
        
        <label className={`icon-btn composer__attach${isQuerying ? ' disabled' : ''}`} style={{ margin: 0 }}>
          <Paperclip size={15} strokeWidth={1.8} />
          <input className="sr-only" type="file" disabled={isQuerying} />
        </label>
        
        <button
          className="send-btn"
          type="submit"
          aria-label="Send"
          disabled={isDisabled || !composer.trim()}
          style={{ margin: 0 }}
        >
          {isQuerying ? (
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          ) : (
            <Send size={15} strokeWidth={2} />
          )}
        </button>
      </div>
    </form>
  )
}
