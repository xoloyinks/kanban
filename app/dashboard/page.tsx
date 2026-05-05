"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Board, Task, Team, User } from "@/structs/types";
import { authHeaders, getInitials, getToken, isOverdue, timeAgo } from "@/helpers/helpers";
import AnimCounter from "@/components/animatedCounter";
import Ring from "@/components/ringChart";
import Bar from "@/components/bar";
import { useGetUserQuery } from "../api/user";


interface PaginatedTasks { data: Task[]; pagination: { total: number } }

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[] | undefined>([]);
    const [user, setUser] = useState<User | undefined>(undefined);
    const [boards, setBoards] = useState<Board[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState("Good morning");
    const { data } = useGetUserQuery(null);

    useEffect(() => {
        const token = getToken()

        if (!token) { router.push("/auth/login"); return; }

        setUser(data);
        setTeams(data?.teams);

    }, [router, data]);

    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    }, []);

    useEffect(() => {
        if (!user) return;



        (async () => {
            setLoading(true);

            try {
                const personalBoardsRes = await fetch(`https://task-api-5zuk.onrender.com/boards?destination_id=${user.id}`, { headers: authHeaders() })
                
                

                const personalBoards: Board[] = await personalBoardsRes.json().then(d => Array.isArray(d) ? d : []);

                // 2. Fetch boards for each team
                const teamBoardResponses = await Promise.all(
                    (user.teams || []).map((tid) =>
                        fetch(`https://task-api-5zuk.onrender.com/boards?destination_id=${tid.id}`, {
                            headers: authHeaders(),
                        }).then(res => res.json())
                    )
                );

                // 3. Flatten team boards
                const teamBoards: Board[] = teamBoardResponses.flat().filter(Boolean);

                // 4. Merge + dedupe (IMPORTANT)
                const allBoardsMap = new Map<string, Board>();

                [...personalBoards, ...teamBoards].forEach((b) => {
                    allBoardsMap.set(b.id, b);
                });

                const allBoards = Array.from(allBoardsMap.values());

                setBoards(allBoards);

                // 5. Fetch tasks for ALL boards
                if (allBoards.length > 0) {
                    const taskResults = await Promise.all(
                        allBoards.map((b) =>
                            fetch(`https://task-api-5zuk.onrender.com/tasks?board_id=${b.id}&limit=100`, {
                                headers: authHeaders(),
                            })
                                .then((r) => r.json() as Promise<PaginatedTasks>)
                                .catch(() => ({
                                    data: [] as Task[],
                                    pagination: { total: 0 },
                                }))
                        )
                    );

                    setTasks(taskResults.flatMap((r) => r.data ?? []));
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();

    }, [user, router]);
    // ── Computed stats ────────────────────────────────────────────────────────
    const completed = tasks.filter((t) => t.column?.name?.toLowerCase() === "completed");
    const inProgress = tasks.filter((t) => t.column?.name?.toLowerCase() === "in progress");
    const todo = tasks.filter((t) => t.column?.name?.toLowerCase() === "todo");
    const overdue = tasks.filter((t) => isOverdue(t.due_date));
    const highPri = tasks.filter((t) => t.priority === "high");
    const rate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

    const recentTasks = [...tasks]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8);

    const boardActivity = boards
        .map((b) => ({ ...b, count: tasks.filter((t) => t.board_id === b.id).length }))
        .sort((a, b) => b.count - a.count).slice(0, 5);

    const priorityRows = [
        { label: "High", val: highPri.length, color: "#f87171", dot: "bg-red-400" },
        { label: "Medium", val: tasks.filter((t) => t.priority === "medium").length, color: "#fbbf24", dot: "bg-yellow-400" },
        { label: "Low", val: tasks.filter((t) => t.priority === "low").length, color: "#34d399", dot: "bg-emerald-400" },
    ];

    const PALETTE = ["#a78bfa", "#67e8f9", "#f0abfc", "#6ee7b7", "#fbbf24"];

    const COL_CFG: Record<string, { color: string; dot: string }> = {
        "todo": { color: "text-zinc-500", dot: "bg-zinc-500" },
        "in progress": { color: "text-violet-400", dot: "bg-violet-400" },
        "completed": { color: "text-emerald-400", dot: "bg-emerald-400" },
    };

    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 flex-shrink-0 border-b border-zinc-800/60 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-sm">
                    <div>
                        <h1 className="text-white font-bold text-base leading-tight">
                            {greeting}, {user?.name?.split(" ")[0] ?? "there"} 👋
                        </h1>
                        <p className="text-zinc-600 text-xs mt-0.5">
                            {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/all-boards">
                            <motion.span
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <rect x="1" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                                    <rect x="7" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                                    <rect x="1" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                                    <rect x="7" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
                                </svg>
                                View boards
                            </motion.span>
                        </Link>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                            {user ? getInitials(user.name) : "?"}
                        </div>
                    </div>
                </header>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <motion.div key={i} className="h-32 rounded-2xl bg-zinc-900 border border-zinc-800" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <motion.div key={i} className="h-72 rounded-2xl bg-zinc-900 border border-zinc-800" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.12 }} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">

                            {/* ── Stat cards ──────────────────────────────────────────── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: "Total Tasks", value: tasks.length,
                                        sub: `Across ${boards.length} board${boards.length !== 1 ? "s" : ""}`,
                                        color: "text-violet-300", accent: "#a78bfa",
                                        icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M3 5h12M3 13h7" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" /></svg>,
                                        hover: "hover:border-violet-500/20", delay: 0,
                                    },
                                    {
                                        label: "Completed", value: completed.length,
                                        sub: `${rate}% completion rate`,
                                        color: "text-emerald-300", accent: "#34d399",
                                        icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l5 5 7-7" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
                                        hover: "hover:border-emerald-500/20", delay: 0.08,
                                    },
                                    {
                                        label: "In Progress", value: inProgress.length,
                                        sub: `${todo.length} in todo`,
                                        color: "text-indigo-300", accent: "#818cf8",
                                        icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="#818cf8" strokeWidth="1.4" /><path d="M9 6v3l2 2" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round" /></svg>,
                                        hover: "hover:border-indigo-500/20", delay: 0.16,
                                    },
                                    {
                                        label: "High Priority", value: highPri.length,
                                        sub: overdue.length > 0 ? `${overdue.length} overdue` : "All on track",
                                        color: overdue.length > 0 ? "text-red-300" : "text-orange-300",
                                        accent: overdue.length > 0 ? "#f87171" : "#fb923c",
                                        icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 4v6M9 13v.5" stroke={overdue.length > 0 ? "#f87171" : "#fb923c"} strokeWidth="1.6" strokeLinecap="round" /><circle cx="9" cy="9" r="6.5" stroke={overdue.length > 0 ? "#f87171" : "#fb923c"} strokeWidth="1.3" /></svg>,
                                        hover: overdue.length > 0 ? "hover:border-red-500/20" : "hover:border-orange-500/20",
                                        delay: 0.24,
                                    },
                                ].map((card, ci) => (
                                    <motion.div
                                        key={card.label}
                                        className={`group relative rounded-2xl p-5 bg-zinc-900 border border-zinc-800/60 ${card.hover} overflow-hidden transition-all duration-300`}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: card.delay, duration: 0.45 }}
                                        whileHover={{ y: -3 }}
                                    >
                                        {/* top-left accent line */}
                                        <motion.div
                                            className="absolute top-0 left-0 h-0.5 rounded-full"
                                            style={{ backgroundColor: card.accent }}
                                            initial={{ width: 0 }}
                                            animate={{ width: "40%" }}
                                            transition={{ delay: card.delay + 0.3, duration: 0.6 }}
                                        />
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest mb-3">{card.label}</p>
                                                <p className={`text-4xl font-black tracking-tight ${card.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                                                    <AnimCounter value={card.value} />
                                                </p>
                                                <p className="text-zinc-600 text-xs mt-1.5">{card.sub}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mt-1">
                                                {card.icon}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* ── Teams + Boards row ───────────────────────────────────── */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    {
                                        label: "Teams", value: teams?.length, sub: "Active workspaces", color: "text-cyan-300", accent: "#67e8f9",
                                        icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6" r="3" stroke="#67e8f9" strokeWidth="1.4" /><circle cx="13" cy="6" r="2" stroke="#67e8f9" strokeWidth="1.4" opacity="0.5" /><path d="M1 15c0-2.761 2.686-4 6-4s6 1.239 6 4" stroke="#67e8f9" strokeWidth="1.4" strokeLinecap="round" /><path d="M13 11c1.657 0 3 .895 3 2.5" stroke="#67e8f9" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" /></svg>,
                                        extra: (
                                            <div className="flex -space-x-2 mt-3">
                                                {teams?.slice(0, 5).map((t, i) => (
                                                    <div key={t.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 border-2 border-zinc-900 flex items-center justify-center text-white font-bold" style={{ fontSize: "9px", zIndex: 5 - i }}>
                                                        {getInitials(t.name)}
                                                    </div>
                                                ))}
                                                {teams && teams?.length > 5 && <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-zinc-500 text-xs">+{teams.length - 5}</div>}
                                            </div>
                                        ),
                                    },
                                    {
                                        label: "Boards", value: boards.length, sub: "Active boards", color: "text-fuchsia-300", accent: "#e879f9",
                                        icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#e879f9" strokeWidth="1.4" /><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#e879f9" strokeWidth="1.4" opacity="0.5" /><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#e879f9" strokeWidth="1.4" opacity="0.5" /><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#e879f9" strokeWidth="1.4" /></svg>,
                                        extra: null,
                                    },
                                ].map((card, ci) => (
                                    <motion.div
                                        key={card.label}
                                        className="relative rounded-2xl p-5 bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/60 overflow-hidden transition-all group"
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.32 + ci * 0.08, duration: 0.45 }}
                                        whileHover={{ y: -3 }}
                                    >
                                        <motion.div
                                            className="absolute top-0 left-0 h-0.5 rounded-full"
                                            style={{ backgroundColor: card.accent }}
                                            initial={{ width: 0 }}
                                            animate={{ width: "40%" }}
                                            transition={{ delay: 0.5 + ci * 0.08, duration: 0.6 }}
                                        />
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest mb-3">{card.label}</p>
                                                <p className={`text-4xl font-black ${card.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                                                    <AnimCounter value={card.value} />
                                                </p>
                                                <p className="text-zinc-600 text-xs mt-1.5">{card.sub}</p>
                                                {card.extra}
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">{card.icon}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* ── Bottom 3-col row ─────────────────────────────────────── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                                {/* Completion ring + priority */}
                                <motion.div
                                    className="rounded-2xl p-5 bg-zinc-900 border border-zinc-800/60"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                                >
                                    <p className="text-white font-semibold text-sm mb-5">Task Breakdown</p>

                                    {/* Ring */}
                                    <div className="flex items-center justify-center mb-5">
                                        <div className="relative">
                                            <Ring pct={rate} color="#34d399" size={120} stroke={10} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{rate}%</span>
                                                <span className="text-zinc-600 text-xs">complete</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status pills */}
                                    <div className="grid grid-cols-3 gap-2 mb-5">
                                        {[
                                            { label: "Todo", val: todo.length, color: "text-zinc-400", bg: "bg-zinc-800" },
                                            { label: "Active", val: inProgress.length, color: "text-violet-400", bg: "bg-violet-500/10" },
                                            { label: "Done", val: completed.length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                                        ].map((s) => (
                                            <div key={s.label} className={`rounded-xl p-2 text-center ${s.bg}`}>
                                                <p className={`text-lg font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.val}</p>
                                                <p className="text-zinc-600 text-xs">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Priority bars */}
                                    <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                                        {priorityRows.map((p) => (
                                            <div key={p.label} className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.dot}`} />
                                                <span className="text-zinc-500 text-xs w-12">{p.label}</span>
                                                <Bar value={p.val} max={tasks.length} color={p.color} />
                                                <span className="text-zinc-400 text-xs w-5 text-right font-medium">{p.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Board activity */}
                                <motion.div
                                    className="rounded-2xl p-5 bg-zinc-900 border border-zinc-800/60"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <p className="text-white font-semibold text-sm">Board Activity</p>
                                        <Link href="/dashboard/all-boards" className="text-violet-400 hover:text-violet-300 text-xs transition-colors">View all →</Link>
                                    </div>

                                    {boardActivity.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-zinc-700">
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                                <rect x="3" y="3" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
                                                <rect x="16" y="3" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
                                                <rect x="3" y="16" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
                                                <rect x="16" y="16" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
                                            </svg>
                                            <p className="text-xs mt-2">No boards yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {boardActivity.map((board, i) => {
                                                const max = boardActivity[0].count || 1;
                                                return (
                                                    <Link key={board.id} href={`/dashboard/boards/${board.id}`}>
                                                        <motion.div
                                                            className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-800/50 transition-all cursor-pointer"
                                                            whileHover={{ x: 2 }}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.56 + i * 0.06 }}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0 group-hover:border-zinc-600 transition-colors">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-zinc-300 text-xs font-medium truncate group-hover:text-white transition-colors">{board.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Bar value={board.count} max={max} color={PALETTE[i % PALETTE.length]} />
                                                                    <span className="text-zinc-600 text-xs flex-shrink-0">{board.count}</span>
                                                                </div>
                                                            </div>
                                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0">
                                                                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </motion.div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Recent tasks */}
                                <motion.div
                                    className="rounded-2xl p-5 bg-zinc-900 border border-zinc-800/60"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.64 }}
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <p className="text-white font-semibold text-sm">Recent Tasks</p>
                                        <span className="text-zinc-600 text-xs">{recentTasks.length} shown</span>
                                    </div>

                                    {recentTasks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-zinc-700">
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                                <path d="M5 14h18M5 8h18M5 20h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                            </svg>
                                            <p className="text-xs mt-2">No tasks yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 overflow-y-auto max-h-[260px] pr-1 scrollbar-hide">
                                            {recentTasks.map((task, i) => {
                                                const colKey = task.column?.name?.toLowerCase() ?? "todo";
                                                const cfg = COL_CFG[colKey] ?? COL_CFG["todo"];
                                                const od = isOverdue(task.due_date);
                                                return (
                                                    <motion.div
                                                        key={task.id}
                                                        className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-zinc-800/40 transition-all cursor-pointer group"
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.64 + i * 0.04 }}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-zinc-300 text-xs font-medium truncate group-hover:text-white">{task.title}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className={`text-xs capitalize ${cfg.color}`}>{task.column?.name ?? "todo"}</span>
                                                                <span className="text-zinc-700 text-xs">·</span>
                                                                <span className={`text-xs ${od ? "text-red-400" : "text-zinc-600"}`}>{timeAgo(task.created_at)}</span>
                                                            </div>
                                                        </div>
                                                        {task.priority === "high" && <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* ── Overdue alert ─────────────────────────────────────────── */}
                            <AnimatePresence>
                                {overdue.length > 0 && (
                                    <motion.div
                                        className="rounded-2xl p-4 bg-red-500/5 border border-red-500/15 flex items-center gap-4"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                            <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                                animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                                <path d="M8 4v4M8 11v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                                                <circle cx="8" cy="8" r="6.5" stroke="#f87171" strokeWidth="1.2" />
                                            </motion.svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-red-300 text-sm font-semibold">{overdue.length} overdue task{overdue.length !== 1 ? "s" : ""}</p>
                                            <p className="text-red-400/50 text-xs mt-0.5">These tasks have passed their due date. Review them soon.</p>
                                        </div>
                                        <Link href="/dashboard/tasks">
                                            <motion.span
                                                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors whitespace-nowrap"
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            >
                                                Review now
                                            </motion.span>
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ── Empty workspace ───────────────────────────────────────── */}
                            {tasks.length === 0 && teams?.length === 0 && (
                                <motion.div
                                    className="rounded-2xl p-10 border border-dashed border-zinc-800 text-center"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                >
                                    <motion.div
                                        className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4"
                                        animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                                            <path d="M11 4v14M4 11h14" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </motion.div>
                                    <h3 className="text-white font-semibold text-base mb-2">Your workspace is empty</h3>
                                    <p className="text-zinc-600 text-sm mb-6 max-w-xs mx-auto">Create a team and a board to start tracking tasks. Your analytics will appear here.</p>
                                    <Link href="/dashboard/all-boards">
                                        <motion.span
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        >
                                            Get started
                                        </motion.span>
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
}