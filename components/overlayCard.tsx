import { PRIORITY_CONFIG } from '@/helpers/helpers';
import { Task } from '@/structs/types';
import React from 'react'

export default function OverlayCard({ task }: { task: Task }) {
    const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.low;
  return (
    <div className="bg-zinc-900 border border-violet-500/50 rounded-xl p-4 shadow-2xl shadow-violet-500/20 rotate-2 w-72 opacity-95 pointer-events-none">
      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border mb-3 ${priority.bg} ${priority.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
        {priority.label}
      </span>
      <p className="text-white text-sm font-medium leading-snug">{task.title}</p>
      {task.category && (
        <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 border border-zinc-700/40">
          {task.category}
        </span>
      )}
    </div>
  );
}
