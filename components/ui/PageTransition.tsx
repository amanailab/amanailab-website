'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

// Enter-only fade. A previous version wrapped this in <AnimatePresence mode="wait">, which holds the OLD
// page on screen until its exit animation finishes; with the App Router that freezes navigation
// (links appear dead until a hard refresh). Never block the new route on an exit animation.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
