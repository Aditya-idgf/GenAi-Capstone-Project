import { useEffect, useRef } from 'react'
import { useWorkspace } from '../../state/WorkspaceContext'
import { ToolWorkspace } from '../tools/ToolWorkspace'
import { AssistantResponse } from './AssistantResponse'
import { UserMessage } from './UserMessage'

export function Conversation() {
  const { messages } = useWorkspace()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="conversation">
      {messages.length === 0 && (
        <div className="conversation__empty">
          <p>Ask anything about your uploaded documents.</p>
        </div>
      )}
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserMessage key={msg.id} message={msg} />
        ) : (
          <AssistantResponse key={msg.id} message={msg} />
        ),
      )}
      <ToolWorkspace />
      <div ref={bottomRef} />
    </div>
  )
}
