'use client'

import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  return (
    <button
      onClick={async () => {
        await logout()
        window.location.href = '/'
      }}
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" /> Sign out
    </button>
  )
}
