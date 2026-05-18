'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getAdminSupabase, type BlogPostInput } from './admin'
import { checkRateLimit, getClientIp } from './rate-limit'
import { headers } from 'next/headers'

async function requireAdmin() {
  const store = await cookies()
  if (store.get('admin_session')?.value !== 'true') throw new Error('Unauthorized')
}

export async function loginAction(prevState: { error: string } | null, formData: FormData) {
  const headersList = await headers()
  const ip = getClientIp({ headers: { get: (k: string) => headersList.get(k) } } as Request)
  const rl = checkRateLimit(`admin-login:${ip}`, 10, 15 * 60_000)
  if (!rl.allowed) return { error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` }

  const password = formData.get('password') as string

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    redirect('/admin/dashboard')
  }

  return { error: 'Invalid password' }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin')
}

export async function createPostAction(data: BlogPostInput) {
  await requireAdmin()
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('blog_posts').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  return { success: true }
}

export async function updatePostAction(id: string, data: BlogPostInput) {
  await requireAdmin()
  const supabase = getAdminSupabase()
  const { error } = await supabase
    .from('blog_posts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/blog')
  revalidatePath(`/blog/${data.slug}`)
  revalidatePath('/admin/blog')
  return { success: true }
}

export async function deletePostAction(id: string) {
  await requireAdmin()
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  return { success: true }
}

export async function togglePublishAction(id: string, published: boolean) {
  await requireAdmin()
  const supabase = getAdminSupabase()
  const { error } = await supabase
    .from('blog_posts')
    .update({ published, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  return { success: true }
}
