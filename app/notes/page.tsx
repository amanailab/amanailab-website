import type { Metadata } from 'next'
import { getAdminSupabase } from '@/lib/admin'
import type { Note, NotePackage } from '@/lib/notes-data'
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

// Fetches ALL notes (incl. bundle-only is_active=false) so PackageCard can
// resolve titles/pages for every note_id regardless of public visibility.
async function getAllNotes(): Promise<Note[]> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase
      .from('notes')
      .select('id, title, pages, price, pdf_path, topic, gradient, emoji, is_active')
      .order('sort_order', { ascending: true })
    return (data as Note[]) ?? []
  } catch {
    return []
  }
}

async function getPackages(): Promise<NotePackage[]> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    return (data as NotePackage[]) ?? []
  } catch {
    return []
  }
}

export default async function NotesPage() {
  const [notes, allNotes, packages] = await Promise.all([getNotes(), getAllNotes(), getPackages()])
  return (
    <div className="pt-20">
      <NotesClient notes={notes} allNotes={allNotes} packages={packages} />
    </div>
  )
}
