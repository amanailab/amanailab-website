import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | AmanAI Lab',
  description: 'Privacy Policy for AmanAI Lab — how we collect, use, and protect your data.',
  alternates: { canonical: 'https://amanailab.com/privacy' },
}

const LAST_UPDATED = 'May 11, 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <p className="text-xs text-zinc-600 mb-2">Last updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-extrabold text-zinc-100 mb-2">Privacy Policy</h1>
        <p className="text-zinc-400 mb-10">AmanAI Lab (&quot;we&quot;, &quot;us&quot;) operates amanailab.com. This policy explains what data we collect and how we use it.</p>

        {[
          {
            title: '1. Information We Collect',
            body: [
              '**Account data** — when you sign up, we store your email address and display name via Supabase Auth.',
              '**Usage data** — interview sessions, quiz scores, code submissions, flashcard progress, and XP are stored in our database to power your dashboard and progress tracking.',
              '**Submitted content** — resume text, LinkedIn text, cover letters, and prompts you submit to our AI tools. These are processed in real time and not stored permanently.',
              '**Analytics** — we use Google Analytics and Microsoft Clarity to understand how visitors use the site. These tools may set cookies. No personally identifiable information is shared with them.',
            ],
          },
          {
            title: '2. How We Use Your Data',
            body: [
              'To provide and improve the service — showing your progress, streaks, and history.',
              'To send transactional emails — password resets, email verification, and (if you opt in) weekly digest emails.',
              'We do **not** sell your data to third parties.',
              'We do **not** use your submitted content (resumes, cover letters) to train AI models.',
            ],
          },
          {
            title: '3. Third-Party Services',
            body: [
              '**Supabase** — authentication and database (supabase.com/privacy)',
              '**Groq** — AI inference for tool responses. Inputs are sent to Groq\'s API for processing.',
              '**Google Analytics** — anonymised site analytics.',
              '**Microsoft Clarity** — session heatmaps and recordings.',
              '**Resend** — transactional email delivery.',
              '**Vercel** — hosting and edge infrastructure.',
            ],
          },
          {
            title: '4. Cookies',
            body: [
              'We use essential cookies for authentication (Supabase session cookies).',
              'Analytics cookies are set by Google Analytics and Microsoft Clarity.',
              'You can disable cookies in your browser settings, though this may affect site functionality.',
            ],
          },
          {
            title: '5. Data Retention',
            body: [
              'Your account data is retained until you delete your account.',
              'You can delete your account at any time from your Profile page — this permanently removes all associated data.',
              'Session logs and submissions are deleted with your account.',
            ],
          },
          {
            title: '6. Your Rights',
            body: [
              'You can request a copy of your data at any time by contacting us.',
              'You can delete your account and all associated data from the Profile page.',
              'EU/EEA users have rights under GDPR including access, rectification, and erasure.',
            ],
          },
          {
            title: '7. Contact',
            body: [
              'For privacy questions, email: aman.chauhan.ai71@gmail.com',
            ],
          },
        ].map(section => (
          <div key={section.title} className="mb-8">
            <h2 className="text-base font-bold text-zinc-200 mb-3">{section.title}</h2>
            <ul className="flex flex-col gap-2">
              {section.body.map((line, i) => (
                <li key={i} className="text-sm text-zinc-400 leading-relaxed">
                  {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-6 border-t border-zinc-800 flex gap-4">
          <Link href="/terms" className="text-sm text-orange-400 hover:underline">Terms of Service</Link>
          <Link href="/contact" className="text-sm text-zinc-500 hover:text-zinc-300">Contact Us</Link>
        </div>
      </div>
    </div>
  )
}
