"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authHeaders, COLUMN_CONFIG, formatDate, getInitials, getToken, PRIORITY_CONFIG } from "@/helpers/helpers";
import { Board, Column, PaginatedTasks, Task, User } from "@/structs/types";
import TaskCard from "@/components/taskCard";
import TaskModal from "@/components/taskModal";
import CreateTaskModal from "@/components/createTaskModal";

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
          <Link href="/dashboard/all-boards">
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