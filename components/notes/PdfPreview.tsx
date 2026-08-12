'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, FileText, RefreshCw } from 'lucide-react'

declare global {
  interface Window {
    pdfjsLib: {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (opts: { url: string; withCredentials: boolean }) => {
        promise: Promise<PdfDoc>
      }
    }
  }
}

interface PdfDoc {
  numPages: number
  getPage:  (n: number) => Promise<PdfPage>
}
interface PdfPage {
  getViewport: (opts: { scale: number }) => PdfViewport
  render:      (opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => { promise: Promise<void> }
}
interface PdfViewport { width: number; height: number }

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const WORKER    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

// Module-level — shared across all instances so we never double-load
let libPromise: Promise<void> | null = null

function ensurePdfJs(): Promise<void> {
  if (typeof window !== 'undefined' && window.pdfjsLib) return Promise.resolve()
  if (libPromise) return libPromise
  libPromise = new Promise<void>((resolve, reject) => {
    if (window.pdfjsLib) { resolve(); return }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PDFJS_CDN}"]`)
    if (existing) {
      existing.addEventListener('load',  () => resolve(),                                          { once: true })
      existing.addEventListener('error', () => { libPromise = null; reject(new Error('Failed to load PDF.js')) }, { once: true })
      return
    }
    const s = document.createElement('script')
    s.src   = PDFJS_CDN
    s.async = true
    s.onload  = () => resolve()
    s.onerror = () => { libPromise = null; reject(new Error('Failed to load PDF.js')) }
    document.body.appendChild(s)
  })
  return libPromise
}

interface Props {
  noteId: string
  fade?:  boolean
  pages?: number  // max preview pages (default 2)
}

type Status = 'loading' | 'done' | 'error'

export default function PdfPreview({ noteId, fade = true, pages: maxPages = 2 }: Props) {
  const canvas1 = useRef<HTMLCanvasElement>(null)
  const canvas2 = useRef<HTMLCanvasElement>(null)

  const [status,     setStatus]     = useState<Status>('loading')
  const [page2ready, setPage2ready] = useState(false)
  const [totalPages, setTotal]      = useState(0)
  const [errMsg,     setErrMsg]     = useState('')
  const [attempt,    setAttempt]    = useState(0)

  async function renderToCanvas(doc: PdfDoc, pageNum: number, canvas: HTMLCanvasElement) {
    const page      = await doc.getPage(pageNum)
    const width     = canvas.parentElement?.clientWidth ?? 480
    const raw       = page.getViewport({ scale: 1 })
    const viewport  = page.getViewport({ scale: width / raw.width })
    canvas.width    = viewport.width
    canvas.height   = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setPage2ready(false)
      setErrMsg('')
      try {
        await ensurePdfJs()
        if (cancelled) return

        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER
        const doc = await window.pdfjsLib.getDocument({
          url: `/api/notes/preview-pdf/${noteId}`,
          withCredentials: false,
        }).promise
        if (cancelled) return

        setTotal(doc.numPages)

        // Render page 1 — show it immediately
        if (canvas1.current) await renderToCanvas(doc, 1, canvas1.current)
        if (cancelled) return
        setStatus('done')

        // Render page 2 in the background
        if (maxPages >= 2 && doc.numPages >= 2 && canvas2.current) {
          try {
            await renderToCanvas(doc, 2, canvas2.current)
            if (!cancelled) setPage2ready(true)
          } catch {
            // page 2 failure is non-fatal — page 1 already showing
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setErrMsg(e instanceof Error ? e.message : 'Preview failed')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [noteId, attempt]) // eslint-disable-line react-hooks/exhaustive-deps

  function retry() {
    libPromise = null  // allow PDF.js to re-load if it failed
    setAttempt(a => a + 1)
  }

  const loading = status === 'loading'

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/60 select-none">

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 min-h-[200px]">
          <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
          <p className="text-xs text-zinc-500">Loading preview…</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 min-h-[200px]">
          <FileText className="w-8 h-8 text-zinc-700" />
          <p className="text-xs text-zinc-500">{errMsg || 'Preview unavailable'}</p>
          <button onClick={retry}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Page 1 */}
      <canvas ref={canvas1} className="w-full block" style={{ display: status === 'done' ? 'block' : 'none' }} />

      {/* Page 2 — shown as soon as it renders */}
      {page2ready && <div className="h-px bg-zinc-700/40" />}
      <canvas ref={canvas2} className="w-full block" style={{ display: page2ready ? 'block' : 'none' }} />

      {/* Bottom fade */}
      {fade && status === 'done' && (
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none z-10" />
      )}

      {/* Page count badge */}
      {status === 'done' && totalPages > 0 && (
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center z-20">
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-full">
            Showing {page2ready ? Math.min(2, totalPages) : 1} of {totalPages} pages
            {fade ? ' · Buy to unlock full PDF' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
