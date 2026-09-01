import { createEvidenceSource } from '@/lib/knowledge-graph/repository'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const created = await createEvidenceSource(supabase, user.id, await request.json())
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create evidence source' },
      { status: 500 }
    )
  }
}
