'use client'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode | ReactNode[]
}

export function StaggerFeed({ children }: Props) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: i * 0.04, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </>
  )
}
