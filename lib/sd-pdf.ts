// Client-side PDF export for a graded system design attempt.
// jsPDF is imported dynamically so it never lands in the server bundle.

export interface SdPdfReview {
  overallScore: number
  grade: string
  summary: string
  strengths: string[]
  gaps: string[]
  sectionScores: Record<string, number | null>
  codeQuality: { score: number; notes: string } | null
  topSuggestion: string
  interviewerNote: string
  followUps?: { question: string; whatStrongAnswersCover: string }[]
}

export interface SdPdfData {
  problemTitle: string
  category: string
  design: string
  diagramText: string
  snippets: { name: string; language: string; code: string }[]
  review: SdPdfReview | null
}

const SECTION_LABELS: Record<string, string> = {
  requirements: 'Requirements',
  architecture: 'Architecture',
  scalability:  'Scalability',
  dataModel:    'Data Model',
  tradeoffs:    'Trade-offs',
}

type RGB = [number, number, number]
const ORANGE: RGB = [234, 88, 12]
const INK:    RGB = [24, 24, 27]
const BODY:   RGB = [63, 63, 70]
const MUTED:  RGB = [148, 148, 155]
const RULE:   RGB = [228, 228, 232]

// Strip markdown inline markers so text renders cleanly.
function clean(text: string): string {
  return (text ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g,     '$1')
    .replace(/\*(.+?)\*/g,     '$1')
    .replace(/_(.+?)_/g,       '$1')
    .replace(/`(.+?)`/g,       '$1')
    .replace(/~~(.+?)~~/g,     '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function exportDesignPdf(data: SdPdfData): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const pageW   = doc.internal.pageSize.getWidth()
  const pageH   = doc.internal.pageSize.getHeight()
  const M       = 54                 // page margin
  const contentW = pageW - M * 2
  const bottom  = pageH - 56
  let y = M

  const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2])
  const setFill  = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const setDraw  = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2])

  const ensure = (space: number) => { if (y + space > bottom) { doc.addPage(); y = M } }

  // Core paragraph writer. Left edge = M + indent; wrapped lines align under it.
  const para = (
    text: string,
    { size = 10, style = 'normal', color = BODY, font = 'helvetica', lh = 15, indent = 0, gapAfter = 0 }:
    { size?: number; style?: string; color?: RGB; font?: string; lh?: number; indent?: number; gapAfter?: number } = {},
  ) => {
    doc.setFont(font, style); doc.setFontSize(size); setColor(color)
    const lines = doc.splitTextToSize(text, contentW - indent) as string[]
    for (const ln of lines) { ensure(lh); doc.text(ln, M + indent, y); y += lh }
    y += gapAfter
  }

  // Bulleted item with a colored dot and hanging indent.
  const bullet = (text: string, dot: RGB, color: RGB) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    const lines = doc.splitTextToSize(text, contentW - 16) as string[]
    ensure(15)
    setFill(dot); doc.circle(M + 3, y - 3.5, 2, 'F')
    setColor(color)
    for (let i = 0; i < lines.length; i++) { if (i) ensure(14); doc.text(lines[i], M + 16, y); y += 14 }
    y += 3
  }

  // Section heading: orange tab + title + full-width divider. Always left-aligned at M.
  const heading = (title: string) => {
    ensure(46)
    y += 16
    setFill(ORANGE); doc.rect(M, y - 9, 3.5, 12, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); setColor(INK)
    doc.text(title.toUpperCase(), M + 11, y + 1.5)
    y += 9
    setDraw(RULE); doc.setLineWidth(0.75); doc.line(M, y, M + contentW, y)
    y += 12
  }

  // A tinted box sized to its wrapped text — measured first so it never splits.
  const noteBox = (text: string, fill: RGB, textColor: RGB, opts: { border?: RGB; italic?: boolean } = {}) => {
    const padX = 12, padY = 10, size = 10, lh = 15
    doc.setFont('helvetica', opts.italic ? 'italic' : 'normal'); doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, contentW - padX * 2) as string[]
    const boxH = padY * 2 + lines.length * lh - (lh - size) + 2
    ensure(boxH + 2)
    setFill(fill)
    if (opts.border) { setDraw(opts.border); doc.setLineWidth(0.75); doc.roundedRect(M, y, contentW, boxH, 5, 5, 'FD') }
    else doc.roundedRect(M, y, contentW, boxH, 5, 5, 'F')
    setColor(textColor)
    let ty = y + padY + size - 1
    for (const ln of lines) { doc.text(ln, M + padX, ty); ty += lh }
    y += boxH
  }

  const scoreRGB = (s: number): RGB => s >= 7 ? [34, 150, 80] : s >= 5 ? [188, 124, 20] : [200, 60, 60]

  // ── Header ──────────────────────────────────────────────────────────────────
  setFill(ORANGE); doc.rect(0, 0, pageW, 6, 'F')
  y = M

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setColor(ORANGE)
  doc.setCharSpace(0.6)
  doc.text('AMANAI LAB  //  SYSTEM DESIGN PRACTICE', M, y)
  doc.setCharSpace(0)
  y += 20

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); setColor(INK)
  for (const ln of doc.splitTextToSize(clean(data.problemTitle), contentW) as string[]) { doc.text(ln, M, y); y += 23 }

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setColor(MUTED)
  doc.text(`${data.category}   //   ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`, M, y)
  y += 8

  const r = data.review

  if (r) {
    // ── Score banner ─────────────────────────────────────────────────────────
    y += 14
    const bh = 56
    ensure(bh)
    setFill([250, 250, 251]); setDraw(RULE); doc.setLineWidth(0.75)
    doc.roundedRect(M, y, contentW, bh, 6, 6, 'FD')

    // score badge (left)
    setFill(ORANGE); doc.roundedRect(M + 14, y + 14, 78, 28, 5, 5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); setColor([255, 255, 255])
    doc.text(`${r.overallScore}/10`, M + 53, y + 33, { align: 'center' })

    // grade (middle)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setColor(MUTED)
    doc.setCharSpace(0.5); doc.text('OVERALL GRADE', M + 108, y + 22); doc.setCharSpace(0)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(23); setColor(INK)
    doc.text(r.grade, M + 108, y + 44)

    // best-at-a-glance strengths count (right)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setColor(MUTED)
    doc.text('STRENGTHS', M + contentW - 14, y + 22, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setFontSize(23); setColor([34, 150, 80])
    doc.text(String(r.strengths.length), M + contentW - 14, y + 44, { align: 'right' })

    y += bh + 6

    if (r.summary) para(clean(r.summary), { size: 10.5, color: BODY, lh: 16, gapAfter: 2 })

    // ── Section scores — aligned label + bar + score ──────────────────────────
    const entries = Object.entries(r.sectionScores).filter(([, v]) => v !== null) as [string, number][]
    if (entries.length) {
      heading('Section Scores')
      const labelW = 108
      const scoreW = 42
      const barX   = M + labelW
      const barW   = contentW - labelW - scoreW - 8
      for (const [key, score] of entries) {
        ensure(20)
        const base = y + 8
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); setColor(BODY)
        doc.text(SECTION_LABELS[key] ?? key, M, base + 3)
        setFill([234, 234, 238]); doc.roundedRect(barX, base - 3, barW, 7, 3.5, 3.5, 'F')
        const c = scoreRGB(score)
        setFill(c); doc.roundedRect(barX, base - 3, Math.max(7, barW * (score / 10)), 7, 3.5, 3.5, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); setColor(c)
        doc.text(`${score}/10`, M + contentW, base + 3, { align: 'right' })
        y += 20
      }
    }

    if (r.strengths.length) {
      heading('Strengths')
      for (const s of r.strengths) bullet(clean(s), [34, 150, 80], [55, 92, 66])
    }

    if (r.gaps.length) {
      heading('Gaps to Fix')
      for (const g of r.gaps) bullet(clean(g), [200, 60, 60], [128, 62, 62])
    }

    if (r.topSuggestion) {
      heading('Top Priority Improvement')
      noteBox(clean(r.topSuggestion), [255, 247, 237], [124, 45, 4], { border: ORANGE })
    }

    if (r.codeQuality) {
      heading(`Code Quality — ${r.codeQuality.score}/10`)
      para(clean(r.codeQuality.notes), { color: BODY, lh: 15 })
    }

    if (r.interviewerNote) {
      heading('Interviewer Note')
      noteBox(`"${clean(r.interviewerNote)}"`, [244, 244, 246], [78, 78, 92], { italic: true })
    }

    if (r.followUps && r.followUps.length) {
      heading('Interviewer Follow-up Questions')
      r.followUps.forEach((f, i) => {
        para(`Q${i + 1}.  ${clean(f.question)}`, { size: 10.5, style: 'bold', color: [40, 55, 110], lh: 15 })
        if (f.whatStrongAnswersCover) para(clean(f.whatStrongAnswersCover), { size: 9, color: MUTED, lh: 13, indent: 22, gapAfter: 6 })
        else y += 6
      })
    }
  }

  // ── Your written design ──────────────────────────────────────────────────────
  if (data.design.trim()) {
    heading('Your Design')
    for (const raw of data.design.split('\n')) {
      const line = raw.replace(/\r$/, '')
      if (/^###\s/.test(line))        para(clean(line.replace(/^###\s+/, '')), { size: 10.5, style: 'bold', color: [42, 42, 48], lh: 15 })
      else if (/^##\s/.test(line))    { y += 6; para(clean(line.replace(/^##\s+/, '')), { size: 12, style: 'bold', color: INK, lh: 16 }) }
      else if (/^#\s/.test(line))     { y += 8; para(clean(line.replace(/^#\s+/, '')), { size: 13, style: 'bold', color: INK, lh: 17 }) }
      else if (/^\s*[-*]\s/.test(line)) bullet(clean(line.replace(/^\s*[-*]\s+/, '')), MUTED, BODY)
      else if (/^\d+\.\s/.test(line)) {
        const m = line.match(/^(\d+)\.\s+(.*)$/)
        if (m) {
          ensure(15)
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setColor(ORANGE)
          doc.text(`${m[1]}.`, M, y)
          para(clean(m[2]), { color: BODY, lh: 15, indent: 22 })
        }
      }
      else if (line.trim() === '') y += 6
      else para(clean(line), { color: BODY, lh: 15 })
    }
  }

  // ── Architecture diagram ──────────────────────────────────────────────────────
  if (data.diagramText.trim()) {
    heading('Architecture Diagram')
    noteBox(data.diagramText.replace(/\r/g, ''), [247, 247, 249], [70, 70, 78])
  }

  // ── Code snippets ──────────────────────────────────────────────────────────────
  const codeSnips = data.snippets.filter(s => s.code.trim())
  if (codeSnips.length) {
    heading('Code Snippets')
    for (const s of codeSnips) {
      y += 4
      para(`${s.name}   (${s.language})`, { size: 9.5, style: 'bold', color: [60, 60, 92], lh: 14 })
      y += 2
      // monospace code block, measured so it never splits
      const padX = 12, padY = 10, size = 8, lh = 11.5
      doc.setFont('courier', 'normal'); doc.setFontSize(size)
      const lines = doc.splitTextToSize(s.code.replace(/\t/g, '  '), contentW - padX * 2) as string[]
      const boxH = padY * 2 + lines.length * lh
      ensure(boxH + 2)
      setFill([245, 245, 249]); doc.roundedRect(M, y, contentW, boxH, 5, 5, 'F')
      setColor([32, 32, 38])
      let ty = y + padY + size - 1
      for (const ln of lines) { doc.text(ln, M + padX, ty); ty += lh }
      y += boxH + 4
    }
  }

  // ── Footer on every page ─────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    setDraw(RULE); doc.setLineWidth(0.5); doc.line(M, pageH - 38, pageW - M, pageH - 38)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setColor(MUTED)
    doc.text('amanailab.com', M, pageH - 24)
    doc.text(`Page ${p} of ${pages}`, pageW - M, pageH - 24, { align: 'right' })
  }

  const safe = clean(data.problemTitle).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'design'
  doc.save(`system-design-${safe}.pdf`)
}
