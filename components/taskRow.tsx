import { formatDue } from '@/helpers/helpers';
import { Board, COLUMN, PRIORITY, Task } from '@/structs/types';
import { motion } from 'framer-motion';

export default function TaskRow({
  task, boards, index, onOpen, onComplete,
}: {
  task: Task; boards: Board[]; index: number;
  onOpen: (t: Task) => void;
  onComplete: (t: Task) => void;
}) {
  const pri   = PRIORITY[task.priority] ?? PRIORITY.low;
  const col   = COLUMN[task.column?.name?.toLowerCase() ?? "todo"] ?? COLUMN["todo"];
  const due   = formatDue(task.due_date);
  const board = boards.find((b) => b.id === task.board_id);
  const done  = task.column?.name?.toLowerCase() === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        done
          ? "bg-zinc-900/30 border-zinc-800/30 opacity-60 hover:opacity-80"
          : "bg-zinc-900 border-zinc-800/60 hover:border-zinc-700/60 hover:bg-zinc-900/80"
      }`}
      onClick={() => onOpen(task)}
    >
      {/* Checkbox */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); onComplete(task); }}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          done ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 hover:border-violet-500 group-hover:border-zinc-600"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {done && (
          <motion.svg width="10" height="10" viewBox="0 0 10 10" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }}>
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </motion.button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate transition-all ${done ? "line-through text-zinc-600" : "text-zinc-200 group-hover:text-white"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-zinc-600 text-xs truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* Board */}
      {board && (
        <div className="hidden md:flex items-center gap-1.5 min-w-0 max-w-[120px]">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 flex-shrink-0" />
          <span className="text-zinc-600 text-xs truncate">{board.name}</span>
        </div>
      )}

      {/* Category */}
      {task.category && (
        <span className="hidden lg:inline text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 border border-zinc-700/40 flex-shrink-0">
          {task.category}
        </span>
      )}

      {/* Column */}
      <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${col.bg} flex-shrink-0`}>
        <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
        <span className={`capitalize ${col.color}`}>{task.column?.name ?? "todo"}</span>
      </div>

      {/* Priority */}
      <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${pri.bg} ${pri.color} flex-shrink-0`}>
        <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
        {pri.label}
      </span>

      {/* Due date */}
      {due && (
        <span className={`text-xs flex items-center gap-1 flex-shrink-0 ${
          due.state === "overdue" ? "text-red-400" :
          due.state === "today" || due.state === "soon" ? "text-yellow-400" : "text-zinc-600"
        }`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
            <path d="M5 3v2l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">{due.label}</span>
        </span>
      )}

      {/* Open arrow */}
      <motion.div
        className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0"
        animate={{ x: [0, 2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
