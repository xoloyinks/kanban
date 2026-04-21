import React from 'react'
import { motion } from 'framer-motion'

export default function EmptyBoards({ onCreateBoard }: { onCreateBoard: () => void }) {
  return (
    <motion.div
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <motion.div
                className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="3" y="3" width="9" height="9" rx="2" stroke="#52525b" strokeWidth="1.5" />
                    <rect x="16" y="3" width="9" height="9" rx="2" stroke="#52525b" strokeWidth="1.5" />
                    <rect x="3" y="16" width="9" height="9" rx="2" stroke="#52525b" strokeWidth="1.5" />
                    <path d="M20.5 16v9M16 20.5h9" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </motion.div>
            <h3 className="text-white font-semibold text-base mb-2">No boards yet</h3>
            <p className="text-zinc-600 text-sm max-w-xs mb-6">
                Create your first board to start managing tasks with your team.
            </p>
            <motion.button
                onClick={onCreateBoard}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Create board
            </motion.button>
        </motion.div>
  )
}
