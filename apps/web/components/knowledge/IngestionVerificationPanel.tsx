'use client'

import { useState } from 'react'
import type { IngestionVerificationSource } from '@/lib/knowledge-graph/summary'

const MAX_VISIBLE_CLAIMS = 10

function formatPercent(value?: number | null): string {
  if (typeof value !== 'number') return 'n/a'
  return `${Math.round(value * 100)}%`
}

function providerLabel(metadata?: Record<string, unknown>): string {
  const provider = metadata?.extraction_provider ?? metadata?.embedding_provider
  const model = metadata?.extraction_model ?? metadata?.embedding_model
  return [provider, model].filter(Boolean).join(' / ') || 'local pipeline'
}

function sourceTypeLabel(value: string): string {
  return value.replace(/_/g, ' ')
}

export function IngestionVerificationPanel({ sources }: { sources: IngestionVerificationSource[] }) {
  const [expandedSourceIds, setExpandedSourceIds] = useState<Set<string>>(new Set())

  function toggleSource(sourceId: string) {
    setExpandedSourceIds((current) => {
      const next = new Set(current)
      if (next.has(sourceId)) {
        next.delete(sourceId)
      } else {
        next.add(sourceId)
      }

      return next
    })
  }

  return (
    <section className="rounded-xl border border-white/5 bg-[#0a0a0a] p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white/40 text-[18px]">fact_check</span>
          <h3 className="text-sm font-semibold text-white">Ingestion Verification</h3>
        </div>
        <p className="text-xs text-white/35">
          Inspect extracted claims, evidence chunks, entities, and guardrails.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {sources.length ? sources.map((source) => {
          const isExpanded = expandedSourceIds.has(source.id)
          const visibleClaims = source.claims.slice(0, MAX_VISIBLE_CLAIMS)
          const hiddenClaimCount = Math.max(0, source.claims.length - visibleClaims.length)

          return (
          <article key={source.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-white">{source.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/45">
                    {sourceTypeLabel(source.source_type)}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/45">
                    {source.chunks.length} chunks
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/45">
                    {source.claims.length} claims
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[11px] text-white/35">{providerLabel(source.metadata)}</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  aria-expanded={isExpanded}
                  aria-controls={`ingestion-source-${source.id}`}
                  aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${source.title}`}
                  onClick={() => toggleSource(source.id)}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>

            {isExpanded ? (
            <div id={`ingestion-source-${source.id}`} className="mt-4 space-y-3">
              {source.claims.length ? (
                <>
                  {hiddenClaimCount ? (
                    <p className="text-[11px] text-white/35">
                      Showing {visibleClaims.length} of {source.claims.length} extracted claim links.
                    </p>
                  ) : null}
                  {visibleClaims.map((claim) => (
                <div key={claim.id} className="rounded-lg border border-white/5 bg-black/20 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed text-white">{claim.claim}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-[11px] text-white/45">{claim.category}</span>
                        <span className="text-[11px] text-white/45">{claim.evidence_strength ?? 'unknown'} evidence</span>
                        <span className="text-[11px] text-white/45">{formatPercent(claim.confidence)} confidence</span>
                        <span className="text-[11px] text-white/45">{claim.status ?? 'draft'}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/35">{providerLabel(claim.metadata)}</p>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
                        Source chunk {claim.source_chunk ? claim.source_chunk.chunk_index + 1 : 'n/a'}
                      </p>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/50">
                        {claim.source_chunk?.content ?? 'No chunk link recorded for this claim.'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
                        Entities
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {claim.entities.length ? claim.entities.slice(0, 8).map((entity) => (
                          <span key={entity.id} className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/60">
                            {entity.name}
                          </span>
                        )) : <span className="text-xs text-white/35">No linked entities.</span>}
                      </div>
                    </div>
                  </div>

                  {claim.do_not_overclaim?.length ? (
                    <div className="mt-3 rounded-lg border border-amber-400/10 bg-amber-400/[0.03] p-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-amber-200/50">
                        Verification guardrails
                      </p>
                      <ul className="mt-2 space-y-1">
                        {claim.do_not_overclaim.slice(0, 3).map((guardrail) => (
                          <li key={guardrail} className="text-xs leading-relaxed text-amber-100/55">
                            {guardrail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
                  ))}
                </>
              ) : (
                <p className="rounded-lg border border-white/5 bg-black/20 p-3 text-xs text-white/35">
                  No extracted claims linked to this source yet.
                </p>
              )}
            </div>
            ) : null}
          </article>
          )
        }) : (
          <p className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-white/35">
            Ingest a document to inspect extracted claims and source evidence here.
          </p>
        )}
      </div>
    </section>
  )
}
