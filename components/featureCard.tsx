import React from 'react'
import { motion } from "framer-motion";
// import { useScrollReveal } from "../hooks/useScrollReveal";

export default function FeatureCard({
    icon, title, description, gradient, delay,
}: { icon: React.ReactNode; title: string; description: string; gradient: string; delay: number }) {
    // const { ref, inView } = useScrollReveal();
    return (
        <motion.div
            // ref={ref}
            // initial={{ opacity: 0, y: 40 }}
            // animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className="group relative rounded-2xl p-6 bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/60 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
        >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
            <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center mb-4 group-hover:border-zinc-600/50 transition-colors">
                    {icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
}
