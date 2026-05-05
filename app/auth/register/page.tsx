"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Animated ring
const Ring = ({ size, delay, opacity }: { size: number; delay: number; opacity: number }) => (
  <motion.div
    className="absolute rounded-full border border-amber-400/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    style={{ width: size, height: size }}
    animate={{ scale: [1, 1.05, 1], opacity: [opacity * 0.5, opacity, opacity * 0.5] }}
    transition={{ duration: 6 + delay, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

// Password strength indicator
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { label: "Weak", color: "#ef4444" },
      { label: "Fair", color: "#f97316" },
      { label: "Good", color: "#eab308" },
      { label: "Strong", color: "#22c55e" },
    ];
    return { score, ...levels[score - 1] || levels[0] };
  };

  const strength = getStrength();
  if (!password) return null;

  return (
    <motion.div
      className="mt-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="h-0.5 flex-1 rounded-full"
            animate={{
              backgroundColor: i <= strength.score ? strength.color : "rgba(255,255,255,0.1)",
            }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: strength.color, fontFamily: "'DM Mono', monospace" }}>
        {strength.label}
      </p>
    </motion.div>
  );
};

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // multi-step feel

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/createAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          const firstError = Object.values(data.fields)[0] as string;
          setError(firstError);
        } else {
          setError(data.error || "Registration failed");
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch {
      setError("Unable to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#0D0D0D] text-white placeholder-white/20 rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none";

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Diagonal gradient stripe */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #f59e0b 0px, #f59e0b 1px, transparent 1px, transparent 60px)",
          }}
        />
        {/* Ambient glow */}
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)",
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 60%)",
          }}
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Rings */}
      {mounted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <Ring size={800} delay={0} opacity={0.3} />
          <Ring size={600} delay={1} opacity={0.4} />
          <Ring size={400} delay={2} opacity={0.5} />
        </div>
      )}

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
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
            Create account
          </h1>
          <p className="text-white/40 text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>
            Join thousands of productive teams
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Glow border */}
          <div
            className="absolute -inset-[1px] rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(255,255,255,0.05) 40%, rgba(99,102,241,0.2) 100%)",
            }}
          />

          <div className="relative bg-[#111111] rounded-2xl p-8 border border-white/[0.04]">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  className="py-8 text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </motion.div>
                  <h3
                    className="text-white text-xl font-bold mb-2"
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                  >
                    Account created!
                  </h3>
                  <p className="text-white/40 text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Redirecting to login...
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Name field */}
                  <motion.div custom={0} initial="hidden" animate="visible">
                    <label
                      className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        animate={{
                          boxShadow: focusedField === "name"
                            ? "0 0 0 1px rgba(245,158,11,0.5)"
                            : "0 0 0 1px rgba(255,255,255,0.06)",
                        }}
                        transition={{ duration: 0.2 }}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <motion.svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          animate={{ color: focusedField === "name" ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.3)" }}
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                        </motion.svg>
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="John Doe"
                        required
                        minLength={3}
                        className={inputClass}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                    </div>
                  </motion.div>

                  {/* Email field */}
                  <motion.div custom={1} initial="hidden" animate="visible">
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
                            ? "0 0 0 1px rgba(245,158,11,0.5)"
                            : "0 0 0 1px rgba(255,255,255,0.06)",
                        }}
                        transition={{ duration: 0.2 }}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <motion.svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          animate={{ color: focusedField === "email" ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.3)" }}
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
                        className={inputClass}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                    </div>
                  </motion.div>

                  {/* Password field */}
                  <motion.div custom={2} initial="hidden" animate="visible">
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
                            ? "0 0 0 1px rgba(245,158,11,0.5)"
                            : "0 0 0 1px rgba(255,255,255,0.06)",
                        }}
                        transition={{ duration: 0.2 }}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <motion.svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          animate={{ color: focusedField === "password" ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.3)" }}
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
                        minLength={6}
                        className={`${inputClass} pr-12`}
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
                    <PasswordStrength password={password} />
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

                  {/* Submit */}
                  <motion.div
                    custom={3}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full rounded-xl py-3.5 text-sm font-semibold overflow-hidden group"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="absolute inset-0 bg-amber-400 group-hover:bg-amber-300 transition-colors duration-200" />
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
                            Creating account...
                          </span>
                        ) : (
                          "Create account →"
                        )}
                      </span>
                    </motion.button>
                  </motion.div>

                  {/* Terms */}
                  <motion.p
                    className="text-center text-white/20 text-xs leading-relaxed"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    By creating an account you agree to our{" "}
                    <span className="text-amber-400/60 hover:text-amber-400 transition-colors cursor-pointer">
                      Terms of Service
                    </span>
                  </motion.p>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Divider */}
            {!success && (
              <>
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-white/20 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>or</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <motion.p
                  className="text-center text-sm text-white/40"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
                  >
                    Sign in
                  </Link>
                </motion.p>
              </>
            )}
          </div>
        </motion.div>

        <motion.p
          className="text-center text-white/20 text-xs mt-6"
          style={{ fontFamily: "'DM Mono', monospace" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Secured with JWT · v1.0
        </motion.p>
      </motion.div>
    </div>
  );
}