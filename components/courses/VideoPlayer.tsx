'use client'

import { useState, useRef } from 'react'
import { Play, AlertCircle } from 'lucide-react'

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.includes('/embed/')) return u.pathname.split('/embed/')[1].split('?')[0]
      return u.searchParams.get('v')
    }
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
  } catch { /* not a valid URL */ }
  return null
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i.test(url) ||
    url.includes('supabase') ||
    url.includes('storage')
}

interface VideoPlayerProps {
  url: string
  title: string
  thumbnail?: string | null
  autoplay?: boolean
}

export default function VideoPlayer({ url, title, thumbnail, autoplay = false }: VideoPlayerProps) {
  const [started, setStarted] = useState(autoplay)
  const [error, setError]     = useState(false)
  const videoRef              = useRef<HTMLVideoElement>(null)

  const ytId = getYouTubeId(url)
  const isDirect = isDirectVideo(url)

  // Blank / unknown URL
  if (!url) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-3">
      <AlertCircle className="w-10 h-10 text-zinc-600" />
      <p className="text-zinc-500 text-sm">No video available</p>
    </div>
  )

  // Thumbnail overlay before playback starts
  if (!started) return (
    <div
      className="relative w-full h-full cursor-pointer group"
      onClick={() => setStarted(true)}
      role="button"
      aria-label={`Play ${title}`}
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
        <div className="w-20 h-20 rounded-full bg-orange-500 group-hover:bg-orange-400 flex items-center justify-center shadow-2xl shadow-orange-500/40 transition-all group-hover:scale-110">
          <Play className="w-9 h-9 text-white fill-white translate-x-0.5" />
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
        <span className="text-xs bg-black/70 text-zinc-300 px-2.5 py-1 rounded-full backdrop-blur-sm">
          {ytId ? 'YouTube' : 'Video'} · Click to play
        </span>
      </div>
    </div>
  )

  // YouTube iframe
  if (ytId) return (
    <iframe
      src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
      title={title}
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )

  // Direct video (Supabase Storage, MP4, etc.)
  if (isDirect) {
    if (error) return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500/70" />
        <p className="text-zinc-400 text-sm text-center px-4">Could not load video.<br />Check the URL or try again.</p>
      </div>
    )
    return (
      <video
        ref={videoRef}
        src={url}
        autoPlay
        controls
        controlsList="nodownload"
        className="w-full h-full bg-black"
        onError={() => setError(true)}
      >
        Your browser doesn&apos;t support video playback.
      </video>
    )
  }

  // Fallback iframe (Vimeo, Loom, etc.)
  return (
    <iframe
      src={url}
      title={title}
      className="w-full h-full"
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  )
}
