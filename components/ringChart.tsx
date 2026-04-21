import React from 'react'
import { motion } from 'framer-motion';

export default function Ring({ pct, color, size = 96, stroke = 8 }: { pct: number; color: string; size?: number; stroke?: number }) {
   const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
                transition={{ duration: 1.3, ease: "easeOut", delay: 0.4 }}
            />
        </svg>
    );
}
