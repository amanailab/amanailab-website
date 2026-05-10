"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function NavigationProgress() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 600)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[200] h-[2px] bg-orange-500 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </AnimatePresence>
  )
}
