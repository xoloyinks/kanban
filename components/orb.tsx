import React from 'react'
import { motion } from "framer-motion";

interface OrbProps {
    className: string;
    delay: number;
}

export default function Orb({ className, delay }: OrbProps) {
    return (
        <motion.div
            className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
            animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay }}
        />
    )
}
