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

// Strip common markdown inline markers (bold, italic, code, strikethrough)
function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g,     '$1')
    .replace(/`(.+?)`/g,       '$1')
    .replace(/~~(.+?)~~/g,     '$1')
}

export async function exportDesignPdf(data: SdPdfData): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 48
  const maxW   = pageW - margin * 2
  let y = margin

  const ensure = (space: number) => {
    if (y + space > pageH - margin) { doc.addPage(); y = margin }
  }
  const gap = (h = 8) => { y += h }

  const write = (
    text: string,
    {
      size   = 10,
      style  = 'normal',
      color  = [60, 60, 60] as [number, number, number],
      font   = 'helvetica',
      lh     = 15,
      indent = 0,
    } = {},
  ) => {
    doc.setFont(font, style)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
    const lines = doc.splitTextToSize(text, maxW - indent)
    for (const ln of lines) {
      ensure(lh + 2)
      doc.text(ln, margin + indent, y)
      y += lh
    }
  }

  const sectionHeading = (text: string) => {
    ensure(36)
    gap(12)
    doc.setDrawColor(234, 88, 12)
    doc.setLineWidth(2)
    doc.line(margin, y, margin + 28, y)
    y += 7
    write(text, { size: 12, style: 'bold', color: [20, 20, 20], lh: 17 })
    gap(4)
  }

  // ── Orange top bar ──────────────────────────────────────────────────────────
  doc.setFillColor(234, 88, 12)
  doc.rect(0, 0, pageW, 5, 'F')
  y = margin

  write('AmanAI Lab — System Design Practice', { size: 9, style: 'bold', color: [234, 88, 12], lh: 14 })
  gap(5)
  write(data.problemTitle, { size: 18, style: 'bold', color: [15, 15, 15], lh: 24 })
  write(
    `${data.category}  |  ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    { size: 9, color: [140, 140, 140], lh: 14 },
  )
  gap(12)

  const r = data.review

  // ── Score box ───────────────────────────────────────────────────────────────
  if (r) {
    ensure(56)
    doc.setFillColor(250, 250, 250)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, y, maxW, 48, 5, 5, 'FD')

    // Score badge
    doc.setFillColor(234, 88, 12)
    doc.roundedRect(margin + 12, y + 10, 68, 28, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(255, 255, 255)
    doc.text(`${r.overallScore}/10`, margin + 46, y + 29, { align: 'center' })

    // Grade
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(20, 20, 20)
    doc.text(r.grade, margin + 96, y + 32)

    // Sub-label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text('Overall Score', margin + 96, y + 14)

    y += 58

    if (r.summary) {
      write(r.summary, { size: 10, color: [70, 70, 70], lh: 15 })
      gap(6)
    }

    // Section scores — one row per entry with a right-aligned score
    const sectionEntries = Object.entries(r.sectionScores).filter(([, v]) => v !== null)
    if (sectionEntries.length) {
      sectionHeading('Section Scores')
      for (const [key, val] of sectionEntries) {
        const label = SECTION_LABELS[key] ?? key
        const score = val as number

        ensure(22)
        doc.setFillColor(246, 246, 248)
        doc.setDrawColor(235, 235, 240)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin, y - 2, maxW, 20, 3, 3, 'FD')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(70, 70, 70)
        doc.text(label, margin + 10, y + 12)

        const scoreColor: [number, number, number] =
          score >= 7 ? [30, 120, 55] : score >= 5 ? [160, 100, 10] : [170, 45, 45]
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...scoreColor)
        doc.text(`${score} / 10`, margin + maxW - 10, y + 12, { align: 'right' })

        y += 24
      }
      gap(2)
    }

    if (r.strengths.length) {
      sectionHeading('Strengths')
      for (const s of r.strengths) {
        write(`(+)  ${stripInline(s)}`, { color: [30, 110, 55], lh: 15 })
        gap(2)
      }
    }

    if (r.gaps.length) {
      sectionHeading('Gaps to Fix')
      for (const g of r.gaps) {
        write(`(!)  ${stripInline(g)}`, { color: [160, 40, 40], lh: 15 })
        gap(2)
      }
    }

    if (r.topSuggestion) {
      sectionHeading('Top Priority Improvement')
      ensure(30)
      doc.setFillColor(255, 247, 237)
      doc.setDrawColor(234, 88, 12)
      doc.setLineWidth(0.5)
      const tLines = doc.splitTextToSize(stripInline(r.topSuggestion), maxW - 28)
      const tH = tLines.length * 15 + 16
      doc.roundedRect(margin, y, maxW, tH, 4, 4, 'FD')
      y += 10
      for (const ln of tLines) {
        ensure(15)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(120, 45, 0)
        doc.text(ln, margin + 14, y)
        y += 15
      }
      y += 6
    }

    if (r.codeQuality) {
      sectionHeading(`Code Quality  ${r.codeQuality.score}/10`)
      write(stripInline(r.codeQuality.notes), { color: [60, 60, 60], lh: 15 })
    }

    if (r.interviewerNote) {
      sectionHeading('Interviewer Note')
      write(`"${stripInline(r.interviewerNote)}"`, { style: 'italic', color: [80, 80, 100], lh: 15 })
    }

    if (r.followUps && r.followUps.length) {
      sectionHeading('Interviewer Follow-up Questions')
      r.followUps.forEach((f, i) => {
        gap(4)
        write(`Q${i + 1}.  ${stripInline(f.question)}`, { size: 10, style: 'bold', color: [40, 60, 120], lh: 15 })
        if (f.whatStrongAnswersCover) {
          write(`Strong answer covers: ${stripInline(f.whatStrongAnswersCover)}`, { size: 9, color: [100, 100, 110], lh: 13, indent: 18 })
        }
        gap(4)
      })
    }
  }

  // ── Your written design ──────────────────────────────────────────────────────
  if (data.design.trim()) {
    sectionHeading('Your Design')

    for (const rawLine of data.design.split('\n')) {
      const line = rawLine.replace(/\r$/, '')

      if (/^###\s/.test(line)) {
        gap(4)
        write(stripInline(line.replace(/^###\s+/, '')), { size: 10, style: 'bold', color: [40, 40, 40], lh: 14 })
        gap(2)
      } else if (/^##\s/.test(line)) {
        gap(8)
        write(stripInline(line.replace(/^##\s+/, '')), { size: 11, style: 'bold', color: [25, 25, 25], lh: 16 })
        gap(3)
      } else if (/^#\s/.test(line)) {
        gap(10)
        write(stripInline(line.replace(/^#\s+/, '')), { size: 13, style: 'bold', color: [15, 15, 15], lh: 18 })
        gap(4)
      } else if (/^[-*]\s/.test(line)) {
        write('•  ' + stripInline(line.replace(/^[-*]\s+/, '')), { color: [60, 60, 60], lh: 14, indent: 14 })
      } else if (/^\d+\.\s/.test(line)) {
        const m = line.match(/^(\d+\.\s+)(.*)$/)
        if (m) write(`${m[1]}${stripInline(m[2])}`, { color: [60, 60, 60], lh: 14, indent: 14 })
      } else if (line.trim() === '') {
        gap(6)
      } else {
        write(stripInline(line), { color: [60, 60, 60], lh: 15 })
      }
    }
  }

  // ── Architecture diagram (plain text) ────────────────────────────────────────
  if (data.diagramText.trim()) {
    sectionHeading('Architecture Diagram')
    write(data.diagramText, { size: 8.5, font: 'courier', color: [60, 60, 60], lh: 12 })
  }

  // ── Code snippets ────────────────────────────────────────────────────────────
  const codeSnips = data.snippets.filter(s => s.code.trim())
  if (codeSnips.length) {
    sectionHeading('Code Snippets')
    for (const s of codeSnips) {
      gap(4)
      ensure(24)
      doc.setFillColor(238, 238, 245)
      const codeLines = doc.splitTextToSize(s.code, maxW - 24)
      const cH = codeLines.length * 11 + 22
      doc.roundedRect(margin, y, maxW, cH, 4, 4, 'F')
      y += 6
      write(`${s.name}  (${s.language})`, { size: 9, style: 'bold', color: [55, 55, 90], lh: 14, indent: 10 })
      gap(2)
      write(s.code, { size: 8, font: 'courier', color: [30, 30, 30], lh: 11, indent: 10 })
      y += 6
      gap(6)
    }
  }

  // ── Page numbers ─────────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.5)
    doc.line(margin, pageH - 32, pageW - margin, pageH - 32)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(170, 170, 170)
    doc.text(`amanailab.com  |  page ${p} of ${pages}`, margin, pageH - 20)
  }

  const safe = data.problemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'design'
  doc.save(`system-design-${safe}.pdf`)
}
