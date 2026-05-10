"use client"

import { useEffect, useState } from 'react'
import { List } from 'lucide-react'

interface Heading { id: string; text: string; level: number }

interface Props { headings: Heading[] }

export default function TableOfContents({ headings }: Props) {
  const [active, setActive] = useState('')
  const [open, setOpen]     = useState(false) // collapsed by default; opens on md+ via useEffect

  useEffect(() => {
    setOpen(window.matchMedia('(min-width: 768px)').matches)
  }, [])

  useEffect(() => {
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )
    headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors">
        <div className="flex items-center gap-2">
          <List className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Contents</span>
        </div>
        <span className="text-[10px] text-zinc-600">{open ? 'hide' : 'show'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-1 border-t border-zinc-800">
          {headings.map(h => (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={e => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
              className={`text-xs leading-relaxed transition-colors hover:text-orange-400 py-0.5 ${
                h.level === 3 ? 'pl-3 text-zinc-600' : 'text-zinc-400'
              } ${active === h.id ? 'text-orange-400 font-semibold' : ''}`}
            >
              {h.level === 2 ? '— ' : '  · '}{h.text}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
