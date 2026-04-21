import { Board } from '@/structs/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react'

const BOARD_COLORS = [
    "from-violet-500/20 to-violet-600/5 border-violet-500/20",
    "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
    "from-fuchsia-500/20 to-fuchsia-600/5 border-fuchsia-500/20",
    "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    "from-orange-500/20 to-orange-600/5 border-orange-500/20",
    "from-rose-500/20 to-rose-600/5 border-rose-500/20",
];

const DOT_COLORS = [
    "bg-violet-400",
    "bg-cyan-400",
    "bg-fuchsia-400",
    "bg-emerald-400",
    "bg-orange-400",
    "bg-rose-400",
];

export default function BoardCard({ board, index, teamName }: { board: Board; index: number; teamName?: string; }) {
  const colorClass = BOARD_COLORS[index % BOARD_COLORS.length];
    const dotClass = DOT_COLORS[index % DOT_COLORS.length];

    return (
        <Link href={`/dashboard/boards/${board.id}`}>
            <motion.div
                className={`group relative rounded-2xl p-5 bg-gradient-to-br border cursor-pointer overflow-hidden transition-all duration-300 ${colorClass}`}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                {/* Hover shimmer */}
                <motion.div
                    className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                />

                <div className="relative z-10">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-9 h-9 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center`}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <rect x="2" y="2" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" opacity="0.7" />
                                <rect x="9" y="2" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" opacity="0.4" />
                                <rect x="2" y="9" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" opacity="0.4" />
                                <rect x="9" y="9" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" opacity="0.7" />
                            </svg>
                        </div>
                        <motion.div
                            className="w-7 h-7 rounded-lg bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-center text-zinc-600 group-hover:text-zinc-400 group-hover:border-zinc-700 transition-all"
                            whileHover={{ rotate: 45 }}
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Board name */}
                    <h3 className="text-white font-semibold text-base mb-1 group-hover:text-white transition-colors">
                        {board.name}
                    </h3>
                    <p className="text-zinc-600 text-xs mb-4 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        {teamName ? teamName : "Personal Board"}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-700 font-medium uppercase tracking-wider">Open board</span>
                        <motion.svg
                            width="14" height="14" viewBox="0 0 14 14" fill="none"
                            className="text-zinc-700 group-hover:text-zinc-400 transition-colors"
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <path d="M2 7h10M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
