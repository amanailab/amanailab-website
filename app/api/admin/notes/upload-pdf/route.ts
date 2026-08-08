import { NextResponse } from 'next/server'
import { cookies }       from 'next/headers'
import { createClient }  from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth-tokens'

export const runtime = 'nodejs'

const BUCKET = 'notes'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (!(await verifyAdminSession(cookieStore.get('admin_session')?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'PDF files only.' }, { status: 400 })
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 50 MB.` }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    )

    // Auto-create private bucket on first upload (same pattern as blog-images bucket)
    const { data: bucket, error: bucketErr } = await supabase.storage.getBucket(BUCKET)
    if (bucketErr && !/not found/i.test(bucketErr.message)) {
      return NextResponse.json({ error: `Storage error: ${bucketErr.message}` }, { status: 500 })
    }
    if (!bucket) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: false,          // private — PDFs served via signed URLs only
        fileSizeLimit: 50 * 1024 * 1024,
      })
      if (createErr && !/already exists/i.test(createErr.message)) {
        return NextResponse.json({ error: `Could not create bucket: ${createErr.message}` }, { status: 500 })
      }
    }

    // Unique filename: timestamp + random + original name (sanitised)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')
    const path     = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: 'application/pdf', upsert: false })

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    return NextResponse.json({ pdf_path: path, file_name: file.name, size: file.size })
  } catch (err) {
    console.error('[upload-pdf]', err)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
