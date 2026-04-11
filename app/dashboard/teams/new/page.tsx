"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@/structs/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getToken    = () => typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });
const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

// ─── Floating background dot ──────────────────────────────────────────────────
const Dot = ({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) => (
  <motion.div
    className="absolute rounded-full bg-violet-500/10 pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
    animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

// ─── Member invite row ────────────────────────────────────────────────────────
interface InvitedMember { email: string; role: "admin" | "member" | "viewer"; id: string; }

const ROLES = ["admin", "member", "viewer"] as const;
const ROLE_CONFIG = {
  admin:  { color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20",  desc: "Can manage boards and members"  },
  member: { color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",      desc: "Can create and edit tasks"      },
  viewer: { color: "text-zinc-400",    bg: "bg-zinc-500/10 border-zinc-500/20",      desc: "Can view boards and tasks only" },
};

const MemberRow = ({
  member, index, onRemove, onRoleChange,
}: {
  member: InvitedMember; index: number;
  onRemove: (id: string) => void;
  onRoleChange: (id: string, role: "admin" | "member" | "viewer") => void;
}) => {
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
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewTeamPage() {
  const router  = useRouter();

  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState<"admin" | "member" | "viewer">("member");
  const [members, setMembers]     = useState<InvitedMember[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [inviteError, setInviteError] = useState("");
  const [mounted, setMounted]     = useState(false);
  const [step, setStep]           = useState<1 | 2>(1); // 1=details, 2=members
  const [success, setSuccess]     = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

//   get user from localstorage
  const getUser = () : User | null => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  };


  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) { router.push("/login"); return; }
    setTimeout(() => nameRef.current?.focus(), 400);
  }, [mounted, router]);

  const addMember = () => {
    setInviteError("");
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError("Enter a valid email address");
      return;
    }
    if (members.find((m) => m.email === email)) {
      setInviteError("Already added");
      return;
    }
    setMembers((prev) => [...prev, { email, role: inviteRole, id: crypto.randomUUID() }]);
    setInviteEmail("");
  };

  const handleInviteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addMember(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      // 1. create the team
      const teamRes = await fetch("http://localhost:8000/team", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), description: description.trim(), created_by: getUser()?.email }),
      });

      const teamData = await teamRes.json();
      if (!teamRes.ok) { setError(teamData.error || "Failed to create team"); return; }

      const teamId = teamData.teamId;

       console.log(teamData)
      setCreatedTeamId(teamId);

      // 2. invite members (fire all in parallel, ignore individual failures)
      if (members.length > 0) {
        await Promise.allSettled(
          members.map((m) =>
            fetch(`http://localhost:8000/addMember/${teamId}`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ email: m.email, role: m.role }),
            })
          )
        );
      }

      

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/all-boards"), 1800);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;
 

  return (
    <div className="min-h-screen bg-zinc-950 flex overflow-hidden relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 flex-col relative overflow-hidden border-r border-zinc-800/60">
        {/* Background dots */}
        <Dot x={10} y={15} size={120} delay={0} />
        <Dot x={60} y={40} size={80}  delay={2} />
        <Dot x={20} y={70} size={160} delay={4} />
        <Dot x={80} y={80} size={60}  delay={1} />

        {/* Grid lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent"
            style={{ top: `${(i + 1) * 14}%` }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: i * 0.1, duration: 1.2 }}
          />
        ))}

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Main copy */}
          <div className="py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">New team</p>
              <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                Build your<br />
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  dream team
                </span>
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Create a shared workspace for your team. Add members, assign roles, and start shipping together.
              </p>
            </motion.div>

            {/* Feature list */}
            <motion.div
              className="mt-10 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[
                { icon: "🎯", title: "Shared boards",  desc: "Every board belongs to a team" },
                { icon: "👥", title: "Role control",   desc: "Admin, member, and viewer roles" },
                { icon: "⚡", title: "Real-time sync", desc: "Everyone sees updates instantly" },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <span className="text-lg flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{f.title}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Step indicator */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <motion.div
                  className={`rounded-full transition-all duration-300 ${
                    step === s
                      ? "w-8 h-2 bg-violet-500"
                      : step > s
                      ? "w-2 h-2 bg-emerald-500"
                      : "w-2 h-2 bg-zinc-700"
                  }`}
                />
                {s < 2 && <div className="w-4 h-px bg-zinc-800" />}
              </div>
            ))}
            <span className="text-zinc-600 text-xs ml-1">Step {step} of 2</span>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.9" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.9" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm">TaskFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className={`rounded-full transition-all duration-300 ${step === s ? "w-6 h-1.5 bg-violet-500" : step > s ? "w-1.5 h-1.5 bg-emerald-500" : "w-1.5 h-1.5 bg-zinc-700"}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg">

            {/* Success overlay */}
            <AnimatePresence>
              {success && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="text-center"
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <motion.path
                          d="M8 18l7 7 13-13"
                          stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        />
                      </svg>
                    </motion.div>
                    <motion.p
                      className="text-white font-bold text-xl mb-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      Team created!
                    </motion.p>
                    <motion.p
                      className="text-zinc-500 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      Redirecting to your boards...
                    </motion.p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">

                {/* ── Step 1: Team details ─────────────────────────── */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-8">
                      <h1 className="text-2xl font-black text-white mb-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Team details
                      </h1>
                      <p className="text-zinc-500 text-sm">Give your team a name and description.</p>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
                          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 3a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 017 4zm0 6a.875.875 0 110-1.75.875.875 0 010 1.75z" /></svg>
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-5">
                      {/* Team name */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                          Team name *
                        </label>
                        <div className="relative">
                          <input
                            ref={nameRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Engineering, Design, Marketing..."
                            maxLength={50}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all pr-16"
                          />
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${name.length > 40 ? "text-orange-400" : "text-zinc-700"}`}>
                            {name.length}/50
                          </span>
                        </div>

                        {/* Live preview */}
                        <AnimatePresence>
                          {name.trim() && (
                            <motion.div
                              className="mt-2 flex items-center gap-2"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                            >
                              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: "8px" }}>
                                {getInitials(name)}
                              </div>
                              <span className="text-zinc-500 text-xs">Preview: <span className="text-zinc-300">{name}</span></span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                          Description <span className="text-zinc-700 normal-case font-normal">optional</span>
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDesc(e.target.value)}
                          placeholder="What does this team work on?"
                          rows={3}
                          maxLength={200}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all resize-none"
                        />
                        <p className={`text-xs mt-1 text-right tabular-nums ${description.length > 160 ? "text-orange-400" : "text-zinc-700"}`}>
                          {description.length}/200
                        </p>
                      </div>

                      {/* Next */}
                      <motion.button
                        type="button"
                        onClick={() => { if (name.trim()) { setError(""); setStep(2); } }}
                        disabled={!name.trim()}
                        className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 relative overflow-hidden group"
                        whileHover={name.trim() ? { scale: 1.01 } : {}}
                        whileTap={name.trim() ? { scale: 0.99 } : {}}
                      >
                        <motion.div
                          className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                        />
                        <span className="relative">Continue</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative group-hover:translate-x-1 transition-transform">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Invite members ───────────────────────── */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-8">
                      {/* Back */}
                      <motion.button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 text-xs mb-5 transition-colors"
                        whileHover={{ x: -2 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to details
                      </motion.button>

                      <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                          Invite members
                        </h1>
                        <span className="text-zinc-600 text-sm font-normal">optional</span>
                      </div>
                      <p className="text-zinc-500 text-sm">Add teammates by email. You can always do this later.</p>
                    </div>

                    {/* Team name recap */}
                    <motion.div
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(name)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{name}</p>
                        {description && <p className="text-zinc-600 text-xs truncate max-w-xs">{description}</p>}
                      </div>
                    </motion.div>

                    {/* Invite input */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                        Email address
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                            onKeyDown={handleInviteKeyDown}
                            placeholder="teammate@company.com"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-sm outline-none focus:border-violet-500/60 transition-all"
                          />
                        </div>

                        {/* Role picker inline */}
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-400 text-xs outline-none appearance-none cursor-pointer focus:border-zinc-700 transition-all"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        <motion.button
                          type="button"
                          onClick={addMember}
                          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          Add
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {inviteError && (
                          <motion.p
                            className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="4" /><path d="M5 3v2.5M5 7v.5" stroke="white" strokeWidth="1" strokeLinecap="round" /></svg>
                            {inviteError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <p className="text-zinc-700 text-xs mt-1.5">Press Enter to add quickly</p>
                    </div>

                    {/* Member list */}
                    <AnimatePresence>
                      {members.length > 0 && (
                        <motion.div
                          className="mb-6 space-y-2"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                              {members.length} member{members.length !== 1 ? "s" : ""} to invite
                            </p>
                            <button
                              type="button"
                              onClick={() => setMembers([])}
                              className="text-zinc-700 hover:text-red-400 text-xs transition-colors"
                            >
                              Clear all
                            </button>
                          </div>
                          <AnimatePresence initial={false}>
                            {members.map((m, i) => (
                              <MemberRow
                                key={m.id}
                                member={m}
                                index={i}
                                onRemove={(id) => setMembers((prev) => prev.filter((m) => m.id !== id))}
                                onRoleChange={(id, role) => setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m))}
                              />
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Role legend */}
                    <motion.div
                      className="mb-6 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 space-y-2"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    >
                      <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest mb-3">Role permissions</p>
                      {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                        <div key={role} className="flex items-center gap-3">
                          <span className={`text-xs font-semibold capitalize w-14 ${cfg.color}`}>{role}</span>
                          <span className="text-zinc-600 text-xs">{cfg.desc}</span>
                        </div>
                      ))}
                    </motion.div>

                    {/* Submit */}
                    <div className="flex gap-3">
                      <motion.button
                        type="button"
                        onClick={() => { setMembers([]); handleSubmit({ preventDefault: () => {} } as React.FormEvent); }}
                        className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm font-medium transition-all"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        Skip for now
                      </motion.button>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 relative overflow-hidden group"
                        whileHover={!loading ? { scale: 1.01 } : {}}
                        whileTap={!loading ? { scale: 0.99 } : {}}
                      >
                        <motion.div
                          className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                        />
                        {loading ? (
                          <>
                            <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                            <span className="relative">Creating...</span>
                          </>
                        ) : (
                          <>
                            <span className="relative">
                              {members.length > 0 ? `Create & invite ${members.length}` : "Create team"}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative group-hover:translate-x-1 transition-transform">
                              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}