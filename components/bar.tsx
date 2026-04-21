import React from 'react'
import { motion } from 'framer-motion'

export default function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: max > 0 ? `${(value / max) * 100}%` : 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
        />
    </div>
  )
}
