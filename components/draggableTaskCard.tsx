import { formatDate, PRIORITY_CONFIG } from '@/helpers/helpers';
import { Task } from '@/structs/types';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';

export default function DraggableTaskCard(
    {
      task, onOpen, isDragging,
    }: {
      task: Task; onOpen: (t: Task) => void; isDragging?: boolean;
    }
) {

    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
      const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.low;
      const due = formatDate(task.due_date);
    
      const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999 }
        : undefined;
        
   return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        className={`group relative bg-zinc-900 border rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200 select-none ${isDragging
          ? "border-violet-500/40 shadow-xl shadow-violet-500/10 scale-[1.02] opacity-80"
          : "border-zinc-800/60 hover:border-zinc-700/80"
          }`}
        whileHover={!isDragging ? { y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" } : {}}
        onClick={() => onOpen(task)}
        {...listeners}
      >
        {/* Drag handle indicator */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="text-zinc-500">
            <circle cx="3" cy="2" r="1.5" /><circle cx="7" cy="2" r="1.5" />
            <circle cx="3" cy="7" r="1.5" /><circle cx="7" cy="7" r="1.5" />
            <circle cx="3" cy="12" r="1.5" /><circle cx="7" cy="12" r="1.5" />
          </svg>
        </div>

        {/* Priority */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${priority.bg} ${priority.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>
        </div>

        {/* Title */}
        <p className="text-white text-sm font-medium leading-snug mb-3 pr-4">{task.title}</p>

        {/* Description preview */}
        {task.description && (
          <p className="text-zinc-600 text-xs leading-relaxed mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {task.category ? (
            <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 border border-zinc-700/40">
              {task.category}
            </span>
          ) : <div />}
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
    </div>
  );
}
