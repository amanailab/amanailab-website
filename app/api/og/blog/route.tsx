import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const CATEGORY_COLOR: Record<string, string> = {
  'Tutorials':       '#f97316',
  'Interview Prep':  '#a855f7',
  'Companies':       '#0ea5e9',
  'Tools':           '#8b5cf6',
  'Career':          '#22c55e',
  'RAG':             '#8b5cf6',
  'Agents':          '#f97316',
  'Fine-Tuning':     '#eab308',
  'MLOps':           '#22c55e',
  'System Design':   '#ef4444',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title    = searchParams.get('title')    ?? 'AmanAI Lab Blog'
  const category = searchParams.get('category') ?? 'AI/ML'
  const readTime = searchParams.get('rt')       ?? '5'
  const accent   = CATEGORY_COLOR[category] ?? '#f97316'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.4,
        }} />

        {/* Orange glow */}
        <div style={{
          position: 'absolute',
          top: '-100px', left: '50%',
          transform: 'translateX(-50%)',
          width: '800px', height: '500px',
          background: `radial-gradient(ellipse, ${accent}33 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }} />

        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
        }} />

        <div style={{
          display: 'flex', flexDirection: 'column',
          padding: '60px 72px',
          flex: 1, position: 'relative', zIndex: 1,
          justifyContent: 'space-between',
        }}>
          {/* Top: brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: `${accent}22`,
              border: `1.5px solid ${accent}44`,
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '22px' }}>🧠</div>
            </div>
            <div style={{ display: 'flex', fontSize: '22px', color: '#e4e4e7', fontWeight: 700 }}>
              <span>Aman</span>
              <span style={{ color: accent }}>AI</span>
              <span style={{ color: '#71717a', fontWeight: 400, marginLeft: '6px' }}>Lab</span>
            </div>
          </div>

          {/* Middle: title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                fontSize: '15px', fontWeight: 600,
                color: accent,
                background: `${accent}18`,
                border: `1px solid ${accent}30`,
                padding: '4px 14px',
                borderRadius: '100px',
              }}>
                {category}
              </div>
              <div style={{ fontSize: '14px', color: '#71717a' }}>
                {`${readTime} min read`}
              </div>
            </div>

            <div style={{
              fontSize: title.length > 60 ? '40px' : title.length > 40 ? '46px' : '52px',
              fontWeight: 800,
              color: '#fafafa',
              lineHeight: 1.15,
              maxWidth: '900px',
            }}>
              {title}
            </div>
          </div>

          {/* Bottom: URL */}
          <div style={{
            fontSize: '16px', color: '#52525b',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '6px', height: '6px',
              borderRadius: '50%', backgroundColor: accent,
            }} />
            amanailab.com/blog
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
