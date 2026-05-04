import AdminNav from '@/components/admin/AdminNav'
import ResourcesManager from '@/components/admin/ResourcesManager'
import { getAdminSupabase } from '@/lib/admin'

export interface AdminResource {
  id: string
  title: string
  description: string | null
  category: string | null
  file_url: string
  file_name: string | null
  is_free: boolean
  download_count: number
  created_at: string
}

async function getAllResources(): Promise<AdminResource[]> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
    return (data as AdminResource[] | null) ?? []
  } catch (err) {
    console.error('[admin/resources] error:', err)
    return []
  }
}

export default async function AdminResourcesPage() {
  const resources = await getAllResources()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Cheat Sheets</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {resources.length} resource{resources.length === 1 ? '' : 's'} live
            </p>
          </div>
          <ResourcesManager initialResources={resources} />
        </div>
      </main>
    </div>
  )
}
