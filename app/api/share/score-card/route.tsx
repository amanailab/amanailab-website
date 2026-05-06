import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const TOPIC_COLOR: Record<string, string> = {
  LLM:             '#3b82f6',
  RAG:             '#8b5cf6',
  Agents:          '#f97316',
  'Fine-Tuning':   '#eab308',
  MLOps:           '#22c55e',
  Transformers:    '#14b8a6',
  'System Design': '#ef4444',
  Python:          '#84cc16',
  'Vector DB':     '#ec4899',
  'Computer Vision':'#06b6d4',
  NLP:             '#a855f7',
  Statistics:      '#f59e0b',
  'SQL & Data':    '#10b981',
  Behavioral:      '#f43f5e',
}

function gradeColor(g: string) {
  if (g.startsWith('A')) return '#4ade80'
  if (g === 'B')         return '#60a5fa'
  if (g === 'C')         return '#facc15'
  return '#f87171'
}

function gradeMsg(g: string) {
  if (g === 'A+' || g === 'A') return 'Excellent performance'
  if (g === 'B')               return 'Good performance'
  if (g === 'C')               return 'Keep practicing'
  return 'Room to improve'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic  = searchParams.get('t') ?? 'AI/ML'
  const score  = searchParams.get('s') ?? '0'
  const grade  = searchParams.get('g') ?? 'F'
  const level  = searchParams.get('l') ?? 'Mid'

  const topicColor = TOPIC_COLOR[topic] ?? '#f97316'
  const gColor     = gradeColor(grade)

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{ width: '100%', height: '4px', background: 'linear-gradient(90deg, #f97316, #fb923c, #f97316)', display: 'flex' }} />

        {/* Subtle background glow */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${topicColor}18 0%, transparent 70%)`,
          display: 'flex',
        }} />

        <div style={{ display: 'flex', flex: 1, padding: '56px 72px', alignItems: 'center', gap: '80px' }}>

          {/* Left side */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '24px' }}>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px',
                background: '#f9731620',
                border: '1px solid #f9731640',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: '20px', height: '20px', background: '#f97316', borderRadius: '50%', display: 'flex' }} />
              </div>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#f4f4f5' }}>
                Aman<span style={{ color: '#f97316' }}>AI</span>
                <span style={{ color: '#71717a', fontWeight: '400' }}> Lab</span>
              </span>
            </div>

            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '18px', color: '#71717a', margin: 0 }}>AI/ML Interview Score Card</p>
              <h1 style={{ fontSize: '52px', fontWeight: '800', color: '#f4f4f5', margin: 0, lineHeight: 1.1 }}>
                I scored <span style={{ color: gColor }}>{grade}</span> on
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
                <div style={{
                  background: `${topicColor}25`,
                  border: `1px solid ${topicColor}50`,
                  borderRadius: '999px',
                  padding: '6px 18px',
                  display: 'flex',
                }}>
                  <span style={{ fontSize: '26px', fontWeight: '700', color: topicColor }}>{topic}</span>
                </div>
                <span style={{ fontSize: '22px', color: '#71717a' }}>· {level}</span>
              </div>
            </div>

            {/* Message */}
            <p style={{ fontSize: '20px', color: '#a1a1aa', margin: 0 }}>
              {gradeMsg(grade)} · Practice at amanailab.com
            </p>
          </div>

          {/* Right side — big score */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '28px',
            padding: '48px 56px',
            gap: '8px',
            minWidth: '260px',
          }}>
            <p style={{ fontSize: '14px', color: '#52525b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Score</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '88px', fontWeight: '900', color: gColor, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: '28px', color: '#52525b', fontWeight: '400' }}>/10</span>
            </div>
            <div style={{
              background: `${gColor}20`,
              border: `1px solid ${gColor}40`,
              borderRadius: '999px',
              padding: '6px 20px',
              display: 'flex',
              marginTop: '8px',
            }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: gColor }}>{grade}</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 72px',
          borderTop: '1px solid #18181b',
        }}>
          <span style={{ fontSize: '15px', color: '#3f3f46' }}>Free AI/ML interview prep · amanailab.com</span>
          <span style={{ fontSize: '15px', color: '#3f3f46' }}>Practice. Improve. Get hired.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
