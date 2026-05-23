'use client'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 6 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

interface Props {
  children: ReactNode
}

export function StaggerFeed({ children }: Props) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={item}>{child}</motion.div>
          ))
        : children}
    </motion.div>
  )
}
