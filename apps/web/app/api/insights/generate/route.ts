import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { callGemini, parseGeminiJSON } from '@/lib/ai/gemini'
import type { InsightItem } from '@/lib/types'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profiles } = await adminClient.from('profiles').select('user_id')
  if (!profiles?.length) return NextResponse.json({ generated: 0 })

  const weekStart = getWeekStart()
  let generated = 0

  for (const user of profiles) {
    const { data: existing } = await adminClient
      .from('insights')
      .select('id')
      .eq('user_id', user.user_id)
      .eq('week_start', weekStart)
      .maybeSingle()

    if (existing) continue

    const { data: apps } = await adminClient
      .from('applications')
      .select('status, applied_at, last_activity_at')
      .eq('user_id', user.user_id)

    if (!apps?.length) continue

    const total = apps.length
    const applied = apps.filter(a => a.status !== 'saved').length
    const responded = apps.filter(a => ['oa', 'interviewing', 'offer'].includes(a.status)).length
    const ghosted = apps.filter(a => a.status === 'ghosted').length
    const rejected = apps.filter(a => a.status === 'rejected').length
    const offers = apps.filter(a => a.status === 'offer').length
    const responseRate = applied > 0 ? Math.round((responded / applied) * 100) / 100 : 0

    const prompt = `Application stats for a job seeker:
- Total applications: ${total}
- Applied (non-saved): ${applied}
- Got responses (OA/interview/offer): ${responded}
- Offers: ${offers}
- Rejected: ${rejected}
- Ghosted (30+ days no response): ${ghosted}
- Response rate: ${(responseRate * 100).toFixed(0)}%

Generate 3-5 actionable insights. Be encouraging but honest.`

    const systemPrompt = `You generate weekly job search insights. Respond in JSON:
{"insights": [{"type": "stat|recommendation|warning", "message": "...", "data_point": "..." or null}]}`

    try {
      const { text } = await callGemini(prompt, systemPrompt)
      const parsed = parseGeminiJSON<{ insights: InsightItem[] }>(text)

      await adminClient.from('insights').insert({
        user_id: user.user_id,
        insights: parsed.insights,
        response_rate: responseRate,
        avg_days_to_response: null,
        week_start: weekStart,
      })

      generated++
    } catch (err) {
      console.error('Insight generation failed for user:', user.user_id, err)
    }
  }

  return NextResponse.json({ generated })
}

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day
  const sunday = new Date(now.setDate(diff))
  return sunday.toISOString().split('T')[0]
}
