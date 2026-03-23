import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  getLatestCommitSha, getRepoDiff,
  parseAddedMarkdownRows, regexParseJobRow,
} from '@/lib/github/sync'
import { sanitizeLocation, extractCompanyDomain } from '@/lib/utils'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const authToken = authHeader?.replace('Bearer ', '')
  const isValid =
    authToken === process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (!!process.env.CRON_SECRET && authToken === process.env.CRON_SECRET)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const token = process.env.GITHUB_TOKEN!

  const { data: sources } = await supabase
    .from('job_sources')
    .select('*')
    .eq('is_active', true)

  let totalNew = 0
  for (const source of sources ?? []) {
    const currentSha = await getLatestCommitSha(source.repo_name, token)
    if (currentSha === source.last_synced_sha) continue

    const diff = await getRepoDiff(source.repo_name, source.last_synced_sha, currentSha, token)
    const newRows = parseAddedMarkdownRows(diff)

    let lastCompanyName = ''
    for (const row of newRows) {
      const parsed = regexParseJobRow(row)
      if (!parsed || !parsed.is_active) continue

      // Carry forward company name for continuation rows
      let company = parsed.company
      if (parsed.isContinuation) {
        company = parsed.company || lastCompanyName
      } else {
        lastCompanyName = parsed.company
      }

      const { error } = await supabase.from('jobs').upsert({
        source_id: source.id,
        source_url: `https://github.com/${source.repo_name}`,
        title: parsed.title,
        company,
        location: parsed.location ? sanitizeLocation(parsed.location) : null,
        job_type: source.job_type_tag,
        apply_url: parsed.apply_url,
        required_skills: [],
        preferred_skills: [],
        is_active: true,
        first_seen_at: new Date().toISOString(),
        company_domain: extractCompanyDomain(parsed.apply_url, company),
      }, { onConflict: 'source_id,apply_url', ignoreDuplicates: true })

      if (!error) totalNew++
    }

    await supabase
      .from('job_sources')
      .update({ last_synced_sha: currentSha, last_synced_at: new Date().toISOString() })
      .eq('id', source.id)
  }

  return NextResponse.json({ synced: totalNew })
}
