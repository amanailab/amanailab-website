import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | AmanAI Lab',
  description: 'Terms of Service for AmanAI Lab — rules for using our AI/ML career platform.',
  alternates: { canonical: 'https://amanailab.com/terms' },
}

const LAST_UPDATED = 'May 11, 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <p className="text-xs text-zinc-600 mb-2">Last updated: {LAST_UPDATED}</p>
        <h1 className="text-3xl font-extrabold text-zinc-100 mb-2">Terms of Service</h1>
        <p className="text-zinc-400 mb-10">By using AmanAI Lab (&quot;the Service&quot;), you agree to these terms. Please read them carefully.</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: [
              'By accessing amanailab.com, you agree to be bound by these Terms of Service.',
              'If you do not agree with any part of these terms, you may not use the Service.',
            ],
          },
          {
            title: '2. Use of the Service',
            body: [
              'AmanAI Lab provides free AI-powered tools for AI/ML learning, interview preparation, and career development.',
              'You must be at least 13 years old to create an account.',
              'You are responsible for maintaining the security of your account credentials.',
              'You agree not to use the Service for any unlawful purpose or to violate any regulations.',
              'You agree not to attempt to abuse, overload, or reverse-engineer the Service.',
            ],
          },
          {
            title: '3. User Content',
            body: [
              'Content you submit (resumes, cover letters, blog comments) remains yours.',
              'By submitting content, you grant us a limited licence to process it to provide the Service.',
              'You are solely responsible for the accuracy and legality of content you submit.',
              'We reserve the right to remove any content that violates these terms.',
            ],
          },
          {
            title: '4. AI-Generated Content',
            body: [
              'Our tools use AI (powered by Groq / Llama models) to generate responses.',
              'AI-generated content is provided for informational and educational purposes only.',
              'We do not guarantee the accuracy, completeness, or suitability of AI-generated responses.',
              'Do not rely solely on AI-generated advice for important career or financial decisions.',
            ],
          },
          {
            title: '5. Intellectual Property',
            body: [
              'All original content, design, and code on AmanAI Lab is owned by Aman Chauhan.',
              'You may not reproduce or redistribute our content without permission.',
              'Our tools and AI features are provided for personal, non-commercial use only.',
            ],
          },
          {
            title: '6. Availability',
            body: [
              'We strive for high availability but do not guarantee uninterrupted access.',
              'We may modify, suspend, or discontinue any part of the Service at any time.',
              'Free features may be changed or removed with reasonable notice.',
            ],
          },
          {
            title: '7. Limitation of Liability',
            body: [
              'AmanAI Lab is provided "as is" without warranties of any kind.',
              'We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.',
              'Our total liability to you for any claim shall not exceed the amount you paid us in the past 12 months (which may be zero for free users).',
            ],
          },
          {
            title: '8. Changes to Terms',
            body: [
              'We may update these terms at any time. Continued use of the Service constitutes acceptance.',
              'We will notify registered users of significant changes by email.',
            ],
          },
          {
            title: '9. Contact',
            body: [
              'For questions about these terms: aman.chauhan.ai71@gmail.com',
            ],
          },
        ].map(section => (
          <div key={section.title} className="mb-8">
            <h2 className="text-base font-bold text-zinc-200 mb-3">{section.title}</h2>
            <ul className="flex flex-col gap-2">
              {section.body.map((line, i) => (
                <li key={i} className="text-sm text-zinc-400 leading-relaxed">{line}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-6 border-t border-zinc-800 flex gap-4">
          <Link href="/privacy" className="text-sm text-orange-400 hover:underline">Privacy Policy</Link>
          <Link href="/contact" className="text-sm text-zinc-500 hover:text-zinc-300">Contact Us</Link>
        </div>
      </div>
    </div>
  )
}
