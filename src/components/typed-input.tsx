"use client"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

type Props = {
  placeholder: string
  onSubmit: (value: string) => void
  buttonText?: string
}

export default function TypedInput({ placeholder, onSubmit, buttonText = "Continue" }: Props) {
  const [value, setValue] = useState("")
  const [ghost, setGhost] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setGhost(placeholder)
    const t = setTimeout(() => ref.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [placeholder])

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <input
          ref={ref}
          className="w-full rounded-lg bg-slate-900/60 border border-cyan-500/30 px-4 py-3 text-cyan-100 placeholder-cyan-400/40 outline-none focus:border-cyan-400 transition"
          placeholder={ghost}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && value && onSubmit(value)}
        />
        <motion.div
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: value ? 0 : 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-mono">{ghost}</span>
        </motion.div>
      </div>
      <button
        className="mt-3 w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium py-2.5 transition"
        onClick={() => value && onSubmit(value)}
      >
        {buttonText}
      </button>
    </div>
  )
}
