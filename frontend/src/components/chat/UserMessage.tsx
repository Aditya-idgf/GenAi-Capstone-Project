import { CheckCheck } from 'lucide-react'

export function UserMessage() {
  return (
    <div className="q-row">
      <article className="q-card">
        <p>What are the key principles behind Retrieval-Augmented Generation (RAG)?</p>
        <div className="q-card__meta">
          <time>10:42 PM</time>
          <CheckCheck size={14} strokeWidth={1.8} />
        </div>
      </article>
    </div>
  )
}
