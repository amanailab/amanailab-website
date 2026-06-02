import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getAdminSupabase } from '@/lib/admin'
import { verifyAdminSession } from '@/lib/auth-tokens'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const cookieStore = await cookies()
  if (!(await verifyAdminSession(cookieStore.get('admin_session')?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 })
  }

  try {
    const sb = getAdminSupabase()
    const { error } = await sb
      .from('code_problems')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePath('/admin/code-problems')
    revalidatePath('/code-lab')

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin/code-problems DELETE]', e)
    return NextResponse.json({ error: 'Failed to delete problem' }, { status: 500 })
  }
}
