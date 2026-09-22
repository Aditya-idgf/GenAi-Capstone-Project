import { CheckCheck } from 'lucide-react'
import type { ChatMessage } from '../../types'

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="q-row">
      <article className="q-card">
        <p>{message.content}</p>
        <div className="q-card__meta">
          <time>{message.timestamp}</time>
          <CheckCheck size={14} strokeWidth={1.8} />
        </div>
      </article>
    </div>
  )
}
