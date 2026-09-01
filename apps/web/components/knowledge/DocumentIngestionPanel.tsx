'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type IngestState = 'idle' | 'saving' | 'saved' | 'error'
type IngestMode = 'paste' | 'upload'

export function DocumentIngestionPanel() {
  const router = useRouter()
  const [state, setState] = useState<IngestState>('idle')
  const [mode, setMode] = useState<IngestMode>('paste')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setState('saving')
    setMessage(null)

    const response = mode === 'upload'
      ? await fetch('/api/knowledge/ingest', {
        method: 'POST',
        body: buildUploadPayload(form),
      })
      : await fetch('/api/knowledge/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: String(form.get('source_type') ?? 'resume'),
          title: String(form.get('document_title') ?? ''),
          raw_text: String(form.get('document_text') ?? ''),
          metadata: { source: 'knowledge_document_ingestion_panel', input_mode: 'paste' },
        }),
      })

    const json = await response.json().catch(() => null)

    if (!response.ok) {
      setState('error')
      setMessage(typeof json?.error === 'string' ? json.error : 'Document ingestion failed.')
      return
    }

    setState('saved')
    setMessage(`Extracted ${json?.claimsCreated ?? 0} draft claims from ${json?.chunksCreated ?? 0} chunks.`)
    router.refresh()
  }

  function buildUploadPayload(form: FormData): FormData {
    const payload = new FormData()
    payload.set('source_type', String(form.get('source_type') ?? 'work_experience_portfolio'))
    payload.set('title', String(form.get('document_title') ?? ''))
    payload.set('metadata', JSON.stringify({
      source: 'knowledge_document_ingestion_panel',
      input_mode: 'upload',
    }))

    const file = form.get('document_file')
    if (file instanceof File) {
      payload.set('file', file)
    }

    return payload
  }

  return (
    <section className="rounded-xl border border-white/5 bg-[#0a0a0a] p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white/40 text-[18px]">auto_stories</span>
          <h3 className="text-sm font-semibold text-white">Document Ingestion</h3>
        </div>
        {state !== 'idle' ? (
          <p className={`text-xs ${state === 'error' ? 'text-red-300' : 'text-white/50'}`} role="status">
            {state === 'saving' ? 'Extracting...' : message}
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-[10px] border border-border-subtle bg-surface-card p-1">
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`h-8 rounded-[8px] text-xs font-medium transition-colors ${
                mode === 'paste' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              Paste text
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`h-8 rounded-[8px] text-xs font-medium transition-colors ${
                mode === 'upload' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              Upload file
            </button>
          </div>
          <label className="space-y-1.5">
            <span className="block label-sm text-on-surface-muted">Source type</span>
            <select
              name="source_type"
              className="h-9 w-full rounded-[10px] border border-border-subtle bg-surface-card px-3 text-sm text-on-surface"
            >
              <option value="resume">Resume</option>
              <option value="work_experience_portfolio">Work-experience portfolio</option>
              <option value="project_note">Project note</option>
              <option value="cover_letter">Cover letter</option>
              <option value="application_answer">Application answer</option>
              <option value="chatgpt_export">ChatGPT export</option>
              <option value="linkedin">LinkedIn</option>
              <option value="github">GitHub</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Input id="document_title" name="document_title" label="Document title" required />
          <Button type="submit" size="sm">Ingest document</Button>
        </div>
        {mode === 'upload' ? (
          <div className="space-y-1.5">
            <label htmlFor="document_file" className="block label-sm text-on-surface-muted">
              Document file
            </label>
            <input
              id="document_file"
              name="document_file"
              type="file"
              accept="application/pdf,text/plain,text/markdown,.pdf,.txt,.md"
              className="block w-full rounded-[10px] border border-border-subtle bg-surface-card px-3 py-2.5 text-sm text-on-surface file:mr-3 file:rounded-[8px] file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/15"
            />
            <p className="text-xs leading-relaxed text-white/35">
              Upload resumes, detailed work-experience portfolios, project writeups, or notes as PDF, TXT, or Markdown.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="document_text" className="block label-sm text-on-surface-muted">
              Document text
            </label>
            <textarea
              id="document_text"
              name="document_text"
              rows={10}
              required
              className="w-full resize-none rounded-[10px] border border-border-subtle bg-surface-card px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-on-surface-muted/50 focus:ring-2 focus:ring-primary/30"
              placeholder="Paste resume bullets, work-experience portfolios, project notes, cover letters, or application answers..."
            />
          </div>
        )}
      </form>
    </section>
  )
}
