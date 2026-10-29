'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, GraduationCap,
  ChevronDown, ChevronUp, PlayCircle, X, CheckCircle2, Users, BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string; slug: string; title: string; short_description: string | null
  price: number; currency: string; level: string; duration_hours: number | null
  is_published: boolean; is_free: boolean; students_count: number
  stripe_price_id: string | null; thumbnail_url: string | null; preview_video_url: string | null
  description: string | null
}

type Section = { id: string; title: string; position: number; lectures: Lecture[] }
type Lecture = {
  id: string; title: string; description: string | null; video_url: string | null
  duration_minutes: number | null; is_preview: boolean; position: number
}

const LEVELS = ['beginner', 'intermediate', 'advanced']
const INPUT  = 'w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/60 text-zinc-100 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all'
const LABEL  = 'block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={LABEL}>{label}</label>{children}</div>
}

const EMPTY_COURSE: Omit<Course, 'id' | 'students_count'> = {
  slug: '', title: '', short_description: '', description: '', thumbnail_url: '',
  preview_video_url: '', price: 999, currency: 'INR', level: 'beginner',
  duration_hours: null, is_published: false, is_free: false, stripe_price_id: '',
}

export default function AdminCoursesPage() {
  const supabase = createClient()

  const [courses, setCourses]     = useState<Course[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<string | null>(null)
  const [editingCourse, setEditing] = useState<Partial<Course> | null>(null)
  const [isNew, setIsNew]         = useState(false)

  // Curriculum state
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  const [sections, setSections]   = useState<Section[]>([])
  const [sectLoading, setSectLoading] = useState(false)
  const [expandedSect, setExpandedSect] = useState<Set<string>>(new Set())

  // New section / lecture forms
  const [newSectTitle, setNewSectTitle] = useState('')
  const [addingLectureFor, setAddingLectureFor] = useState<string | null>(null)
  const [newLecture, setNewLecture] = useState({ title: '', video_url: '', duration_minutes: '', is_preview: false })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function loadCourses() {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
    setCourses((data as Course[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCourses() }, [])

  async function loadSections(courseId: string) {
    setSectLoading(true)
    const { data } = await supabase
      .from('course_sections')
      .select('id,title,position,course_lectures(id,title,description,video_url,duration_minutes,is_preview,position)')
      .eq('course_id', courseId)
      .order('position')
    const normalized = (data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      lectures: ((s.course_lectures as Lecture[]) ?? []).sort((a, b) => a.position - b.position),
    })) as Section[]
    setSections(normalized)
    setExpandedSect(new Set(normalized.map(s => s.id)))
    setSectLoading(false)
  }

  async function saveCourse() {
    if (!editingCourse?.title || !editingCourse?.slug) { showToast('Title and slug are required'); return }
    setSaving(true)
    const payload = { ...editingCourse }
    delete (payload as Record<string, unknown>).id

    if (isNew) {
      const { error } = await supabase.from('courses').insert({ ...payload, students_count: 0 })
      if (error) { showToast('Error: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('courses').update(payload).eq('id', editingCourse.id!)
      if (error) { showToast('Error: ' + error.message); setSaving(false); return }
    }
    showToast(isNew ? 'Course created!' : 'Course updated!')
    setEditing(null)
    loadCourses()
    setSaving(false)
  }

  async function togglePublish(course: Course) {
    await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id)
    showToast(course.is_published ? 'Course unpublished' : 'Course published!')
    loadCourses()
  }

  async function deleteCourse(id: string) {
    if (!confirm('Delete this course and all its content?')) return
    await supabase.from('courses').delete().eq('id', id)
    showToast('Course deleted')
    loadCourses()
  }

  async function addSection() {
    if (!newSectTitle.trim() || !activeCourseId) return
    const position = sections.length
    await supabase.from('course_sections').insert({ course_id: activeCourseId, title: newSectTitle.trim(), position })
    setNewSectTitle('')
    loadSections(activeCourseId)
  }

  async function deleteSection(id: string) {
    if (!confirm('Delete this section and all its lectures?')) return
    await supabase.from('course_sections').delete().eq('id', id)
    if (activeCourseId) loadSections(activeCourseId)
  }

  async function addLecture(sectionId: string) {
    if (!newLecture.title.trim()) return
    const section = sections.find(s => s.id === sectionId)
    const position = section?.lectures.length ?? 0
    await supabase.from('course_lectures').insert({
      section_id: sectionId,
      title: newLecture.title.trim(),
      video_url: newLecture.video_url.trim() || null,
      duration_minutes: newLecture.duration_minutes ? parseFloat(newLecture.duration_minutes) : null,
      is_preview: newLecture.is_preview,
      position,
    })
    setNewLecture({ title: '', video_url: '', duration_minutes: '', is_preview: false })
    setAddingLectureFor(null)
    if (activeCourseId) loadSections(activeCourseId)
  }

  async function deleteLecture(id: string) {
    await supabase.from('course_lectures').delete().eq('id', id)
    if (activeCourseId) loadSections(activeCourseId)
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <AdminNav />

      <main className="flex-1 p-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-xl shadow-xl text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-zinc-100">Courses</h1>
            <p className="text-zinc-500 text-sm mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={() => { setEditing({ ...EMPTY_COURSE }); setIsNew(true) }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <Plus className="w-4 h-4" /> New Course
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <GraduationCap className="w-16 h-16 text-zinc-700" />
            <p className="text-zinc-400">No courses yet. Create your first one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => (
              <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-100 truncate">{course.title}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${course.is_published ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-500 bg-zinc-800 border-zinc-700'}`}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                        {course.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-orange-400 font-bold">{course.is_free ? 'Free' : `₹${course.price}`}</span>
                      <span className="flex items-center gap-1 text-xs text-zinc-500"><Users className="w-3 h-3" /> {course.students_count}</span>
                      <span className="text-xs text-zinc-600">/{course.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setActiveCourseId(course.id); loadSections(course.id) }}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-orange-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors">
                      <BookOpen className="w-3.5 h-3.5" /> Curriculum
                    </button>
                    <button onClick={() => togglePublish(course)}
                      className={`p-2 rounded-lg transition-colors ${course.is_published ? 'text-emerald-400 hover:text-red-400 hover:bg-red-500/10' : 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                      {course.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditing({ ...course }); setIsNew(false) }}
                      className="p-2 text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCourse(course.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Curriculum panel */}
                {activeCourseId === course.id && (
                  <div className="border-t border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-zinc-300">Curriculum</h3>
                      <button onClick={() => setActiveCourseId(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
                    </div>

                    {sectLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div> : (
                      <div className="space-y-3">
                        {sections.map(section => (
                          <div key={section.id} className="border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900">
                              <button onClick={() => setExpandedSect(prev => { const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n })}>
                                {expandedSect.has(section.id) ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                              </button>
                              <span className="flex-1 font-semibold text-zinc-200 text-sm">{section.title}</span>
                              <span className="text-xs text-zinc-600">{section.lectures.length} lectures</span>
                              <button onClick={() => deleteSection(section.id)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            {expandedSect.has(section.id) && (
                              <div className="divide-y divide-zinc-800/60">
                                {section.lectures.map(lecture => (
                                  <div key={lecture.id} className="flex items-center gap-3 px-4 py-3">
                                    <PlayCircle className="w-4 h-4 text-zinc-600 shrink-0" />
                                    <span className="flex-1 text-sm text-zinc-400">{lecture.title}</span>
                                    {lecture.is_preview && <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">Preview</span>}
                                    {lecture.duration_minutes && <span className="text-xs text-zinc-600">{lecture.duration_minutes}m</span>}
                                    <button onClick={() => deleteLecture(lecture.id)} className="p-1 text-zinc-700 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                ))}

                                {addingLectureFor === section.id ? (
                                  <div className="p-4 space-y-3 bg-zinc-900/50">
                                    <input value={newLecture.title} onChange={e => setNewLecture(p => ({ ...p, title: e.target.value }))} placeholder="Lecture title *" className={INPUT} />
                                    <input value={newLecture.video_url} onChange={e => setNewLecture(p => ({ ...p, video_url: e.target.value }))} placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)" className={INPUT} />
                                    <div className="flex gap-2">
                                      <input value={newLecture.duration_minutes} onChange={e => setNewLecture(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="Duration (min)" type="number" className={INPUT} />
                                      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer shrink-0">
                                        <input type="checkbox" checked={newLecture.is_preview} onChange={e => setNewLecture(p => ({ ...p, is_preview: e.target.checked }))} className="accent-orange-500" />
                                        Free preview
                                      </label>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => addLecture(section.id)} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 rounded-xl text-sm transition-colors">Add Lecture</button>
                                      <button onClick={() => setAddingLectureFor(null)} className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold py-2 rounded-xl text-sm transition-colors">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setAddingLectureFor(section.id)}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-500 hover:text-orange-400 hover:bg-orange-500/5 transition-colors">
                                    <Plus className="w-4 h-4" /> Add lecture
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add section */}
                        <div className="flex gap-2">
                          <input value={newSectTitle} onChange={e => setNewSectTitle(e.target.value)} placeholder="New section title…" className={`${INPUT} flex-1`}
                            onKeyDown={e => e.key === 'Enter' && addSection()} />
                          <button onClick={addSection} className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
                            <Plus className="w-4 h-4" /> Section
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

      {/* Edit / Create modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <h2 className="text-lg font-bold text-zinc-100">{isNew ? 'Create Course' : 'Edit Course'}</h2>
              <button onClick={() => setEditing(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Title *">
                  <input value={editingCourse.title ?? ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} className={INPUT} placeholder="Course title" />
                </Field>
                <Field label="Slug *">
                  <input value={editingCourse.slug ?? ''} onChange={e => setEditing(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className={INPUT} placeholder="url-friendly-slug" />
                </Field>
              </div>

              <Field label="Short Description">
                <input value={editingCourse.short_description ?? ''} onChange={e => setEditing(p => ({ ...p, short_description: e.target.value }))} className={INPUT} placeholder="One-line tagline" />
              </Field>

              <Field label="Full Description">
                <textarea rows={4} value={editingCourse.description ?? ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} className={`${INPUT} resize-none`} placeholder="Detailed description…" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Thumbnail URL">
                  <input value={editingCourse.thumbnail_url ?? ''} onChange={e => setEditing(p => ({ ...p, thumbnail_url: e.target.value }))} className={INPUT} placeholder="https://…" />
                </Field>
                <Field label="Preview Video URL">
                  <input value={editingCourse.preview_video_url ?? ''} onChange={e => setEditing(p => ({ ...p, preview_video_url: e.target.value }))} className={INPUT} placeholder="YouTube URL" />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Price (INR)">
                  <input type="number" value={editingCourse.price ?? 999} onChange={e => setEditing(p => ({ ...p, price: parseFloat(e.target.value) }))} className={INPUT} />
                </Field>
                <Field label="Level">
                  <select value={editingCourse.level ?? 'beginner'} onChange={e => setEditing(p => ({ ...p, level: e.target.value }))} className={INPUT}>
                    {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Duration (hours)">
                  <input type="number" value={editingCourse.duration_hours ?? ''} onChange={e => setEditing(p => ({ ...p, duration_hours: e.target.value ? parseFloat(e.target.value) : null }))} className={INPUT} placeholder="e.g. 4.5" />
                </Field>
              </div>

              <Field label="Stripe Price ID">
                <input value={editingCourse.stripe_price_id ?? ''} onChange={e => setEditing(p => ({ ...p, stripe_price_id: e.target.value }))} className={INPUT} placeholder="price_xxxx (from Stripe dashboard)" />
              </Field>

              <div className="flex gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={editingCourse.is_free ?? false} onChange={e => setEditing(p => ({ ...p, is_free: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm text-zinc-300">Free course</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={editingCourse.is_published ?? false} onChange={e => setEditing(p => ({ ...p, is_published: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm text-zinc-300">Published</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button onClick={saveCourse} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : isNew ? 'Create Course' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(null)} className="px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
