import { createLatestResumeDraftArtifact } from '@/lib/artifacts/repository'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const artifact = await createLatestResumeDraftArtifact(supabase, user.id)
    return NextResponse.json({ artifact }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create resume draft' },
      { status: 400 }
    )
  }
}
