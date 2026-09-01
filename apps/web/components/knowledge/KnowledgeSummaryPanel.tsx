import type { KnowledgeSummary } from '@/lib/knowledge-graph/summary'

type KnowledgeRecord = Record<string, unknown>

function textValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function SummaryCard({
  title,
  items,
  renderItem,
}: {
  title: string
  items: KnowledgeRecord[]
  renderItem: (item: KnowledgeRecord) => React.ReactNode
}) {
  return (
    <section className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-[10px] text-white/35 uppercase tracking-widest">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={String(item.id)} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              {renderItem(item)}
            </div>
          ))
        ) : (
          <p className="text-xs text-white/35">No saved records yet.</p>
        )}
      </div>
    </section>
  )
}

export function KnowledgeSummaryPanel({ summary }: { summary: KnowledgeSummary }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-white/40 text-[18px]">database</span>
        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
          Saved Knowledge
        </h3>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <SummaryCard
          title="Recent Evidence"
          items={summary.evidenceSources}
          renderItem={(item) => (
            <>
              <p className="text-xs font-medium text-white truncate">{textValue(item.title)}</p>
              <p className="mt-1 text-[11px] text-white/35">{textValue(item.source_type)}</p>
            </>
          )}
        />
        <SummaryCard
          title="Recent Claims"
          items={summary.claims}
          renderItem={(item) => (
            <>
              <p className="text-xs font-medium text-white line-clamp-2">{textValue(item.claim)}</p>
              <p className="mt-1 text-[11px] text-white/35">{textValue(item.category)}</p>
            </>
          )}
        />
        <SummaryCard
          title="Network Contacts"
          items={summary.contacts}
          renderItem={(item) => (
            <>
              <p className="text-xs font-medium text-white truncate">{textValue(item.full_name)}</p>
              <p className="mt-1 text-[11px] text-white/35">{textValue(item.relationship_strength)}</p>
            </>
          )}
        />
        <SummaryCard
          title="Job Analyses"
          items={summary.jobAnalyses}
          renderItem={(item) => (
            <>
              <p className="text-xs font-medium text-white truncate">{textValue(item.title, 'Untitled role')}</p>
              <p className="mt-1 text-[11px] text-white/35">{textValue(item.company_name, 'Unknown company')}</p>
            </>
          )}
        />
        <SummaryCard
          title="Open Alerts"
          items={summary.openAlerts}
          renderItem={(item) => (
            <p className="text-xs font-medium text-white line-clamp-3">{textValue(item.message)}</p>
          )}
        />
      </div>
    </div>
  )
}
