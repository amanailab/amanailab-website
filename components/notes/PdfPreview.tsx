'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, FileText, RefreshCw } from 'lucide-react'

// PDF.js served locally — no CDN dependency
const PDFJS_SRC = '/pdfjs/pdf.min.js'
const WORKER    = '/pdfjs/pdf.worker.min.js'

declare global {
  interface Window {
    pdfjsLib: {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (opts: object) => PdfTask
    }
  }
}
interface PdfTask { promise: Promise<PdfDoc>; destroy(): void }
interface PdfDoc  { numPages: number; getPage(n: number): Promise<PdfPage> }
interface PdfPage {
  getViewport(opts: { scale: number }): { width: number; height: number }
  render(opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }): { promise: Promise<void> }
}

// ── Module-level loader (shared across all instances) ─────────────────────────
type LibState = 'idle' | 'loading' | 'done' | 'error'
let libState:     LibState = 'idle'
let libWaiters:   Array<{ ok: () => void; err: (e: Error) => void }> = []

function ensurePdfJs(): Promise<void> {
  if (libState === 'done') return Promise.resolve()

  // reset after an error so retry can re-attempt
  if (libState === 'error') { libState = 'idle'; libWaiters = [] }

  return new Promise<void>((ok, err) => {
    libWaiters.push({ ok, err })
    if (libState === 'loading') return   // already in flight — just queue

    libState = 'loading'
    // remove any stale script from a previous failed attempt
    document.querySelectorAll('script[data-pdfjs]').forEach(s => s.remove())

    const s = document.createElement('script')
    s.src           = PDFJS_SRC
    s.async         = true
    s.dataset.pdfjs = '1'
    s.onload  = () => { libState = 'done';  libWaiters.forEach(w => w.ok());  libWaiters = [] }
    s.onerror = () => {
      libState = 'error'
      const e = new Error('Could not load PDF viewer. Check your connection and retry.')
      libWaiters.forEach(w => w.err(e))
      libWaiters = []
    }
    document.body.appendChild(s)
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  noteId: string
  fade?:  boolean
  pages?: number
}
type Status = 'loading' | 'done' | 'error'

const TIMEOUT_MS = 20_000   // give up after 20 s

export default function PdfPreview({ noteId, fade = true, pages: maxPages = 2 }: Props) {
  const c1 = useRef<HTMLCanvasElement>(null)
  const c2 = useRef<HTMLCanvasElement>(null)
  const taskRef = useRef<PdfTask | null>(null)

  const [status,    setStatus]    = useState<Status>('loading')
  const [p2ready,   setP2ready]   = useState(false)
  const [total,     setTotal]     = useState(0)
  const [errMsg,    setErrMsg]    = useState('')
  const [attempt,   setAttempt]   = useState(0)

  async function renderPage(doc: PdfDoc, num: number, canvas: HTMLCanvasElement) {
    const page     = await doc.getPage(num)
    const width    = canvas.parentElement?.clientWidth ?? 480
    const raw      = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: width / raw.width })
    canvas.width   = viewport.width
    canvas.height  = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
  }

  useEffect(() => {
    let cancelled = false

    // destroy any previous in-flight task
    if (taskRef.current) { taskRef.current.destroy(); taskRef.current = null }

    setStatus('loading')
    setP2ready(false)
    setErrMsg('')

    async function load() {
      try {
        await ensurePdfJs()
        if (cancelled) return

        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER

        const task = window.pdfjsLib.getDocument({
          url: `/api/notes/preview-pdf/${noteId}`,
          withCredentials: false,
        })
        taskRef.current = task

        // race the load against a timeout
        const timer   = new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('Preview timed out — please retry.')), TIMEOUT_MS)
        )
        const doc = await Promise.race([task.promise, timer])
        if (cancelled) return

        setTotal(doc.numPages)

        // render page 1 — show immediately
        if (c1.current) await renderPage(doc, 1, c1.current)
        if (cancelled) return
        setStatus('done')

        // render page 2 in background (non-fatal if it fails)
        if (maxPages >= 2 && doc.numPages >= 2 && c2.current) {
          try {
            await renderPage(doc, 2, c2.current)
            if (!cancelled) setP2ready(true)
          } catch { /* page 1 is already shown */ }
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setErrMsg(e instanceof Error ? e.message : 'Preview failed — please retry.')
        }
      }
    }

    load()
    return () => {
      cancelled = true
      taskRef.current?.destroy()
      taskRef.current = null
    }
  }, [noteId, attempt]) // eslint-disable-line react-hooks/exhaustive-deps

  function retry() {
    if (libState === 'error') { libState = 'idle'; libWaiters = [] }
    setAttempt(a => a + 1)
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/60 select-none">

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 min-h-[200px]">
          <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
          <p className="text-xs text-zinc-500">Loading preview…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 min-h-[200px] px-6 text-center">
          <FileText className="w-8 h-8 text-zinc-700" />
          <p className="text-xs text-zinc-500 leading-relaxed">{errMsg || 'Preview unavailable.'}</p>
          <button onClick={retry}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      )}

      {/* Page 1 */}
      <canvas ref={c1} className="w-full block" style={{ display: status === 'done' ? 'block' : 'none' }} />

      {/* Page 2 — appears as soon as rendered */}
      {p2ready && <div className="h-px bg-zinc-700/40" />}
      <canvas ref={c2} className="w-full block" style={{ display: p2ready ? 'block' : 'none' }} />

      {fade && status === 'done' && (
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none z-10" />
      )}

      {status === 'done' && total > 0 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center z-20">
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-full">
            Preview: {p2ready ? `pages 1–2` : `page 1`} of {total}
            {fade ? ' · Buy to unlock full PDF' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
