'use client'

import { useState, useEffect, useRef } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import Image from 'next/image'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, GraduationCap,
  ChevronDown, ChevronUp, PlayCircle, X, CheckCircle2, Users,
  UploadCloud, Link2, AlertCircle, GripVertical, BookOpen,
  Zap, TrendingUp, ListVideo, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string; slug: string; title: string; short_description: string | null
  description: string | null; price: number; level: string; duration_hours: number | null
  is_published: boolean; is_free: boolean; students_count: number
  stripe_price_id: string | null; thumbnail_url: string | null; preview_video_url: string | null
}
type Section = { id: string; title: string; position: number; lectures: Lecture[] }
type Lecture = {
  id: string; title: string; description: string | null; video_url: string | null
  duration_minutes: number | null; is_preview: boolean; position: number
}

const INPUT = 'w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/60 text-zinc-100 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all'
const EMPTY: Omit<Course, 'id' | 'students_count'> = {
  slug: '', title: '', short_description: '', description: '', thumbnail_url: '',
  preview_video_url: '', price: 999, level: 'beginner',
  duration_hours: null, is_published: false, is_free: false, stripe_price_id: '',
}

// ── Video Upload Component ─────────────────────────────────────────────────
function VideoUpload({ onUrl }: { onUrl: (url: string) => void }) {
  const [mode, setMode]         = useState<'url' | 'upload'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return
    setUploading(true); setProgress(0); setUploadError(null)

    const sb       = createClient()
    const ext      = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Simulate progress while uploading
    const timer = setInterval(() => setProgress(p => Math.min(p + 8, 90)), 300)

    try {
      const { data, error } = await sb.storage.from('course-videos').upload(fileName, file, { upsert: false })
      clearInterval(timer)
      if (error) { setUploadError(error.message); setUploading(false); return }
      setProgress(100)
      const { data: { publicUrl } } = sb.storage.from('course-videos').getPublicUrl(data.path)
      onUrl(publicUrl)
      setTimeout(() => { setUploading(false); setProgress(0) }, 800)
    } catch (e) {
      clearInterval(timer)
      setUploadError(String(e))
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => setMode('url')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${mode === 'url' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
          <Link2 className="w-3.5 h-3.5" /> URL
        </button>
        <button onClick={() => setMode('upload')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${mode === 'upload' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
          <UploadCloud className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {mode === 'url' ? (
        <div className="flex gap-2">
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="YouTube URL or direct video link…" className={`${INPUT} flex-1`} />
          <button onClick={() => { if (urlInput.trim()) { onUrl(urlInput.trim()); setUrlInput('') } }} className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-bold transition-colors shrink-0">
            Use
          </button>
        </div>
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploading ? 'border-orange-500/40 cursor-default' : 'border-zinc-700 hover:border-orange-500/50 hover:bg-orange-500/3'}`}
          >
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                <p className="text-sm text-zinc-400 font-semibold">Uploading… {progress}%</p>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden max-w-xs mx-auto">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">Drop video here or click to browse</p>
                <p className="text-xs text-zinc-600">MP4, MOV, WebM · Max 500MB</p>
                <p className="text-xs text-zinc-700 mt-1">Requires <span className="text-orange-500/70">course-videos</span> bucket in Supabase Storage</p>
              </div>
            )}
          </div>
          {uploadError && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {uploadError}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminCoursesPage() {
  const sb = createClient()

  const [courses, setCourses]       = useState<Course[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<string | null>(null)
  const [editing, setEditing]       = useState<Partial<Course> | null>(null)
  const [isNew, setIsNew]           = useState(false)
  const [activeTab, setActiveTab]   = useState<'info' | 'media' | 'settings'>('info')

  // YouTube playlist import
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting]   = useState(false)
  const [importErr, setImportErr]   = useState<string | null>(null)
  const [imp, setImp] = useState({ playlistUrl: '', title: '', price: '999', level: 'beginner', is_free: false, is_published: false })

  // Curriculum
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  const [sections, setSections]       = useState<Section[]>([])
  const [sectLoading, setSectLoading] = useState(false)
  const [expandedSects, setExpSects]  = useState<Set<string>>(new Set())

  // Forms
  const [newSectTitle, setNewSectTitle]     = useState('')
  const [addingLecFor, setAddingLecFor]     = useState<string | null>(null)
  const [newLec, setNewLec] = useState({ title: '', description: '', video_url: '', duration_minutes: '', is_preview: false })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function loadCourses() {
    const { data } = await sb.from('courses').select('*').order('created_at', { ascending: false })
    setCourses((data as Course[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { loadCourses() }, [])

  async function importPlaylist() {
    if (!imp.playlistUrl.trim()) { setImportErr('Paste a YouTube playlist link first.'); return }
    setImporting(true); setImportErr(null)
    try {
      const res = await fetch('/api/admin/courses/import-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistUrl: imp.playlistUrl.trim(),
          title: imp.title.trim() || undefined,
          price: parseFloat(imp.price) || 0,
          level: imp.level,
          is_free: imp.is_free,
          is_published: imp.is_published,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setImportErr(data.error ?? 'Import failed.'); setImporting(false); return }
      setImportOpen(false)
      setImp({ playlistUrl: '', title: '', price: '999', level: 'beginner', is_free: false, is_published: false })
      showToast(`Imported "${data.course.title}" — ${data.lectureCount} lectures created!`)
      await loadCourses()
    } catch (e) {
      setImportErr(String(e))
    }
    setImporting(false)
  }

  async function loadSections(courseId: string) {
    setSectLoading(true)
    const { data } = await sb
      .from('course_sections')
      .select('id,title,position,course_lectures(id,title,description,video_url,duration_minutes,is_preview,position)')
      .eq('course_id', courseId).order('position')
    const norm = (data ?? []).map((s: Record<string, unknown>) => ({
      ...s, lectures: ((s.course_lectures as Lecture[]) ?? []).sort((a, b) => a.position - b.position),
    })) as Section[]
    setSections(norm)
    setExpSects(new Set(norm.map(s => s.id)))
    setSectLoading(false)
  }

  async function saveCourse() {
    if (!editing?.title || !editing?.slug) { showToast('Title and slug are required'); return }
    setSaving(true)
    const payload = { ...editing } as Record<string, unknown>
    delete payload.id
    const op = isNew
      ? await sb.from('courses').insert({ ...payload, students_count: 0 })
      : await sb.from('courses').update(payload).eq('id', editing.id!)
    if (op.error) { showToast('Error: ' + op.error.message); setSaving(false); return }
    showToast(isNew ? 'Course created!' : 'Saved!')
    setEditing(null); loadCourses(); setSaving(false)
  }

  async function togglePublish(c: Course) {
    await sb.from('courses').update({ is_published: !c.is_published }).eq('id', c.id)
    showToast(c.is_published ? 'Unpublished' : 'Published!')
    loadCourses()
  }

  async function deleteCourse(id: string) {
    if (!confirm('Delete this course and all content?')) return
    await sb.from('courses').delete().eq('id', id)
    showToast('Deleted'); loadCourses()
    if (activeCourseId === id) setActiveCourseId(null)
  }

  async function addSection() {
    if (!newSectTitle.trim() || !activeCourseId) return
    await sb.from('course_sections').insert({ course_id: activeCourseId, title: newSectTitle.trim(), position: sections.length })
    setNewSectTitle(''); loadSections(activeCourseId)
  }

  async function deleteSection(id: string) {
    if (!confirm('Delete section and all its lectures?')) return
    await sb.from('course_sections').delete().eq('id', id)
    if (activeCourseId) loadSections(activeCourseId)
  }

  async function addLecture(sectionId: string) {
    if (!newLec.title.trim()) return
    const sec = sections.find(s => s.id === sectionId)
    await sb.from('course_lectures').insert({
      section_id: sectionId, title: newLec.title.trim(),
      description: newLec.description.trim() || null,
      video_url: newLec.video_url.trim() || null,
      duration_minutes: newLec.duration_minutes ? parseFloat(newLec.duration_minutes) : null,
      is_preview: newLec.is_preview, position: sec?.lectures.length ?? 0,
    })
    setNewLec({ title: '', description: '', video_url: '', duration_minutes: '', is_preview: false })
    setAddingLecFor(null)
    if (activeCourseId) loadSections(activeCourseId)
  }

  async function deleteLecture(id: string) {
    await sb.from('course_lectures').delete().eq('id', id)
    if (activeCourseId) loadSections(activeCourseId)
  }

  const totalStudents = courses.reduce((a, c) => a + c.students_count, 0)
  const published     = courses.filter(c => c.is_published).length

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <AdminNav />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-2xl shadow-2xl text-sm animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-zinc-100">Courses</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your course catalog and curriculum</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => { setImportErr(null); setImportOpen(true) }}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
              <ListVideo className="w-4 h-4 text-red-500" /> Import YouTube Playlist
            </button>
            <button onClick={() => { setEditing({ ...EMPTY }); setIsNew(true); setActiveTab('info') }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20">
              <Plus className="w-4 h-4" /> New Course
            </button>
          </div>
        </div>

        {/* Stats */}
        {courses.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: GraduationCap, label: 'Total Courses',   val: courses.length.toString(), color: 'text-orange-400' },
              { icon: Eye,           label: 'Published',       val: published.toString(),       color: 'text-emerald-400' },
              { icon: Users,         label: 'Total Students',  val: totalStudents.toLocaleString('en-IN'), color: 'text-blue-400' },
              { icon: TrendingUp,    label: 'Draft',           val: (courses.length - published).toString(), color: 'text-zinc-400' },
            ].map(({ icon: Icon, label, val, color }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-zinc-500">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-black ${color}`}>{val}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-zinc-700" />
            </div>
            <p className="text-zinc-400 font-semibold">No courses yet</p>
            <button onClick={() => { setEditing({ ...EMPTY }); setIsNew(true) }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Create First Course
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map(course => (
              <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

                {/* Course row */}
                <div className="flex items-center gap-4 p-5">
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                    {course.thumbnail_url
                      ? <Image src={course.thumbnail_url} alt={course.title} width={80} height={56} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-7 h-7 text-zinc-600" /></div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-zinc-100 truncate">{course.title}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                        course.is_published ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-500 bg-zinc-800 border-zinc-700'
                      }`}>{course.is_published ? 'Published' : 'Draft'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 shrink-0 capitalize">{course.level}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold text-orange-400">{course.is_free ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}</span>
                      <span className="flex items-center gap-1 text-xs text-zinc-600"><Users className="w-3 h-3" />{course.students_count} students</span>
                      {course.duration_hours && <span className="text-xs text-zinc-600">{course.duration_hours}h</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => { setActiveCourseId(activeCourseId === course.id ? null : course.id); if (activeCourseId !== course.id) loadSections(course.id) }}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold transition-colors ${activeCourseId === course.id ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'}`}>
                      <BookOpen className="w-3.5 h-3.5" /> Curriculum
                    </button>
                    <button onClick={() => togglePublish(course)}
                      className={`p-2 rounded-xl transition-colors ${course.is_published ? 'text-emerald-400 hover:bg-red-500/10 hover:text-red-400' : 'text-zinc-600 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                      title={course.is_published ? 'Unpublish' : 'Publish'}>
                      {course.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditing({ ...course }); setIsNew(false); setActiveTab('info') }}
                      className="p-2 rounded-xl text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10 transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCourse(course.id)}
                      className="p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Curriculum panel ── */}
                {activeCourseId === course.id && (
                  <div className="border-t border-zinc-800 bg-zinc-950/60 p-5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Curriculum Builder</p>

                    {sectLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
                    ) : (
                      <div className="space-y-3">
                        {sections.length === 0 && (
                          <p className="text-center text-zinc-600 text-sm py-6">No sections yet. Add your first section below.</p>
                        )}

                        {sections.map((sec, si) => {
                          const isOpen = expandedSects.has(sec.id)
                          return (
                            <div key={sec.id} className="border border-zinc-800 rounded-xl overflow-hidden">
                              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900">
                                <GripVertical className="w-4 h-4 text-zinc-700 shrink-0" />
                                <button onClick={() => setExpSects(prev => { const n = new Set(prev); n.has(sec.id) ? n.delete(sec.id) : n.add(sec.id); return n })} className="shrink-0">
                                  {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                </button>
                                <span className="text-xs text-zinc-600 shrink-0">Section {si + 1}</span>
                                <span className="flex-1 font-semibold text-zinc-200 text-sm">{sec.title}</span>
                                <span className="text-xs text-zinc-600 shrink-0">{sec.lectures.length} lectures</span>
                                <button onClick={() => deleteSection(sec.id)} className="p-1 text-zinc-700 hover:text-red-400 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>

                              {isOpen && (
                                <div className="divide-y divide-zinc-800/60">
                                  {sec.lectures.map((l, li) => (
                                    <div key={l.id} className="flex items-center gap-3 px-4 py-3 bg-zinc-950/50">
                                      <GripVertical className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                                      <PlayCircle className="w-4 h-4 text-zinc-600 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-300 truncate">{li + 1}. {l.title}</p>
                                        {l.video_url && <p className="text-xs text-zinc-600 truncate">{l.video_url.length > 50 ? l.video_url.slice(0, 50) + '…' : l.video_url}</p>}
                                      </div>
                                      {l.is_preview && <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full shrink-0">Preview</span>}
                                      {l.duration_minutes && <span className="text-xs text-zinc-600 shrink-0">{l.duration_minutes}m</span>}
                                      <button onClick={() => deleteLecture(l.id)} className="p-1 text-zinc-700 hover:text-red-400 transition-colors shrink-0"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  ))}

                                  {/* Add lecture form */}
                                  {addingLecFor === sec.id ? (
                                    <div className="p-4 bg-zinc-900/60 space-y-3">
                                      <input value={newLec.title} onChange={e => setNewLec(p => ({ ...p, title: e.target.value }))} placeholder="Lecture title *" className={INPUT} />
                                      <input value={newLec.description} onChange={e => setNewLec(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" className={INPUT} />

                                      <div>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Video</p>
                                        <VideoUpload onUrl={url => setNewLec(p => ({ ...p, video_url: url }))} />
                                        {newLec.video_url && (
                                          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{newLec.video_url}</span>
                                            <button onClick={() => setNewLec(p => ({ ...p, video_url: '' }))} className="shrink-0 text-zinc-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex gap-2">
                                        <input value={newLec.duration_minutes} onChange={e => setNewLec(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="Duration (min)" type="number" className={`${INPUT} w-36`} />
                                        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                                          <input type="checkbox" checked={newLec.is_preview} onChange={e => setNewLec(p => ({ ...p, is_preview: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                                          Free preview
                                        </label>
                                      </div>
                                      <div className="flex gap-2">
                                        <button onClick={() => addLecture(sec.id)} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">Add Lecture</button>
                                        <button onClick={() => setAddingLecFor(null)} className="px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => setAddingLecFor(sec.id)}
                                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-600 hover:text-orange-400 hover:bg-orange-500/5 transition-colors">
                                      <Plus className="w-4 h-4" /> Add lecture
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {/* Add section */}
                        <div className="flex gap-2 pt-1">
                          <input value={newSectTitle} onChange={e => setNewSectTitle(e.target.value)} placeholder="New section title…" className={`${INPUT} flex-1`} onKeyDown={e => e.key === 'Enter' && addSection()} />
                          <button onClick={addSection} className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0">
                            <Plus className="w-4 h-4" /> Add Section
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Import YouTube Playlist Modal ── */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <ListVideo className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-100">Import YouTube Playlist</h2>
                  <p className="text-xs text-zinc-600 mt-0.5">Creates a full course — one lecture per video</p>
                </div>
              </div>
              <button onClick={() => !importing && setImportOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Playlist Link *</label>
                <input value={imp.playlistUrl} onChange={e => setImp(p => ({ ...p, playlistUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/playlist?list=PL…" className={INPUT} autoFocus />
                <p className="text-xs text-zinc-600 mt-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-orange-500/60 shrink-0" />
                  Paste any public playlist URL. We fetch every video, title and duration automatically.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Course Title (optional)</label>
                <input value={imp.title} onChange={e => setImp(p => ({ ...p, title: e.target.value }))}
                  placeholder="Leave blank to use the playlist title" className={INPUT} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Level</label>
                  <select value={imp.level} onChange={e => setImp(p => ({ ...p, level: e.target.value }))} className={INPUT}>
                    <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Price (₹)</label>
                  <input type="number" value={imp.price} disabled={imp.is_free}
                    onChange={e => setImp(p => ({ ...p, price: e.target.value }))} className={`${INPUT} disabled:opacity-50`} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                  <span className="text-sm font-semibold text-zinc-200">Free course</span>
                  <input type="checkbox" checked={imp.is_free} onChange={e => setImp(p => ({ ...p, is_free: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                </label>
                <label className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Publish immediately</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Show on the public courses page right away</p>
                  </div>
                  <input type="checkbox" checked={imp.is_published} onChange={e => setImp(p => ({ ...p, is_published: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                </label>
              </div>

              {importErr && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {importErr}
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-zinc-800 flex gap-3">
              <button onClick={importPlaylist} disabled={importing}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20">
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing playlist…</> : <><ListVideo className="w-4 h-4" /> Import & Create Course</>}
              </button>
              <button onClick={() => !importing && setImportOpen(false)} className="px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 shrink-0">
              <div>
                <h2 className="text-lg font-black text-zinc-100">{isNew ? 'Create New Course' : 'Edit Course'}</h2>
                <p className="text-xs text-zinc-600 mt-0.5">Fill in course details and add curriculum after saving</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 px-6 shrink-0">
              {(['info', 'media', 'settings'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === t ? 'text-orange-400 border-orange-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                  {t === 'info' ? 'Course Info' : t === 'media' ? 'Media' : 'Settings'}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Title *</label>
                      <input value={editing.title ?? ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} className={INPUT} placeholder="e.g. Complete LLM Engineer Bootcamp" /></div>
                    <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Slug *</label>
                      <input value={editing.slug ?? ''} onChange={e => setEditing(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} className={INPUT} placeholder="complete-llm-bootcamp" /></div>
                  </div>
                  <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Short Description</label>
                    <input value={editing.short_description ?? ''} onChange={e => setEditing(p => ({ ...p, short_description: e.target.value }))} className={INPUT} placeholder="One-line tagline shown on course cards" /></div>
                  <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Full Description</label>
                    <textarea rows={5} value={editing.description ?? ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} className={`${INPUT} resize-none`} placeholder="Detailed course description…" /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Level</label>
                      <select value={editing.level ?? 'beginner'} onChange={e => setEditing(p => ({ ...p, level: e.target.value }))} className={INPUT}>
                        <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                      </select></div>
                    <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Price (₹)</label>
                      <input type="number" value={editing.price ?? 999} onChange={e => setEditing(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} className={INPUT} /></div>
                    <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Duration (hours)</label>
                      <input type="number" step="0.5" value={editing.duration_hours ?? ''} onChange={e => setEditing(p => ({ ...p, duration_hours: e.target.value ? parseFloat(e.target.value) : null }))} className={INPUT} placeholder="e.g. 4.5" /></div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-5">
                  <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Thumbnail URL</label>
                    <input value={editing.thumbnail_url ?? ''} onChange={e => setEditing(p => ({ ...p, thumbnail_url: e.target.value }))} className={INPUT} placeholder="https://… (course cover image)" />
                    {editing.thumbnail_url && (
                      <div className="mt-3 aspect-video w-full max-w-xs rounded-xl overflow-hidden border border-zinc-800">
                        <Image src={editing.thumbnail_url} alt="thumbnail" width={320} height={180} className="w-full h-full object-cover" onError={() => {}} />
                      </div>
                    )}</div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Preview Video</label>
                    <p className="text-xs text-zinc-600 mb-2">Shown on the course detail page before purchase</p>
                    <VideoUpload onUrl={url => setEditing(p => ({ ...p, preview_video_url: url }))} />
                    {editing.preview_video_url && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{editing.preview_video_url}</span>
                        <button onClick={() => setEditing(p => ({ ...p, preview_video_url: '' }))} className="shrink-0 text-zinc-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4">
                    <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">Free Course</p>
                        <p className="text-xs text-zinc-600 mt-0.5">Students can enroll without payment</p>
                      </div>
                      <input type="checkbox" checked={editing.is_free ?? false} onChange={e => setEditing(p => ({ ...p, is_free: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">Published</p>
                        <p className="text-xs text-zinc-600 mt-0.5">Visible on the public courses page</p>
                      </div>
                      <input type="checkbox" checked={editing.is_published ?? false} onChange={e => setEditing(p => ({ ...p, is_published: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                    </label>
                  </div>
                  <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Razorpay Price ID</label>
                    <input value={editing.stripe_price_id ?? ''} onChange={e => setEditing(p => ({ ...p, stripe_price_id: e.target.value }))} className={INPUT} placeholder="price_xxxx (optional)" /></div>
                  <div className="p-4 bg-zinc-950 border border-orange-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-zinc-500 space-y-1">
                        <p className="text-zinc-300 font-semibold">To enable video upload:</p>
                        <p>1. Go to Supabase → Storage → Create bucket named <span className="text-orange-400 font-mono">course-videos</span></p>
                        <p>2. Set bucket to <span className="text-orange-400">Public</span></p>
                        <p>3. Add RLS policy: allow authenticated users to insert</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-zinc-800 flex gap-3 shrink-0">
              <button onClick={saveCourse} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : isNew ? 'Create Course' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(null)} className="px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
