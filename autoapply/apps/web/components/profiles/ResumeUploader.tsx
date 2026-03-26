'use client'
import { useRef, useState } from 'react'
import { FileUp, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  profileId: string
  currentResumePath: string | null
  currentCoverLetterPath: string | null
  onUploadComplete: (type: 'resume' | 'cover_letter', path: string) => void
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

interface FileUploadZoneProps {
  type: 'resume' | 'cover_letter'
  profileId: string
  currentPath: string | null
  onUploadComplete: (type: 'resume' | 'cover_letter', path: string) => void
}

function FileUploadZone({ type, profileId, currentPath, onUploadComplete }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadState>(currentPath ? 'done' : 'idle')
  const [fileName, setFileName] = useState<string>(
    currentPath ? currentPath.split('/').pop() ?? '' : ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const label = type === 'resume' ? 'Upload Resume (PDF)' : 'Upload Cover Letter (PDF, optional)'

  function validateFile(file: File): string | null {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'File must be a PDF under 5MB.'
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'File must be a PDF under 5MB.'
    }
    return null
  }

  async function uploadFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setStatus('idle')
      return
    }

    setError(null)
    setStatus('uploading')
    setFileName(file.name)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const res = await fetch(`/api/profiles/${profileId}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error('Upload failed')
      }
      const data = await res.json()
      setStatus('done')
      setFileName(file.name)
      onUploadComplete(type, data.path)
    } catch {
      setStatus('error')
      setError('Resume parsing failed. Try uploading a different file, or fill in your details manually.')
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleZoneClick() {
    inputRef.current?.click()
  }

  function handleReplace(e: React.MouseEvent) {
    e.stopPropagation()
    setStatus('idle')
    setFileName('')
    setError(null)
  }

  if (status === 'done' && !error) {
    return (
      <div className="flex items-center justify-between border-2 border-dashed border-success/40 rounded-xl p-4 bg-success/5">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-success shrink-0" />
          <span className="text-sm text-on-surface truncate max-w-xs">{fileName}</span>
        </div>
        <button
          type="button"
          onClick={handleReplace}
          className="text-xs text-on-surface-muted hover:text-on-surface transition-colors ml-2 shrink-0"
        >
          Replace
        </button>
      </div>
    )
  }

  if (status === 'uploading') {
    return (
      <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="text-primary animate-spin" />
          <span className="text-sm text-on-surface-muted">{fileName}</span>
          <span className="text-xs text-on-surface-muted">Uploading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary/50 bg-primary/5'
            : 'border-outline-variant hover:border-primary/30 hover:bg-surface-container/40'
        )}
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={e => e.key === 'Enter' && handleZoneClick()}
      >
        <div className="flex flex-col items-center gap-2">
          <FileUp size={24} className="text-on-surface-muted" />
          <p className="text-sm text-on-surface-muted">{label}</p>
          <p className="text-xs text-on-surface-muted/60">Drag and drop or click to select</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
      {error && (
        <p className="text-xs text-error mt-2">{error}</p>
      )}
    </div>
  )
}

export function ResumeUploader({ profileId, currentResumePath, currentCoverLetterPath, onUploadComplete }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-on-surface">Resume</h3>
        <FileUploadZone
          type="resume"
          profileId={profileId}
          currentPath={currentResumePath}
          onUploadComplete={onUploadComplete}
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-on-surface">Cover Letter</h3>
        <FileUploadZone
          type="cover_letter"
          profileId={profileId}
          currentPath={currentCoverLetterPath}
          onUploadComplete={onUploadComplete}
        />
      </div>
    </div>
  )
}
