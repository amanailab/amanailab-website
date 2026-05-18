import AdminNav from '@/components/admin/AdminNav'
import { getAdminSupabase } from '@/lib/admin'
import CompaniesManager from '@/components/admin/CompaniesManager'

export const dynamic = 'force-dynamic'

export interface AdminCompany {
  id: number
  name: string
  slug: string
  logo_emoji: string
  tagline: string
  description: string
  hq: string
  size: string
  interview_rounds: number
  what_they_look_for: string[]
  tips: string[]
  is_featured: boolean
}

export default async function AdminCompaniesPage() {
  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('companies')
    .select('id,name,slug,logo_emoji,tagline,description,hq,size,interview_rounds,what_they_look_for,tips,is_featured')
    .order('name')

  const companies: AdminCompany[] = (data ?? []).map((c: AdminCompany) => ({
    ...c,
    what_they_look_for: c.what_they_look_for ?? [],
    tips: c.tips ?? [],
  }))

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Companies</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage company profiles. Add questions in Company Q&apos;s tab.</p>
          </div>
          <CompaniesManager initial={companies} />
        </div>
      </main>
    </div>
  )
}
