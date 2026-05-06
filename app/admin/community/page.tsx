import AdminNav from '@/components/admin/AdminNav'
import CommunityManager from '@/components/admin/CommunityManager'
import { getAdminSupabase } from '@/lib/admin'

async function getData() {
  const supabase = getAdminSupabase()
  const [{ data: pending }, { data: approved }] = await Promise.all([
    supabase.from('community_posts').select('*').eq('approved', false).order('created_at', { ascending: false }),
    supabase.from('community_posts').select('*').eq('approved', true).order('created_at', { ascending: false }).limit(50),
  ])
  return { pending: pending ?? [], approved: approved ?? [] }
}

export default async function AdminCommunityPage() {
  const { pending, approved } = await getData()
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Community</h1>
            <p className="text-zinc-500 text-sm mt-1">{pending.length} pending · {approved.length} approved</p>
          </div>
          <CommunityManager pending={pending} approved={approved} />
        </div>
      </main>
    </div>
  )
}
