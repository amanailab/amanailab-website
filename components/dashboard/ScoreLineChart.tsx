'use client'

import { useState } from 'react'

interface Point {
  topic: string
  score: number
  date: string
}

interface Props {
  points: Point[]
}

const W = 600
const H = 160
const PAD = { top: 16, right: 16, bottom: 28, left: 32 }

function scoreColor(s: number) {
  if (s >= 8) return '#4ade80'
  if (s >= 6) return '#60a5fa'
  if (s >= 4) return '#facc15'
  return '#f87171'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ScoreLineChart({ points }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (points.length < 2) return null

  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const xs = points.map((_, i) => PAD.left + (i / (points.length - 1)) * innerW)
  const ys = points.map((p) => PAD.top + innerH - (p.score / 10) * innerH)

  // Smooth bezier path
  const linePath = points.map((_, i) => {
    if (i === 0) return `M ${xs[0]} ${ys[0]}`
    const cpx = (xs[i - 1] + xs[i]) / 2
    return `C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`
  }).join(' ')

  const fillPath = `${linePath} L ${xs[xs.length - 1]} ${PAD.top + innerH} L ${xs[0]} ${PAD.top + innerH} Z`

  // Y-axis labels
  const yLabels = [0, 4, 6, 8, 10]

  return (
    <div className="relative w-full" style={{ aspectRatio: `${W}/${H}` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        onMouseLeave={() => setHovered(null)}
      >
        {/* Grid lines */}
        {yLabels.map((v) => {
          const y = PAD.top + innerH - (v / 10) * innerH
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#27272a" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#52525b" fontSize="9">{v}</text>
            </g>
          )
        })}

        {/* Fill */}
        <defs>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#fillGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + hover areas */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Hit area */}
            <rect
              x={xs[i] - 20}
              y={0}
              width={40}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
            />
            {/* Dot */}
            <circle
              cx={xs[i]}
              cy={ys[i]}
              r={hovered === i ? 5 : 3.5}
              fill={hovered === i ? scoreColor(p.score) : '#f97316'}
              stroke={hovered === i ? '#fff' : '#f97316'}
              strokeWidth={hovered === i ? 2 : 1}
              style={{ transition: 'r 0.1s, fill 0.1s' }}
            />

            {/* Hover vertical line */}
            {hovered === i && (
              <line
                x1={xs[i]} y1={PAD.top}
                x2={xs[i]} y2={PAD.top + innerH}
                stroke="#52525b"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
            )}

            {/* X-axis label (every other point if many) */}
            {(points.length <= 6 || i % Math.ceil(points.length / 6) === 0) && (
              <text
                x={xs[i]}
                y={H - 4}
                textAnchor="middle"
                fill="#52525b"
                fontSize="8"
              >
                {formatDate(p.date)}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (() => {
        const p = points[hovered]
        const leftPct = (xs[hovered] / W) * 100
        const above = ys[hovered] > H / 2
        return (
          <div
            className="absolute pointer-events-none z-10 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-center shadow-xl"
            style={{
              left: `${Math.min(Math.max(leftPct, 8), 82)}%`,
              transform: 'translateX(-50%)',
              top: above ? '4px' : 'auto',
              bottom: above ? 'auto' : '28px',
            }}
          >
            <p className="text-xs font-bold text-zinc-100">{p.score.toFixed(1)}<span className="text-zinc-500 font-normal">/10</span></p>
            <p className="text-[10px] text-zinc-400">{p.topic}</p>
            <p className="text-[10px] text-zinc-600">{formatDate(p.date)}</p>
          </div>
        )
      })()}
    </div>
  )
}
