"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Board, Column, PaginatedTasks, Task, User } from "@/structs/types";
import { authHeaders, getInitials, getToken, isDueSoon, isOverdue } from "@/helpers/helpers";
import TaskPanel from "@/components/taskPanel";
import TaskRow from "@/components/taskRow";
import Empty from "@/components/empty";

export default function MyTasksPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [filterPri, setFilterPri] = useState("");
  const [filterCol, setFilterCol] = useState("");
  const [filterBoard, setFilterBoard] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "due" | "priority">("created");
  const [showDone, setShowDone] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // panel
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getToken(), ud = localStorage.getItem("user");
    if (!token || !ud) { router.push("/login"); return; }
    setUser(JSON.parse(ud));
  }, [mounted, router]);

  const loadUserTasks = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      // 1. Build all destinations (user + teams)
      const destinations = [user.id, ...(user.teams || [])];

      // 2. Fetch boards in parallel
      const boardResults = await Promise.all(
        destinations.map((id) =>
          fetch(`http://localhost:8000/boards?destination_id=${id}`, {
            headers: authHeaders(),
          })
            .then((r) => {
              if (r.status === 401) {
                router.push("/login");
                return [];
              }
              return r.json();
            })
            .then((d) => (Array.isArray(d) ? d : []))
            .catch(() => [])
        )
      );

      // 3. Merge + dedupe boards
      const boardMap = new Map<string, Board>();
      boardResults.flat().forEach((b) => boardMap.set(b.id, b));
      const boardList = Array.from(boardMap.values());

      setBoards(boardList);

      if (boardList.length === 0) {
        setAllTasks([]);
        return;
      }

      // 4. Fetch tasks for all boards
      const taskResults = await Promise.all(
        boardList.map((b) =>
          fetch(`http://localhost:8000/tasks?board_id=${b.id}&limit=100`, {
            headers: authHeaders(),
          })
            .then((r) => r.json() as Promise<PaginatedTasks>)
            .catch(() => ({
              data: [] as Task[],
              pagination: { total: 0 },
            }))
        )
      );

      const all = taskResults.flatMap((r) => r.data ?? []);

      // 5. Optional: filter tasks assigned to user
      const mine = all.filter((t) => t.destination_id === user.id);

      // 👉 choose what you actually want:
      setAllTasks(all);   // all tasks (team + personal)
      // setAllTasks(mine); // only user's tasks across all boards

      // 6. derive columns
      const colMap = new Map<string, Column>();
      all.forEach((t) => {
        if (t.column?.id) colMap.set(t.column.id, t.column);
      });

      setColumns(Array.from(colMap.values()));

    } finally {
      setLoading(false);
    }
  }, [user, router]);



  useEffect(() => { loadUserTasks(); }, [loadUserTasks]);


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

  const paginated = filtered.slice(0, page * LIMIT);
  const hasMore = filtered.length > paginated.length;
  const isFiltered = !!(search || filterPri || filterCol || filterBoard || !showDone);

  // stats
  const done = allTasks.filter((t) => t.column?.name?.toLowerCase() === "completed").length;
  const active = allTasks.filter((t) => t.column?.name?.toLowerCase() === "in progress").length;
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
              { label: "Total", value: allTasks.length, color: "text-zinc-400", dot: "bg-zinc-500" },
              { label: "Completed", value: done, color: "text-emerald-400", dot: "bg-emerald-400" },
              { label: "In Progress", value: active, color: "text-violet-400", dot: "bg-violet-400" },
              { label: "Overdue", value: overdueN, color: overdueN > 0 ? "text-red-400" : "text-zinc-600", dot: overdueN > 0 ? "bg-red-400" : "bg-zinc-700" },
              { label: "Due soon", value: dueSoonN, color: dueSoonN > 0 ? "text-yellow-400" : "text-zinc-600", dot: dueSoonN > 0 ? "bg-yellow-400" : "bg-zinc-700" },
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