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

const ORANGE: [number, number, number] = [234, 88, 12]
const INK:    [number, number, number] = [24, 24, 27]
const BODY:   [number, number, number] = [63, 63, 70]
const MUTED:  [number, number, number] = [140, 140, 145]

// Strip common markdown inline markers (bold, italic, code, strikethrough, links)
function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g,     '$1')
    .replace(/\*(.+?)\*/g,     '$1')
    .replace(/_(.+?)_/g,       '$1')
    .replace(/`(.+?)`/g,       '$1')
    .replace(/~~(.+?)~~/g,     '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .trim()
}

export async function exportDesignPdf(data: SdPdfData): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 52
  const maxW   = pageW - margin * 2
  const bottom = pageH - margin
  let y = margin

  const newPage = () => { doc.addPage(); y = margin }
  const ensure  = (space: number) => { if (y + space > bottom) newPage() }
  const gap     = (h = 8) => { y += h }

  type WriteOpts = {
    size?: number; style?: string; color?: [number, number, number]
    font?: string; lh?: number; indent?: number; width?: number
  }

  // Wrap + measure without drawing (used to keep cards on a single page).
  const wrap = (text: string, size: number, font: string, style: string, width: number): string[] => {
    doc.setFont(font, style)
    doc.setFontSize(size)
    return doc.splitTextToSize(text, width)
  }

  const write = (text: string, o: WriteOpts = {}) => {
    const { size = 10, style = 'normal', color = BODY, font = 'helvetica', lh = 15, indent = 0 } = o
    const width = (o.width ?? maxW) - indent
    const lines = wrap(text, size, font, style, width)
    doc.setTextColor(color[0], color[1], color[2])
    for (const ln of lines) {
      ensure(lh)
      doc.text(ln, margin + indent, y)
      y += lh
    }
  }

  // Inline rich-text: renders **bold**, *italic* and `code` in-place with word wrap.
  type Seg = { text: string; bold?: boolean; italic?: boolean; code?: boolean }
  const parseRich = (s: string): Seg[] => {
    const segs: Seg[] = []
    const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\s][^*]*?)\*|_([^_\s][^_]*?)_|`([^`]+)`)/g
    let last = 0, m: RegExpExecArray | null
    while ((m = re.exec(s))) {
      if (m.index > last) segs.push({ text: s.slice(last, m.index) })
      if (m[2] !== undefined || m[3] !== undefined) segs.push({ text: (m[2] ?? m[3])!, bold: true })
      else if (m[4] !== undefined || m[5] !== undefined) segs.push({ text: (m[4] ?? m[5])!, italic: true })
      else if (m[6] !== undefined) segs.push({ text: m[6], code: true })
      last = re.lastIndex
    }
    if (last < s.length) segs.push({ text: s.slice(last) })
    return segs.length ? segs : [{ text: s }]
  }

  const writeRich = (text: string, o: WriteOpts = {}) => {
    const { size = 10, color = BODY, lh = 15, indent = 0 } = o
    const startX = margin + indent
    const right  = margin + (o.width ?? maxW)
    const words: { w: string; seg: Seg }[] = []
    for (const seg of parseRich(text)) {
      for (const part of seg.text.split(/(\s+)/)) if (part.length) words.push({ w: part, seg })
    }
    ensure(lh)
    let cx = startX
    for (const { w, seg } of words) {
      const font  = seg.code ? 'courier' : 'helvetica'
      const style = seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal'
      doc.setFont(font, style); doc.setFontSize(size)
      const ww = doc.getTextWidth(w)
      if (cx + ww > right && cx > startX && w.trim() !== '') { y += lh; ensure(lh); cx = startX }
      if (cx === startX && w.trim() === '') continue   // drop leading space after wrap
      doc.setTextColor(...(seg.code ? [82, 82, 110] as [number, number, number] : color))
      doc.text(w, cx, y)
      cx += ww
    }
    y += lh
  }

  const sectionHeading = (text: string) => {
    ensure(40)
    gap(14)
    doc.setFillColor(...ORANGE)
    doc.rect(margin, y - 9, 4, 13, 'F')       // orange tab marker
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...INK)
    doc.text(text, margin + 12, y + 2)
    y += 10
    doc.setDrawColor(230, 230, 233)
    doc.setLineWidth(0.75)
    doc.line(margin, y, margin + maxW, y)
    gap(10)
  }

  // Draw a tinted rounded card sized to its wrapped text — never splits a page.
  const card = (
    text: string,
    opts: { fill: [number, number, number]; border?: [number, number, number]; textColor: [number, number, number]; size?: number; font?: string; style?: string; lh?: number },
  ) => {
    const { fill, border, textColor, size = 10, font = 'helvetica', style = 'normal', lh = 15 } = opts
    const padX = 14, padY = 12
    const lines = wrap(text, size, font, style, maxW - padX * 2)
    const boxH  = lines.length * lh + padY * 2 - (lh - size)
    ensure(boxH + 4)
    doc.setFillColor(...fill)
    if (border) { doc.setDrawColor(...border); doc.setLineWidth(0.75); doc.roundedRect(margin, y, maxW, boxH, 5, 5, 'FD') }
    else doc.roundedRect(margin, y, maxW, boxH, 5, 5, 'F')
    doc.setFont(font, style)
    doc.setFontSize(size)
    doc.setTextColor(...textColor)
    let ty = y + padY + size - 2
    for (const ln of lines) { doc.text(ln, margin + padX, ty); ty += lh }
    y += boxH
  }

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.setFillColor(...ORANGE)
  doc.rect(0, 0, pageW, 6, 'F')
  y = margin + 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...ORANGE)
  doc.text('AMANAI LAB  ·  SYSTEM DESIGN PRACTICE', margin, y)
  y += 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(19)
  doc.setTextColor(...INK)
  for (const ln of wrap(data.problemTitle, 19, 'helvetica', 'bold', maxW)) { doc.text(ln, margin, y); y += 24 }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(
    `${data.category}   ·   ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    margin, y,
  )
  y += 6

  const r = data.review

  // ── Score banner ─────────────────────────────────────────────────────────────
  if (r) {
    gap(14)
    const boxH = 52
    ensure(boxH)
    doc.setFillColor(249, 250, 251)
    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.75)
    doc.roundedRect(margin, y, maxW, boxH, 6, 6, 'FD')

    // Score badge
    doc.setFillColor(...ORANGE)
    doc.roundedRect(margin + 14, y + 12, 74, 28, 5, 5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(255, 255, 255)
    doc.text(`${r.overallScore}/10`, margin + 51, y + 31, { align: 'center' })

    // Grade + label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text('OVERALL GRADE', margin + 104, y + 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(...INK)
    doc.text(r.grade, margin + 104, y + 42)

    y += boxH + 4

    if (r.summary) {
      gap(10)
      writeRich(r.summary, { size: 10.5, color: BODY, lh: 15.5 })
    }

    // Section scores — labelled progress bars
    const entries = Object.entries(r.sectionScores).filter(([, v]) => v !== null) as [string, number][]
    if (entries.length) {
      sectionHeading('Section Scores')
      const labelW = 118
      const scoreW = 40
      const barX   = margin + labelW
      const barW   = maxW - labelW - scoreW
      const rowH   = 22
      for (const [key, score] of entries) {
        ensure(rowH)
        const midY = y + 8
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(...BODY)
        doc.text(SECTION_LABELS[key] ?? key, margin, midY + 3)
        // track
        doc.setFillColor(235, 235, 238)
        doc.roundedRect(barX, midY - 3, barW, 7, 3.5, 3.5, 'F')
        // fill
        const sc: [number, number, number] = score >= 7 ? [34, 160, 84] : score >= 5 ? [201, 130, 20] : [214, 69, 69]
        doc.setFillColor(...sc)
        doc.roundedRect(barX, midY - 3, Math.max(7, barW * (score / 10)), 7, 3.5, 3.5, 'F')
        // score
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(...sc)
        doc.text(`${score}/10`, margin + maxW, midY + 3, { align: 'right' })
        y += rowH
      }
    }

    if (r.strengths.length) {
      sectionHeading('Strengths')
      for (const s of r.strengths) {
        ensure(15)
        doc.setFillColor(34, 160, 84)
        doc.circle(margin + 3, y - 3, 2, 'F')
        writeRich(s, { color: [52, 96, 66], lh: 15, indent: 14 })
        gap(4)
      }
    }

    if (r.gaps.length) {
      sectionHeading('Gaps to Fix')
      for (const g of r.gaps) {
        ensure(15)
        doc.setFillColor(214, 69, 69)
        doc.circle(margin + 3, y - 3, 2, 'F')
        writeRich(g, { color: [140, 60, 60], lh: 15, indent: 14 })
        gap(4)
      }
    }

    if (r.topSuggestion) {
      sectionHeading('Top Priority Improvement')
      card(stripInline(r.topSuggestion), {
        fill: [255, 247, 237], border: ORANGE, textColor: [124, 45, 4], size: 10.5, lh: 15.5,
      })
    }

    if (r.codeQuality) {
      sectionHeading(`Code Quality — ${r.codeQuality.score}/10`)
      writeRich(r.codeQuality.notes, { color: BODY, lh: 15 })
    }

    if (r.interviewerNote) {
      sectionHeading('Interviewer Note')
      card(`"${stripInline(r.interviewerNote)}"`, {
        fill: [244, 244, 246], textColor: [82, 82, 95], size: 10, style: 'italic', lh: 15,
      })
    }

    if (r.followUps && r.followUps.length) {
      sectionHeading('Interviewer Follow-up Questions')
      r.followUps.forEach((f, i) => {
        ensure(20)
        write(`Q${i + 1}.  ${stripInline(f.question)}`, { size: 10.5, style: 'bold', color: [40, 55, 110], lh: 15 })
        if (f.whatStrongAnswersCover) {
          gap(1)
          write(`A strong answer covers: ${stripInline(f.whatStrongAnswersCover)}`, { size: 9, color: MUTED, lh: 13, indent: 16 })
        }
        gap(6)
      })
    }
  }

  // ── Your written design ──────────────────────────────────────────────────────
  if (data.design.trim()) {
    sectionHeading('Your Design')

    for (const rawLine of data.design.split('\n')) {
      const line = rawLine.replace(/\r$/, '')

      if (/^###\s/.test(line)) {
        gap(6)
        write(stripInline(line.replace(/^###\s+/, '')), { size: 10.5, style: 'bold', color: [40, 40, 45], lh: 15 })
        gap(1)
      } else if (/^##\s/.test(line)) {
        gap(9)
        write(stripInline(line.replace(/^##\s+/, '')), { size: 12, style: 'bold', color: INK, lh: 16 })
        gap(2)
      } else if (/^#\s/.test(line)) {
        gap(11)
        write(stripInline(line.replace(/^#\s+/, '')), { size: 13.5, style: 'bold', color: INK, lh: 18 })
        gap(3)
      } else if (/^\s*[-*]\s/.test(line)) {
        const depth = /^\s{2,}/.test(line) ? 1 : 0
        const ind   = 12 + depth * 14
        ensure(14)
        doc.setFillColor(160, 160, 165)
        doc.circle(margin + ind - 6, y - 3, 1.6, 'F')
        writeRich(line.replace(/^\s*[-*]\s+/, ''), { color: BODY, lh: 14.5, indent: ind })
      } else if (/^\d+\.\s/.test(line)) {
        const m = line.match(/^(\d+)\.\s+(.*)$/)
        if (m) {
          ensure(14)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(...ORANGE)
          doc.text(`${m[1]}.`, margin, y)
          writeRich(m[2], { color: BODY, lh: 14.5, indent: 20 })
        }
      } else if (line.trim() === '') {
        gap(6)
      } else {
        writeRich(line, { color: BODY, lh: 15 })
      }
    }
  }

  // ── Architecture diagram (plain text) ────────────────────────────────────────
  if (data.diagramText.trim()) {
    sectionHeading('Architecture Diagram')
    card(data.diagramText, { fill: [247, 247, 249], textColor: [70, 70, 78], size: 8.5, font: 'courier', lh: 12 })
  }

  // ── Code snippets ────────────────────────────────────────────────────────────
  const codeSnips = data.snippets.filter(s => s.code.trim())
  if (codeSnips.length) {
    sectionHeading('Code Snippets')
    for (const s of codeSnips) {
      gap(6)
      write(`${s.name}   (${s.language})`, { size: 9.5, style: 'bold', color: [55, 55, 85], lh: 14 })
      gap(3)
      card(s.code, { fill: [244, 244, 248], textColor: [30, 30, 35], size: 8, font: 'courier', lh: 11.5 })
    }
  }

  // ── Footer on every page ─────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(232, 232, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, pageH - 34, pageW - margin, pageH - 34)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('amanailab.com', margin, pageH - 20)
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 20, { align: 'right' })
  }

  const safe = data.problemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'design'
  doc.save(`system-design-${safe}.pdf`)
}
