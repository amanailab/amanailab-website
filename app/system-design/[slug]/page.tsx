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
    title: `${problem.title} System Design Interview — Practice & AI Review | AmanAI Lab`,
    description: `Practice the "${problem.title}" system design interview question. Write your design answer, check must-cover key areas with an interactive checklist, and get AI feedback scoring 5 sections with an interviewer perspective.`,
    alternates: { canonical: `https://amanailab.com/system-design/${slug}` },
    openGraph: {
      title: `${problem.title} — System Design Practice`,
      description: `Structured workspace for the "${problem.title}" ML design question. Editor, checklist, timer, and AI review.`,
      url: `https://amanailab.com/system-design/${slug}`,
    },
  }
}

const breadcrumbJsonLd = (slug: string, title: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',          item: 'https://amanailab.com' },
    { '@type': 'ListItem', position: 2, name: 'System Design', item: 'https://amanailab.com/system-design' },
    { '@type': 'ListItem', position: 3, name: title,           item: `https://amanailab.com/system-design/${slug}` },
  ],
})

export default async function DesignPage({ params }: Props) {
  const { slug } = await params
  const problem = DESIGN_PROBLEM_MAP[slug]
  if (!problem) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/system-design/${slug}`)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(slug, problem.title)) }} />
      <DesignPad problem={problem} />
    </>
  )
}
