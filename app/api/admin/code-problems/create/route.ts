import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/admin'

interface TestCaseInput {
  id: number
  function_call: string
  expected_output: string
  is_hidden: boolean
  description: string
}

interface CreateProblemBody {
  title: string
  slug: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  topic: string
  tags: string[]
  companies: string[]
  description: string
  starter_code: string
  test_cases: TestCaseInput[]
  hints: string[]
  order_index: number
}

export async function POST(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (!session || session.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CreateProblemBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, slug, difficulty, topic, description, starter_code, test_cases } = body

  // Required field validation
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!slug?.trim()) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    return NextResponse.json({ error: 'Difficulty must be Easy, Medium, or Hard' }, { status: 400 })
  }
  if (!topic?.trim()) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }
  if (!starter_code?.trim()) {
    return NextResponse.json({ error: 'Starter code is required' }, { status: 400 })
  }
  if (!Array.isArray(test_cases) || test_cases.length === 0) {
    return NextResponse.json({ error: 'At least one test case is required' }, { status: 400 })
  }
  const validTestCases = test_cases.filter(
    tc => tc.function_call?.trim() && tc.expected_output?.trim()
  )
  if (validTestCases.length === 0) {
    return NextResponse.json(
      { error: 'Each test case must have a function_call and expected_output' },
      { status: 400 }
    )
  }

  const row = {
    title:        title.trim(),
    slug:         slug.trim().toLowerCase().replace(/\s+/g, '-'),
    difficulty,
    topic:        topic.trim(),
    tags:         (body.tags ?? []).map((t: string) => t.trim()).filter(Boolean),
    companies:    (body.companies ?? []).map((c: string) => c.trim()).filter(Boolean),
    description:  description.trim(),
    starter_code: starter_code.trim(),
    test_cases:   validTestCases,
    hints:        (body.hints ?? []).map((h: string) => h.trim()).filter(Boolean),
    order_index:  body.order_index ?? 99,
  }

  try {
    const sb = getAdminSupabase()
    const { error } = await sb
      .from('code_problems')
      .upsert(row, { onConflict: 'slug' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePath('/admin/code-problems')
    revalidatePath('/code-lab')

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
