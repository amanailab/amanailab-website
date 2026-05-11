export const revalidate = 3600

import { getAdminSupabase } from '@/lib/admin'
import { Building2 } from 'lucide-react'
import CompaniesClient from './CompaniesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI/ML Interview Prep by Company | AmanAI Lab',
  description: 'Company-specific AI/ML interview preparation. Google, Meta, OpenAI, Anthropic, Microsoft and more — real questions, interview formats, and insider tips.',
  alternates: { canonical: 'https://amanailab.com/companies' },
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

        <CompaniesClient featured={featured} rest={rest} counts={counts} />

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
