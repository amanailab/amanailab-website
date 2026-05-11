"use client"

import { useEffect, useRef } from 'react'

export default function GiscusComments({ slug: _slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || ref.current.childElementCount > 0) return
    const script = document.createElement('script')
    script.src            = 'https://giscus.app/client.js'
    script.setAttribute('data-repo',             'amanailab/amanailab-website')
    script.setAttribute('data-repo-id',          'R_kgDOSDGHiw')
    script.setAttribute('data-category',         'General')
    script.setAttribute('data-category-id',      'DIC_kwDOSDGHi84C8wi_')
    script.setAttribute('data-mapping',          'pathname')
    script.setAttribute('data-strict',           '0')
    script.setAttribute('data-reactions-enabled','1')
    script.setAttribute('data-emit-metadata',    '0')
    script.setAttribute('data-input-position',   'bottom')
    script.setAttribute('data-theme',            'dark_tritanopia')
    script.setAttribute('data-lang',             'en')
    script.crossOrigin  = 'anonymous'
    script.async        = true
    ref.current.appendChild(script)
  }, [])

  return (
    <div className="mt-10 pt-8 border-t border-zinc-800">
      <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">
        💬 Discussion
      </h2>
      <p className="text-xs text-zinc-600 mb-4">
        Comments powered by <a href="https://giscus.app" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Giscus</a> · Requires a GitHub account
      </p>
      <div ref={ref} />
    </div>
  )
}
