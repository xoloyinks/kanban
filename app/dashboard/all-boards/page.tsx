"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Board, Team, User } from "@/structs/types";
import { authHeaders, getInitials, getToken } from "@/helpers/helpers";
import CreateBoardModal from "@/components/createBoardModal";
import BoardCard from "@/components/boardCard";
import EmptyBoards from "@/components/emptyBoards";

export default function AllBoards() {
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
    if (!user?.teams?.length) return;

    const fetchTeams = async () => {
        try {
            const teamPromises = user.teams.map((teamId: string) =>
                fetch(`http://localhost:8000/teams/${teamId}`, {
                    headers: authHeaders(),
                }).then(res => {
                    if (res.status === 401) {
                        router.push("/auth/login");
                        return null;
                    }
                    return res.json();
                })
            );

            const results = await Promise.all(teamPromises);

            // remove failed/null responses
            const validTeams: Team[] = results.filter(Boolean);

            setTeams(validTeams);

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

    // const selectedTeamName = (id: string) =>
    //     teams.find((t) => t === id) ?? "Unknown";

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
                                            teamName={teams.find(t => t.id === board.destination_id)?.name}
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
                                                    <span className="text-zinc-400 text-sm font-medium">{team.name.toLocaleUpperCase()}</span>
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
                teams={teams.map(t => t.name )}
                selectedTeam={selectedTeam}
                onCreated={(board) => setBoards((prev) => [...prev, board])}
            />
        </div>
    );
}