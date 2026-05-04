import AdminNav from '@/components/admin/AdminNav'
import EmailsManager from '@/components/admin/EmailsManager'
import { getAdminSupabase } from '@/lib/admin'

export interface NewsletterRow {
  id: string | number
  email: string
  created_at: string
}

export interface WaitlistRow {
  id: string | number
  email: string
  created_at: string
}

export interface ContactRow {
  id: string | number
  name: string
  email: string
  subject: string | null
  message: string
  created_at: string
}

async function safeFetch<T>(table: string, columns: string): Promise<T[]> {
  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn(`[admin/emails] ${table} error:`, error.message)
      return []
    }
    return (data as T[] | null) ?? []
  } catch (err) {
    console.error(`[admin/emails] ${table} unexpected:`, err)
    return []
  }
}

export default async function AdminEmailsPage() {
  const [newsletter, waitlist, contacts] = await Promise.all([
    safeFetch<NewsletterRow>('newsletter_subscribers', 'id, email, created_at'),
    safeFetch<WaitlistRow>('course_waitlist', 'id, email, created_at'),
    safeFetch<ContactRow>(
      'contact_messages',
      'id, name, email, subject, message, created_at'
    ),
  ])

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Emails & Waitlist</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage newsletter, course waitlist and contact messages
            </p>
          </div>
          <EmailsManager
            newsletter={newsletter}
            waitlist={waitlist}
            contacts={contacts}
          />
        </div>
      </main>
    </div>
  )
}
