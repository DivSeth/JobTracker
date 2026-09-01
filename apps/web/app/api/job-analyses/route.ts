import { analyzePastedJob } from '@/lib/job-analysis/analyzer'
import { createJobAnalysisWithNetworkAlerts } from '@/lib/job-analysis/repository'
import {
  fetchJobTextFromUrl,
  JobTextFetchError,
  renderJobPageTextWithPlaywright,
} from '@/lib/job-analysis/url-ingest'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

const jobAnalysisRequestSchema = z.object({
  jobText: z.string().trim().optional(),
  applyUrl: z.string().trim().url().optional(),
  companyName: z.string().trim().min(1).optional(),
  jobTitle: z.string().trim().min(1).optional(),
}).refine((input) => Boolean(input.applyUrl || (input.jobText && input.jobText.length >= 20)), {
  message: 'Provide an apply URL or paste at least 20 characters of job text.',
  path: ['jobText'],
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const input = jobAnalysisRequestSchema.parse(await request.json())
    const jobText = input.jobText && input.jobText.length >= 20
      ? input.jobText
      : await fetchJobTextFromUrl(input.applyUrl as string, {
        renderPageText: renderJobPageTextWithPlaywright,
      })
    const analysis = analyzePastedJob({ ...input, jobText })
    const created = await createJobAnalysisWithNetworkAlerts(supabase, user.id, analysis)

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }

    if (err instanceof JobTextFetchError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    console.error('Job analysis failed', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to analyze job' },
      { status: 500 }
    )
  }
}
