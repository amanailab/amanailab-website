import { createClient } from '@supabase/supabase-js'

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  description: string | null
  content: string
  category: string
  tags: string[]
  cover_image: string | null
  read_time: string
  published: boolean
  created_at: string
  updated_at: string
}

export type BlogPostInput = {
  title: string
  slug: string
  description: string
  content: string
  category: string
  tags: string[]
  cover_image: string
  read_time: string
  published: boolean
}
