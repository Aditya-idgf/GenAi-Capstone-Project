import { useRef } from 'react'
import { Upload } from 'lucide-react'

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".pdf,.txt,.md,.docx"
        multiple
        onChange={() => {
          if (inputRef.current) inputRef.current.value = ''
        }}
      />
      <button className="upload-btn" type="button" onClick={() => inputRef.current?.click()}>
        <Upload size={18} strokeWidth={1.8} />
        Upload Documents
      </button>
    </>
  )
}
