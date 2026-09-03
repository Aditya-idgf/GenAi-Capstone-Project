import { AppShell } from './components/AppShell'
import { WorkspaceProvider } from './state/WorkspaceContext'

export default function App() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  )
}
