import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { DESIGN_PROBLEM_MAP, SYSTEM_DESIGN_PROBLEMS } from '@/lib/system-design-problems'
import { createClient } from '@/lib/supabase/server'
import DesignPad from './DesignPad'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return SYSTEM_DESIGN_PROBLEMS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const problem = DESIGN_PROBLEM_MAP[slug]
  if (!problem) return { title: 'System Design Practice' }
  return {
    title: `${problem.title} — System Design Practice | AmanAI Lab`,
    description: `Practice "${problem.title}" — write your system design answer, check key areas, and get AI feedback. Free ML system design interview prep.`,
    alternates: { canonical: `https://amanailab.com/system-design/${slug}` },
  }
}

export default async function DesignPage({ params }: Props) {
  const { slug } = await params
  const problem = DESIGN_PROBLEM_MAP[slug]
  if (!problem) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/system-design/${slug}`)

  return <DesignPad problem={problem} />
}
