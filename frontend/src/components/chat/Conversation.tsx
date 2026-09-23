import { useEffect, useRef } from 'react'
import { useWorkspace } from '../../state/WorkspaceContext'
import { ToolWorkspace } from '../tools/ToolWorkspace'
import { AssistantResponse } from './AssistantResponse'
import { UserMessage } from './UserMessage'

export function Conversation() {
  const { messages } = useWorkspace()
  const bottomRef = useRef<HTMLDivElement>(null)

  const previousLengthRef = useRef(messages.length)

  useEffect(() => {
    if (messages.length > previousLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    previousLengthRef.current = messages.length
  }, [messages])

  return (
    <div className="conversation">
      {messages.length === 0 && (
        <div className="conversation__empty" style={{ margin: '0 0 16px 0', padding: 0 }}>
          <h2 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
            What can I help with?
          </h2>
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
