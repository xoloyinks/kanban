import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion';
import { getInitials } from '@/helpers/helpers';

interface InvitedMember { email: string; role: "admin" | "member" | "viewer"; id: string; }

const ROLES = ["admin", "member", "viewer"] as const;
const ROLE_CONFIG = {
  admin:  { color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20",  desc: "Can manage boards and members"  },
  member: { color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",      desc: "Can create and edit tasks"      },
  viewer: { color: "text-zinc-400",    bg: "bg-zinc-500/10 border-zinc-500/20",      desc: "Can view boards and tasks only" },
};

export default function MemberRow({
  member, index, onRemove, onRoleChange,
}: {
  member: InvitedMember; index: number;
  onRemove: (id: string) => void;
  onRoleChange: (id: string, role: "admin" | "member" | "viewer") => void;
}) {
  const [showRoles, setShowRoles] = useState(false);
  const cfg = ROLE_CONFIG[member.role];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-3 py-3 px-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60 group"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/40 border border-violet-500/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {getInitials(member.email.split("@")[0])}
      </div>

      {/* Email */}
      <div className="flex-1 min-w-0">
        <p className="text-zinc-200 text-sm truncate">{member.email}</p>
      </div>

      {/* Role selector */}
      <div className="relative">
        <motion.button
          onClick={() => setShowRoles((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${cfg.bg} ${cfg.color}`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {member.role}
          <motion.svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            animate={{ rotate: showRoles ? 180 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </motion.button>

        <AnimatePresence>
          {showRoles && (
            <motion.div
              className="absolute right-0 top-full mt-1.5 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-20"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {ROLES.map((role) => {
                const rc = ROLE_CONFIG[role];
                return (
                  <motion.button
                    key={role}
                    onClick={() => { onRoleChange(member.id, role); setShowRoles(false); }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-800/60 transition-colors ${member.role === role ? "bg-zinc-800/40" : ""}`}
                    whileHover={{ x: 2 }}
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${member.role === role ? rc.color.replace("text-", "bg-") : "bg-zinc-700"}`} />
                    <div>
                      <p className={`text-xs font-semibold capitalize ${rc.color}`}>{role}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{rc.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Remove */}
      <motion.button
        onClick={() => onRemove(member.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        whileHover={{ scale: 1.1, rotate: 90 }}
        transition={{ duration: 0.15 }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
