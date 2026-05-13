'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(prevState: string | null, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return error.message
  const next = formData.get('next') as string
  redirect(next?.startsWith('/') ? next : '/dashboard')
}

export async function signup(prevState: string | null, formData: FormData) {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })
  if (error) return error.message
  return 'check_email'
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // No redirect here — callers use window.location.href='/' for a hard reload
  // so the Next.js router cache is fully cleared and the sign-out is instant.
}

export async function resendVerification(email: string) {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })
  if (error) return error.message
  return 'sent'
}
