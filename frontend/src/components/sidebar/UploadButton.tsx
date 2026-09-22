import { Loader2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { useWorkspace } from '../../state/WorkspaceContext'

export function UploadButton() {
  const { uploadFile, isUploading, activeProjectId } = useWorkspace()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const disabled = isUploading || activeProjectId === null

  return (
    <>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".pdf"
        onChange={handleChange}
        disabled={disabled}
      />
      <button
        className="upload-btn"
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        title={activeProjectId === null ? 'Select a project first' : 'Upload PDF'}
      >
        {isUploading ? (
          <><Loader2 size={17} strokeWidth={1.8} className="spin" /> Uploading…</>
        ) : (
          <><Upload size={17} strokeWidth={1.8} /> Upload Documents</>
        )}
      </button>
    </>
  )
}
