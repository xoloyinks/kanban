"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Board, Column, PaginatedTasks, Task, User } from "@/structs/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getToken    = () => typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });
const getInitials = (name: string) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

const isOverdue = (due: string) => due && !due.startsWith("0001") && new Date(due) < new Date();
const isDueSoon = (due: string) => {
  if (!due || due.startsWith("0001")) return false;
  const diff = new Date(due).getTime() - Date.now();
  return diff > 0 && diff < 86400000 * 3;
};
const formatDue = (due: string) => {
  if (!due || due.startsWith("0001")) return null;
  const d    = new Date(due);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, state: "overdue" };
  if (diff === 0) return { label: "Due today",     state: "today"   };
  if (diff === 1) return { label: "Due tomorrow",  state: "soon"    };
  if (diff <= 3)  return { label: `Due in ${diff}d`, state: "soon"  };
  return { label: d.toLocaleDateString("en", { month: "short", day: "numeric" }), state: "normal" };
};
const timeAgo = (ds: string) => {
  const m = Math.floor((Date.now() - new Date(ds).getTime()) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const PRIORITY: Record<string, { label: string; color: string; bg: string; dot: string; ring: string }> = {
  high:   { label: "High",   color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",       dot: "bg-red-400",     ring: "ring-red-500/30"    },
  medium: { label: "Medium", color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400",  ring: "ring-yellow-500/30" },
  low:    { label: "Low",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",dot: "bg-emerald-400", ring: "ring-emerald-500/30"},
};
const COLUMN: Record<string, { color: string; bg: string; dot: string }> = {
  "todo":        { color: "text-zinc-400",    bg: "bg-zinc-800",         dot: "bg-zinc-500"    },
  "in progress": { color: "text-violet-400",  bg: "bg-violet-500/10",    dot: "bg-violet-400"  },
  "completed":   { color: "text-emerald-400", bg: "bg-emerald-500/10",   dot: "bg-emerald-400" },
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ user, collapsed, onCollapse }: {
  user: User | null; collapsed: boolean; onCollapse: (v: boolean) => void;
}) => {
  const router = useRouter();
  const nav = [
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5.5L8 2l6 3.5V14H2V5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6 14v-4h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>, label: "Dashboard",  href: "/dashboard",  active: false },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg>, label: "All Boards", href: "/all-boards", active: false },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" /><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>, label: "My Tasks",   href: "/tasks",      active: true  },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" opacity="0.6" /><path d="M1 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M12 10c1.657 0 3 .895 3 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" /></svg>, label: "Teams",      href: "/teams",      active: false },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex-shrink-0 h-screen bg-zinc-950 border-r border-zinc-800/60 flex flex-col overflow-hidden z-20"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800/60 flex-shrink-0">
        {collapsed ? (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.9" /><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" /><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" /><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.9" /></svg>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div className="flex items-center gap-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.9" /><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" /><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" /><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.9" /></svg>
              </div>
              <span className="text-white font-bold text-sm tracking-tight whitespace-nowrap">TaskFlow</span>
            </motion.div>
          </AnimatePresence>
        )}
        {!collapsed && (
          <button onClick={() => onCollapse(true)} className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => onCollapse(false)} className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white z-30 shadow-md">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 scrollbar-hide">
        {nav.map((item) => (
          <Link key={item.label} href={item.href}>
            <motion.div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${item.active ? "bg-violet-500/10 text-violet-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"}`}
              whileHover={{ x: collapsed ? 0 : 2 }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span className="text-sm font-medium whitespace-nowrap" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="flex-shrink-0 border-t border-zinc-800/60 p-3">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl ${!collapsed ? "hover:bg-zinc-800/40" : ""} transition-all cursor-pointer group`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user ? getInitials(user.name) : "?"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div className="flex-1 min-w-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-zinc-600 text-xs truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2v10h3M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

// ─── Task row ─────────────────────────────────────────────────────────────────
const TaskRow = ({
  task, boards, index, onOpen, onComplete,
}: {
  task: Task; boards: Board[]; index: number;
  onOpen: (t: Task) => void;
  onComplete: (t: Task) => void;
}) => {
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
};

// ─── Task detail panel ────────────────────────────────────────────────────────
const TaskPanel = ({
  task, open, onClose, boards, columns, onUpdated, onDeleted,
}: {
  task: Task | null; open: boolean; onClose: () => void;
  boards: Board[]; columns: Column[];
  onUpdated: (t: Task) => void; onDeleted: (id: string) => void;
}) => {
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
      const res = await fetch(`http://localhost:8000/tasks/${task.id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload) });
      if (res.ok) { onUpdated({ ...task, title, description: desc, priority, category, column: columns.find((c) => c.id === columnId) ?? task.column }); setEditing(false); }
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:8000/tasks/${task.id}`, { method: "DELETE", headers: authHeaders() });
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
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const Empty = ({ filtered }: { filtered: boolean }) => (
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
);

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const router = useRouter();

  const [user, setUser]           = useState<User | null>(null);
  const [boards, setBoards]       = useState<Board[]>([]);
  const [allTasks, setAllTasks]   = useState<Task[]>([]);
  const [columns, setColumns]     = useState<Column[]>([]);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted]     = useState(false);

  // filters
  const [search, setSearch]       = useState("");
  const [filterPri, setFilterPri] = useState("");
  const [filterCol, setFilterCol] = useState("");
  const [filterBoard, setFilterBoard] = useState("");
  const [sortBy, setSortBy]       = useState<"created" | "due" | "priority">("created");
  const [showDone, setShowDone]   = useState(true);
  const [page, setPage]           = useState(1);
  const LIMIT                     = 20;

  // panel
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen]       = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getToken(), ud = localStorage.getItem("user");
    if (!token || !ud) { router.push("/login"); return; }
    setUser(JSON.parse(ud));
  }, [mounted, router]);

  // fetch all tasks across boards
  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const boardsRes = await fetch("http://localhost:8000/boards?destination_id=" + user.id, { headers: authHeaders() });
      if (boardsRes.status === 401) { router.push("/login"); return; }
      const boardList: Board[] = await boardsRes.json().then((d) => Array.isArray(d) ? d : []);
      setBoards(boardList);

      if (boardList.length === 0) { setAllTasks([]); setLoading(false); return; }

      // fetch tasks for all boards in parallel, filter by assignee
      const results = await Promise.all(
        boardList.map((b) =>
          fetch(`http://localhost:8000/tasks?board_id=${b.id}&limit=100`, { headers: authHeaders() })
            .then((r) => r.json() as Promise<PaginatedTasks>)
            .catch(() => ({ data: [] as Task[], pagination: { total: 0 } }))
        )
      );

      const all = results.flatMap((r) => r.data ?? []);
      // filter to only tasks assigned to current user
      const mine = all.filter((t) => t.destination_id === user.id);
      setAllTasks(all);

      console.log(all)
      // derive columns
      const colMap = new Map<string, Column>();
      mine.forEach((t) => { if (t.column?.id) colMap.set(t.column.id, t.column); });
      setColumns(Array.from(colMap.values()));
    } finally { setLoading(false); }
  }, [user, router]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // apply filters + sort
  const filtered = allTasks
    .filter((t) => {
      if (!showDone && t.column?.name?.toLowerCase() === "completed") return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPri && t.priority !== filterPri) return false;
      if (filterCol && t.column?.name?.toLowerCase() !== filterCol) return false;
      if (filterBoard && t.board_id !== filterBoard) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "due") {
        const ad = a.due_date && !a.due_date.startsWith("0001") ? new Date(a.due_date).getTime() : Infinity;
        const bd = b.due_date && !b.due_date.startsWith("0001") ? new Date(b.due_date).getTime() : Infinity;
        return ad - bd;
      }
      if (sortBy === "priority") {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const paginated  = filtered.slice(0, page * LIMIT);
  const hasMore    = filtered.length > paginated.length;
  const isFiltered = !!(search || filterPri || filterCol || filterBoard || !showDone);

  // stats
  const done     = allTasks.filter((t) => t.column?.name?.toLowerCase() === "completed").length;
  const active   = allTasks.filter((t) => t.column?.name?.toLowerCase() === "in progress").length;
  const overdueN = allTasks.filter((t) => isOverdue(t.due_date) && t.column?.name?.toLowerCase() !== "completed").length;
  const dueSoonN = allTasks.filter((t) => isDueSoon(t.due_date) && t.column?.name?.toLowerCase() !== "completed").length;

  const handleComplete = async (task: Task) => {
    // find a completed column for this board or use the first available
    const completedCol = columns.find((c) => c.name.toLowerCase() === "completed" && c.board_id === task.board_id);
    if (!completedCol) return;
    try {
      await fetch(`http://localhost:8000/tasks/${task.id}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ board_id: task.board_id, column_id: completedCol.id }),
      });
      setAllTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, column: completedCol } : t));
    } catch (e) { console.error(e); }
  };

  const handleUpdated = (updated: Task) => {
    setAllTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const handleDeleted = (id: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex-shrink-0 border-b border-zinc-800/60 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-sm">
          <div>
            <h1 className="text-white font-bold text-base">My Tasks</h1>
            <p className="text-zinc-600 text-xs mt-0.5">{allTasks.length} tasks assigned to you</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 transition-all appearance-none cursor-pointer hidden sm:block">
              <option value="created">Newest</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
            </select>
            {/* Show completed */}
            <motion.button
              onClick={() => setShowDone((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${showDone ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-900 border-zinc-800 text-zinc-600"}`}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Completed</span>
            </motion.button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
              {user ? getInitials(user.name) : "?"}
            </div>
          </div>
        </header>

        {/* Quick stats bar */}
        {!loading && allTasks.length > 0 && (
          <motion.div
            className="flex-shrink-0 border-b border-zinc-800/40 px-6 py-3 flex items-center gap-6 overflow-x-auto scrollbar-hide"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {[
              { label: "Total",       value: allTasks.length,  color: "text-zinc-400",    dot: "bg-zinc-500"    },
              { label: "Completed",   value: done,             color: "text-emerald-400", dot: "bg-emerald-400" },
              { label: "In Progress", value: active,           color: "text-violet-400",  dot: "bg-violet-400"  },
              { label: "Overdue",     value: overdueN,         color: overdueN > 0 ? "text-red-400" : "text-zinc-600",   dot: overdueN > 0 ? "bg-red-400" : "bg-zinc-700" },
              { label: "Due soon",    value: dueSoonN,         color: dueSoonN > 0 ? "text-yellow-400" : "text-zinc-600", dot: dueSoonN > 0 ? "bg-yellow-400" : "bg-zinc-700" },
            ].map((s, i) => (
              <motion.div key={s.label} className="flex items-center gap-2 whitespace-nowrap" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }}>
                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className={`text-sm font-bold ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</span>
                <span className="text-zinc-600 text-xs">{s.label}</span>
              </motion.div>
            ))}

            {/* Completion bar */}
            <div className="flex-1 hidden md:flex items-center gap-3 min-w-[120px] max-w-[200px] ml-4">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: allTasks.length > 0 ? `${Math.round((done / allTasks.length) * 100)}%` : 0 }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                />
              </div>
              <span className="text-zinc-600 text-xs whitespace-nowrap">{allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0}%</span>
            </div>
          </motion.div>
        )}

        {/* Filter bar */}
        <div className="flex-shrink-0 border-b border-zinc-800/40 px-6 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text" placeholder="Search tasks..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-700 transition-all w-44"
            />
          </div>

          {/* Priority filter */}
          <select value={filterPri} onChange={(e) => { setFilterPri(e.target.value); setPage(1); }} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 transition-all appearance-none cursor-pointer flex-shrink-0">
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Column filter */}
          <select value={filterCol} onChange={(e) => { setFilterCol(e.target.value); setPage(1); }} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 transition-all appearance-none cursor-pointer flex-shrink-0">
            <option value="">All columns</option>
            <option value="todo">Todo</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Board filter */}
          {boards.length > 1 && (
            <select value={filterBoard} onChange={(e) => { setFilterBoard(e.target.value); setPage(1); }} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 transition-all appearance-none cursor-pointer flex-shrink-0">
              <option value="">All boards</option>
              {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}

          {/* Clear filters */}
          <AnimatePresence>
            {isFiltered && (
              <motion.button
                onClick={() => { setSearch(""); setFilterPri(""); setFilterCol(""); setFilterBoard(""); setShowDone(true); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/15 transition-all flex-shrink-0"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                Clear
              </motion.button>
            )}
          </AnimatePresence>

          <span className="text-zinc-700 text-xs ml-auto flex-shrink-0">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div key={i} className="h-14 rounded-xl bg-zinc-900 border border-zinc-800" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <Empty filtered={isFiltered} />
          ) : (
            <div className="space-y-2">
              {/* Overdue section */}
              {paginated.some((t) => isOverdue(t.due_date) && t.column?.name?.toLowerCase() !== "completed") && (
                <motion.div className="mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div className="w-2 h-2 rounded-full bg-red-400" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    <span className="text-red-400 text-xs font-semibold uppercase tracking-widest">Overdue</span>
                  </div>
                  <AnimatePresence>
                    {paginated
                      .filter((t) => isOverdue(t.due_date) && t.column?.name?.toLowerCase() !== "completed")
                      .map((task, i) => (
                        <TaskRow key={task.id} task={task} boards={boards} index={i} onOpen={(t) => { setSelectedTask(t); setPanelOpen(true); }} onComplete={handleComplete} />
                      ))}
                  </AnimatePresence>
                  <div className="h-px bg-zinc-800/60 my-4" />
                </motion.div>
              )}

              {/* Remaining tasks */}
              <AnimatePresence>
                {paginated
                  .filter((t) => !isOverdue(t.due_date) || t.column?.name?.toLowerCase() === "completed")
                  .map((task, i) => (
                    <TaskRow key={task.id} task={task} boards={boards} index={i} onOpen={(t) => { setSelectedTask(t); setPanelOpen(true); }} onComplete={handleComplete} />
                  ))}
              </AnimatePresence>

              {/* Load more */}
              {hasMore && (
                <motion.div className="flex justify-center pt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.button
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm font-medium transition-all"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Load more · {filtered.length - paginated.length} remaining
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Task panel */}
      <TaskPanel
        task={selectedTask} open={panelOpen}
        onClose={() => setPanelOpen(false)}
        boards={boards} columns={columns}
        onUpdated={handleUpdated} onDeleted={handleDeleted}
      />
    </div>
  );
}