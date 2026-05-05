import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Board, Team, User } from '@/structs/types';
import Link from 'next/link';
import { getInitials } from '@/helpers/helpers';
import { useRouter, usePathname } from 'next/navigation';


const DOT_COLORS = [
    "bg-violet-400",
    "bg-cyan-400",
    "bg-fuchsia-400",
    "bg-emerald-400",
    "bg-orange-400",
    "bg-rose-400",
];

export default function SideNav(
    {
        user,
        teams,
        boards,
        // selectedTeam,
        onSelectTeam,
        collapsed,
        onCollapse,
    }: {
        user: User | undefined;
        teams: Team[];
        boards: Board[];
        selectedTeam: Team | null;
        onSelectTeam: (team: Team | null) => void;
        collapsed: boolean;
        onCollapse: (v: boolean) => void;
    }
) {
    const router = useRouter();
    const teamBoards = boards.filter((b) => b.destination_id === selectedTeam?.id);
    const path = usePathname();

    const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
    const handleTeamSelect = (team: Team) => {
        setSelectedTeam(team);
        router.push(team ? `/dashboard/teams/${team.id}` : "/dashboard");
    }

    const handleLogout = () => {
        localStorage.clear();
        router.push("/auth/login");
    };
    return (
        <motion.aside
            animate={{ width: collapsed ? 68 : 256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex-shrink-0 h-screen bg-zinc-950 border-r border-zinc-800/60 flex flex-col overflow-hidden z-20"
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800/60 flex-shrink-0">
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            className="flex items-center gap-2.5"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.9" />
                                    <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                                    <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                                    <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.9" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-sm tracking-tight whitespace-nowrap">
                                TaskFlow
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {collapsed && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.9" />
                            <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                            <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                            <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.9" />
                        </svg>
                    </div>
                )}

                {!collapsed && (
                    <button
                        onClick={() => onCollapse(true)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-all"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Collapsed expand button */}
            {collapsed && (
                <button
                    onClick={() => onCollapse(false)}
                    className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all shadow-md z-30"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            )}

            {/* Nav content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 scrollbar-hide">

                {/* Main nav */}
                <div className="space-y-1">
                    {[
                        {
                            icon: (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M2 5.5L8 2l6 3.5V14H2V5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                                    <path d="M6 14v-4h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                                </svg>
                            ),
                            label: "Dashboard",
                            active: path === "/dashboard",
                            href: "/dashboard",
                        },
                        {
                            icon: (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                                    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                                    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                                    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                                </svg>
                            ),
                            label: "All Boards",
                            active: path === "/dashboard/all-boards",
                            href: "/dashboard/all-boards",
                        },
                        {
                            icon: (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
                                    <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                            ),
                            label: "My Tasks",
                            active: path === "/dashboard/tasks",
                            href: "/dashboard/tasks",
                        },
                    ].map((item) => (
                        <Link onClick={() => onSelectTeam(null)} key={item.label} href={item.href}>
                            <motion.div
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${item.active
                                    ? "bg-violet-500/10 text-violet-300"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                    }`}
                                whileHover={{ x: collapsed ? 0 : 2 }}
                            >
                                <span className="flex-shrink-0">{item.icon}</span>
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Teams */}
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex items-center justify-between px-3 mb-2">
                            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">
                                Teams
                            </span>
                            <Link href="/dashboard/teams/new">
                                <motion.button
                                    className="w-5 h-5 rounded-md flex items-center justify-center text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </motion.button>
                            </Link>
                        </div>

                        <div className="space-y-0.5">
                            {teams.length === 0 ? (
                                <p className="text-xs text-zinc-700 px-3 py-2">No teams yet</p>
                            ) : (
                                teams.map((team, i) => (
                                    <motion.button
                                        key={team.id}
                                        onClick={() => handleTeamSelect(team)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40`}
                                        whileHover={{ x: 2 }}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${DOT_COLORS[i % DOT_COLORS.length].replace("bg-", "bg-").replace("-400", "-500")
                                                }`}
                                            style={{ fontSize: "10px" }}
                                        >
                                            {getInitials(team.name)}
                                        </div>
                                        <span className="text-sm font-medium truncate">{team.name}</span>
                                        {/* {selectedTeam?.id === team.id && (
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-auto flex-shrink-0 text-violet-400">
                                                <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )} */}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Boards under selected team */}
                {!collapsed && selectedTeam && teamBoards.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="px-3 mb-2">
                            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">
                                Boards
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            {teamBoards.map((board, i) => (
                                <Link key={board.id} href={`/boards/${board.id}`}>
                                    <motion.div
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all cursor-pointer"
                                        whileHover={{ x: 2 }}
                                    >
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLORS[i % DOT_COLORS.length]}`} />
                                        <span className="text-sm truncate">{board.name}</span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* User profile */}
            <div className="flex-shrink-0 border-t border-zinc-800/60 p-3">
                <div className={`flex items-center gap-3 px-2 py-2 rounded-xl ${!collapsed ? "hover:bg-zinc-800/40" : ""} transition-all cursor-pointer group`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user ? getInitials(user.name) : "?"}
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                className="flex-1 min-w-0"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                                <p className="text-zinc-600 text-xs truncate">{user?.email}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!collapsed && (
                        <motion.button
                            onClick={handleLogout}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            whileHover={{ scale: 1.1 }}
                            title="Sign out"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M5 2H2v10h3M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}
