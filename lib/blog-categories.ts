// Single source of truth for blog categories and their badge styles.
// The blog list (filter chips + badges) and the admin editor dropdown both read
// from here so their category lists can never drift out of sync.
export const BLOG_CATEGORY_STYLES: Record<string, string> = {
  Tutorials:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Interview Prep': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Companies:        'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Career:           'bg-green-500/10 text-green-400 border-green-500/20',
  RAG:              'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Agents:           'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Fine-Tuning':    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  MLOps:            'bg-red-500/10 text-red-400 border-red-500/20',
  'System Design':  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Tools:            'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  General:          'bg-zinc-700/40 text-zinc-300 border-zinc-600/40',
}

export const BLOG_CATEGORIES = Object.keys(BLOG_CATEGORY_STYLES)

export function blogCategoryStyle(category: string): string {
  return BLOG_CATEGORY_STYLES[category] ?? 'bg-zinc-700 text-zinc-400 border-zinc-600'
}
