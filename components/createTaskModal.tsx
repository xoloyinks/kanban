import { authHeaders } from '@/helpers/helpers';
import { Column, Task } from '@/structs/types';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react'

export default function CreateTaskModal(
    {
      open, onClose, boardId, defaultColumnName, columns, onCreated,
    }: {
      open: boolean; onClose: () => void;
      boardId: string; defaultColumnName: string;
      columns: Column[];
      onCreated: (task: Task) => void;
    }
) {
    const [title, setTitle]       = useState("");
      const [description, setDesc]  = useState("");
      const [priority, setPriority] = useState("low");
      const [category, setCategory] = useState("");
      const [dueDate, setDueDate]   = useState("");
      const [loading, setLoading]   = useState(false);
      const [error, setError]       = useState("");
    
      useEffect(() => {
        if (open) { setTitle(""); setDesc(""); setPriority("low"); setCategory(""); setDueDate(""); setError(""); }
      }, [open]);
    
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
          const payload: Record<string, unknown> = { title: title.trim(), board_id: boardId, priority };
          if (description.trim()) payload.description = description.trim();
          if (category.trim())    payload.category    = category.trim();
          if (dueDate)            payload.due_date     = new Date(dueDate).toISOString();
    
          const res = await fetch("https://task-api-5zuk.onrender.com/tasks", {
            method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.error || "Failed to create task"); return; }
          onCreated(data);
          onClose();
        } catch { setError("Something went wrong"); }
        finally { setLoading(false); }
      };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
                <div>
                  <h2 className="text-white font-bold text-base">New Task</h2>
                  <p className="text-zinc-600 text-xs mt-0.5 capitalize">Adding to · {defaultColumnName}</p>
                </div>
                <motion.button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all" whileHover={{ rotate: 90 }} transition={{ duration: 0.15 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Title *</label>
                  <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="What needs to be done?" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                  <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Add some context..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 transition-all resize-none" />
                </div>

                {/* Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500/60 transition-all appearance-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Category</label>
                    <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="frontend" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Due date</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500/60 transition-all [color-scheme:dark]" />
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
                  whileHover={!loading ? { scale: 1.01 } : {}}
                  whileTap={!loading ? { scale: 0.99 } : {}}
                >
                  {loading ? (
                    <>
                      <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Create task
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
