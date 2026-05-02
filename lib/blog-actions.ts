'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getAdminSupabase, type BlogPostInput } from './admin'

export async function loginAction(prevState: { error: string } | null, formData: FormData) {
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
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('blog_posts').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  return { success: true }
}

export async function updatePostAction(id: string, data: BlogPostInput) {
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
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  return { success: true }
}

export async function togglePublishAction(id: string, published: boolean) {
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
