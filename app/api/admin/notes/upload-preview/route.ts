import { NextResponse } from 'next/server'
import { cookies }       from 'next/headers'
import { createClient }  from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth-tokens'

export const runtime = 'nodejs'

const BUCKET = 'note-previews'

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
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'PNG, JPG or WebP images only.' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Max 5 MB.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    )

    // Ensure public bucket exists
    const { data: bucket, error: bucketErr } = await supabase.storage.getBucket(BUCKET)
    if (bucketErr && !/not found/i.test(bucketErr.message)) {
      return NextResponse.json({ error: `Storage error: ${bucketErr.message}` }, { status: 500 })
    }
    if (!bucket) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: allowed,
      })
      if (createErr && !/already exists/i.test(createErr.message)) {
        return NextResponse.json({ error: `Could not create bucket: ${createErr.message}` }, { status: 500 })
      }
    }

    const ext    = file.name.split('.').pop() ?? 'png'
    const path   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ preview_image: publicUrl })
  } catch (err) {
    console.error('[upload-preview]', err)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
