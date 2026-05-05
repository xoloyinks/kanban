import { authHeaders, formatDue, timeAgo } from '@/helpers/helpers';
import { Board, Column, PRIORITY, Task } from '@/structs/types';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'

export default function TaskPanel({
  task, open, onClose, boards, columns, onUpdated, onDeleted,
}: {
  task: Task | null; open: boolean; onClose: () => void;
  boards: Board[]; columns: Column[];
  onUpdated: (t: Task) => void; onDeleted: (id: string) => void;
}) {
  const [editing, setEditing]         = useState(false);
  const [title, setTitle]             = useState("");
  const [desc, setDesc]               = useState("");
  const [priority, setPriority]       = useState("");
  const [category, setCategory]       = useState("");
  const [columnId, setColumnId]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);

  useEffect(() => {
    if (task) { setTitle(task.title); setDesc(task.description); setPriority(task.priority); setCategory(task.category); setColumnId(task.column?.id ?? ""); setEditing(false); setConfirmDel(false); }
  }, [task]);

  const save = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { board_id: task.board_id };
      if (title !== task.title) payload.title = title;
      if (desc  !== task.description) payload.description = desc;
      if (priority !== task.priority) payload.priority = priority;
      if (category !== task.category) payload.category = category;
      if (columnId !== task.column?.id) payload.column_id = columnId;
      const res = await fetch(`https://task-api-5zuk.onrender.com/tasks/${task.id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) { onUpdated({ ...task, title, description: desc, priority, category, column: columns.find((c) => c.id === columnId) ?? task.column }); setEditing(false); }
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      const res = await fetch(`https://task-api-5zuk.onrender.com/tasks/${task.id}`, { method: "DELETE", headers: authHeaders() });

      if (res.ok) { onDeleted(task.id); onClose(); }
    } finally { setDeleting(false); }
  };

  const pri = PRIORITY[priority] ?? PRIORITY.low;
  const due = task ? formatDue(task.due_date) : null;
  const board = boards.find((b) => b.id === task?.board_id);

  return (
    <AnimatePresence>
      {open && task && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-lg z-50 flex flex-col bg-zinc-950 border-l border-zinc-800/60 shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${pri.bg} ${pri.color}`}>{pri.label}</span>
                {task.column && <span className="text-xs text-zinc-600 capitalize">{task.column.name}</span>}
                {board && <span className="text-xs text-zinc-700">· {board.name}</span>}
              </div>
              <div className="flex items-center gap-2">
                {!editing ? (
                  <motion.button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-all" whileHover={{ scale: 1.02 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                    Edit
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-xl text-zinc-500 hover:text-white text-xs transition-all">Cancel</button>
                    <motion.button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-60 transition-all" whileHover={{ scale: 1.02 }}>
                      {saving ? <motion.div className="w-3 h-3 border border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /> : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      Save
                    </motion.button>
                  </div>
                )}
                <motion.button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all" whileHover={{ rotate: 90 }} transition={{ duration: 0.15 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Title */}
              <div>
                {editing ? (
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-xl font-bold outline-none focus:border-violet-500/60 transition-all" />
                ) : (
                  <h2 className="text-white text-xl font-bold leading-snug">{task.title}</h2>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Priority",
                    view: <span className={`inline-flex items-center gap-1.5 text-xs ${pri.color}`}><span className={`w-2 h-2 rounded-full ${pri.dot}`} />{pri.label}</span>,
                    edit: <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>,
                  },
                  {
                    label: "Column",
                    view: <span className="text-zinc-300 text-xs capitalize">{task.column?.name ?? "—"}</span>,
                    edit: <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none capitalize">{columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>,
                  },
                  {
                    label: "Category",
                    view: <span className="text-zinc-300 text-xs">{task.category || "—"}</span>,
                    edit: <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. frontend" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none placeholder-zinc-600" />,
                  },
                  {
                    label: "Due date",
                    view: <span className={`text-xs ${due?.state === "overdue" ? "text-red-400" : "text-zinc-300"}`}>{due?.label ?? "—"}</span>,
                    edit: null,
                  },
                ].map((field) => (
                  <div key={field.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
                    <p className="text-zinc-600 text-xs mb-2 uppercase tracking-widest font-medium">{field.label}</p>
                    {editing && field.edit ? field.edit : field.view}
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <p className="text-zinc-600 text-xs mb-3 uppercase tracking-widest font-medium">Description</p>
                {editing ? (
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder="Add a description..." className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/60 transition-all placeholder-zinc-600 resize-none" />
                ) : (
                  <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-3 min-h-[80px]">
                    {task.description ? <p className="text-zinc-400 text-sm leading-relaxed">{task.description}</p> : <p className="text-zinc-700 text-sm italic">No description</p>}
                  </div>
                )}
              </div>

              {/* Board link */}
              {board && (
                <Link href={`/boards/${board.id}`}>
                  <motion.div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all cursor-pointer group" whileHover={{ x: 2 }}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="#a78bfa" strokeWidth="1.2" /><rect x="8" y="1" width="5" height="5" rx="1" stroke="#a78bfa" strokeWidth="1.2" opacity="0.5" /><rect x="1" y="8" width="5" height="5" rx="1" stroke="#a78bfa" strokeWidth="1.2" opacity="0.5" /><rect x="8" y="8" width="5" height="5" rx="1" stroke="#a78bfa" strokeWidth="1.2" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-400 text-xs">Board</p>
                      <p className="text-white text-sm font-medium truncate">{board.name}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-zinc-700 group-hover:text-zinc-500 transition-colors">
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                </Link>
              )}

              {/* Timestamps */}
              <div className="border-t border-zinc-800/40 pt-4 space-y-1">
                <p className="text-zinc-700 text-xs">Created {new Date(task.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} · {timeAgo(task.created_at)}</p>
                <p className="text-zinc-700 text-xs">Updated {new Date(task.updated_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
            </div>

            {/* Delete */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-800/60">
              <AnimatePresence mode="wait">
                {!confirmDel ? (
                  <motion.button key="del" onClick={() => setConfirmDel(true)} className="flex items-center gap-2 text-zinc-700 hover:text-red-400 text-sm transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2h4v2M3 4l1 8h6l1-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Delete task
                  </motion.button>
                ) : (
                  <motion.div key="confirm" className="flex items-center gap-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <p className="text-zinc-500 text-xs flex-1">This cannot be undone.</p>
                    <button onClick={() => setConfirmDel(false)} className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-white text-xs transition-colors">Cancel</button>
                    <motion.button onClick={del} disabled={deleting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium disabled:opacity-60" whileTap={{ scale: 0.97 }}>
                      {deleting ? "Deleting..." : "Yes, delete"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
