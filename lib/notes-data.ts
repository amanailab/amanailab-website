// Type matching the Supabase `notes` table columns (snake_case).
// To add new notes: go to /admin/notes on your website.
export type Note = {
  id: string
  title: string
  description: string
  topic: string
  pages: number
  emoji: string
  gradient: string        // Tailwind gradient, e.g. "from-blue-600 to-indigo-700"
  preview_points: string[]
  price: number
  pdf_path: string        // filename inside the Supabase "notes" storage bucket
  is_new: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}
