import { authHeaders } from '@/helpers/helpers';
import { Team, TeamWithMembers } from '@/structs/types';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react'

export default function EditTeamModal({
  open, team, onClose, onUpdated,
}: {
  open: boolean; team: TeamWithMembers | null;
  onClose: () => void;
  onUpdated: (t: Partial<Team>) => void;
}) {
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
}
