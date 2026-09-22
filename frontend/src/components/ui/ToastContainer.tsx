import { useWorkspace } from '../../state/WorkspaceContext'
import { Toast } from './Toast'

export function ToastContainer() {
  const { toasts, removeToast } = useWorkspace()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
