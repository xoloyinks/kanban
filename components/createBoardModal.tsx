import { authHeaders } from '@/helpers/helpers';
import { Board, Team, User } from '@/structs/types';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react'

export default function CreateBoardModal({
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
    teams: string[];
    selectedTeam: Team | null;
    onCreated: (board: Board) => void;
}) {
  const [name, setName] = useState("");
    const [teamID, setTeamID] = useState(selectedTeam?.id ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isPersonalBoard, setIsPersonalBoard] = useState(true);

    useEffect(() => {
        if (open) {
            setName("");
            setTeamID(selectedTeam?.id ?? teams[0] ?? "");
            setError("");
        }
    }, [open, selectedTeam, teams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

                            <form className="space-y-5">
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
                                                <option key={t} value={t}>{"team name coming soon"}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Submit */}
                                <motion.button
                                    onClick={handleSubmit}
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
}
