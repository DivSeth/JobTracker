import type { KnowledgeSummary } from '@/lib/knowledge-graph/summary'

type KnowledgeRecord = Record<string, unknown>

function textValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function GraphColumn({
  title,
  items,
  renderItem,
}: {
  title: string
  items: KnowledgeRecord[]
  renderItem: (item: KnowledgeRecord) => React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">{title}</p>
        <span className="text-[10px] text-white/30">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.length ? items.map((item) => (
          <div key={String(item.id)} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            {renderItem(item)}
          </div>
        )) : <p className="text-xs text-white/35">No nodes yet.</p>}
      </div>
    </div>
  )
}

export function KnowledgeGraphPanel({ summary }: { summary: KnowledgeSummary }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#0a0a0a] p-6">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-white/40 text-[18px]">hub</span>
        <h3 className="text-sm font-semibold text-white">Knowledge Graph</h3>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-4">
        <GraphColumn
          title="Evidence"
          items={summary.evidenceSources}
          renderItem={(item) => (
            <>
              <p className="truncate text-xs font-medium text-white">{textValue(item.title)}</p>
              <p className="mt-1 text-[11px] text-white/35">{textValue(item.source_type)}</p>
            </>
          )}
        />
        <GraphColumn
          title="Claims"
          items={summary.claims}
          renderItem={(item) => (
            <>
              <p className="line-clamp-2 text-xs font-medium text-white">{textValue(item.claim)}</p>
              <p className="mt-1 text-[11px] text-white/35">{textValue(item.category)}</p>
            </>
          )}
        />
        <GraphColumn
          title="Network"
          items={summary.contacts}
          renderItem={(item) => (
            <>
              <p className="truncate text-xs font-medium text-white">{textValue(item.full_name)}</p>
              <p className="mt-1 text-[11px] text-white/35">{textValue(item.relationship_strength)}</p>
            </>
          )}
        />
        <GraphColumn
          title="Jobs"
          items={summary.jobAnalyses}
          renderItem={(item) => (
            <>
              <p className="truncate text-xs font-medium text-white">{textValue(item.title, 'Untitled role')}</p>
              <p className="mt-1 text-[11px] text-white/35">{textValue(item.company_name, 'Unknown company')}</p>
            </>
          )}
        />
      </div>
    </section>
  )
}
