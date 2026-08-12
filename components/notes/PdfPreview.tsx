'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

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
  getPage: (n: number) => Promise<PdfPage>
}

interface PdfPage {
  getViewport: (opts: { scale: number }) => PdfViewport
  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => { promise: Promise<void> }
}

interface PdfViewport { width: number; height: number }

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const WORKER    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

interface Props {
  noteId:   string
  fade?:    boolean   // show gradient fade at bottom (default true for public)
  pages?:   number    // how many pages to allow (default 1)
}

type State = 'idle' | 'fetching' | 'rendering' | 'done' | 'error'

export default function PdfPreview({ noteId, fade = true, pages: maxPages = 1 }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [state, setState]       = useState<State>('idle')
  const [totalPages, setTotal]  = useState(0)
  const [currentPage, setPage]  = useState(1)
  const [pdfDoc, setPdfDoc]     = useState<PdfDoc | null>(null)
  const [errMsg, setErrMsg]     = useState('')

  // Load PDF.js script once
  async function loadLib(): Promise<void> {
    if (window.pdfjsLib) return
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${PDFJS_CDN}"]`)
      if (existing) { existing.addEventListener('load', () => resolve()); return }
      const s = document.createElement('script')
      s.src = PDFJS_CDN; s.async = true
      s.onload = () => resolve(); s.onerror = reject
      document.body.appendChild(s)
    })
  }

  async function renderPage(doc: PdfDoc, pageNum: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    setState('rendering')
    const page     = await doc.getPage(pageNum)
    const container = canvas.parentElement
    const width    = container?.clientWidth ?? 480
    const raw      = page.getViewport({ scale: 1 })
    const scale    = width / raw.width
    const viewport = page.getViewport({ scale })
    canvas.width   = viewport.width
    canvas.height  = viewport.height
    const ctx      = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise
    setState('done')
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      setState('fetching'); setErrMsg('')
      try {
        await loadLib()
        if (cancelled) return

        // Proxy route — same origin, no CORS
        const url = `/api/notes/preview-pdf/${noteId}`
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER
        const doc = await window.pdfjsLib.getDocument({ url, withCredentials: false }).promise
        if (cancelled) return

        setPdfDoc(doc)
        setTotal(doc.numPages)
        setPage(1)
        await renderPage(doc, 1)
      } catch (e) {
        if (!cancelled) { setState('error'); setErrMsg(e instanceof Error ? e.message : 'Preview failed') }
      }
    }
    init()
    return () => { cancelled = true }
  }, [noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function goTo(p: number) {
    if (!pdfDoc || p < 1 || p > Math.min(totalPages, maxPages)) return
    setPage(p)
    await renderPage(pdfDoc, p)
  }

  const showNav = state === 'done' && totalPages > 1 && maxPages > 1

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/60 select-none">

      {/* Loading states */}
      {(state === 'idle' || state === 'fetching' || state === 'rendering') && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-800 min-h-[200px]">
          <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
          <p className="text-xs text-zinc-500">
            {state === 'fetching' ? 'Loading PDF…' : 'Rendering page…'}
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 min-h-[180px]">
          <FileText className="w-8 h-8 text-zinc-700" />
          <p className="text-xs text-zinc-600">{errMsg || 'Preview unavailable'}</p>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ display: state === 'done' ? 'block' : 'none' }}
      />

      {/* Fade overlay */}
      {fade && state === 'done' && (
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none z-10" />
      )}

      {/* Page info */}
      {state === 'done' && (
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 z-20">
          {showNav && (
            <button onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1}
              className="w-6 h-6 rounded-full bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-full">
            {showNav ? `Page ${currentPage} of ${Math.min(totalPages, maxPages)}` : `Page 1 of ${totalPages}`}
            {fade && ' · Buy to unlock full PDF'}
          </span>
          {showNav && (
            <button onClick={() => goTo(currentPage + 1)} disabled={currentPage >= Math.min(totalPages, maxPages)}
              className="w-6 h-6 rounded-full bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
