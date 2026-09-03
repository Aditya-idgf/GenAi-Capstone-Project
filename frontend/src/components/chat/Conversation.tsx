import { UserMessage } from './UserMessage'
import { AssistantResponse } from './AssistantResponse'
import { ToolWorkspace } from '../tools/ToolWorkspace'
import { SourcePreview } from '../rail/SourcePreview'

export function Conversation() {
  return (
    <div className="conversation">
      <UserMessage />
      <AssistantResponse />
      <ToolWorkspace />
      <SourcePreview />
    </div>
  )
}
