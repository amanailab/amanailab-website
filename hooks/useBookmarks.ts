'use client'

import { useState, useEffect, useCallback } from 'react'

const BOOKMARKS_KEY = 'bookmarked_questions'

/**
 * Persists a set of bookmarked question ids in localStorage.
 * Shared by the Questions page and the Interview Hub's question bank so
 * "save" behaves identically in both places.
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '[]') as string[]
      setBookmarks(new Set(stored))
    } catch { /* ignore */ }
  }, [])

  const toggle = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }, [])

  return { bookmarks, toggle }
}
