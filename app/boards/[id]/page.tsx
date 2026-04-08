"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Column { id: string; name: string; board_id: string; }
interface Task {
  id: string; title: string; description: string;
  assignee_id: string; board_id: string; column_id?: string;
  priority: string; category: string; due_date: string;
  created_at: string; updated_at: string;
  column: Column;
}
interface Board { id: string; name: string; destination_id: string; }
interface PaginatedTasks { data: Task[]; pagination: { page: number; limit: number; total: number; total_pages: number; has_next: boolean; has_prev: boolean; }; }
interface User { id: string; name: string; email: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });
const getInitials = (name: string) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  high:   { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",    dot: "bg-red-400",    label: "High"   },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400", label: "Medium" },
  low:    { color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", label: "Low" },
};

const COLUMN_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  "todo":        { color: "text-zinc-400",   bg: "bg-zinc-500/10",    border: "border-zinc-500/20",   glow: "shadow-zinc-500/10"   },
  "in progress": { color: "text-violet-400", bg: "bg-violet-500/10",  border: "border-violet-500/20", glow: "shadow-violet-500/20" },
  "completed":   { color: "text-emerald-400",bg: "bg-emerald-500/10", border: "border-emerald-500/20",glow: "shadow-emerald-500/10"},
};

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr.startsWith("0001")) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, overdue: true };
  if (days === 0) return { label: "Due today", overdue: false };
  if (days === 1) return { label: "Due tomorrow", overdue: false };
  return { label: `${d.toLocaleDateString("en", { month: "short", day: "numeric" })}`, overdue: false };
};

// ─── Task card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) => {
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
};

