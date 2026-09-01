import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')

  if (!platform) {
    return NextResponse.json({ error: 'platform query param is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ats_field_mappings')
    .select('*')
    .eq('platform', platform)
    .eq('is_active', true)
    .order('version', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data?.length) {
    return NextResponse.json({ error: 'No active mapping config found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
