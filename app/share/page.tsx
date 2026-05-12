import type { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, ArrowRight, BrainCircuit } from 'lucide-react'

interface Props {
  searchParams: Promise<{ t?: string; s?: string; g?: string; l?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { t = 'AI/ML', s = '0', g = 'F', l = 'Mid' } = await searchParams
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'
  const imageUrl = `${siteUrl}/api/share/score-card?t=${encodeURIComponent(t)}&s=${encodeURIComponent(s)}&g=${encodeURIComponent(g)}&l=${encodeURIComponent(l)}`

  return {
    title: `I scored ${g} (${s}/10) on ${t} interview prep`,
    description: `Check out my AI/ML interview score on AmanAI Lab — the free platform for AI/ML interview preparation. Try it yourself!`,
    openGraph: {
      title: `I scored ${g} on ${t} interview prep | AmanAI Lab`,
      description: `Score: ${s}/10 · ${l} level · Free practice at amanailab.com`,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `AmanAI Lab Score Card: ${g} on ${t}` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `I scored ${g} on ${t} interview prep`,
      description: `Score: ${s}/10 · Practice free at amanailab.com`,
      images: [imageUrl],
    },
  }
}

const TOPIC_COLOR: Record<string, string> = {
  LLM:             'bg-blue-500/20 text-blue-300 border-blue-500/30',
  RAG:             'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Agents:          'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Fine-Tuning':   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  MLOps:           'bg-green-500/20 text-green-300 border-green-500/30',
  Transformers:    'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'System Design': 'bg-red-500/20 text-red-300 border-red-500/30',
  Python:          'bg-lime-500/20 text-lime-300 border-lime-500/30',
  'Vector DB':     'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Computer Vision':'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  NLP:             'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Statistics:      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'SQL & Data':    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Behavioral:      'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

function gradeColor(g: string) {
  if (g.startsWith('A')) return 'text-green-400'
  if (g === 'B')         return 'text-blue-400'
  if (g === 'C')         return 'text-yellow-400'
  return 'text-red-400'
}

function gradeBg(g: string) {
  if (g.startsWith('A')) return 'bg-green-500/10 border-green-500/20'
  if (g === 'B')         return 'bg-blue-500/10 border-blue-500/20'
  if (g === 'C')         return 'bg-yellow-500/10 border-yellow-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

export default async function SharePage({ searchParams }: Props) {
  const { t: topic = 'AI/ML', s: score = '0', g: grade = 'F', l: level = 'Mid' } = await searchParams
  const topicBadge  = TOPIC_COLOR[topic] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'
  const gColor      = gradeColor(grade)
  const gBg         = gradeBg(grade)

  const gradeMsg = grade === 'A+' || grade === 'A' ? 'Excellent performance!'
    : grade === 'B' ? 'Good performance — keep going!'
    : grade === 'C' ? 'Decent — more practice needed'
    : 'Keep studying and try again'

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
      {/* Card */}
      <div className="w-full max-w-lg">
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 rounded-t-2xl" />

        <div className="bg-zinc-900 border border-zinc-800 rounded-b-2xl p-8 flex flex-col gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-sm font-bold text-zinc-300">
              Aman<span className="text-orange-500">AI</span>
              <span className="text-zinc-500 font-normal"> Lab</span>
            </span>
          </div>

          {/* Score hero */}
          <div className={`rounded-2xl border p-6 flex items-center gap-6 ${gBg}`}>
            <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center shrink-0 ${gBg}`}>
              <span className={`text-4xl font-extrabold ${gColor}`}>{grade}</span>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">Interview Score</p>
              <p className={`text-5xl font-extrabold ${gColor}`}>
                {score}<span className="text-2xl text-zinc-500 font-normal">/10</span>
              </p>
              <p className="text-sm text-zinc-400 mt-1">{gradeMsg}</p>
            </div>
          </div>

          {/* Topic + level */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${topicBadge}`}>
              {topic}
            </span>
            <span className="text-sm text-zinc-500">{level} level</span>
            <Trophy className="w-4 h-4 text-yellow-400 ml-auto" />
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800" />

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400 text-center">
              Practice AI/ML interview questions free — track your score, improve over time.
            </p>
            <Link
              href="/interview?tab=simulator"
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
            >
              <BrainCircuit className="w-4 h-4" /> Try it yourself — it&apos;s free
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              Explore AmanAI Lab <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-600 mt-6">amanailab.com · Free AI/ML Interview Preparation</p>
    </div>
  )
}
