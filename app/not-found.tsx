import Link from 'next/link'
import { BrainCircuit, ArrowRight, Building2, Library, MessageSquare } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-lg w-full">

        {/* 404 */}
        <div className="text-[96px] font-extrabold text-zinc-800 leading-none mb-4 select-none">
          404
        </div>

        <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BrainCircuit className="w-7 h-7 text-orange-400" />
        </div>

        <h1 className="text-2xl font-extrabold text-zinc-100 mb-2">Page not found</h1>
        <p className="text-zinc-500 text-sm mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or was moved. Here are some useful links:
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm mx-auto">
          {[
            { href: '/interview',  label: 'AI Simulator',   icon: BrainCircuit },
            { href: '/companies',  label: 'Company Prep',   icon: Building2    },
            { href: '/questions',  label: 'Question Bank',  icon: Library      },
            { href: '/community',  label: 'Community',      icon: MessageSquare},
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-300 hover:text-zinc-100 transition-all"
            >
              <Icon className="w-4 h-4 text-zinc-500" />
              {label}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
        >
          Go to Homepage <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
