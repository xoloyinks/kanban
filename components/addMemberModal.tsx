import { authHeaders } from '@/helpers/helpers';
import { Member } from '@/structs/types';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react'


const ROLE_CFG: Record<string, { color: string; bg: string; dot: string; desc: string }> = {
  admin:  { color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20",   dot: "bg-violet-400",  desc: "Can manage boards and members"  },
  member: { color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",       dot: "bg-cyan-400",    desc: "Can create and edit tasks"      },
  viewer: { color: "text-zinc-400",    bg: "bg-zinc-500/10 border-zinc-700/40",       dot: "bg-zinc-500",    desc: "Can view boards and tasks only" },
};

export default function AddMemberModal(
    {
      open, teamId, onClose, onAdded,
    }: {
      open: boolean; teamId: string;
      onClose: () => void;
      onAdded: (member: Member) => void;
    }
) {
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
}
