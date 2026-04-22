"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User   { id: string; name: string; email: string; }
interface Team   { id: string; name: string; description: string; created_by: string; created_at: string; }
interface Member { id: string; team_id: string; email: string; role: string; created_at: string; }
interface TeamWithMembers extends Team { members: Member[]; }
interface Board  { id: string; name: string; destination_id: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getToken    = () => typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });
const getInitials = (str: string) => str?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
const timeAgo     = (ds: string) => {
  const d = Math.floor((Date.now() - new Date(ds).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30)  return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

const ROLE_CFG: Record<string, { color: string; bg: string; dot: string; desc: string }> = {
  admin:  { color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20",   dot: "bg-violet-400",  desc: "Can manage boards and members"  },
  member: { color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",       dot: "bg-cyan-400",    desc: "Can create and edit tasks"      },
  viewer: { color: "text-zinc-400",    bg: "bg-zinc-500/10 border-zinc-700/40",       dot: "bg-zinc-500",    desc: "Can view boards and tasks only" },
};

const BOARD_COLORS = [
  { grad: "from-violet-500/15 to-violet-600/5", border: "border-violet-500/20", dot: "bg-violet-400" },
  { grad: "from-cyan-500/15 to-cyan-600/5",     border: "border-cyan-500/20",   dot: "bg-cyan-400"   },
  { grad: "from-fuchsia-500/15 to-fuchsia-600/5",border:"border-fuchsia-500/20",dot: "bg-fuchsia-400"},
  { grad: "from-emerald-500/15 to-emerald-600/5",border:"border-emerald-500/20",dot: "bg-emerald-400"},
  { grad: "from-orange-500/15 to-orange-600/5", border: "border-orange-500/20", dot: "bg-orange-400" },
];

// ─── Add member modal ─────────────────────────────────────────────────────────
const AddMemberModal = ({
  open, teamId, onClose, onAdded,
}: {
  open: boolean; teamId: string;
  onClose: () => void;
  onAdded: (member: Member) => void;
}) => {
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => { if (open) { setEmail(""); setRole("member"); setError(""); } }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`http://localhost:8000/addMember/${teamId}`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ email: email.trim(), role, team_id: teamId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add member"); return; }
      onAdded(data);
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
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
                <h2 className="text-white font-bold text-base">Add member</h2>
                <motion.button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all" whileHover={{ rotate: 90 }} transition={{ duration: 0.15 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
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

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Email address</label>
                  <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="teammate@company.com" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["admin", "member", "viewer"] as const).map((r) => {
                      const cfg = ROLE_CFG[r];
                      return (
                        <motion.button
                          key={r} type="button"
                          onClick={() => setRole(r)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${role === r ? `${cfg.bg} ${cfg.color}` : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"}`}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        >
                          {r}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-zinc-600 text-xs mt-2">{ROLE_CFG[role].desc}</p>
                </div>

                <motion.button
                  type="submit" disabled={loading || !email.trim()}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  whileHover={!loading ? { scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.99 } : {}}
                >
                  {loading ? (
                    <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />Adding...</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>Add member</>
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

// ─── Edit team modal ──────────────────────────────────────────────────────────
const EditTeamModal = ({
  open, team, onClose, onUpdated,
}: {
  open: boolean; team: TeamWithMembers | null;
  onClose: () => void;
  onUpdated: (t: Partial<Team>) => void;
}) => {
  const [name, setName]     = useState("");
  const [desc, setDesc]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (open && team) { setName(team.name); setDesc(team.description ?? ""); setError(""); }
  }, [open, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`http://localhost:8000/teams/${team.id}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update team"); return; }
      onUpdated({ name: name.trim(), description: desc.trim() });
      onClose();
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && team && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl"
              initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
                <h2 className="text-white font-bold text-base">Edit team</h2>
                <motion.button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all" whileHover={{ rotate: 90 }} transition={{ duration: 0.15 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </motion.button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Team name</label>
                  <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/60 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="What does this team work on?" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 transition-all resize-none" />
                </div>
                <motion.button
                  type="submit" disabled={loading || !name.trim()}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  whileHover={!loading ? { scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.99 } : {}}
                >
                  {loading ? <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />Saving...</> : "Save changes"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Create board modal ───────────────────────────────────────────────────────
const CreateBoardModal = ({
  open, teamId, onClose, onCreated,
}: {
  open: boolean; teamId: string;
  onClose: () => void;
  onCreated: (board: Board) => void;
}) => {
  const [name, setName]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => { if (open) { setName(""); setError(""); } }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost:8000/boards", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), destination_id: teamId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create board"); return; }
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
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl"
              initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
                <h2 className="text-white font-bold text-base">New board</h2>
                <motion.button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all" whileHover={{ rotate: 90 }} transition={{ duration: 0.15 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </motion.button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Board name</label>
                  <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Sprint 4, Q1 Roadmap..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all" />
                </div>
                <motion.button
                  type="submit" disabled={loading || !name.trim()}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  whileHover={!loading ? { scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.99 } : {}}
                >
                  {loading ? <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />Creating...</> : <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>Create board</>}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam]       = useState<TeamWithMembers | null>(null);
  const [boards, setBoards]   = useState<Board[]>([]);
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // modals
  const [showAddMember, setShowAddMember]     = useState(false);
  const [showEditTeam, setShowEditTeam]       = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTeam, setDeletingTeam]       = useState(false);

  // member actions
  const [removingMember, setRemovingMember]   = useState<string | null>(null);
  const [changingRole, setChangingRole]       = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getToken(), ud = localStorage.getItem("user");
    if (!token || !ud) { router.push("/login"); return; }
    setUser(JSON.parse(ud));
  }, [mounted, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [teamRes, boardsRes] = await Promise.all([
        fetch(`http://localhost:8000/teams/${teamId}`, { headers: authHeaders() }),
        fetch(`http://localhost:8000/boards?destination_id=${teamId}`, { headers: authHeaders() }),
      ]);
      if (teamRes.status === 401) { router.push("/login"); return; }
      if (teamRes.status === 404) { router.push("/dashboard"); return; }
      const teamData   = await teamRes.json();
      const boardsData = await boardsRes.json();
      setTeam(teamData);
      const allBoards: Board[] = Array.isArray(boardsData) ? boardsData : [];
      setBoards(allBoards.filter((b) => b.destination_id === teamId));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, teamId, router]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleRemoveMember = async (memberId: string) => {
    setRemovingMember(memberId);
    try {
      const res = await fetch(`http://localhost:8000/teams/${teamId}/members/${memberId}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (res.ok) {
        setTeam((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) } : prev);
      }
    } catch (e) { console.error(e); }
    finally { setRemovingMember(null); }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setChangingRole(memberId);
    try {
      // update via re-add is not clean — ideally you'd have PATCH /teams/:id/members/:id
      // for now we optimistically update the UI
      setTeam((prev) => prev ? {
        ...prev,
        members: prev.members.map((m) => m.id === memberId ? { ...m, role: newRole } : m),
      } : prev);
    } finally { setChangingRole(null); }
  };

  const handleDeleteTeam = async () => {
    setDeletingTeam(true);
    try {
      const res = await fetch(`http://localhost:8000/teams/${teamId}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (res.ok) router.push("/dashboard");
    } catch (e) { console.error(e); }
    finally { setDeletingTeam(false); }
  };

  const isOwner = user?.id === team?.created_by;

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="p-6 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <motion.div className="h-8 w-48 rounded-xl bg-zinc-800" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.div className="h-4 w-72 rounded-lg bg-zinc-800/60" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} className="h-20 rounded-2xl bg-zinc-900 border border-zinc-800" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="p-6 space-y-8 max-w-4xl bg-zinc-950 h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Team header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-lg font-black flex-shrink-0 shadow-lg shadow-violet-500/20"
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {getInitials(team.name)}
            </motion.div>
            <div>
              <h1 className="text-white text-2xl font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                {team.name}
              </h1>
              {team.description ? (
                <p className="text-zinc-500 text-sm mt-1 max-w-md">{team.description}</p>
              ) : (
                <p className="text-zinc-700 text-sm mt-1 italic">No description</p>
              )}
              <p className="text-zinc-700 text-xs mt-2">Created {timeAgo(team.created_at)}</p>
            </div>
          </div>

          {/* Actions */}
          {isOwner && (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setShowEditTeam(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-xs font-medium transition-all"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                Edit
              </motion.button>
              <motion.button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4 3V2h4v1M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Delete team
              </motion.button>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-5 flex-wrap">
          {[
            { label: "Members", value: team.members?.length ?? 0, color: "text-violet-400" },
            { label: "Boards",  value: boards.length,             color: "text-cyan-400"   },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className={`text-2xl font-black ${stat.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{stat.value}</span>
              <span className="text-zinc-600 text-sm">{stat.label}</span>
            </div>
          ))}
          <div className="h-px flex-1 bg-zinc-800/60 hidden sm:block" />
        </div>
      </motion.div>

      {/* ── Members section ─────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-base">Members</h2>
            <p className="text-zinc-600 text-xs mt-0.5">{team.members?.length ?? 0} people in this team</p>
          </div>
          <motion.button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Add member
          </motion.button>
        </div>

        {!team.members || team.members.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-zinc-800 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <motion.div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3" animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="8" cy="7" r="3" stroke="#52525b" strokeWidth="1.4" />
                <circle cx="14" cy="7" r="2.5" stroke="#52525b" strokeWidth="1.4" opacity="0.5" />
                <path d="M2 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#52525b" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M14 11.5c1.657 0 3 1 3 3" stroke="#52525b" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
              </svg>
            </motion.div>
            <p className="text-zinc-500 text-sm font-medium mb-1">No members yet</p>
            <p className="text-zinc-700 text-xs mb-4">Invite your teammates to get started</p>
            <motion.button
              onClick={() => setShowAddMember(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              Invite first member
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {(team.members ?? []).map((member, i) => {
                const cfg     = ROLE_CFG[member.role] ?? ROLE_CFG.member;
                const isRemoving = removingMember === member.id;
                return (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isRemoving ? 0.4 : 1, y: 0 }}
                    exit={{ opacity: 0, x: -16, height: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/60 transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-300 text-xs font-bold flex-shrink-0">
                      {getInitials(member.email.split("@")[0])}
                    </div>

                    {/* Email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 text-sm font-medium truncate">{member.email}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">Joined {timeAgo(member.created_at)}</p>
                    </div>

                    {/* Role badge */}
                    <div className="relative">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        disabled={!isOwner || changingRole === member.id}
                        className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-all appearance-none ${cfg.bg} ${cfg.color} disabled:cursor-default`}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    {/* Remove button */}
                    {isOwner && (
                      <motion.button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isRemoving}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40"
                        whileHover={{ scale: 1.1 }}
                        title="Remove member"
                      >
                        {isRemoving ? (
                          <motion.div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4 3V2h4v1M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* ── Boards section ──────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-base">Boards</h2>
            <p className="text-zinc-600 text-xs mt-0.5">{boards.length} board{boards.length !== 1 ? "s" : ""} in this team</p>
          </div>
          <motion.button
            onClick={() => setShowCreateBoard(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-xs font-medium transition-all"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            New board
          </motion.button>
        </div>

        {boards.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-zinc-800 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <motion.div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3" animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="#52525b" strokeWidth="1.4" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="#52525b" strokeWidth="1.4" opacity="0.5" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="#52525b" strokeWidth="1.4" opacity="0.5" />
                <path d="M14.5 11v7M11 14.5h7" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </motion.div>
            <p className="text-zinc-500 text-sm font-medium mb-1">No boards yet</p>
            <p className="text-zinc-700 text-xs mb-4">Create a board to start managing tasks</p>
            <motion.button
              onClick={() => setShowCreateBoard(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              Create first board
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {boards.map((board, i) => {
                const bc = BOARD_COLORS[i % BOARD_COLORS.length];
                return (
                  <motion.div
                    key={board.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link href={`/boards/${board.id}`}>
                      <motion.div
                        className={`group relative p-4 rounded-2xl bg-gradient-to-br border overflow-hidden cursor-pointer transition-all duration-200 ${bc.grad} ${bc.border}`}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        {/* Shimmer */}
                        <motion.div
                          className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                        />
                        <div className="relative z-10 flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full ${bc.dot} mb-3`} />
                            <p className="text-white text-sm font-semibold truncate group-hover:text-white">{board.name}</p>
                            <p className="text-zinc-600 text-xs mt-1">{team.name}</p>
                          </div>
                          <motion.div
                            className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0 ml-2"
                            animate={{ x: [0, 2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </motion.div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Create board card */}
            <motion.button
              onClick={() => setShowCreateBoard(true)}
              className="group p-4 rounded-2xl border border-dashed border-zinc-800 hover:border-violet-500/30 text-zinc-700 hover:text-violet-400 flex flex-col items-center justify-center gap-2 transition-all min-h-[80px]"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            >
              <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.15 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </motion.div>
              <span className="text-xs font-medium">New board</span>
            </motion.button>
          </div>
        )}
      </motion.section>

      {/* ── Delete confirmation ──────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(false)} />
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6"
                initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 6v4M9 12v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M7.5 2.5l-6 11A1.5 1.5 0 003 16h12a1.5 1.5 0 001.3-2.25l-6-11a1.5 1.5 0 00-2.6 0z" stroke="#f87171" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Delete team</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">This action cannot be undone</p>
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-5">
                  <p className="text-red-300 text-sm font-medium mb-2">Deleting <span className="text-white">{team.name}</span> will permanently remove:</p>
                  <ul className="space-y-1">
                    {[
                      `${team.members?.length ?? 0} member${(team.members?.length ?? 0) !== 1 ? "s" : ""}`,
                      `${boards.length} board${boards.length !== 1 ? "s" : ""}`,
                      "All tasks and columns in those boards",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-red-400/70 text-xs">
                        <div className="w-1 h-1 rounded-full bg-red-500/40" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm font-medium transition-all"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleDeleteTeam}
                    disabled={deletingTeam}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    whileHover={!deletingTeam ? { scale: 1.01 } : {}} whileTap={!deletingTeam ? { scale: 0.99 } : {}}
                  >
                    {deletingTeam ? (
                      <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />Deleting...</>
                    ) : "Yes, delete team"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AddMemberModal
        open={showAddMember} teamId={teamId}
        onClose={() => setShowAddMember(false)}
        onAdded={(member) => setTeam((prev) => prev ? { ...prev, members: [...(prev.members ?? []), member] } : prev)}
      />
      <EditTeamModal
        open={showEditTeam} team={team}
        onClose={() => setShowEditTeam(false)}
        onUpdated={(updates) => setTeam((prev) => prev ? { ...prev, ...updates } : prev)}
      />
      <CreateBoardModal
        open={showCreateBoard} teamId={teamId}
        onClose={() => setShowCreateBoard(false)}
        onCreated={(board) => setBoards((prev) => [...prev, board])}
      />
    </div>
  );
}