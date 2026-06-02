import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Only these columns may be set from the request body — prevents mass-assignment
// of internal columns (id, user_id, timestamps) via a spread of arbitrary JSON.
const ALLOWED_FIELDS = [
  'company_name', 'role_title', 'status', 'location', 'salary_range', 'notes',
  'applied_date', 'company_slug', 'priority', 'interview_date', 'job_url', 'recruiter_name',
] as const

function pickAllowed(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of ALLOWED_FIELDS) if (k in body) out[k] = body[k]
  return out
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('job_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json({ applications: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabase.from('job_applications').insert({ ...pickAllowed(body), user_id: user.id }).select().single()
  if (error) {
    console.error('[job-tracker POST]', error)
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
  }
  return NextResponse.json({ application: data })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  const { data, error } = await supabase.from('job_applications').update({ ...pickAllowed(updates), updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single()
  if (error) {
    console.error('[job-tracker PATCH]', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
  return NextResponse.json({ application: data })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await supabase.from('job_applications').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
