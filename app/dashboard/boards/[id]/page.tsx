"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  authHeaders, getInitials, getToken,
} from "@/helpers/helpers";
import { Board, Column, ColumnDef, FIXED_COLUMNS, PaginatedTasks, Task, User } from "@/structs/types";
import TaskModal from "@/components/taskModal";
import CreateTaskModal from "@/components/createTaskModal";
import OverlayCard from "@/components/overlayCard";
import DroppableColumn from "@/components/droppableColumn";
import { useGetUserQuery } from "@/app/api/user";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]); // server columns
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumnName, setCreateColumnName] = useState("todo");
  const [filterPriority, setFilterPriority] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveCount, setLiveCount] = useState(0);
  const { data } = useGetUserQuery(null)

  // DnD state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getToken()
    if (!token) { router.push("/auth/login"); return; }
    setUser(data);
  }, [mounted, router, data]);

  useEffect(() => {
    if (!user) return;
    fetch(`http://localhost:8000/boards/${boardId}`, { headers: authHeaders() })
      .then((r) => { if (r.status === 401) router.push("/login"); return r.ok ? r.json() : null; })
      .then((d) => d && setBoard(d))
      .catch(console.error);

  }, [user, boardId, router]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let url = `http://localhost:8000/tasks?board_id=${boardId}&limit=100`;
      if (filterPriority) url += `&priority=${filterPriority}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) { router.push("/login"); return; }
      const data: PaginatedTasks = await res.json();
      const list = data.data ?? [];
      setTasks(list);
      const colMap = new Map<string, Column>();
      list.forEach((t) => { if (t.column?.id) colMap.set(t.column.id, t.column); });
      setColumns(Array.from(colMap.values()));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, boardId, filterPriority, searchQuery, router]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!user || !boardId) return;

    const controller = new AbortController();
    let isMounted = true;

    const connect = async () => {
      try {
        const res = await fetch(`http://localhost:8000/stream?board_id=${boardId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "text/event-stream",
          },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to connect to SSE");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let buffer = "";

        while (isMounted) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split by SSE message delimiter
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part.split("\n");

            let event = "";
            let data = "";

            for (const line of lines) {
              if (line.startsWith("event:")) {
                event = line.replace("event:", "").trim();
              }
              if (line.startsWith("data:")) {
                data += line.replace("data:", "").trim();
              }
            }

            if (!event) continue;

            //  Handle events 
            if (event === "connected") {
              setLiveCount((c) => c + 1);
            }

            if (event === "task:created") {
              const task = JSON.parse(data) as Task;
              setTasks((p) => [task, ...p]);

              if (task.column?.id) {
                setColumns((p) =>
                  p.find((c) => c.id === task.column.id) ? p : [...p, task.column]
                );
              }
            }

            if (event === "task:updated") {
              const updated = JSON.parse(data) as Task;

              setTasks((p) =>
                p.map((t) => (t.id === updated.id ? updated : t))
              );

              if (updated.column?.id) {
                setColumns((p) =>
                  p.find((c) => c.id === updated.column.id)
                    ? p.map((c) => c.id === updated.column.id ? updated.column : c)
                    : [...p, updated.column]
                );
              }
            }

            if (event === "task:deleted") {
              const { id } = JSON.parse(data);
              setTasks((p) => p.filter((t) => t.id !== id));
            }

            if (event === "column:updated") {
              const u = JSON.parse(data);

              setColumns((p) =>
                p.map((c) => (c.id === u.id ? { ...c, ...u } : c))
              );

              setTasks((p) =>
                p.map((t) =>
                  t.column?.id === u.id
                    ? { ...t, column: { ...t.column, ...u } }
                    : t
                )
              );
            }
          }
        }
      } catch (err) {
        console.error("SSE error:", err);
        setLiveCount(0);
      }
    };

    connect();

    return () => {
      isMounted = false;
      controller.abort();
      setLiveCount(0);
    };
  }, [user, boardId]);

  // ── Build column defs (always 3 fixed columns) ────────────────────────────
  const columnDefs: ColumnDef[] = FIXED_COLUMNS.map((colName) => {
    const serverCol = columns.find((c) => c.name.toLowerCase() === colName);
    const colTasks = tasks.filter((t) => t.column?.name?.toLowerCase() === colName);
    return { id: serverCol?.id ?? "", name: colName, tasks: colTasks };
  });

  // ── DnD handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverColumn(over ? String(over.id) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);

    if (!over) return;

    const taskId = String(active.id);
    const targetColName = String(over.id) as "todo" | "in progress" | "completed";
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // same column — no op
    if (task.column?.name?.toLowerCase() === targetColName) return;

    // optimistically move task in UI
    const optimisticCol: Column = { id: "optimistic", name: targetColName, board_id: boardId };
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, column: optimisticCol } : t));

    try {
      // 1. find or create the target column
      let targetCol = columns.find((c) => c.name.toLowerCase() === targetColName);

      if (!targetCol) {
        // column doesn't exist for this board yet — create it
        const colRes = await fetch("http://localhost:8000/columns", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ board_id: boardId, name: targetColName }),
        });

        if (!colRes.ok) {
          // rollback
          setTasks((prev) => prev.map((t) => t.id === taskId ? task : t));
          return;
        }

        targetCol = await colRes.json() as Column;

        // add new column to state
        setColumns((prev) => [...prev, targetCol!]);
      }

      // 2. update task with new column_id
      const res = await fetch(`http://localhost:8000/tasks/${taskId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ board_id: task.board_id, column_id: targetCol.id }),
      });

      if (!res.ok) {
        // rollback
        setTasks((prev) => prev.map((t) => t.id === taskId ? task : t));
      } else {
        // confirm with real column data
        setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, column: targetCol! } : t));
      }
    } catch {
      // rollback
      setTasks((prev) => prev.map((t) => t.id === taskId ? task : t));
    }
  };

  const handleRenameColumn = async (id: string, name: string) => {
    try {
      const res = await fetch(`http://localhost:8000/columns/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setColumns((p) => p.map((c) => c.id === id ? { ...c, name } : c));
        setTasks((p) => p.map((t) => t.column?.id === id ? { ...t, column: { ...t.column, name } } : t));
      }
    } catch (e) { console.error(e); }
  };

  const handleTaskCreated = (task: Task) => {
    // console.log("Task ")
    // setTasks((p) => [task, ...p]);
    if (task.column?.id) setColumns((p) => p.find((c) => c.id === task.column.id) ? p : [...p, task.column]);
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((p) => p.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const handleTaskDeleted = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));

  if (!mounted) return null;


  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 border-b border-zinc-800/60 flex items-center justify-between px-5 bg-zinc-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/all-boards">
            <motion.button className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 transition-colors" whileHover={{ x: -2 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-medium hidden sm:inline">Boards</span>
            </motion.button>
          </Link>
          <span className="text-zinc-800">/</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="3.5" height="3.5" rx="0.8" fill="white" opacity="0.9" />
                <rect x="5.5" y="1" width="3.5" height="3.5" rx="0.8" fill="white" opacity="0.5" />
                <rect x="1" y="5.5" width="3.5" height="3.5" rx="0.8" fill="white" opacity="0.5" />
                <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.8" fill="white" opacity="0.9" />
              </svg>
            </div>
            <h1 className="text-white font-semibold text-sm">{board?.name ?? "Loading..."}</h1>
          </div>
          {liveCount > 0 && (
            <motion.div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <span className="text-emerald-400 text-xs font-medium">Live</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-700 transition-all w-40 focus:w-48" />
          </div>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 outline-none focus:border-zinc-700 transition-all appearance-none cursor-pointer hidden sm:block">
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-600 text-xs">{tasks.length}</span>
            <span className="text-zinc-700 text-xs">tasks</span>
          </div>
          <motion.button
            onClick={() => { setCreateColumnName("todo"); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">New task</span>
          </motion.button>
          <div className="w-7 h-7 rounded-xl bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer shrink-0">
            {user ? getInitials(user.name) : "?"}
          </div>
        </div>
      </header>

      {/* ── Board area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {loading ? (
          <div className="flex gap-5 p-6 h-full">
            {FIXED_COLUMNS.map((col, i) => (
              <div key={col} className="w-72 shrink-0 space-y-3">
                <motion.div className="h-6 w-28 rounded-lg bg-zinc-800" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }} />
                {Array.from({ length: 3 }).map((_, j) => (
                  <motion.div key={j} className="h-screen rounded-xl bg-zinc-900 border border-zinc-800" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + j * 0.07 }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-5 p-6 h-full min-w-max">
              {columnDefs.map((colDef, i) => (
                <motion.div
                  key={colDef.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <DroppableColumn
                    colDef={colDef}
                    isOver={overColumn === colDef.name}
                    onAddTask={(colName) => { setCreateColumnName(colName); setShowCreateModal(true); }}
                    onOpenTask={(task) => { setSelectedTask(task); setShowTaskModal(true); }}
                    onRenameColumn={handleRenameColumn}
                  />
                </motion.div>
              ))}
            </div>

            {/* Drag overlay — rendered at root, follows cursor */}
            <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
              {activeTask ? <OverlayCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <TaskModal
        task={selectedTask} open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted}
        columns={columns}
      />
      <CreateTaskModal
        open={showCreateModal} onClose={() => setShowCreateModal(false)}
        boardId={boardId} defaultColumnName={createColumnName}
        columns={columns} onCreated={handleTaskCreated}
      />
    </div>
  );
}