import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { TOPIC_MAP } from '@/lib/topic-data'
import FlashcardDeck from '@/components/flashcards/FlashcardDeck'

interface Props { params: Promise<{ topic: string }> }

export async function generateStaticParams() {
  return Object.keys(TOPIC_MAP).map(slug => ({ topic: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params
  const meta = TOPIC_MAP[slug]
  if (!meta) return { title: 'Not Found' }
  return {
    title: `${meta.label} Flashcards — Key Concepts | AmanAI Lab`,
    description: `${meta.cards.length} flashcards covering ${meta.concepts.slice(0, 4).join(', ')} and more. Free daily ${meta.label} practice.`,
    alternates: { canonical: `https://amanailab.com/flashcards/${slug}` },
  }
}

export default async function FlashcardTopicPage({ params }: Props) {
  const { topic: slug } = await params
  const meta = TOPIC_MAP[slug]
  if (!meta) notFound()
  return <FlashcardDeck topic={meta} />
}
