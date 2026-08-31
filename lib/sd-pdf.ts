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
    { size = 10, style = 'normal', color = [60, 60, 60], font = 'helvetica', lh = 14, indent = 0 }:
    { size?: number; style?: string; color?: [number, number, number]; font?: string; lh?: number; indent?: number } = {},
  ) => {
    doc.setFont(font, style)
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
    const lines = doc.splitTextToSize(text, maxW - indent)
    for (const ln of lines) {
      ensure(lh)
      doc.text(ln, margin + indent, y)
      y += lh
    }
  }

  const heading = (text: string) => {
    ensure(26)
    gap(6)
    doc.setDrawColor(234, 88, 12)
    doc.setLineWidth(2)
    doc.line(margin, y - 2, margin + 22, y - 2)
    write(text, { size: 12, style: 'bold', color: [20, 20, 20], lh: 16 })
    gap(2)
  }

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(234, 88, 12)
  doc.rect(0, 0, pageW, 6, 'F')
  write('AmanAI Lab — System Design Practice', { size: 9, style: 'bold', color: [234, 88, 12], lh: 13 })
  gap(2)
  write(data.problemTitle, { size: 18, style: 'bold', color: [20, 20, 20], lh: 22 })
  write(`${data.category}  ·  ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`, { size: 9, color: [130, 130, 130], lh: 13 })
  gap(6)

  const r = data.review

  // ── Score ─────────────────────────────────────────────────────────────────
  if (r) {
    ensure(30)
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(margin, y - 4, maxW, 30, 4, 4, 'F')
    write(`Overall Score: ${r.overallScore}/10        Grade: ${r.grade}`, { size: 13, style: 'bold', color: [20, 20, 20], lh: 18, indent: 10 })
    gap(8)
    if (r.summary) write(r.summary, { size: 10, color: [80, 80, 80], lh: 14 })
    gap(4)

    const sectionEntries = Object.entries(r.sectionScores).filter(([, v]) => v !== null)
    if (sectionEntries.length) {
      heading('Section Scores')
      for (const [key, val] of sectionEntries) {
        write(`${(SECTION_LABELS[key] ?? key).padEnd(16)}  ${val}/10`, { size: 10, font: 'courier', color: [50, 50, 50], lh: 14 })
      }
    }

    if (r.strengths.length) {
      heading('Strengths')
      for (const s of r.strengths) write(`•  ${s}`, { color: [40, 110, 60], lh: 14 })
    }
    if (r.gaps.length) {
      heading('Gaps to Fix')
      for (const g of r.gaps) write(`•  ${g}`, { color: [170, 50, 50], lh: 14 })
    }
    if (r.topSuggestion) {
      heading('Top Priority Improvement')
      write(r.topSuggestion, { color: [60, 60, 60] })
    }
    if (r.codeQuality) {
      heading(`Code Quality — ${r.codeQuality.score}/10`)
      write(r.codeQuality.notes, { color: [60, 60, 60] })
    }
    if (r.interviewerNote) {
      heading('Interviewer Note')
      write(`"${r.interviewerNote}"`, { style: 'italic', color: [90, 90, 90] })
    }
    if (r.followUps && r.followUps.length) {
      heading('Interviewer Follow-up Questions')
      r.followUps.forEach((f, i) => {
        write(`Q${i + 1}. ${f.question}`, { size: 10, style: 'bold', color: [40, 60, 120], lh: 14 })
        if (f.whatStrongAnswersCover) write(`A strong answer covers: ${f.whatStrongAnswersCover}`, { size: 9, color: [110, 110, 110], lh: 13, indent: 14 })
        gap(3)
      })
    }
  }

  // ── The written design ──────────────────────────────────────────────────────
  if (data.design.trim()) {
    heading('Your Design')
    for (const rawLine of data.design.split('\n')) {
      const line = rawLine.replace(/\r$/, '')
      if (/^##\s+/.test(line)) {
        gap(3)
        write(line.replace(/^##\s+/, ''), { size: 11, style: 'bold', color: [30, 30, 30], lh: 15 })
      } else if (/^#\s+/.test(line)) {
        gap(3)
        write(line.replace(/^#\s+/, ''), { size: 12, style: 'bold', color: [20, 20, 20], lh: 16 })
      } else if (line.trim() === '') {
        gap(4)
      } else {
        write(line.replace(/\*\*/g, ''), { color: [60, 60, 60] })
      }
    }
  }

  // ── Diagram (text summary) ──────────────────────────────────────────────────
  if (data.diagramText.trim()) {
    heading('Architecture Diagram (components & connections)')
    write(data.diagramText, { size: 9, font: 'courier', color: [70, 70, 70], lh: 12 })
  }

  // ── Code ────────────────────────────────────────────────────────────────────
  const codeSnips = data.snippets.filter(s => s.code.trim())
  if (codeSnips.length) {
    heading('Code')
    for (const s of codeSnips) {
      write(`${s.name} (${s.language})`, { size: 10, style: 'bold', color: [30, 30, 30], lh: 14 })
      write(s.code, { size: 8.5, font: 'courier', color: [50, 50, 50], lh: 11 })
      gap(6)
    }
  }

  // ── Footer page numbers ─────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`amanailab.com  ·  page ${p} of ${pages}`, margin, pageH - 24)
  }

  const safe = data.problemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'design'
  doc.save(`system-design-${safe}.pdf`)
}
