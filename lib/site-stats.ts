// Canonical marketing stats shown across the site. Change a number here and it
// updates everywhere that imports it, so the homepage, footer, and services page
// can't drift out of sync (we previously had "17+" / "18" / "19+" all at once).
export const SITE_STATS = {
  tools: '19+',
  questions: '500+',
  sheetTopics: '279',
  codeProblems: '45',
  systemDesignProblems: '18',
} as const
