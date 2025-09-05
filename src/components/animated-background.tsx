"use client"
import { motion } from "framer-motion"

export default function AnimatedBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <motion.div
        className="absolute -inset-32 rounded-full"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, rgba(34,197,94,0.06) 0%, rgba(0,0,0,0) 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
      <motion.div
        className="absolute -inset-10"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, rgba(34,211,238,0.15), rgba(99,102,241,0.05), rgba(236,72,153,0.15), rgba(34,211,238,0.15))",
          filter: "blur(60px)",
        }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
    </div>
  )
}
