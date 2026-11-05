// Single source of truth for the Diwali AI Accelerator cohort.
export const DIWALI = {
  totalSeats: 3,
  price: 49999,
  regularPrice: 105000,
  deposit: 15000,
  // Applications close 12 Nov 2026, 11:59 PM IST
  deadline: '2026-11-12T23:59:00+05:30',
  deadlineLabel: '12 November 2026',
  startLabel: 'around 15 November 2026',
  whatsapp: '919997600372',
  pdf: '/pdfs/AmanAI_Lab_Diwali_AI_Accelerator_2026.pdf',
} as const

// Payment plans, in paise. Amounts are always decided on the server.
export const DIWALI_PLANS = {
  deposit: { label: 'Reserve my seat', paise: 15000 * 100 },
  full: { label: 'Pay full fee', paise: 49999 * 100 },
} as const
export type DiwaliPlan = keyof typeof DIWALI_PLANS

export const DIWALI_STATUSES = ['new', 'call_scheduled', 'selected', 'paid', 'rejected'] as const
export type DiwaliStatus = (typeof DIWALI_STATUSES)[number]

export function applicationsClosed(now = Date.now()): boolean {
  return now > new Date(DIWALI.deadline).getTime()
}

