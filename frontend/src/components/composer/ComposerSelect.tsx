import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

type Option = { label: string; value: string }

type Props = {
  icon: ReactNode
  title: string
  subtitle: string
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export function ComposerSelect({ icon, title, subtitle, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="c-select" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)}>
        <span className="c-select__icon">{icon}</span>
        <span className="c-select__text">
          <strong>{title}</strong>
          <em>{subtitle}</em>
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.8}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}
        />
      </button>
      {open && (
        /* opens UPWARD — bottom: 100% so it never clips below viewport */
        <div className="menu c-select__menu c-select__menu--up">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? 'is-selected' : ''}
              onClick={() => { onChange(option.value); setOpen(false) }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
