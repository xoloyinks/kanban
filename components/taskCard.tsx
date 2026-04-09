import React from 'react'
import { motion } from 'framer-motion'
import { Task } from '@/structs/types'
import { formatDate, PRIORITY_CONFIG } from '@/helpers/helpers';

export default function TaskCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
    const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.low;
      const due      = formatDate(task.due_date);
  return (
    <motion.div
      layout
      layoutId={`task-${task.id}`}
      className="group relative bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 cursor-pointer hover:border-zinc-700/80 transition-all duration-200"
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onOpen(task)}
    >
      {/* Priority dot */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${priority.bg} ${priority.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
        <motion.div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-zinc-400 hover:bg-zinc-800 transition-all"
          whileHover={{ scale: 1.1 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="2" r="1" fill="currentColor" />
            <circle cx="6" cy="6" r="1" fill="currentColor" />
            <circle cx="6" cy="10" r="1" fill="currentColor" />
          </svg>
        </motion.div>
      </div>

      {/* Title */}
      <p className="text-white text-sm font-medium leading-snug mb-3 group-hover:text-zinc-100">
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="text-zinc-600 text-xs leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.category && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 border border-zinc-700/40">
              {task.category}
            </span>
          )}
        </div>
        {due && (
          <span className={`text-xs flex items-center gap-1 ${due.overdue ? "text-red-400" : "text-zinc-600"}`}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
              <path d="M5 3v2l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            {due.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}
