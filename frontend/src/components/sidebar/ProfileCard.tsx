import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useWorkspace } from '../../state/WorkspaceContext'

export function ProfileCard() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { setView } = useWorkspace()

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="profile" ref={ref}>
      <button className="profile__btn" type="button" onClick={() => setOpen((v) => !v)}>
        <span className="avatar">AS</span>
        <span className="profile__meta">
          <strong>Aarav Sharma</strong>
          <em>Student Plan</em>
        </span>
        <ChevronDown size={16} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="menu profile__menu">
          <button
            type="button"
            onClick={() => {
              setView('settings')
              setOpen(false)
            }}
          >
            Account settings
          </button>
          <button type="button">Student Plan</button>
        </div>
      )}
    </div>
  )
}
