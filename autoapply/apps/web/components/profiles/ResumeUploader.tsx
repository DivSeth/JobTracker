'use client'
import { useRef, useState } from 'react'
import { FileUp, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResumeParseData } from '@/components/profiles/ResumeParser'

interface Props {
  profileId: string
  currentResumePath: string | null
  currentCoverLetterPath: string | null
  onUploadComplete: (type: 'resume' | 'cover_letter', path: string) => void
  onParseComplete?: (data: ResumeParseData) => void
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

interface ResumeZoneProps {
  profileId: string
  currentPath: string | null
  onUploadComplete: (type: 'resume', path: string) => void
  onParseComplete?: (data: ResumeParseData) => void
}

function ResumeUploadZone({ profileId, currentPath, onUploadComplete, onParseComplete }: ResumeZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadState>(currentPath ? 'done' : 'idle')
  const [fileName, setFileName] = useState<string>(
    currentPath ? currentPath.split('/').pop() ?? '' : ''
  )
  const [error, setError] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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
    setParseError(null)
    setStatus('uploading')
    setFileName(file.name)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'resume')

    let uploadedPath: string
    try {
      const res = await fetch(`/api/profiles/${profileId}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      uploadedPath = data.path
      onUploadComplete('resume', uploadedPath)
    } catch {
      setStatus('error')
      setError('Resume parsing failed. Try uploading a different file, or fill in your details manually.')
      return
    }

    // If no parse handler, just mark done
    if (!onParseComplete) {
      setStatus('done')
      return
    }

    // Trigger AI parsing after upload
    setStatus('parsing')
    try {
      const parseRes = await fetch(`/api/profiles/${profileId}/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_path: uploadedPath }),
      })
      if (!parseRes.ok) throw new Error('Parse failed')
      const parseData = await parseRes.json()
      setStatus('done')
      onParseComplete(parseData.data)
    } catch {
      // Upload succeeded, only parsing failed — keep the uploaded file
      setStatus('done')
      setParseError('Resume parsing failed. Try uploading a different file, or fill in your details manually.')
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
    setParseError(null)
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

  if (status === 'parsing') {
    return (
      <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="text-primary animate-spin" />
          <span className="text-sm text-on-surface-muted">{fileName}</span>
          <span className="text-xs text-on-surface-muted">Parsing resume...</span>
        </div>
      </div>
    )
  }

  if (status === 'done' && !error) {
    return (
      <div>
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
        {parseError && (
          <p className="text-xs text-error mt-2">{parseError}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload Resume (PDF)"
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
          <p className="text-sm text-on-surface-muted">Upload Resume (PDF)</p>
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

interface CoverLetterZoneProps {
  profileId: string
  currentPath: string | null
  onUploadComplete: (type: 'cover_letter', path: string) => void
}

function CoverLetterUploadZone({ profileId, currentPath, onUploadComplete }: CoverLetterZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>(currentPath ? 'done' : 'idle')
  const [fileName, setFileName] = useState<string>(
    currentPath ? currentPath.split('/').pop() ?? '' : ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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
    formData.append('type', 'cover_letter')

    try {
      const res = await fetch(`/api/profiles/${profileId}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setStatus('done')
      setFileName(file.name)
      onUploadComplete('cover_letter', data.path)
    } catch {
      setStatus('error')
      setError('Upload failed. Try uploading a different file.')
    }
  }

  function handleZoneClick() { inputRef.current?.click() }

  function handleReplace(e: React.MouseEvent) {
    e.stopPropagation()
    setStatus('idle')
    setFileName('')
    setError(null)
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

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload Cover Letter (PDF, optional)"
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary/50 bg-primary/5'
            : 'border-outline-variant hover:border-primary/30 hover:bg-surface-container/40'
        )}
        onClick={handleZoneClick}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f) }}
        onKeyDown={e => e.key === 'Enter' && handleZoneClick()}
      >
        <div className="flex flex-col items-center gap-2">
          <FileUp size={24} className="text-on-surface-muted" />
          <p className="text-sm text-on-surface-muted">Upload Cover Letter (PDF, optional)</p>
          <p className="text-xs text-on-surface-muted/60">Drag and drop or click to select</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
        />
      </div>
      {error && (
        <p className="text-xs text-error mt-2">{error}</p>
      )}
    </div>
  )
}

export function ResumeUploader({
  profileId,
  currentResumePath,
  currentCoverLetterPath,
  onUploadComplete,
  onParseComplete,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-on-surface">Resume</h3>
        <ResumeUploadZone
          profileId={profileId}
          currentPath={currentResumePath}
          onUploadComplete={onUploadComplete}
          onParseComplete={onParseComplete}
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-on-surface">Cover Letter</h3>
        <CoverLetterUploadZone
          profileId={profileId}
          currentPath={currentCoverLetterPath}
          onUploadComplete={onUploadComplete}
        />
      </div>
    </div>
  )
}
