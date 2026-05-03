import { COLUMN_CONFIG } from '@/helpers/helpers';
import { ColumnDef, Task } from '@/structs/types';
import { useDroppable } from '@dnd-kit/core';
import React, { useEffect, useRef, useState } from 'react'
import DraggableTaskCard from './draggableTaskCard';
import { AnimatePresence, motion } from 'framer-motion';

export default function DroppableColumn({
  colDef, onAddTask, onOpenTask, onRenameColumn, isOver,
}: {
  colDef: ColumnDef;
  onAddTask: (colName: string) => void;
  onOpenTask: (t: Task) => void;
  onRenameColumn: (id: string, name: string) => void;
  isOver: boolean;
}) {

    const { setNodeRef } = useDroppable({ id: colDef.name }); // use name as droppable id
      const cfg = COLUMN_CONFIG[colDef.name] ?? COLUMN_CONFIG["todo"];
      const [renaming, setRenaming] = useState(false);
      const [newName, setNewName] = useState<string>(colDef.name);
      const inputRef = useRef<HTMLInputElement>(null);
    
      useEffect(() => { if (renaming) inputRef.current?.focus(); }, [renaming]);
    
      const handleRename = async () => {
        if (!newName.trim() || newName === colDef.name || !colDef.id) { setRenaming(false); return; }
        await onRenameColumn(colDef.id, newName.trim());
        setRenaming(false);
      };
  return (
    <div className="flex flex-col overflow-hidden max-h-150 w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cfg.color.replace("text-", "bg-")}`} />
          {renaming ? (
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-0.5 text-white text-sm outline-none focus:border-violet-500/60 w-32"
            />
          ) : (
            <button
              onClick={() => colDef.id ? setRenaming(true) : undefined}
              className={`text-sm font-semibold capitalize ${cfg.color} ${colDef.id ? "hover:opacity-80" : "cursor-default"} transition-opacity`}
            >
              {colDef.name}
            </button>
          )}
          <motion.span
            className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.color} font-medium`}
            key={colDef.tasks.length}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {colDef.tasks.length}
          </motion.span>
        </div>

        <motion.button
          onClick={() => onAddTask(colDef.name)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-3 border max-h-150 overflow-y-auto overflow-x-hidden transition-all duration-200 space-y-3 ${isOver
          ? `${cfg.border} bg-zinc-900/60 ring-2 ${cfg.border} ring-offset-2 ring-offset-zinc-950`
          : `${cfg.border} bg-zinc-950/40`
          }`}

      >
        {/* Drop indicator */}
        <AnimatePresence>
          {isOver && (
            <motion.div
              className={`h-1 rounded-full ${cfg.color.replace("text-", "bg-")} opacity-60`}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.6 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {colDef.tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              layout
            >
              <DraggableTaskCard task={task} onOpen={onOpenTask} />
            </motion.div>
          ))}
        </AnimatePresence>

        {colDef.tasks.length === 0 && !isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-2"
          >
            <div className={`w-8 h-8 rounded-xl border border-dashed ${cfg.border} flex items-center justify-center ${cfg.color} opacity-30`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-zinc-700 text-xs">Drop tasks here</p>
          </motion.div>
        )}

        {/* Drop target hint when dragging over empty */}
        {colDef.tasks.length === 0 && isOver && (
          <motion.div
            className={`flex flex-col items-center justify-center py-12 gap-2 rounded-xl border-2 border-dashed ${cfg.border}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <p className={`text-xs font-medium ${cfg.color}`}>Release to move here</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
