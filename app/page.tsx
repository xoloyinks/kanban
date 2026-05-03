"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import Orb from "@/components/orb";
import Counter from "@/components/counter";
import Tag from "@/components/tag";
import FeatureCard from "@/components/featureCard";

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="bg-zinc-950 text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {/* Grid */}
          {Array.from({ length: 11 }).map((_, i) => (
            <motion.div key={`h-${i}`}
              className="absolute h-px w-full bg-linear-to-r from-transparent via-zinc-800/60 to-transparent"
              style={{ top: `${i * 10}%` }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 1 }} />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <motion.div key={`v-${i}`}
              className="absolute w-px h-full bg-linear-to-b from-transparent via-zinc-800/60 to-transparent"
              style={{ left: `${i * 10}%` }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 1 }} />
          ))}

          {/* Radial linear center glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]" />
        </div>

        {/* Orbs */}
        <Orb className="w-125 h-125 bg-violet-600/25 -top-40 -left-32" delay={0} />
        <Orb className="w-100 h-100 bg-cyan-500/20 top-20 -right-20" delay={3} />
        <Orb className="w-75 h-75 bg-fuchsia-600/15 bottom-0 left-1/3" delay={6} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          {/* Pill badge */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/60 text-sm text-zinc-400"
              whileHover={{ borderColor: "rgba(139,92,246,0.5)", color: "#c4b5fd" }}
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Real-time collaboration · Built with Go + Next.js
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-1">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-[0.9]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            <span className="text-white">Ship faster.</span>
            <br />
            <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Together.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            TaskFlow is a real-time task management platform built for engineering teams. Boards, columns, tasks — all synced instantly across your team via Server-Sent Events.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Link href="/register">
              <motion.span
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-linear-to-r from-violet-600 to-cyan-600 text-white font-semibold text-sm relative overflow-hidden"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div
                  className="absolute inset-0 -skew-x-12 bg-linear-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                />
                <span className="relative">Start for free</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative group-hover:translate-x-1 transition-transform">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            </Link>
            <a href="#how-it-works">
              <motion.span
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-zinc-700/60 text-zinc-300 hover:text-white hover:border-zinc-600 font-semibold text-sm transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M6 8l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                See how it works
              </motion.span>
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="mt-12 flex items-center justify-center gap-6 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { value: 1200, suffix: "+", label: "teams" },
              { value: 45000, suffix: "+", label: "tasks completed" },
              { value: 99, suffix: "%", label: "uptime" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-zinc-600 text-sm">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span className="text-zinc-700 text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            className="w-px h-10 bg-linear-to-b from-zinc-700 to-transparent"
            animate={{ scaleY: [1, 0.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </section>

      {/* ── PRODUCT PREVIEW ──────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />

        <div className="max-w-5xl mx-auto px-6">
          {(() => {
            return (
              <motion.div
                // ref={previewRef}
                // initial={{ opacity: 0, y: 60 }}
                // animate={previewInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                {/* Outer glow */}
                <div className="absolute -inset-1 rounded-3xl bg-linear-to-br from-violet-500/20 via-transparent to-cyan-500/20 blur-xl" />

                {/* App mockup */}
                <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl shadow-violet-500/10">
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/80">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1 rounded-md bg-zinc-800 text-zinc-500 text-xs flex items-center gap-2">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M8 5a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1" />
                          <path d="M7.5 7.5l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                        app.taskflow.dev/boards
                      </div>
                    </div>
                  </div>

                  {/* App content */}
                  <div className="flex" style={{ minHeight: "440px" }}>
                    {/* Sidebar */}
                    <div className="w-52 border-r border-zinc-800 p-4 bg-zinc-950/50 hidden md:block">
                      <div className="flex items-center gap-2 mb-6 px-2">
                        <div className="w-6 h-6 rounded bg-linear-to-br from-violet-500 to-cyan-500" />
                        <span className="text-white text-xs font-semibold">Engineering</span>
                      </div>
                      <div className="space-y-1">
                        {[
                          { icon: "⬡", label: "Dashboard", active: false },
                          { icon: "◫", label: "My Boards", active: true },
                          { icon: "◻", label: "My Tasks", active: false },
                          { icon: "⬡", label: "Team", active: false },
                          { icon: "◻", label: "Settings", active: false },
                        ].map((item) => (
                          <div key={item.label}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${item.active ? "bg-violet-500/10 text-violet-300" : "text-zinc-600 hover:text-zinc-400"}`}>
                            <span className="text-xs opacity-60">{item.icon}</span>
                            {item.label}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-800/50">
                        <p className="text-zinc-700 text-xs px-3 mb-2 uppercase tracking-widest font-medium">Teams</p>
                        {["Frontend", "Backend", "Design"].map((team) => (
                          <div key={team} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-600 cursor-pointer hover:text-zinc-400">
                            <div className="w-2 h-2 rounded-full bg-zinc-700" />
                            {team}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main area */}
                    <div className="flex-1 p-5 overflow-hidden">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-white text-sm font-semibold">Sprint 4 — Q1 2025</h3>
                          <p className="text-zinc-600 text-xs mt-0.5">12 tasks · 3 members active</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {["7C3AED", "0891B2", "BE185D"].map((c, i) => (
                              <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900" style={{ backgroundColor: `#${c}` }} />
                            ))}
                          </div>
                          <motion.div
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                          >
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-violet-400"
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                            />
                            Live
                          </motion.div>
                        </div>
                      </div>

                      {/* Kanban columns */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            col: "Todo",
                            color: "bg-zinc-500",
                            tasks: [
                              { title: "Auth middleware", tag: "backend" },
                              { title: "Rate limiting", tag: "backend" },
                              { title: "Unit tests", tag: "testing" },
                            ],
                          },
                          {
                            col: "In Progress",
                            color: "bg-violet-500",
                            tasks: [
                              { title: "SSE real-time", tag: "backend" },
                              { title: "Dashboard UI", tag: "frontend" },
                            ],
                          },
                          {
                            col: "Completed",
                            color: "bg-emerald-500",
                            tasks: [
                              { title: "JWT tokens", tag: "auth" },
                              { title: "MongoDB setup", tag: "database" },
                              { title: "Team routes", tag: "api" },
                            ],
                          },
                        ].map((col, ci) => (
                          <div key={col.col} className="space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-2 h-2 rounded-full ${col.color}`} />
                              <span className="text-zinc-500 text-xs font-medium">{col.col}</span>
                              <span className="ml-auto text-zinc-700 text-xs">{col.tasks.length}</span>
                            </div>
                            {col.tasks.map((task, ti) => (
                              <motion.div
                                key={task.title}
                                className="p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 cursor-pointer group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: ci * 0.1 + ti * 0.08 }}
                                whileHover={{ borderColor: "rgba(139,92,246,0.3)", y: -1 }}
                              >
                                <p className="text-zinc-300 text-xs font-medium mb-1.5">{task.title}</p>
                                <span className="text-zinc-600 text-xs px-1.5 py-0.5 rounded bg-zinc-700/50 border border-zinc-700/30">{task.tag}</span>
                              </motion.div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="py-14 border-y border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 1200, suffix: "+", label: "Teams using TaskFlow" },
              { value: 45, suffix: "k+", label: "Tasks completed" },
              { value: 99.9, suffix: "%", label: "Uptime SLA" },
              { value: 12, suffix: "ms", label: "Avg. SSE latency" },
            ].map((stat) => {
              
              return (
                <motion.div
                  key={stat.label}
                  // ref={starRef}
                  // initial={{ opacity: 0, y: 20 }}
                  // animate={starInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                    <Counter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-zinc-600 text-sm">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 relative">
        <div className="max-w-5xl mx-auto px-6">
          {(() => {
            
            return (
              <motion.div
                // ref={featureRef}
                className="text-center mb-16"
                // initial={{ opacity: 0, y: 30 }}
                // animate={featureInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <Tag>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-violet-400">
                    <path d="M5 1l1.2 2.5L9 4.1 6.9 6.2l.4 3L5 7.9 2.7 9.2l.4-3L1 4.1l2.8-.6L5 1z" />
                  </svg>
                  Everything you need
                </Tag>
                <h2 className="text-4xl md:text-5xl font-black mt-5 mb-4 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Built for how teams<br />
                  <span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">actually work</span>
                </h2>
                <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                  No bloat. No enterprise overhead. Just the tools your team needs to ship fast.
                </p>
              </motion.div>
            );
          })()}

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M10 3v14" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                title: "Real-time boards",
                description: "Every task update, column move, and comment is pushed instantly via Server-Sent Events. No polling, no refresh.",
                gradient: "bg-gradient-to-br from-violet-500/5 to-transparent",
                delay: 0,
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.5" stroke="#67e8f9" strokeWidth="1.5" /><rect x="11" y="3" width="6" height="6" rx="1.5" stroke="#67e8f9" strokeWidth="1.5" /><rect x="3" y="11" width="6" height="6" rx="1.5" stroke="#67e8f9" strokeWidth="1.5" /><rect x="11" y="11" width="6" height="6" rx="1.5" stroke="#67e8f9" strokeWidth="1.5" /></svg>,
                title: "Kanban columns",
                description: "Drag tasks between Todo, In Progress, and Completed. Columns update for every member the moment you move a card.",
                gradient: "bg-gradient-to-br from-cyan-500/5 to-transparent",
                delay: 0.1,
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3a7 7 0 100 14A7 7 0 0010 3z" stroke="#f0abfc" strokeWidth="1.5" /><path d="M10 7v3l2 2" stroke="#f0abfc" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                title: "Smart prioritization",
                description: "Tag tasks as low, medium, or high priority. Filter your board instantly to focus on what matters most right now.",
                gradient: "bg-gradient-to-br from-fuchsia-500/5 to-transparent",
                delay: 0.2,
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 0012 0 6 6 0 00-12 0z" stroke="#6ee7b7" strokeWidth="1.5" /><path d="M10 7v3l2 2" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" /><path d="M10 13v.5" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" /></svg>,
                title: "Team management",
                description: "Create teams, invite members by email, assign roles. Each team has its own boards and task visibility.",
                gradient: "bg-gradient-to-br from-emerald-500/5 to-transparent",
                delay: 0.3,
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10h10M15 6l4 4-4 4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
                title: "JWT authentication",
                description: "Secure token-based auth with 24hr expiry. Every request is verified at the middleware layer before touching your data.",
                gradient: "bg-gradient-to-br from-yellow-500/5 to-transparent",
                delay: 0.4,
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10" cy="10" r="7" stroke="#f87171" strokeWidth="1.5" /></svg>,
                title: "Pagination & search",
                description: "Fast paginated task queries with full-text search across title and description. Filter by priority, column, or assignee.",
                gradient: "bg-gradient-to-br from-red-500/5 to-transparent",
                delay: 0.5,
              },
            ].map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 bg-zinc-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(139,92,246,0.06),transparent)]" />

        <div className="max-w-5xl mx-auto px-6">
          {(() => {
            
            return (
              <motion.div
                // ref={previewRef}
                className="text-center mb-16"
                // initial={{ opacity: 0, y: 30 }}
                // animate={previewInView ? { opacity: 1, y: 0 } : {}}
              >
                <Tag>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M3 5l1.5 1.5L7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  How it works
                </Tag>
                <h2 className="text-4xl md:text-5xl font-black mt-5 mb-4 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Up and running<br />
                  <span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">in 3 steps</span>
                </h2>
              </motion.div>
            );
          })()}

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-linear-to-r from-violet-500/30 via-cyan-500/30 to-violet-500/30" />

            {[
              {
                step: "01",
                title: "Create your team",
                desc: "Sign up, create a team, and invite members by email. Everyone gets their own secure JWT token.",
                color: "from-violet-500 to-violet-600",
              },
              {
                step: "02",
                title: "Set up your board",
                desc: "Create a board for your sprint or project. Columns are created automatically when you add your first task.",
                color: "from-fuchsia-500 to-violet-500",
              },
              {
                step: "03",
                title: "Work in real time",
                desc: "Connect to the SSE stream. Every task change is broadcast instantly — no refreshing, no polling.",
                color: "from-cyan-500 to-fuchsia-500",
              },
            ].map((step, i) => {
              // const { ref, inView } = useScrollReveal();
              return (
                <motion.div
                  key={step.step}
                  // ref={ref}
                  // initial={{ opacity: 0, y: 30 }}
                  // animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative text-center"
                >
                  <div className={`w-20 h-20 rounded-2xl bg-linear-to-br ${step.color} mx-auto mb-6 flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-black text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────────────── */}
      <section className="py-20 border-y border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-6">
          {(() => {
            
            return (
              <motion.div
                // ref={previewRef}
                className="text-center mb-10"
                // initial={{ opacity: 0 }}
                // animate={previewInView ? { opacity: 1 } : {}}
              >
                <p className="text-zinc-600 text-sm uppercase tracking-widest font-medium">Powered by</p>
              </motion.div>
            );
          })()}

          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { name: "Go", desc: "Backend API", color: "#00ADD8" },
              { name: "MongoDB", desc: "Database", color: "#47A248" },
              { name: "Next.js", desc: "Frontend", color: "#FFFFFF" },
              { name: "JWT", desc: "Auth", color: "#FB015B" },
              { name: "SSE", desc: "Real-time", color: "#A78BFA" },
              { name: "Tailwind", desc: "Styling", color: "#38BDF8" },
              { name: "Framer", desc: "Animation", color: "#FF0055" },
            ].map((tech, i) => {
              // const { ref, inView } = useScrollReveal(0.2);
              return (
                <motion.div
                  key={tech.name}
                  // ref={ref}
                  // initial={{ opacity: 0, scale: 0.8 }}
                  // animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 transition-colors group"
                  whileHover={{ y: -2 }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tech.color }} />
                  <div>
                    <div className="text-white text-sm font-semibold">{tech.name}</div>
                    <div className="text-zinc-600 text-xs">{tech.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(139,92,246,0.12),transparent)]" />
          <Orb className="w-125 h-125 bg-violet-600/20 -top-40 left-0" delay={2} />
          <Orb className="w-100 h-100 bg-cyan-500/15 -bottom-20 right-0" delay={4} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          {(() => {
            
            return (
              <motion.div
                // ref={previewRef}
                // initial={{ opacity: 0, y: 40 }}
                // animate={previewInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7 }}
              >
                <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Ready to ship<br />
                  <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                    faster?
                  </span>
                </h2>
                <p className="text-zinc-500 text-lg mb-10 max-w-lg mx-auto">
                  Join over 1,200 teams using TaskFlow to manage their work in real time.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <motion.span
                      className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-linear-to-r from-violet-600 to-cyan-600 text-white font-bold text-base relative overflow-hidden"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <motion.div
                        className="absolute inset-0 -skew-x-12 bg-linear-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                      />
                      <span className="relative">Create free account</span>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="relative group-hover:translate-x-1 transition-transform">
                        <path d="M3.5 9h11M10 4.5l4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.span>
                  </Link>
                  <Link href="/auth/login" className="text-zinc-500 hover:text-white text-sm font-medium transition-colors">
                    Already have an account →
                  </Link>
                </div>
                <p className="text-zinc-700 text-xs mt-8">No credit card required · Free forever for small teams</p>
              </motion.div>
            );
          })()}
        </div>
      </section>

      <Footer />
      
    </div>
  );
}