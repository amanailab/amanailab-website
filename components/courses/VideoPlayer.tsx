'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, AlertCircle, Loader2, Lock } from 'lucide-react'

type Playable =
  | { kind: 'youtube'; id: string }
  | { kind: 'file';    url: string }
  | { kind: 'embed';   url: string }

interface VideoPlayerProps {
  /** Lecture to play — the server checks enrolment / free-preview and returns the (signed) source. */
  lectureId?: string
  /** Or a public URL (course preview video). */
  url?: string | null
  title: string
  thumbnail?: string | null
  autoplay?: boolean
  /** Seconds to resume from. */
  startAt?: number
  /** Faint moving label over the video (deters re-sharing screen recordings). */
  watermark?: string | null
  onProgress?: (seconds: number) => void
  onEnded?: () => void
}

// ── YouTube IFrame API (loaded once) ────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
let ytApiPromise: Promise<any> | null = null
function loadYouTubeApi(): Promise<any> {
  const w = window as any
  if (w.YT?.Player) return Promise.resolve(w.YT)
  if (!ytApiPromise) {
    ytApiPromise = new Promise(resolve => {
      const prev = w.onYouTubeIframeAPIReady
      w.onYouTubeIframeAPIReady = () => { prev?.(); resolve(w.YT) }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.async = true
      document.head.appendChild(s)
    })
  }
  return ytApiPromise
}

function ytIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.endsWith('youtube.com')) return u.pathname.startsWith('/embed/') ? u.pathname.split('/embed/')[1].split('?')[0] : u.searchParams.get('v')
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
  } catch { /* not a URL */ }
  return null
}

function toPlayable(url: string): Playable {
  const id = ytIdFromUrl(url)
  if (id) return { kind: 'youtube', id }
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)) return { kind: 'file', url }
  return { kind: 'embed', url }
}

function YouTubePlayer({ id, title, autoplay, startAt, onProgress, onEnded }: {
  id: string; title: string; autoplay: boolean; startAt: number
  onProgress?: (s: number) => void; onEnded?: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const cb = useRef({ onProgress, onEnded })
  cb.current = { onProgress, onEnded }

  useEffect(() => {
    let player: any
    let timer: ReturnType<typeof setInterval> | undefined
    let dead = false
    loadYouTubeApi().then(YT => {
      if (dead || !host.current) return
      const el = document.createElement('div')
      host.current.innerHTML = ''
      host.current.appendChild(el)
      player = new YT.Player(el, {
        videoId: id,
        width: '100%', height: '100%',
        playerVars: { autoplay: autoplay ? 1 : 0, start: Math.floor(startAt), rel: 0, modestbranding: 1, playsinline: 1, origin: window.location.origin },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.ENDED) cb.current.onEnded?.()
            if (e.data === YT.PlayerState.PLAYING && !timer) {
              timer = setInterval(() => {
                const t = player?.getCurrentTime?.()
                if (typeof t === 'number') cb.current.onProgress?.(t)
              }, 5000)
            }
            if (e.data === YT.PlayerState.PAUSED) {
              const t = player?.getCurrentTime?.()
              if (typeof t === 'number') cb.current.onProgress?.(t)
            }
          },
        },
      })
    })
    return () => { dead = true; if (timer) clearInterval(timer); try { player?.destroy?.() } catch { /* ignore */ } }
  }, [id, autoplay, startAt])

  return <div ref={host} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" aria-label={title} />
}

function FilePlayer({ url, autoplay, startAt, onProgress, onEnded }: {
  url: string; autoplay: boolean; startAt: number
  onProgress?: (s: number) => void; onEnded?: () => void
}) {
  const [error, setError] = useState(false)
  const last = useRef(0)
  if (error) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-3">
      <AlertCircle className="w-10 h-10 text-red-500/70" />
      <p className="text-zinc-400 text-sm text-center px-4">Could not load the video. Refresh the page to try again.</p>
    </div>
  )
  return (
    <video
      src={url}
      autoPlay={autoplay}
      controls
      playsInline
      controlsList="nodownload"
      disablePictureInPicture={false}
      onContextMenu={e => e.preventDefault()}
      className="w-full h-full bg-black"
      onLoadedMetadata={e => { if (startAt > 3) e.currentTarget.currentTime = startAt }}
      onTimeUpdate={e => {
        const t = e.currentTarget.currentTime
        if (Math.abs(t - last.current) >= 5) { last.current = t; onProgress?.(t) }
      }}
      onPause={e => onProgress?.(e.currentTarget.currentTime)}
      onEnded={onEnded}
      onError={() => setError(true)}
    />
  )
}

export default function VideoPlayer({
  lectureId, url, title, thumbnail, autoplay = false, startAt = 0, watermark, onProgress, onEnded,
}: VideoPlayerProps) {
  const [started, setStarted] = useState(autoplay)
  const [src, setSrc]         = useState<Playable | null>(url ? toPlayable(url) : null)
  const [err, setErr]         = useState<string | null>(null)

  // Resolve the source from the server (enrolment-checked, private files are signed)
  useEffect(() => {
    if (!lectureId || !started) return
    let dead = false
    setErr(null); setSrc(null)
    fetch(`/api/lectures/${lectureId}/video`)
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (dead) return
        if (!r.ok) setErr(d.error ?? 'Could not load this video.')
        else setSrc(d.video as Playable)
      })
      .catch(() => { if (!dead) setErr('Network error. Check your connection and try again.') })
    return () => { dead = true }
  }, [lectureId, started])

  if (!lectureId && !url) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-3">
      <AlertCircle className="w-10 h-10 text-zinc-600" />
      <p className="text-zinc-500 text-sm">No video available</p>
    </div>
  )

  if (!started) return (
    <button
      type="button"
      className="relative w-full h-full cursor-pointer group block"
      onClick={() => setStarted(true)}
      aria-label={`Play ${title}`}
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
        <div className="w-20 h-20 rounded-full bg-orange-500 group-hover:bg-orange-400 flex items-center justify-center shadow-2xl shadow-orange-500/40 transition-all group-hover:scale-110">
          <Play className="w-9 h-9 text-white fill-white translate-x-0.5" />
        </div>
      </div>
    </button>
  )

  if (err) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-3 px-6 text-center">
      <Lock className="w-10 h-10 text-zinc-600" />
      <p className="text-zinc-400 text-sm">{err}</p>
    </div>
  )

  if (!src) return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  )

  return (
    <div className="relative w-full h-full bg-black">
      {src.kind === 'youtube' && (
        <YouTubePlayer id={src.id} title={title} autoplay startAt={startAt} onProgress={onProgress} onEnded={onEnded} />
      )}
      {src.kind === 'file' && (
        <FilePlayer url={src.url} autoplay startAt={startAt} onProgress={onProgress} onEnded={onEnded} />
      )}
      {src.kind === 'embed' && (
        <iframe
          src={src.url}
          title={title}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      )}
      {watermark && (
        <span
          aria-hidden
          className="pointer-events-none select-none absolute top-3 right-3 text-[11px] font-mono text-white/25 drop-shadow"
        >
          {watermark}
        </span>
      )}
    </div>
  )
}
