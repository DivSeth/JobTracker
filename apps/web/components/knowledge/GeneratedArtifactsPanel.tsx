'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { GeneratedArtifactStatus, GeneratedArtifactSummary } from '@/lib/artifacts/repository'

function labelForArtifactType(type: string) {
  return type.replaceAll('_', ' ')
}

function headlineForArtifact(artifact: GeneratedArtifactSummary) {
  const headline = artifact.metadata?.headline
  return typeof headline === 'string' ? headline : 'Generated application artifact'
}

function dateLabel(value?: string | null) {
  if (!value) return 'Unknown date'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function GeneratedArtifactsPanel({ artifacts }: { artifacts: GeneratedArtifactSummary[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(artifacts[0]?.id ?? null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selectedArtifact = artifacts.find((artifact) => artifact.id === selectedId) ?? artifacts[0] ?? null

  async function updateStatus(artifactId: string, status: GeneratedArtifactStatus) {
    setSavingId(artifactId)
    setError(null)

    const response = await fetch(`/api/artifacts/${artifactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const json = await response.json().catch(() => null)
      setError(typeof json?.error === 'string' ? json.error : 'Failed to update artifact status.')
      setSavingId(null)
      return
    }

    setSavingId(null)
    router.refresh()
  }

  return (
    <section className="rounded-xl border border-white/5 bg-[#0a0a0a] p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white/40 text-[18px]">draft</span>
          <h3 className="text-sm font-semibold text-white">Generated Artifacts</h3>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">{artifacts.length} saved</span>
      </div>

      {error ? <p className="mt-4 text-xs text-red-300" role="status">{error}</p> : null}

      {artifacts.length === 0 ? (
        <p className="mt-5 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-white/35">
          No generated artifacts yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            {artifacts.map((artifact) => (
              <article
                key={artifact.id}
                className={`rounded-lg border p-4 ${
                  selectedArtifact?.id === artifact.id
                    ? 'border-primary/35 bg-primary/5'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{headlineForArtifact(artifact)}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-white/35">
                      {artifact.artifact_type} · {artifact.status} · {dateLabel(artifact.created_at)}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(artifact.id)}>
                    View artifact
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label="approve artifact"
                    disabled={savingId === artifact.id}
                    onClick={() => updateStatus(artifact.id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="reject artifact"
                    disabled={savingId === artifact.id}
                    onClick={() => updateStatus(artifact.id, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="archive artifact"
                    disabled={savingId === artifact.id}
                    onClick={() => updateStatus(artifact.id, 'archived')}
                  >
                    Archive
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            {selectedArtifact ? (
              <>
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{labelForArtifactType(selectedArtifact.artifact_type)}</p>
                    <p className="text-[11px] uppercase tracking-wider text-white/35">{selectedArtifact.status}</p>
                  </div>
                </div>
                <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-xs leading-relaxed text-white/70">
                  {selectedArtifact.content ?? 'No inline content stored for this artifact.'}
                </pre>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
