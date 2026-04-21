import { motion } from "framer-motion"
import Link from "next/link"

export default function Empty({ filtered }: { filtered: boolean }) {
  return (
    <motion.div className="flex flex-col items-center justify-center py-24 px-6 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
    <motion.div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {filtered
          ? <><path d="M3 6h18M7 12h10M11 18h2" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" /></>
          : <><circle cx="12" cy="8" r="4" stroke="#52525b" strokeWidth="1.5" /><path d="M4 20c0-4.418 3.582-7 8-7s8 2.582 8 7" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" /></>
        }
      </svg>
    </motion.div>
    <h3 className="text-white font-semibold text-base mb-2">{filtered ? "No tasks match" : "No tasks assigned to you"}</h3>
    <p className="text-zinc-600 text-sm max-w-xs">
      {filtered ? "Try adjusting your filters or search query." : "Tasks assigned to you across all boards will appear here."}
    </p>
    {filtered && (
      <Link href="/tasks">
        <motion.span className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-all" whileHover={{ scale: 1.02 }}>
          Clear filters
        </motion.span>
      </Link>
    )}
  </motion.div>
  )
}
