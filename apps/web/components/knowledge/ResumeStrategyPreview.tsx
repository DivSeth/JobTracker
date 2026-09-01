import type { ResumeStrategyPreviewData } from '@/lib/resume-strategy/planner'
import { GenerateResumeDraftButton } from '@/components/knowledge/GenerateResumeDraftButton'

function PercentBadge({ value }: { value: number | null }) {
  if (typeof value !== 'number') return null

  return (
    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
      {Math.round(value * 100)}% fit
    </span>
  )
}

export function ResumeStrategyPreview({ preview }: { preview: ResumeStrategyPreviewData | null }) {
  if (!preview) {
    return (
      <section className="rounded-xl border border-white/5 bg-[#0a0a0a] p-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white/40 text-[18px]">account_tree</span>
          <h3 className="text-sm font-semibold text-white">Resume Strategy Preview</h3>
        </div>
        <p className="mt-4 text-sm text-white/45">
          Analyze a job to preview resume strategy from saved claims and networking context.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-white/5 bg-[#0a0a0a] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white/40 text-[18px]">account_tree</span>
            <h3 className="text-sm font-semibold text-white">Resume Strategy Preview</h3>
          </div>
          <h4 className="mt-3 text-xl font-light text-white">{preview.headline}</h4>
          <p className="mt-1 text-xs uppercase tracking-wider text-white/35">
            {preview.title ?? 'Untitled role'} · {preview.roleArchetypeKey.replaceAll('_', ' ')}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <PercentBadge value={preview.fitScore} />
          <GenerateResumeDraftButton disabled={preview.selectedClaims.length === 0} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Focus</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {preview.focus.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
              Overclaim Rules
            </p>
            <div className="mt-3 space-y-2">
              {preview.overclaimRules.length ? (
                preview.overclaimRules.map((rule) => (
                  <p key={rule} className="rounded-lg border border-amber-300/15 bg-amber-300/5 p-3 text-xs text-amber-100/80">
                    {rule}
                  </p>
                ))
              ) : (
                <p className="text-xs text-white/35">No claim-specific overclaim rules yet.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
              Network Alerts
            </p>
            <div className="mt-3 space-y-2">
              {preview.networkingAlerts.length ? (
                preview.networkingAlerts.map((alert) => (
                  <p key={alert.id} className="rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-3 text-xs text-cyan-100/80">
                    {alert.message}
                  </p>
                ))
              ) : (
                <p className="text-xs text-white/35">No open networking reminder for this company.</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
            Evidence-Backed Claims
          </p>
          <div className="mt-3 space-y-3">
            {preview.selectedClaims.length ? (
              preview.selectedClaims.map((claim) => (
                <article key={claim.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                    <span>{claim.category ?? 'uncategorized'}</span>
                    <span>·</span>
                    <span>{claim.evidenceStrength ?? 'unknown'} evidence</span>
                    {claim.status ? (
                      <>
                        <span>·</span>
                        <span>{claim.status}</span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">{claim.claim}</p>
                  {claim.matchReasons.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {claim.matchReasons.slice(0, 3).map((reason) => (
                        <span key={reason} className="rounded-full bg-white/[0.04] px-2 py-1 text-[11px] text-white/45">
                          {reason}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-white/35">
                No resume-usable claims match this job yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
