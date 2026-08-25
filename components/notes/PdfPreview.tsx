'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, FileText, RefreshCw } from 'lucide-react'

// PDF.js served locally — no CDN, no blocked script-src
const PDFJS_SRC = '/pdfjs/pdf.min.js'
const WORKER    = '/pdfjs/pdf.worker.min.js'

declare global {
  interface Window {
    pdfjsLib: {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument(opts: object): PdfTask
    }
  }
}
interface PdfTask { promise: Promise<PdfDoc>; destroy(): void }
interface PdfDoc  { numPages: number; getPage(n: number): Promise<PdfPage> }
interface PdfPage {
  getViewport(o: { scale: number }): { width: number; height: number }
  render(o: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }): { promise: Promise<void> }
}

// ── Shared module-level loader ────────────────────────────────────────────────
type LS = 'idle' | 'loading' | 'done' | 'error'
let ls: LS = 'idle'
let lw: Array<{ ok(): void; err(e: Error): void }> = []

function ensurePdfJs(): Promise<void> {
  if (ls === 'done') return Promise.resolve()
  if (ls === 'error') { ls = 'idle'; lw = [] }
  return new Promise<void>((ok, err) => {
    lw.push({ ok, err })
    if (ls === 'loading') return
    ls = 'loading'
    document.querySelectorAll('script[data-pdfjs]').forEach(s => s.remove())
    const s = document.createElement('script')
    s.src = PDFJS_SRC; s.async = true; s.dataset.pdfjs = '1'
    s.onload  = () => { ls = 'done';  lw.forEach(w => w.ok());  lw = [] }
    s.onerror = () => { ls = 'error'; lw.forEach(w => w.err(new Error('PDF viewer failed to load'))); lw = [] }
    document.body.appendChild(s)
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { noteId: string; fade?: boolean; pages?: number }
type Status = 'loading' | 'done' | 'error'

export default function PdfPreview({ noteId, fade = true, pages: maxPages = 2 }: Props) {
  const c1      = useRef<HTMLCanvasElement>(null)
  const c2      = useRef<HTMLCanvasElement>(null)
  const taskRef = useRef<PdfTask | null>(null)

  const [status,  setStatus]  = useState<Status>('loading')
  const [p2,      setP2]      = useState(false)
  const [total,   setTotal]   = useState(0)
  const [errMsg,  setErrMsg]  = useState('')
  const [attempt, setAttempt] = useState(0)

  async function drawPage(doc: PdfDoc, n: number, canvas: HTMLCanvasElement) {
    const page      = await doc.getPage(n)
    const container = canvas.parentElement
    const cssW      = Math.max(
      container?.getBoundingClientRect().width || container?.clientWidth || 0,
      320,
    )
    const dpr       = Math.min(window.devicePixelRatio || 1, 2)
    const raw       = page.getViewport({ scale: 1 })
    const vp        = page.getViewport({ scale: (cssW / raw.width) * dpr })
    canvas.width    = vp.width
    canvas.height   = vp.height
    canvas.style.width  = `${cssW}px`
    canvas.style.height = `${Math.round(vp.height / dpr)}px`
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
  }

  useEffect(() => {
    let cancelled = false
    taskRef.current?.destroy(); taskRef.current = null

    setStatus('loading'); setP2(false); setErrMsg('')

    async function load() {
      try {
        // ① Get a short-lived signed URL from the server (fast — just a DB lookup)
        const urlRes  = await fetch(`/api/notes/preview-url/${noteId}`)
        const urlData = await urlRes.json()
        if (!urlRes.ok) throw new Error(urlData.error ?? 'Could not load preview')
        const pdfUrl: string = urlData.url
        if (cancelled) return

        // ② Ensure PDF.js is loaded (local file, no CDN)
        await ensurePdfJs()
        if (cancelled) return
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER

        // ③ Load PDF directly from Supabase CDN — fast, no server hop.
        //    withCredentials: false so Supabase's ACAO: * header works.
        //    disableRange: true avoids preflight on Range header (CORS safe).
        const task = window.pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
          disableRange: true,   // prevents CORS preflight on Range header
        })
        taskRef.current = task

        const timer = new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('Preview timed out — please retry.')), 25_000)
        )
        const doc = await Promise.race([task.promise, timer])
        if (cancelled) return

        setTotal(doc.numPages)
        if (c1.current) await drawPage(doc, 1, c1.current)
        if (cancelled) return
        setStatus('done')

        if (maxPages >= 2 && doc.numPages >= 2 && c2.current) {
          try { await drawPage(doc, 2, c2.current); if (!cancelled) setP2(true) }
          catch { /* page 1 already showing */ }
        }
      } catch (e) {
        if (cancelled) return
        // If direct Supabase fetch failed (CORS or network), fall back to proxy
        const msg = e instanceof Error ? e.message : ''
        if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('cors') || msg.toLowerCase().includes('network')) {
          await loadViaProxy(cancelled)
        } else {
          setStatus('error')
          setErrMsg(msg || 'Preview failed — please retry.')
        }
      }
    }

    async function loadViaProxy(cancelled: boolean) {
      try {
        await ensurePdfJs()
        if (cancelled) return
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER

        const task = window.pdfjsLib.getDocument({
          url: `/api/notes/preview-pdf/${noteId}`,
          withCredentials: false,
        })
        taskRef.current = task

        const timer = new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('Preview timed out — please retry.')), 30_000)
        )
        const doc = await Promise.race([task.promise, timer])
        if (cancelled) return

        setTotal(doc.numPages)
        if (c1.current) await drawPage(doc, 1, c1.current)
        if (cancelled) return
        setStatus('done')

        if (maxPages >= 2 && doc.numPages >= 2 && c2.current) {
          try { await drawPage(doc, 2, c2.current); if (!cancelled) setP2(true) }
          catch { /* page 1 already showing */ }
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
      taskRef.current?.destroy(); taskRef.current = null
    }
  }, [noteId, attempt]) // eslint-disable-line react-hooks/exhaustive-deps

  function retry() {
    if (ls === 'error') { ls = 'idle'; lw = [] }
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

      <canvas ref={c1} className="w-full block" style={{ display: status === 'done' ? 'block' : 'none' }} />
      {p2 && <div className="h-px bg-zinc-700/40" />}
      <canvas ref={c2} className="w-full block" style={{ display: p2 ? 'block' : 'none' }} />

      {fade && status === 'done' && (
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none z-10" />
      )}
      {status === 'done' && total > 0 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center z-20">
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-full">
            Preview: {p2 ? 'pages 1–2' : 'page 1'} of {total}{fade ? ' · Buy to unlock' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
