"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useGetUserQuery } from "@/app/api/user";

// Floating particle component
const Particle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-amber-400/30"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      y: [0, -30, 0],
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Grid line component
const GridLine = ({ isVertical, position }: { isVertical: boolean; position: number }) => (
  <motion.div
    className={`absolute ${isVertical ? "w-px h-full" : "w-full h-px"} bg-white/[0.03]`}
    style={isVertical ? { left: `${position}%` } : { top: `${position}%` }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 2, delay: position * 0.01 }}
  />
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("https://task-api-5zuk.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      localStorage.setItem("token", data.token);
      // localStorage.setItem("user", JSON.stringify(user));
      window.location.href = "/dashboard";
    } catch {
      setError("Unable to connect to servers");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center overflow-hidden relative">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Grid */}
      <div className="absolute inset-0">
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((pos) => (
          <GridLine key={`v${pos}`} isVertical={true} position={pos} />
        ))}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((pos) => (
          <GridLine key={`h${pos}`} isVertical={false} position={pos} />
        ))}
      </div>

      {/* Particles */}
      {mounted && particles.map((p) => (
        <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} />
      ))}

      {/* Main card */}
      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo / Brand */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <motion.div
              className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </motion.div>
            <span
              className="text-white text-xl font-bold tracking-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Taskflow
            </span>
          </div>
          <h1
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Welcome back
          </h1>
          <p className="text-white/40 text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>
            Sign in to continue your work
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Card border glow */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(59,130,246,0.1) 100%)",
              padding: "1px",
            }}
          >
            <div className="absolute inset-[1px] rounded-2xl bg-[#111111]" />
          </div>

          <div className="relative bg-[#111111] rounded-2xl p-8 border border-white/[0.06]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label
                  className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Email
                </label>
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                      boxShadow: focusedField === "email"
                        ? "0 0 0 1px rgba(245,158,11,0.5), inset 0 0 20px rgba(245,158,11,0.03)"
                        : "0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <motion.svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      animate={{ color: focusedField === "email" ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.3)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" />
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.5" />
                    </motion.svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#0D0D0D] text-white placeholder-white/20 rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-colors"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  />
                </div>
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label
                  className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  Password
                </label>
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                      boxShadow: focusedField === "password"
                        ? "0 0 0 1px rgba(245,158,11,0.5), inset 0 0 20px rgba(245,158,11,0.03)"
                        : "0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <motion.svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      animate={{ color: focusedField === "password" ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.3)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" />
                    </motion.svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#0D0D0D] text-white placeholder-white/20 rounded-xl pl-11 pr-12 py-3.5 text-sm outline-none"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-red-400/80 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full rounded-xl py-3.5 text-sm font-semibold overflow-hidden group"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Button background */}
                  <div className="absolute inset-0 bg-amber-400 group-hover:bg-amber-300 transition-colors duration-200" />
                  {/* Button shine */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                    }}
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative text-[#0A0A0A]">
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full inline-block"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                        Signing in...
                      </span>
                    ) : (
                      "Sign in →"
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-white/20 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Register link */}
            <motion.p
              className="text-center text-sm text-white/40"
              style={{ fontFamily: "'DM Mono', monospace" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              No account yet?{" "}
              <Link
                href="/auth/register"
                className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                Create one
              </Link>
            </motion.p>
          </div>
        </motion.div>

        {/* Bottom tag */}
        <motion.p
          className="text-center text-white/20 text-xs mt-6"
          style={{ fontFamily: "'DM Mono', monospace" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Secured with JWT · v1.0
        </motion.p>
      </motion.div>
    </div>
  );
}
