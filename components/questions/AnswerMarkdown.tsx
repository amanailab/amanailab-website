/* eslint-disable react/no-array-index-key */
'use client'

import React from 'react'

// Lightweight, dependency-free renderer for the model answers we seed.
// Supports:
//   - Paragraph breaks (blank lines)
//   - Bullet lists ("- ..." or "* ...")
//   - Numbered lists ("1. ...", "2. ...")
//   - Inline **bold** and *italic*
//   - Inline `code`
//   - Fenced ```code``` blocks
//   - Soft line breaks within a paragraph (preserved as <br>)

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split by pattern keeping delimiters: `code`, **bold**, *italic*
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return tokens.map((t, i) => {
    const k = `${keyPrefix}-${i}`
    if (t.startsWith('`') && t.endsWith('`') && t.length > 2) {
      return <code key={k} className="bg-zinc-800 text-orange-300 px-1.5 py-0.5 rounded text-[12.5px] font-mono">{t.slice(1, -1)}</code>
    }
    if (t.startsWith('**') && t.endsWith('**') && t.length > 4) {
      return <strong key={k} className="font-semibold text-zinc-100">{t.slice(2, -2)}</strong>
    }
    if (t.startsWith('*') && t.endsWith('*') && t.length > 2) {
      return <em key={k} className="italic text-zinc-200">{t.slice(1, -1)}</em>
    }
    // Preserve soft line breaks within a paragraph
    const parts = t.split('\n')
    return parts.flatMap((p, j) => j === 0
      ? [<React.Fragment key={`${k}-${j}`}>{p}</React.Fragment>]
      : [<br key={`${k}-${j}-br`} />, <React.Fragment key={`${k}-${j}`}>{p}</React.Fragment>])
  })
}

export default function AnswerMarkdown({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null

  // Split into blocks separated by one or more blank lines, preserving fenced code blocks intact.
  const blocks: string[] = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let buf: string[] = []
  let inFence = false
  const flush = () => {
    if (buf.length > 0) {
      blocks.push(buf.join('\n').trim())
      buf = []
    }
  }
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      buf.push(line)
      if (inFence) {
        // closing fence — flush as its own block
        flush()
        inFence = false
      } else {
        // opening fence — start collecting until close
        inFence = true
      }
      continue
    }
    if (inFence) { buf.push(line); continue }
    if (line.trim() === '') { flush(); continue }
    buf.push(line)
  }
  flush()

  return (
    <div className={`text-sm text-zinc-300 leading-relaxed space-y-2.5 ${className}`}>
      {blocks.map((block, bi) => {
        // Fenced code block
        if (block.startsWith('```')) {
          const inner = block.replace(/^```[a-zA-Z0-9]*\n?/, '').replace(/```$/, '')
          return (
            <pre key={bi} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-x-auto text-[12.5px] font-mono text-orange-300">
              <code>{inner}</code>
            </pre>
          )
        }

        const blockLines = block.split('\n')

        // Bullet list — every line starts with - or *
        if (blockLines.every(l => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={bi} className="list-disc pl-5 space-y-1 marker:text-orange-400">
              {blockLines.map((l, li) => (
                <li key={li} className="text-zinc-300">{renderInline(l.replace(/^\s*[-*]\s+/, ''), `b${bi}-${li}`)}</li>
              ))}
            </ul>
          )
        }

        // Numbered list — every line starts with N.
        if (blockLines.every(l => /^\s*\d+\.\s+/.test(l))) {
          return (
            <ol key={bi} className="list-decimal pl-5 space-y-1 marker:text-orange-400">
              {blockLines.map((l, li) => (
                <li key={li} className="text-zinc-300">{renderInline(l.replace(/^\s*\d+\.\s+/, ''), `n${bi}-${li}`)}</li>
              ))}
            </ol>
          )
        }

        // Heading
        if (blockLines.length === 1) {
          const h2 = blockLines[0].match(/^##\s+(.+)/)
          if (h2) return <h3 key={bi} className="text-base font-bold text-zinc-100 mt-1">{renderInline(h2[1], `h${bi}`)}</h3>
          const h3 = blockLines[0].match(/^###\s+(.+)/)
          if (h3) return <h4 key={bi} className="text-sm font-bold text-zinc-100 mt-1">{renderInline(h3[1], `h${bi}`)}</h4>
        }

        // Plain paragraph — join lines with soft breaks
        return (
          <p key={bi} className="text-zinc-300">
            {renderInline(block, `p${bi}`)}
          </p>
        )
      })}
    </div>
  )
}
