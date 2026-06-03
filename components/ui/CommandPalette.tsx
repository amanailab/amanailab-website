"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, BrainCircuit, Flame, FileText, Code2, BarChart2,
  Briefcase, Wand2, Sparkles, BookOpen, Library, Building2,
  Layers, MessageSquare, Map, Newspaper, LayoutDashboard, X, ArrowRight,
  Target,
} from 'lucide-react'
import { SITE_STATS } from '@/lib/site-stats'

interface Command {
  id: string; label: string; desc?: string
  icon: React.ReactNode; href: string; group: string; tag?: string
}

const COMMANDS: Command[] = [
  // Quick Actions
  { id: 'interview',  label: 'Start AI Interview',     desc: 'Timed mock with AI scoring',         icon: <BrainCircuit className="w-4 h-4" />, href: '/interview?tab=simulator', group: 'Quick Actions' },
  { id: 'daily',      label: "Today's Daily Challenge",desc: 'One AI/ML question daily',           icon: <Flame className="w-4 h-4" />,        href: '/daily',                  group: 'Quick Actions' },
  { id: 'resume',     label: 'Analyze My Resume',       desc: 'ATS score + AI improvements',       icon: <Target className="w-4 h-4" />,        href: '/resume',                 group: 'Quick Actions' },
  { id: 'dashboard',  label: 'My Dashboard',             desc: 'Progress + streak + leaderboard',  icon: <LayoutDashboard className="w-4 h-4" />, href: '/dashboard',            group: 'Quick Actions' },
  // Tools
  { id: 'code-lab',      label: 'Code Lab',             desc: 'Code AI/ML algorithms, earn XP',    icon: <Code2 className="w-4 h-4" />,         href: '/code-lab',              group: 'Tools', tag: 'New' },
  { id: 'playground',    label: 'Code Playground',      desc: 'Monaco editor + AI assistant',      icon: <Code2 className="w-4 h-4" />,         href: '/playground',            group: 'Tools', tag: 'New' },
  { id: 'linkedin-opt',  label: 'LinkedIn Optimizer',   desc: 'AI-rewritten profile',              icon: <BarChart2 className="w-4 h-4" />,     href: '/linkedin-optimizer',    group: 'Tools' },
  { id: 'job-prep',      label: 'Job Prep',             desc: 'Paste JD → tailored questions',     icon: <Briefcase className="w-4 h-4" />,     href: '/job-prep',              group: 'Tools' },
  { id: 'prompt-gen',    label: 'Prompt Generator',     desc: 'Perfect prompts for any AI',        icon: <Wand2 className="w-4 h-4" />,         href: '/prompt',                group: 'Tools' },
  { id: 'quiz',          label: 'Skill Quiz',           desc: 'AI-generated MCQ assessment',       icon: <Sparkles className="w-4 h-4" />,      href: '/quiz',                  group: 'Tools' },
  { id: 'paper',         label: 'Paper Explainer',      desc: 'Any arXiv paper explained',         icon: <BookOpen className="w-4 h-4" />,      href: '/paper-explainer',       group: 'Tools' },
  // Interview
  { id: 'questions',  label: 'Question Bank',           desc: `${SITE_STATS.questions} AI/ML questions`,              icon: <Library className="w-4 h-4" />,       href: '/questions',             group: 'Interview' },
  { id: 'companies',  label: 'Company Prep',            desc: 'Google, Meta, OpenAI & more',       icon: <Building2 className="w-4 h-4" />,     href: '/companies',             group: 'Interview' },
  { id: 'flashcards', label: 'Flashcards',              desc: '5-min daily practice',              icon: <BookOpen className="w-4 h-4" />,      href: '/flashcards',            group: 'Interview' },
  { id: 'topics',     label: 'Topic Guides',            desc: 'Deep-dive AI/ML guides',            icon: <Layers className="w-4 h-4" />,        href: '/topics',                group: 'Interview' },
  { id: 'community',  label: 'Community',               desc: 'Real interview experiences',        icon: <MessageSquare className="w-4 h-4" />, href: '/community',             group: 'Interview' },
  // Learn
  { id: 'blog',       label: 'Blog',                    desc: 'In-depth AI/ML articles',           icon: <FileText className="w-4 h-4" />,      href: '/blog',                  group: 'Learn' },
  { id: 'news',       label: 'AI News Feed',            desc: 'Daily curated AI news',             icon: <Newspaper className="w-4 h-4" />,     href: '/news',                  group: 'Learn' },
  { id: 'series',     label: 'YouTube Series',          desc: 'Structured video courses',          icon: <BrainCircuit className="w-4 h-4" />,  href: '/series',                group: 'Learn' },
  { id: 'resources',  label: 'Free Resources',          desc: 'Cheat sheets + PDFs',               icon: <BookOpen className="w-4 h-4" />,      href: '/resources',             group: 'Learn' },
  { id: 'career',     label: 'Career Roadmap',          desc: 'Week-by-week AI/ML learning path',  icon: <Map className="w-4 h-4" />,           href: '/career',                group: 'Learn' },
]

const GROUP_ORDER = ['Quick Actions', 'Tools', 'Interview', 'Learn']

export default function CommandPalette() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [cursor, setCursor]   = useState(0)
  const inputRef              = useRef<HTMLInputElement>(null)
  const router                = useRouter()

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.desc?.toLowerCase().includes(query.toLowerCase())) ||
        c.group.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS

  // Group the results
  const grouped = GROUP_ORDER.reduce<Record<string, Command[]>>((acc, g) => {
    const items = filtered.filter(c => c.group === g)
    if (items.length) acc[g] = items
    return acc
  }, {})

  const flatFiltered = Object.values(grouped).flat()

  const execute = useCallback((cmd: Command) => {
    setOpen(false)
    router.push(cmd.href)
  }, [router])

  // Arrow key navigation
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flatFiltered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && flatFiltered[cursor]) execute(flatFiltered[cursor])
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, cursor, flatFiltered, execute])

  if (!open) return null

  let itemIndex = 0

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-slide-up">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0) }}
            placeholder="Search tools, pages, actions…"
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 outline-none"
          />
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-zinc-800 rounded transition-colors">
            <X className="w-3.5 h-3.5 text-zinc-600" />
          </button>
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {flatFiltered.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-8">No results for &quot;{query}&quot;</p>
          )}

          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-4 pt-3 pb-1.5">
                {group}
              </p>
              {items.map(cmd => {
                const idx = itemIndex++
                const active = idx === cursor
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => execute(cmd)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${active ? 'bg-orange-500/10' : 'hover:bg-zinc-800/50'}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${active ? 'text-zinc-100' : 'text-zinc-300'}`}>
                          {cmd.label}
                        </span>
                        {cmd.tag && (
                          <span className="text-[9px] font-bold bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                            {cmd.tag}
                          </span>
                        )}
                      </div>
                      {cmd.desc && <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{cmd.desc}</p>}
                    </div>
                    {active && <ArrowRight className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3 text-[10px] text-zinc-600">
            <span className="flex items-center gap-1"><kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded font-mono">↵</kbd> open</span>
          </div>
          <span className="text-[10px] text-zinc-700">{flatFiltered.length} results</span>
        </div>
      </div>
    </div>
  )
}
