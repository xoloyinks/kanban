"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Board, Team, User } from "@/structs/types";
import { authHeaders, getInitials, getToken } from "@/helpers/helpers";
import { userAgent } from "next/server";

const BOARD_COLORS = [
    "from-violet-500/20 to-violet-600/5 border-violet-500/20",
    "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
    "from-fuchsia-500/20 to-fuchsia-600/5 border-fuchsia-500/20",
    "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    "from-orange-500/20 to-orange-600/5 border-orange-500/20",
    "from-rose-500/20 to-rose-600/5 border-rose-500/20",
];

const DOT_COLORS = [
    "bg-violet-400",
    "bg-cyan-400",
    "bg-fuchsia-400",
    "bg-emerald-400",
    "bg-orange-400",
    "bg-rose-400",
];


// ─── Board card ───────────────────────────────────────────────────────────────
const BoardCard = ({ board, index, teamName }: { board: Board; index: number; teamName: string }) => {
    const colorClass = BOARD_COLORS[index % BOARD_COLORS.length];
    const dotClass = DOT_COLORS[index % DOT_COLORS.length];

    return (
        <Link href={`/dashboard/boards/${board.id}`}>
            <motion.div
                className={`group relative rounded-2xl p-5 bg-gradient-to-br border cursor-pointer overflow-hidden transition-all duration-300 ${colorClass}`}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                {/* Hover shimmer */}
                <motion.div
                    className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                />

                <div className="relative z-10">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-9 h-9 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center`}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <rect x="2" y="2" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" opacity="0.7" />
                                <rect x="9" y="2" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" opacity="0.4" />
                                <rect x="2" y="9" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" opacity="0.4" />
                                <rect x="9" y="9" width="5" height="5" rx="1" stroke="white" strokeWidth="1.2" opacity="0.7" />
                            </svg>
                        </div>
                        <motion.div
                            className="w-7 h-7 rounded-lg bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-center text-zinc-600 group-hover:text-zinc-400 group-hover:border-zinc-700 transition-all"
                            whileHover={{ rotate: 45 }}
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Board name */}
                    <h3 className="text-white font-semibold text-base mb-1 group-hover:text-white transition-colors">
                        {board.name}
                    </h3>
                    <p className="text-zinc-600 text-xs mb-4 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        {teamName}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-700 font-medium uppercase tracking-wider">Open board</span>
                        <motion.svg
                            width="14" height="14" viewBox="0 0 14 14" fill="none"
                            className="text-zinc-700 group-hover:text-zinc-400 transition-colors"
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <path d="M2 7h10M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyBoards = ({ onCreateBoard }: { onCreateBoard: () => void }) => (
    <motion.div
        className="flex flex-col items-center justify-center py-20 px-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
    >
        <motion.div
            className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="3" width="9" height="9" rx="2" stroke="#52525b" strokeWidth="1.5" />
                <rect x="16" y="3" width="9" height="9" rx="2" stroke="#52525b" strokeWidth="1.5" />
                <rect x="3" y="16" width="9" height="9" rx="2" stroke="#52525b" strokeWidth="1.5" />
                <path d="M20.5 16v9M16 20.5h9" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </motion.div>
        <h3 className="text-white font-semibold text-base mb-2">No boards yet</h3>
        <p className="text-zinc-600 text-sm max-w-xs mb-6">
            Create your first board to start managing tasks with your team.
        </p>
        <motion.button
            onClick={onCreateBoard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
        >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Create board
        </motion.button>
    </motion.div>
);

// ─── Create board modal ───────────────────────────────────────────────────────
const CreateBoardModal = ({
    open,
    onClose,
    user,
    teams,
    selectedTeam,
    onCreated,
}: {
    open: boolean;
    user: User | null;
    onClose: () => void;
    teams: Team[];
    selectedTeam: Team | null;
    onCreated: (board: Board) => void;
}) => {
    const [name, setName] = useState("");
    const [teamID, setTeamID] = useState(selectedTeam?.id ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isPersonalBoard, setIsPersonalBoard] = useState(true);

    useEffect(() => {
        if (open) {
            setName("");
            setTeamID(selectedTeam?.id ?? teams[0]?.id ?? "");
            setError("");
        }
    }, [open, selectedTeam, teams]);

    console.log("first", teams)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !teamID) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`http://localhost:8000/board/${isPersonalBoard ? user?.id : teamID}`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ name: name.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to create board"); return; }
            onCreated(data);
            onClose();
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-white font-bold text-lg">New Board</h2>
                                <motion.button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                                    whileHover={{ rotate: 90 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </motion.button>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Board Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                                        Board name
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Sprint 4, Q1 Roadmap..."
                                        required
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 focus:bg-zinc-800 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
                                    />
                                </div>

                                {/* Personal Board Toggle */}
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                                        Board type
                                    </label>

                                    <div className="flex items-center justify-between bg-zinc-800/40 border border-zinc-700/50 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-sm text-white font-medium">Personal board</p>
                                            <p className="text-xs text-zinc-500">Not linked to any team</p>
                                        </div>

                                        <input
                                            type="checkbox"
                                            id="personal-board"
                                            checked={isPersonalBoard}
                                            onChange={(e) => setIsPersonalBoard(e.target.checked)}
                                            className="w-5 h-5 accent-violet-600 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Team Select */}
                                {!isPersonalBoard && (
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                                            Team
                                        </label>
                                        <select
                                            value={teamID}
                                            onChange={(e) => setTeamID(e.target.value)}
                                            required
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/60 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select a team</option>
                                            {teams.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                    whileHover={!loading ? { scale: 1.01 } : {}}
                                    whileTap={!loading ? { scale: 0.99 } : {}}
                                >
                                    {loading ? (
                                        <>
                                            <motion.div
                                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                            />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            Create board
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

// ─── Dashboard page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateBoard, setShowCreateBoard] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");



    useEffect(() => { setMounted(true); }, []);

    // auth guard
    useEffect(() => {
        if (!mounted) return;
        const token = getToken();
        const userData = localStorage.getItem("user");
        if (!token || !userData) { router.push("/auth/login"); return; }
        setUser(JSON.parse(userData));
    }, [mounted, router]);

    // fetch teams
    useEffect(() => {
        if (!user) return;
        const fetchTeams = async () => {
            try {
                const res = await fetch("http://localhost:8000/teams", { headers: authHeaders() });
                if (res.status === 401) { router.push("/auth/login"); return; }
                const data = await res.json();
                const teamList: Team[] = Array.isArray(data) ? data : [];
                setTeams(teamList);
                // if (teamList.length > 0) setSelectedTeam(teamList[0]);
            } catch (e) {
                console.error(e);
            }
        };
        fetchTeams();
    }, [user, router]);

    // fetch team boards
    useEffect(() => {
        if (!user) return;
        const fetchBoards = async () => {
            setLoading(true);

            // map through teams id using promises all to fetch boards for each team in parallel and update state using setBoards(prev => [...prev, ...data]) for each team
            const boardPromises = teams.map((team) =>
                fetch(`http://localhost:8000/boards?destination_id=${team.id}`, { headers: authHeaders() })
            );

            try {
                const responses = await Promise.all(boardPromises);
                const boardData = await Promise.all(responses.map((res) => res.json()));

                setBoards(prev => [...prev, ...boardData.flat().filter((v): v is NonNullable<typeof v> => !!v)]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }

        };
        fetchBoards();
    }, [user, teams]);

    //   fetch personal user boards
    useEffect(() => {
        if (!user) return;
        const fetchBoards = async () => {
            setLoading(true);
            try {
                const res = await fetch("http://localhost:8000/boards?destination_id=" + user.id, { headers: authHeaders() });
                if (res.status === 401) { router.push("/login"); return; }
                const data = await res.json();
                setBoards(prev => [...prev, ...(Array.isArray(data) ? data : [])]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchBoards();

    }, [user, router]);

    const teamBoards = boards.filter(
        (b) => b.destination_id === user?.id
    );

    const filteredBoards = boards.filter((b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedTeamName = (id: string) =>
        teams.find((t) => t.id === id)?.name ?? "Unknown";

    if (!mounted) return null;



    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 flex-shrink-0 border-b border-zinc-800/60 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-white font-bold text-base leading-tight">
                                {selectedTeam ? selectedTeam.name : "All Boards"}
                            </h1>
                            <p className="text-zinc-600 text-xs">
                                {filteredBoards.length} board{filteredBoards.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative hidden sm:block">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search boards..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-700 transition-all w-48 focus:w-56"
                            />
                        </div>

                        {/* New board */}
                        <motion.button
                            onClick={() => setShowCreateBoard(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span className="hidden sm:inline">New board</span>
                        </motion.button>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
                            {user ? getInitials(user.name) : "?"}
                        </div>
                    </div>
                </header>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        /* Skeleton loader */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="h-40 rounded-2xl bg-zinc-900 border border-zinc-800/60"
                                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                />
                            ))}
                        </div>
                    ) : filteredBoards.length === 0 ? (
                        searchQuery ? (
                            <motion.div
                                className="flex flex-col items-center justify-center py-20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <p className="text-zinc-500 text-sm">No boards match &quot;{searchQuery}&quot;</p>
                                <button onClick={() => setSearchQuery("")} className="mt-2 text-violet-400 text-sm hover:text-violet-300">
                                    Clear search
                                </button>
                            </motion.div>
                        ) : (
                            <EmptyBoards onCreateBoard={() => setShowCreateBoard(true)} />
                        )
                    ) : (
                        <>
                            {/* Team section label */}
                            {selectedTeam && (
                                <motion.div
                                    className="flex items-center gap-3 mb-6"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold" style={{ fontSize: "9px" }}>
                                            {getInitials(selectedTeam.name)}
                                        </div>
                                        <span className="text-zinc-400 text-sm font-medium">{selectedTeam.name}</span>
                                    </div>
                                    <div className="h-px flex-1 bg-zinc-800/60" />
                                    <span className="text-zinc-700 text-xs">{filteredBoards.length} boards</span>
                                </motion.div>
                            )}

                            {/* Board grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredBoards.map((board, i) => (
                                    <motion.div
                                        key={board.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07, duration: 0.4 }}
                                    >
                                        <BoardCard
                                            board={board}
                                            index={i}
                                            teamName={selectedTeamName(board.destination_id)}
                                        />
                                    </motion.div>
                                ))}

                                {/* Create board card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: boards.length * 0.07 }}
                                >
                                    <motion.button
                                        onClick={() => setShowCreateBoard(true)}
                                        className="w-full h-full min-h-[160px] rounded-2xl border border-dashed border-zinc-800 hover:border-violet-500/40 text-zinc-700 hover:text-violet-400 flex flex-col items-center justify-center gap-3 transition-all group"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <motion.div
                                            className="w-10 h-10 rounded-xl border border-dashed border-zinc-700 group-hover:border-violet-500/40 flex items-center justify-center transition-all"
                                            whileHover={{ rotate: 90 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </motion.div>
                                        <span className="text-xs font-medium">New board</span>
                                    </motion.button>
                                </motion.div>
                            </div>

                            {/* Other teams' boards */}
                            {!selectedTeam && teams.length > 1 && (
                                <div className="mt-10 space-y-8">
                                    {teams.map((team) => {
                                        const tb = boards.filter((b) => b.destination_id === team.id);
                                        if (tb.length === 0) return null;
                                        return (
                                            <div key={team.id}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="text-zinc-400 text-sm font-medium">{team.name}</span>
                                                    <div className="h-px flex-1 bg-zinc-800/60" />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {tb.map((board, i) => (
                                                        <BoardCard key={board.id} board={board} index={i} teamName={team.name} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Create board modal */}
            <CreateBoardModal
                open={showCreateBoard}
                user={user}
                onClose={() => setShowCreateBoard(false)}
                teams={teams}
                selectedTeam={selectedTeam}
                onCreated={(board) => setBoards((prev) => [...prev, board])}
            />
        </div>
    );
}