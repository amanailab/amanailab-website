import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const TOOL_COLORS: Record<string, string> = {
  resume: '#f97316',
  interview: '#8b5cf6',
  linkedin: '#0a66c2',
  career: '#22c55e',
  quiz: '#3b82f6',
  playground: '#f59e0b',
  'cover-letter': '#ec4899',
  'skill-gap': '#14b8a6',
  daily: '#f97316',
  'job-prep': '#6366f1',
  'paper-explainer': '#8b5cf6',
  questions: '#f97316',
  default: '#f97316',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const name    = searchParams.get('name')    ?? 'AmanAI Lab Tool'
  const tagline = searchParams.get('tagline') ?? 'Free AI-powered tool'
  const emoji   = searchParams.get('emoji')   ?? '🧠'
  const tool    = searchParams.get('tool')    ?? 'default'
  const accent  = TOOL_COLORS[tool] ?? TOOL_COLORS.default

  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px',
        display: 'flex', flexDirection: 'column',
        backgroundColor: '#09090b', position: 'relative',
        overflow: 'hidden', fontFamily: 'sans-serif',
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)`,
          backgroundSize: '60px 60px', opacity: 0.4,
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '-80px', left: '50%',
          transform: 'translateX(-50%)',
          width: '700px', height: '400px',
          background: `radial-gradient(ellipse, ${accent}44 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }} />
        {/* Top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
        }} />
        <div style={{
          display: 'flex', flexDirection: 'column',
          padding: '60px 80px', flex: 1,
          position: 'relative', zIndex: 1,
          justifyContent: 'space-between',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '22px', color: '#e4e4e7', fontWeight: 700 }}>
              Aman<span style={{ color: accent }}>AI</span>
              <span style={{ color: '#71717a', fontWeight: 400 }}> Lab</span>
            </div>
            <div style={{
              fontSize: '12px', fontWeight: 600, color: accent,
              background: `${accent}18`, border: `1px solid ${accent}30`,
              padding: '4px 12px', borderRadius: '100px', marginLeft: '8px',
            }}>Free Tool</div>
          </div>
          {/* Main content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
            <div style={{
              width: '140px', height: '140px',
              background: `${accent}18`, border: `2px solid ${accent}40`,
              borderRadius: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '72px', flexShrink: 0,
            }}>
              {emoji}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                fontSize: name.length > 40 ? '44px' : '52px',
                fontWeight: 800, color: '#fafafa', lineHeight: 1.1,
              }}>{name}</div>
              <div style={{ fontSize: '22px', color: '#a1a1aa', lineHeight: 1.4 }}>
                {tagline}
              </div>
            </div>
          </div>
          {/* Bottom */}
          <div style={{ fontSize: '16px', color: '#52525b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: accent }} />
            amanailab.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
