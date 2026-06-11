// Shared slug helpers for individual question pages (/questions/[slug]).
// Slug shape: `<kebab-question-text>-<g|c><id>` — the trailing token encodes
// the source table (g = interview_questions, c = company_questions) and row id,
// so lookups never depend on the text part staying stable.

export function slugifyQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 12)
    .join('-')
}

export function buildQuestionSlug(source: 'general' | 'company', id: number | string, question: string): string {
  const prefix = source === 'general' ? 'g' : 'c'
  return `${slugifyQuestion(question)}-${prefix}${id}`
}

export function parseQuestionSlug(slug: string): { source: 'general' | 'company'; id: number } | null {
  const m = slug.match(/-([gc])(\d+)$/)
  if (!m) return null
  return { source: m[1] === 'g' ? 'general' : 'company', id: Number(m[2]) }
}
