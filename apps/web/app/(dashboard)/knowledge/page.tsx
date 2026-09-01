import { KnowledgeManualEntryPanel } from '@/components/knowledge/KnowledgeManualEntryPanel'
import { JobAnalysisPanel } from '@/components/knowledge/JobAnalysisPanel'
import { KnowledgeSummaryPanel } from '@/components/knowledge/KnowledgeSummaryPanel'
import { ResumeStrategyPreview } from '@/components/knowledge/ResumeStrategyPreview'
import { GeneratedArtifactsPanel } from '@/components/knowledge/GeneratedArtifactsPanel'
import { DocumentIngestionPanel } from '@/components/knowledge/DocumentIngestionPanel'
import { KnowledgeGraphPanel } from '@/components/knowledge/KnowledgeGraphPanel'
import { IngestionVerificationPanel } from '@/components/knowledge/IngestionVerificationPanel'
import { loadRecentGeneratedArtifacts } from '@/lib/artifacts/repository'
import { loadIngestionVerification, loadKnowledgeSummary } from '@/lib/knowledge-graph/summary'
import { loadLatestResumeStrategyPreview } from '@/lib/resume-strategy/repository'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [summary, strategyPreview, generatedArtifacts, ingestionVerification] = await Promise.all([
    loadKnowledgeSummary(supabase, user.id),
    loadLatestResumeStrategyPreview(supabase, user.id),
    loadRecentGeneratedArtifacts(supabase, user.id),
    loadIngestionVerification(supabase, user.id),
  ])

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-light font-serif-lux italic text-white tracking-wide">
            Knowledge Base
          </h2>
          <p className="text-xs text-white/45 mt-1 uppercase tracking-wider">
            Evidence, claims, and networking context for tailored applications.
          </p>
        </div>
      </div>

      <JobAnalysisPanel />

      <DocumentIngestionPanel />

      <IngestionVerificationPanel sources={ingestionVerification} />

      <ResumeStrategyPreview preview={strategyPreview} />

      <KnowledgeGraphPanel summary={summary} />

      <GeneratedArtifactsPanel artifacts={generatedArtifacts} />

      <KnowledgeManualEntryPanel />

      <KnowledgeSummaryPanel summary={summary} />

      <section className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white/40 text-[18px]">rule</span>
          <h3 className="text-sm font-semibold text-white">Review Queue</h3>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['Evidence', 'Manual sources saved for claim extraction.'],
            ['Claims', 'Assertions stay linked to evidence and overclaim rules.'],
            ['Network', 'Company contacts can trigger referral reminders.'],
          ].map(([label, text]) => (
            <div key={label} className="border border-white/5 rounded-lg bg-white/[0.02] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{label}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/40">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
