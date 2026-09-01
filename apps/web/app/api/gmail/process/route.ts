import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { classifyEmail } from '@/lib/ai/email-classifier'
import { extractEntities } from '@/lib/ai/entity-extractor'
import { extractDeadlines } from '@/lib/ai/deadline-extractor'
import { matchApplication } from '@/lib/ai/application-matcher'

export async function POST(request: Request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const userId = body.user_id as string | undefined

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch pending emails
  let query = adminClient.from('email_queue').select('*').eq('status', 'pending').limit(10)
  if (userId) query = query.eq('user_id', userId)
  const { data: pending } = await query

  if (!pending?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const item of pending) {
    try {
      await adminClient.from('email_queue').update({ status: 'processing' }).eq('id', item.id)

      const senderDomain = item.sender?.match(/@([\w.-]+)/)?.[1] ?? 'unknown'

      // Step 1: Classify
      const { result: classification, inputTokens: ct1, outputTokens: ct2 } = await classifyEmail({
        subject: item.subject ?? '',
        body: item.body_preview ?? '',
        sender_domain: senderDomain,
        current_date: new Date().toISOString().split('T')[0],
      })

      await adminClient.from('ai_logs').insert({
        user_id: item.user_id, model: 'gemini-2.0-flash', step: 'classify',
        input_tokens: ct1, output_tokens: ct2, latency_ms: 0,
      })

      // Early exit for non-job emails (~70%)
      if (classification.category === 'other') {
        await adminClient.from('email_queue').update({
          status: 'done', classification, processed_at: new Date().toISOString(),
        }).eq('id', item.id)
        processed++
        continue
      }

      // Step 2: Extract entities
      const { result: entities, inputTokens: et1, outputTokens: et2 } = await extractEntities(
        item.subject ?? '', item.body_preview ?? '', classification.category
      )

      await adminClient.from('ai_logs').insert({
        user_id: item.user_id, model: 'gemini-2.0-flash', step: 'entities',
        input_tokens: et1, output_tokens: et2, latency_ms: 0,
      })

      // Step 3 (parallel): Deadlines + Application match
      const [deadlineResult, matchResult] = await Promise.all([
        extractDeadlines(item.body_preview ?? '', classification.category, new Date().toISOString().split('T')[0], 'America/New_York'),
        (async () => {
          const { data: apps } = await adminClient
            .from('applications')
            .select('id, job:jobs(company, title)')
            .eq('user_id', item.user_id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const flat = (apps ?? []).map((a: any) => {
            const job = Array.isArray(a.job) ? a.job[0] : a.job
            return { id: a.id, company: job?.company ?? '', title: job?.title ?? '', status: '' }
          })
          return matchApplication({ entities, applications: flat }, classification.category)
        })(),
      ])

      await adminClient.from('ai_logs').insert({
        user_id: item.user_id, model: 'gemini-2.0-flash', step: 'deadlines',
        input_tokens: deadlineResult.inputTokens, output_tokens: deadlineResult.outputTokens, latency_ms: 0,
      })

      // Step 5: Persist results
      if (matchResult.matched_application_id) {
        await adminClient.from('applications').update({
          status: matchResult.suggested_status,
          last_activity_at: new Date().toISOString(),
        }).eq('id', matchResult.matched_application_id)
      } else if (matchResult.is_new && classification.confidence >= 0.7) {
        const { data: newApp } = await adminClient.from('applications').insert({
          user_id: item.user_id,
          status: matchResult.suggested_status,
          applied_at: new Date().toISOString(),
          source: 'email_detected',
          last_activity_at: new Date().toISOString(),
        }).select('id').single()

        if (newApp && deadlineResult.result.length > 0) {
          for (const d of deadlineResult.result) {
            await adminClient.from('deadlines').insert({
              user_id: item.user_id,
              application_id: newApp.id,
              email_queue_id: item.id,
              type: d.type,
              datetime: d.datetime,
              is_exact: d.is_exact,
              raw_text: d.raw_text,
            })
          }
        }
      }

      // Mark done
      await adminClient.from('email_queue').update({
        status: 'done',
        classification,
        entities,
        processed_at: new Date().toISOString(),
      }).eq('id', item.id)

      processed++
    } catch (err) {
      console.error('Email processing error:', err)
      await adminClient.from('email_queue').update({
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      }).eq('id', item.id)
    }
  }

  return NextResponse.json({ processed })
}
