import type { Metadata } from 'next'
import { getAdminSupabase } from '@/lib/admin'
import type { Note } from '@/lib/notes-data'
import NotesClient from './NotesClient'

export const revalidate = 30

export const metadata: Metadata = {
  title: 'Notes & Study Guides | AmanAI Lab',
  description:
    'Premium AI/ML notes from AmanAI Lab YouTube videos. YouTube members get all notes free. Buy any note for ₹99. DSA, ML, LLM, System Design, MLOps and more.',
  alternates: { canonical: 'https://amanailab.com/notes' },
  openGraph: {
    title: 'Notes & Study Guides — AmanAI Lab',
    description: 'Premium handcrafted notes for AI/ML interviews. YouTube members get everything free. Buy any note for ₹99.',
    images: [{
      url: '/api/og/tool?name=Notes+%26+Study+Guides&tagline=Premium+AI%2FML+notes+%E2%80%94+free+for+members&emoji=%F0%9F%93%9A&tool=notes',
      width: 1200, height: 630,
    }],
  },
  twitter: { card: 'summary_large_image' },
}

async function getNotes(): Promise<Note[]> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    return (data as Note[]) ?? []
  } catch {
    return []
  }
}

export default async function NotesPage() {
  const notes = await getNotes()
  return (
    <div className="pt-20">
      <NotesClient notes={notes} />
    </div>
  )
}
