import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Secured by ADMIN_UPLOAD_KEY env var — set this in Vercel
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

interface Question {
  question: string
  answer: string
  topic: string
  level: string
  company?: string | null
  source?: string | null
  tags?: string[]
}

interface Company {
  name: string
  slug: string
  logo_emoji?: string
  tagline?: string
  hq?: string
  size?: string
  interview_rounds?: number
  interview_format?: string
  what_they_look_for?: string[]
  tips?: string[]
  description?: string
}

interface NewsArticle {
  title: string
  summary: string
  url: string
  category: string
  source?: string
  published_at?: string
}

const VALID_TOPICS = ['LLM', 'RAG', 'Agents', 'Fine-Tuning', 'MLOps', 'Transformers', 'System Design', 'Python', 'Vector DB', 'Computer Vision', 'NLP', 'Statistics', 'SQL & Data', 'Behavioral']
const VALID_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead']

export async function POST(req: NextRequest) {
  // Authenticate with API key
  const auth = req.headers.get('authorization')
  const key  = process.env.ADMIN_UPLOAD_KEY
  if (!key || auth !== `Bearer ${key}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type = 'questions', data } = body

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'data must be a non-empty array' }, { status: 400 })
    }

    const sb = getAdmin()
    const results = { inserted: 0, skipped: 0, errors: [] as string[] }

    // ── QUESTIONS ──────────────────────────────────────────────────────────────
    if (type === 'questions') {
      const rows = (data as Question[]).map((q, i) => {
        if (!q.question?.trim() || !q.answer?.trim()) {
          results.errors.push(`Row ${i}: missing question or answer`)
          results.skipped++
          return null
        }
        const topic = VALID_TOPICS.includes(q.topic) ? q.topic : 'LLM'
        const level = VALID_LEVELS.includes(q.level) ? q.level : 'Mid'
        return {
          question: q.question.trim(),
          answer:   q.answer.trim(),
          topic,
          level,
          company:  q.company  ?? null,
          source:   q.source   ?? null,
          tags:     q.tags     ?? [],
        }
      }).filter(Boolean)

      if (rows.length > 0) {
        const { error } = await sb
          .from('interview_questions')
          .insert(rows)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        results.inserted = rows.length
      }
    }

    // ── NEWS ARTICLES ──────────────────────────────────────────────────────────
    else if (type === 'news') {
      const VALID_CATS = ['models', 'research', 'tools', 'agents', 'india_ai', 'general']
      const rows = (data as NewsArticle[]).map((n, i) => {
        if (!n.title?.trim() || !n.url?.trim()) {
          results.errors.push(`Row ${i}: missing title or url`)
          results.skipped++
          return null
        }
        return {
          title:        n.title.trim(),
          summary:      n.summary?.trim() ?? '',
          url:          n.url.trim(),
          category:     VALID_CATS.includes(n.category) ? n.category : 'general',
          source:       n.source ?? null,
          published_at: n.published_at ?? new Date().toISOString(),
        }
      }).filter(Boolean)

      if (rows.length > 0) {
        // Upsert by URL to avoid duplicates
        const { error, data: inserted } = await sb
          .from('news_articles')
          .upsert(rows, { onConflict: 'url', ignoreDuplicates: true })
          .select('id')
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        results.inserted = inserted?.length ?? rows.length
      }
    }

    // ── COMPANIES ──────────────────────────────────────────────────────────────
    else if (type === 'companies') {
      const rows = (data as Company[]).map((c, i) => {
        if (!c.name?.trim() || !c.slug?.trim()) {
          results.errors.push(`Row ${i}: missing name or slug`)
          results.skipped++
          return null
        }
        return {
          name:               c.name.trim(),
          slug:               c.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          logo_emoji:         c.logo_emoji ?? '🏢',
          tagline:            c.tagline ?? '',
          description:        c.description ?? '',
          hq:                 c.hq ?? '',
          size:               c.size ?? '',
          interview_rounds:   c.interview_rounds ?? 4,
          interview_format:   c.interview_format ?? '',
          what_they_look_for: c.what_they_look_for ?? [],
          tips:               c.tips ?? [],
          is_featured:        false,
        }
      }).filter(Boolean)

      if (rows.length > 0) {
        const { error, data: inserted } = await sb
          .from('companies')
          .upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
          .select('id')
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        results.inserted = inserted?.length ?? rows.length
      }
    }

    // ── CODE PROBLEMS ──────────────────────────────────────────────────────────
    else if (type === 'code_problems') {
      const rows = (data as Record<string, unknown>[]).map((p, i) => {
        if (!p.title || !p.slug) {
          results.errors.push(`Row ${i}: missing title or slug`)
          results.skipped++
          return null
        }
        return {
          title:        p.title,
          slug:         String(p.slug).toLowerCase().replace(/\s+/g, '-'),
          difficulty:   p.difficulty ?? 'Easy',
          topic:        p.topic ?? 'Math',
          tags:         p.tags ?? [],
          companies:    p.companies ?? [],
          description:  p.description ?? '',
          starter_code: p.starter_code ?? '',
          test_cases:   p.test_cases ?? [],
          hints:        p.hints ?? [],
          order_index:  p.order_index ?? 99,
        }
      }).filter(Boolean)

      if (rows.length > 0) {
        const { error, data: inserted } = await sb
          .from('code_problems')
          .upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
          .select('id')
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        results.inserted = inserted?.length ?? rows.length
      }
    }

    else {
      return NextResponse.json({ error: `Unknown type "${type}". Use: questions, news, companies, code_problems` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type,
      inserted: results.inserted,
      skipped:  results.skipped,
      errors:   results.errors,
    })
  } catch (e) {
    console.error('[admin/bulk-upload]', e)
    return NextResponse.json({ error: 'Bulk upload failed' }, { status: 500 })
  }
}
