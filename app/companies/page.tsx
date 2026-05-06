import { getAdminSupabase } from '@/lib/admin'
import Link from 'next/link'
import { ArrowRight, Building2, Star } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI/ML Interview Prep by Company | AmanAI Lab',
  description: 'Company-specific AI/ML interview preparation. Google, Meta, OpenAI, Anthropic, Microsoft and more — real questions, interview formats, and insider tips.',
}

interface Company {
  id: number; name: string; slug: string; logo_emoji: string
  tagline: string; hq: string; size: string; interview_rounds: number; is_featured: boolean
}

async function getCompanies() {
  const supabase = getAdminSupabase()
  const { data } = await supabase.from('companies').select('id, name, slug, logo_emoji, tagline, hq, size, interview_rounds, is_featured').order('is_featured', { ascending: false }).order('name')
  return (data ?? []) as Company[]
}

async function getQuestionCounts(): Promise<Record<number, number>> {
  const supabase = getAdminSupabase()
  const { data } = await supabase.from('company_questions').select('company_id')
  const counts: Record<number, number> = {}
  ;(data ?? []).forEach((r: { company_id: number }) => { counts[r.company_id] = (counts[r.company_id] ?? 0) + 1 })
  return counts
}

export default async function CompaniesPage() {
  const [companies, counts] = await Promise.all([getCompanies(), getQuestionCounts()])
  const featured = companies.filter(c => c.is_featured)
  const rest = companies.filter(c => !c.is_featured)

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Company Prep</span>
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-100 mb-3">
            Prepare for your target company
          </h1>
          <p className="text-zinc-400 text-base max-w-xl mx-auto">
            Real questions asked at top AI/ML companies. Interview formats, what they look for, and insider tips.
          </p>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Top AI Companies</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {featured.map(c => (
                <Link
                  key={c.id}
                  href={`/companies/${c.slug}`}
                  className="group bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-orange-500/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{c.logo_emoji}</span>
                      <div>
                        <h2 className="text-base font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">{c.name}</h2>
                        <p className="text-xs text-zinc-500">{c.hq}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{c.tagline}</p>
                  <div className="flex items-center gap-3 pt-1 border-t border-zinc-800">
                    <span className="text-xs text-zinc-500">{c.interview_rounds} rounds</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">{c.size} employees</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-orange-400 font-semibold">{counts[c.id] ?? 0} questions</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">More Companies</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {rest.map(c => (
                <Link
                  key={c.id}
                  href={`/companies/${c.slug}`}
                  className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex items-center gap-3 transition-all"
                >
                  <span className="text-2xl shrink-0">{c.logo_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors">{c.name}</p>
                    <p className="text-xs text-zinc-600 truncate">{c.hq}</p>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">{counts[c.id] ?? 0} Q</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {companies.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">Company profiles coming soon. Check back shortly.</p>
          </div>
        )}
      </div>
    </div>
  )
}