// ─── Column ───────────────────────────────────────────────────────────────────
const KanbanColumn = ({
  name, tasks, onAddTask, onOpenTask, onRenameColumn, columnId,
}: {
  name: string; tasks: Task[]; columnId: string;
  onAddTask: (colName: string) => void;
  onOpenTask: (t: Task) => void;
  onRenameColumn: (id: string, name: string) => void;
}) => {
  const cfg = COLUMN_CONFIG[name.toLowerCase()] ?? COLUMN_CONFIG["todo"];
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName]   = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = async () => {
    if (!newName.trim() || newName === name) { setRenaming(false); return; }
    await onRenameColumn(columnId, newName.trim());
    setRenaming(false);
  };

  useEffect(() => { if (renaming) inputRef.current?.focus(); }, [renaming]);

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
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
              onClick={() => setRenaming(true)}
              className={`text-sm font-semibold capitalize ${cfg.color} hover:opacity-80 transition-opacity`}
            >
              {name}
            </button>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.color} font-medium`}>
            {tasks.length}
          </span>
        </div>

        <motion.button
          onClick={() => onAddTask(name)}
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

      {/* Tasks */}
      <div className={`flex-1 rounded-2xl p-3 min-h-[200px] border ${cfg.border} bg-zinc-950/40 space-y-3`}>
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              <TaskCard task={task} onOpen={onOpenTask} />
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 gap-2"
          >
            <div className={`w-8 h-8 rounded-xl border border-dashed ${cfg.border} flex items-center justify-center ${cfg.color} opacity-40`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-zinc-700 text-xs">No tasks</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ─── Task detail modal ────────────────────────────────────────────────────────
const TaskModal = ({
  task, open, onClose, onUpdated, onDeleted, columns,
}: {
  task: Task | null; open: boolean;
  onClose: () => void;
  onUpdated: (t: Task) => void;
  onDeleted: (id: string) => void;
  columns: Column[];
}) => {
  const [editing, setEditing]     = useState(false);
  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [priority, setPriority]   = useState("");
  const [category, setCategory]   = useState("");
  const [columnId, setColumnId]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDesc(task.description);
      setPriority(task.priority);
      setCategory(task.category);
      setColumnId(task.column?.id ?? "");
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const boardId = task.board_id;
      const payload: Record<string, unknown> = { board_id: boardId };
      if (title !== task.title) payload.title = title;
      if (description !== task.description) payload.description = description;
      if (priority !== task.priority) payload.priority = priority;
      if (category !== task.category) payload.category = category;
      if (columnId !== task.column?.id) payload.column_id = columnId;

      const res = await fetch(`http://localhost:8000/tasks/${task.id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
      });
      if (res.ok) {
        onUpdated({ ...task, title, description, priority, category, column: columns.find((c) => c.id === columnId) ?? task.column });
        setEditing(false);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:8000/tasks/${task.id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) { onDeleted(task.id); onClose(); }
    } finally { setDeleting(false); }
  };

  const priority_cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.low;
  const due = task ? formatDate(task.due_date) : null;

  return (
    <AnimatePresence>
      {open && task && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-lg z-50 flex flex-col bg-zinc-950 border-l border-zinc-800/60 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${priority_cfg.bg} ${priority_cfg.color}`}>
                  {priority_cfg.label}
                </span>
                {task.column && (
                  <span className="text-xs text-zinc-600 capitalize">{task.column.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!editing ? (
                  <motion.button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                    Edit
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => setEditing(false)}
                      className="px-3 py-1.5 rounded-xl text-zinc-500 hover:text-white text-xs font-medium transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all disabled:opacity-60"
                      whileHover={{ scale: 1.02 }}
                    >
                      {saving ? (
                        <motion.div className="w-3 h-3 border border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      Save
                    </motion.button>
                  </div>
                )}
                <motion.button
                  onClick={onClose}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Title */}
              <div>
                {editing ? (
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none focus:border-violet-500/60 transition-all"
                  />
                ) : (
                  <h2 className="text-white text-xl font-bold leading-snug">{task.title}</h2>
                )}
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 text-xs mb-2 uppercase tracking-widest font-medium">Priority</p>
                  {editing ? (
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 text-xs ${priority_cfg.color}`}>
                      <span className={`w-2 h-2 rounded-full ${priority_cfg.dot}`} />
                      {priority_cfg.label}
                    </span>
                  )}
                </div>

                {/* Column */}
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 text-xs mb-2 uppercase tracking-widest font-medium">Column</p>
                  {editing ? (
                    <select
                      value={columnId}
                      onChange={(e) => setColumnId(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none capitalize"
                    >
                      {columns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-zinc-300 text-xs capitalize">{task.column?.name ?? "—"}</span>
                  )}
                </div>

                {/* Category */}
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 text-xs mb-2 uppercase tracking-widest font-medium">Category</p>
                  {editing ? (
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. frontend"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none placeholder-zinc-600"
                    />
                  ) : (
                    <span className="text-zinc-300 text-xs">{task.category || "—"}</span>
                  )}
                </div>

                {/* Due date */}
                <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 text-xs mb-2 uppercase tracking-widest font-medium">Due date</p>
                  <span className={`text-xs ${due?.overdue ? "text-red-400" : "text-zinc-300"}`}>
                    {due?.label ?? "—"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-zinc-600 text-xs mb-3 uppercase tracking-widest font-medium">Description</p>
                {editing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={5}
                    placeholder="Add a description..."
                    className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/60 transition-all placeholder-zinc-600 resize-none"
                  />
                ) : (
                  <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-3 min-h-[80px]">
                    {task.description ? (
                      <p className="text-zinc-400 text-sm leading-relaxed">{task.description}</p>
                    ) : (
                      <p className="text-zinc-700 text-sm italic">No description</p>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="border-t border-zinc-800/40 pt-4 space-y-1.5">
                <p className="text-zinc-700 text-xs">
                  Created {new Date(task.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-zinc-700 text-xs">
                  Updated {new Date(task.updated_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Delete zone */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-800/60">
              <AnimatePresence mode="wait">
                {!confirmDelete ? (
                  <motion.button
                    key="delete-btn"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 text-zinc-700 hover:text-red-400 text-sm transition-colors"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4h10M5 4V2h4v2M3 4l1 8h6l1-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete task
                  </motion.button>
                ) : (
                  <motion.div
                    key="confirm"
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  >
                    <p className="text-zinc-500 text-xs flex-1">Are you sure? This cannot be undone.</p>
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-white text-xs transition-colors">
                      Cancel
                    </button>
                    <motion.button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all disabled:opacity-60"
                      whileTap={{ scale: 0.97 }}
                    >
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
};

// ─── Create task modal ────────────────────────────────────────────────────────
const CreateTaskModal = ({
  open, onClose, boardId, defaultColumnName, columns, onCreated,
}: {
  open: boolean; onClose: () => void;
  boardId: string; defaultColumnName: string;
  columns: Column[];
  onCreated: (task: Task) => void;
}) => {
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

      const res = await fetch("http://localhost:8000/tasks", {
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
};

// ─── Main board page ──────────────────────────────────────────────────────────
export default function BoardPage() {
  const params  = useParams();
  const router  = useRouter();
  const boardId = params.id as string;

  const [board, setBoard]               = useState<Board | null>(null);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [columns, setColumns]           = useState<Column[]>([]);
  const [loading, setLoading]           = useState(true);
  const [user, setUser]                 = useState<User | null>(null);
  const [mounted, setMounted]           = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal]     = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumnName, setCreateColumnName] = useState("todo");
  const [filterPriority, setFilterPriority]   = useState("");
  const [searchQuery, setSearchQuery]         = useState("");
  const [liveCount, setLiveCount]             = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // auth guard
  useEffect(() => {
    if (!mounted) return;
    const token    = getToken();
    const userData = localStorage.getItem("user");
    if (!token || !userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));
  }, [mounted, router]);

  // fetch board
  useEffect(() => {
    if (!user) return;
    const fetchBoard = async () => {
      try {
        const res = await fetch(`http://localhost:8000/boards/${boardId}`, { headers: authHeaders() });
        if (res.status === 401) { router.push("/login"); return; }
        if (res.ok) setBoard(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchBoard();
  }, [user, boardId, router]);

  // fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let url = `http://localhost:8000/tasks?board_id=${boardId}&limit=100`;
      if (filterPriority) url += `&priority=${filterPriority}`;
      if (searchQuery)    url += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) { router.push("/login"); return; }
      const data: PaginatedTasks = await res.json();
      const taskList = data.data ?? [];
      setTasks(taskList);

      // derive unique columns from tasks
      const colMap = new Map<string, Column>();
      taskList.forEach((t) => { if (t.column?.id) colMap.set(t.column.id, t.column); });
      setColumns(Array.from(colMap.values()));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, boardId, filterPriority, searchQuery, router]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // SSE connection
  useEffect(() => {
    if (!user || !boardId) return;
    const token = getToken();
    const es = new EventSource(`http://localhost:8000/stream?board_id=${boardId}&token=${token}`);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => setLiveCount((c) => c + 1));
    es.addEventListener("task:created", (e) => {
      const task = JSON.parse(e.data) as Task;
      setTasks((prev) => [task, ...prev]);
      if (task.column?.id) setColumns((prev) => prev.find((c) => c.id === task.column.id) ? prev : [...prev, task.column]);
    });
    es.addEventListener("task:updated", (e) => {
      const updated = JSON.parse(e.data);
      setTasks((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
    });
    es.addEventListener("task:deleted", (e) => {
      const { id } = JSON.parse(e.data);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
    es.addEventListener("column:updated", (e) => {
      const updated = JSON.parse(e.data);
      setColumns((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c));
      setTasks((prev) => prev.map((t) => t.column?.id === updated.id ? { ...t, column: { ...t.column, ...updated } } : t));
    });

    es.onerror = () => setLiveCount(0);
    return () => { es.close(); setLiveCount(0); };
  }, [user, boardId]);

  // group tasks by column
  const COLUMN_ORDER = ["todo", "in progress", "completed"];

  const columnGroups = (): { col: Column; tasks: Task[] }[] => {
    const grouped: { col: Column; tasks: Task[] }[] = [];
    const sorted = [...columns].sort((a, b) => {
      const ai = COLUMN_ORDER.indexOf(a.name.toLowerCase());
      const bi = COLUMN_ORDER.indexOf(b.name.toLowerCase());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    sorted.forEach((col) => {
      grouped.push({ col, tasks: tasks.filter((t) => t.column?.id === col.id) });
    });
    // tasks without column
    const unassigned = tasks.filter((t) => !t.column?.id);
    if (unassigned.length > 0 && sorted.length > 0) grouped[0].tasks.push(...unassigned);
    return grouped;
  };

  const handleRenameColumn = async (id: string, name: string) => {
    try {
      const res = await fetch(`http://localhost:8000/columns/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setColumns((prev) => prev.map((c) => c.id === id ? { ...c, name } : c));
        setTasks((prev) => prev.map((t) => t.column?.id === id ? { ...t, column: { ...t.column, name } } : t));
      }
    } catch (e) { console.error(e); }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    if (task.column?.id) setColumns((prev) => prev.find((c) => c.id === task.column.id) ? prev : [...prev, task.column]);
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const handleTaskDeleted = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const groups = columnGroups();

  if (!mounted) return null;

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-14 border-b border-zinc-800/60 flex items-center justify-between px-5 bg-zinc-950/90 backdrop-blur-sm">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <motion.button
              className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
              whileHover={{ x: -2 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-medium hidden sm:inline">Boards</span>
            </motion.button>
          </Link>

          <span className="text-zinc-800">/</span>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="3.5" height="3.5" rx="0.8" fill="white" opacity="0.9" />
                <rect x="5.5" y="1" width="3.5" height="3.5" rx="0.8" fill="white" opacity="0.5" />
                <rect x="1" y="5.5" width="3.5" height="3.5" rx="0.8" fill="white" opacity="0.5" />
                <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.8" fill="white" opacity="0.9" />
              </svg>
            </div>
            <h1 className="text-white font-semibold text-sm">
              {board?.name ?? "Loading..."}
            </h1>
          </div>

          {/* Live indicator */}
          {liveCount > 0 && (
            <motion.div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-emerald-400 text-xs font-medium">Live</span>
            </motion.div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-700 transition-all w-40 focus:w-48"
            />
          </div>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 transition-all appearance-none cursor-pointer hidden sm:block"
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Task count */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-600 text-xs">{tasks.length}</span>
            <span className="text-zinc-700 text-xs">tasks</span>
          </div>

          {/* New task */}
          <motion.button
            onClick={() => { setCreateColumnName("todo"); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">New task</span>
          </motion.button>

          {/* User avatar */}
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer flex-shrink-0">
            {user ? getInitials(user.name) : "?"}
          </div>
        </div>
      </header>

      {/* ── Board area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {loading ? (
          <div className="flex gap-4 p-6 h-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-72 flex-shrink-0 space-y-3">
                <motion.div className="h-6 w-24 rounded-lg bg-zinc-800" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }} />
                {Array.from({ length: 3 }).map((_, j) => (
                  <motion.div key={j} className="h-28 rounded-xl bg-zinc-900 border border-zinc-800" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + j * 0.07 }} />
                ))}
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <motion.div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4v16M4 12h16" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </motion.div>
              <h3 className="text-white font-semibold mb-2">No tasks yet</h3>
              <p className="text-zinc-600 text-sm mb-5">Create your first task to get started</p>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Create first task
              </motion.button>
            </motion.div>
          </div>
        ) : (
          <div className="flex gap-5 p-6 h-full min-w-max">
            {groups.map(({ col, tasks: colTasks }, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <KanbanColumn
                  name={col.name}
                  columnId={col.id}
                  tasks={colTasks}
                  onAddTask={(colName) => { setCreateColumnName(colName); setShowCreateModal(true); }}
                  onOpenTask={(task) => { setSelectedTask(task); setShowTaskModal(true); }}
                  onRenameColumn={handleRenameColumn}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <TaskModal
        task={selectedTask}
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onUpdated={handleTaskUpdated}
        onDeleted={handleTaskDeleted}
        columns={columns}
      />

      <CreateTaskModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        boardId={boardId}
        defaultColumnName={createColumnName}
        columns={columns}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}