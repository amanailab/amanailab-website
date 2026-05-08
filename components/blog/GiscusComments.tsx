"use client"

import { useEffect, useRef } from 'react'

interface Props { slug: string }

export default function GiscusComments({ slug }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || ref.current.childElementCount > 0) return
    const script = document.createElement('script')
    script.src            = 'https://giscus.app/client.js'
    script.setAttribute('data-repo',            'amanailab/amanailab-website')
    script.setAttribute('data-repo-id',         'YOUR_REPO_ID')        // ← replace with Giscus repo ID
    script.setAttribute('data-category',        'Blog Comments')
    script.setAttribute('data-category-id',     'YOUR_CATEGORY_ID')   // ← replace with Giscus category ID
    script.setAttribute('data-mapping',         'specific')
    script.setAttribute('data-term',            slug)
    script.setAttribute('data-strict',          '0')
    script.setAttribute('data-reactions-enabled','1')
    script.setAttribute('data-emit-metadata',   '0')
    script.setAttribute('data-input-position',  'top')
    script.setAttribute('data-theme',           'dark_dimmed')
    script.setAttribute('data-lang',            'en')
    script.crossOrigin  = 'anonymous'
    script.async        = true
    ref.current.appendChild(script)
  }, [slug])

  return (
    <div className="mt-10 pt-8 border-t border-zinc-800">
      <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">
        💬 Discussion
      </h2>
      <p className="text-xs text-zinc-600 mb-4">
        Comments powered by Giscus (GitHub Discussions). Requires a GitHub account.
        To enable: visit <a href="https://giscus.app" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">giscus.app</a> and replace the IDs in GiscusComments.tsx.
      </p>
      <div ref={ref} />
    </div>
  )
}
