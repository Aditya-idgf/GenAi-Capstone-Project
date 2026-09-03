import { Dog, Layers, Link2, Paperclip, Send } from 'lucide-react'
import { COLLECTIONS, MODELS, SOURCE_COUNTS } from '../../data'
import { useWorkspace } from '../../state/WorkspaceContext'
import { ComposerSelect } from './ComposerSelect'

export function MessageComposer() {
  const {
    collection,
    setCollection,
    sourceCount,
    setSourceCount,
    model,
    setModel,
    composer,
    setComposer,
  } = useWorkspace()

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <textarea
        value={composer}
        onChange={(e) => setComposer(e.target.value)}
        placeholder="Ask anything about your documents..."
        rows={2}
      />
      <div className="composer__row">
        <div className="composer__selects">
          <ComposerSelect
            icon={<Layers size={16} strokeWidth={1.75} />}
            title={collection}
            subtitle="Collection"
            value={collection}
            onChange={setCollection}
            options={COLLECTIONS.map((item) => ({ label: item.name, value: item.name }))}
          />
          <ComposerSelect
            icon={<Link2 size={16} strokeWidth={1.75} />}
            title={String(sourceCount)}
            subtitle="Sources"
            value={String(sourceCount)}
            onChange={(value) => setSourceCount(Number(value))}
            options={SOURCE_COUNTS.map((count) => ({
              label: `${count} Sources`,
              value: String(count),
            }))}
          />
          <ComposerSelect
            icon={<Dog size={16} strokeWidth={1.75} />}
            title={model}
            subtitle="Model"
            value={model}
            onChange={setModel}
            options={MODELS.map((item) => ({ label: item, value: item }))}
          />
        </div>
        <div className="composer__actions">
          <label className="icon-btn composer__attach">
            <Paperclip size={18} strokeWidth={1.8} />
            <input className="sr-only" type="file" />
          </label>
          <button className="send-btn" type="submit" aria-label="Send">
            <Send size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </form>
  )
}
