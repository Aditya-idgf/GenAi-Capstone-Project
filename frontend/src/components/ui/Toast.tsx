import { CheckCircle, X, AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'success', duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle size={18} strokeWidth={1.75} />,
    error: <AlertCircle size={18} strokeWidth={1.75} />,
    info: <AlertCircle size={18} strokeWidth={1.75} />,
  }

  return (
    <div className={`toast toast--${type}`} role="alert">
      <div className="toast__icon">{icons[type]}</div>
      <div className="toast__message">{message}</div>
      <button
        type="button"
        className="toast__close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  )
}
