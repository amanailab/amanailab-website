'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { User } from '@supabase/supabase-js'

export type UserState = User | null | 'loading'

export function useUser(): UserState {
  const [user, setUser] = useState<UserState>('loading')
  const prevUserRef = useRef<User | null | 'loading'>('loading')
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      prevUserRef.current = user ?? null
      setUser(user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null

      if (
        event === 'SIGNED_OUT' &&
        prevUserRef.current !== 'loading' &&
        prevUserRef.current !== null
      ) {
        // A real user just got signed out — detect if it was intentional (logout
        // action redirects to '/') or an expired session (we stay on the same page).
        if (pathname !== '/') {
          toast('Session expired — please sign in again', 'info')
          router.push(`/login?next=${encodeURIComponent(pathname)}`)
        }
      }

      prevUserRef.current = currentUser
      setUser(currentUser)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return user
}
