import {
  type GeneratedArtifactStatus,
  updateGeneratedArtifactStatus,
} from '@/lib/artifacts/repository'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

const updateArtifactSchema = z.object({
  status: z.enum(['draft', 'validated', 'approved', 'rejected', 'archived']),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const input = updateArtifactSchema.parse(await request.json())
    const artifact = await updateGeneratedArtifactStatus(
      supabase,
      user.id,
      params.id,
      input.status as GeneratedArtifactStatus
    )

    return NextResponse.json({ artifact })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update artifact' },
      { status: 500 }
    )
  }
}
