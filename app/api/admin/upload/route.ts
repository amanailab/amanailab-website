import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'blog-images'
const MAX_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (!session || session.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Storage not configured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY.' },
      { status: 500 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type || 'unknown'}". Please upload an image (PNG, JPG or WebP).` },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). The maximum is 10MB.` },
      { status: 400 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Cover images must be publicly viewable, so make sure the bucket exists and is
  // public before uploading. This self-heals the most common upload failure
  // (bucket missing or marked private in a fresh Supabase project).
  const { data: bucket, error: bucketErr } = await supabase.storage.getBucket(BUCKET)
  if (bucketErr && !/not found/i.test(bucketErr.message)) {
    return NextResponse.json({ error: `Could not read storage bucket: ${bucketErr.message}` }, { status: 500 })
  }
  if (!bucket) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
    })
    if (createErr && !/already exists/i.test(createErr.message)) {
      return NextResponse.json({ error: `Could not create storage bucket "${BUCKET}": ${createErr.message}` }, { status: 500 })
    }
  } else if (!bucket.public) {
    await supabase.storage.updateBucket(BUCKET, { public: true })
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  if (!data?.publicUrl) {
    return NextResponse.json(
      { error: 'Upload succeeded but no public URL was returned. Make sure the bucket is public.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: data.publicUrl })
}
