import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'PDF files only' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`

    const { error } = await supabase.storage
      .from('pdfs')
      .upload(path, file, { contentType: 'application/pdf', upsert: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data } = supabase.storage.from('pdfs').getPublicUrl(path)
    if (!data?.publicUrl) {
      return NextResponse.json({ error: 'Failed to generate public URL' }, { status: 500 })
    }
    return NextResponse.json({
      url: data.publicUrl,
      path,
      file_name: file.name,
      size: file.size,
    })
  } catch (err) {
    console.error('[admin/resources/upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
