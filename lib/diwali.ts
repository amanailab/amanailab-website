import { getAdminSupabase } from '@/lib/admin'
import { DIWALI } from '@/lib/diwali-config'

// Seats taken = learners you have selected or who have paid.
export async function getSeatsLeft(): Promise<number> {
  try {
    const supabase = getAdminSupabase()
    const { count, error } = await supabase
      .from('diwali_applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['selected', 'paid'])
    if (error) return DIWALI.totalSeats
    return Math.max(0, DIWALI.totalSeats - (count ?? 0))
  } catch {
    return DIWALI.totalSeats
  }
}
