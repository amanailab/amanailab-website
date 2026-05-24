'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminEditor from './AdminEditor'
import { createPostAction, updatePostAction } from '@/lib/blog-actions'
import type { BlogPost } from '@/lib/admin'
import { X, Upload, Loader2 } from 'lucide-react'
import { BLOG_CATEGORIES as CATEGORIES } from '@/lib/blog-categories'

// Pick a deterministic gradient per category so placeholders feel distinct.
const CATEGORY_GRADIENTS: Record<string, string> = {
  Tutorials: 'from-orange-500 via-amber-500 to-yellow-500',
  'Interview Prep': 'from-violet-500 via-fuchsia-500 to-pink-500',
  Tools: 'from-cyan-500 via-sky-500 to-blue-500',
  Career: 'from-emerald-500 via-teal-500 to-cyan-500',
  RAG: 'from-blue-500 via-indigo-500 to-violet-500',
  Agents: 'from-pink-500 via-rose-500 to-red-500',
  'Fine-Tuning': 'from-amber-500 via-orange-500 to-rose-500',
  MLOps: 'from-rose-500 via-pink-500 to-purple-500',
  'System Design': 'from-red-500 via-orange-500 to-amber-500',
  General: 'from-zinc-600 via-zinc-700 to-zinc-800',
}

function categoryGradient(category: string): string {
  return CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.General
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

interface ArticleFormProps {
  post?: BlogPost
}

export default function ArticleForm({ post }: ArticleFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!post)
  const [description, setDescription] = useState(post?.description ?? '')
  const [category, setCategory] = useState(post?.category ?? 'General')
  const [tags, setTags] = useState<string[]>(post?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [readTime, setReadTime] = useState(post?.read_time ?? '5 min read')
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!slugManual) {
      setSlug(generateSlug(title))
    }
  }, [title, slugManual])

  const handleCoverUpload = async (file: File) => {
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        setCoverImage(data.url)
      } else {
        setError(data.error || `Cover upload failed (HTTP ${res.status})`)
      }
    } catch (err) {
      setError(err instanceof Error ? `Cover upload failed: ${err.message}` : 'Cover upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim()
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleSave = async (published: boolean) => {
    if (!title || !slug || !content) {
      setError('Title, slug, and content are required')
      return
    }
    setSaving(true)
    setError('')

    const data = {
      title,
      slug,
      description,
      content,
      category,
      tags,
      cover_image: coverImage,
      read_time: readTime,
      published,
    }

    const result = post
      ? await updatePostAction(post.id, data)
      : await createPostAction(data)

    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/admin/blog')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article Title"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-2xl font-semibold text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
          placeholder="article-slug-here"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300 font-mono placeholder-zinc-600 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description shown in blog card preview..."
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Category + Read Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Read Time</label>
          <input
            type="text"
            value={readTime}
            onChange={(e) => setReadTime(e.target.value)}
            placeholder="5 min read"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Tags</label>
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 flex flex-wrap gap-2 focus-within:border-orange-500">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-orange-200">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKey}
            placeholder={tags.length === 0 ? 'Type tag and press Enter...' : 'Add more...'}
            className="bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none min-w-32"
          />
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Cover Image</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden"
        >
          {coverImage ? (
            <div className="relative w-full h-48">
              <Image src={coverImage} alt="Cover" fill className="object-cover rounded" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCoverImage('') }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-400 py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <div
              className={`relative w-full h-48 rounded bg-gradient-to-br ${categoryGradient(category)} flex flex-col items-center justify-center text-center px-4 overflow-hidden`}
            >
              {/* subtle texture so placeholder doesn't look flat */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 pointer-events-none" />
              <span className="relative text-[10px] font-bold tracking-[0.25em] uppercase text-white/80">
                Default Cover
              </span>
              <span className="relative mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                {category}
              </span>
              <span className="relative mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/85 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                <Upload className="w-3.5 h-3.5" />
                Click to upload your own
              </span>
            </div>
          )}
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          {coverImage
            ? 'Custom image uploaded.'
            : `No image uploaded — the gradient placeholder above will be saved as the default cover. PNG, JPG or WebP up to 10MB.`}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }}
        />
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Content</label>
        <AdminEditor content={content} onChange={setContent} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2 pb-8">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {post ? 'Save Changes' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {post ? 'Update & Publish' : 'Publish Article'}
        </button>
        {post?.published && (
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            Unpublish
          </button>
        )}
      </div>
    </div>
  )
}
