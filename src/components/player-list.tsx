"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Crown } from "lucide-react"
import type { Player } from "../../types"

interface PlayerListProps {
  initial: Player[]
  adminId?: string
}

export default function PlayerList({ initial, adminId }: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>(initial)
  useEffect(() => setPlayers(initial), [initial])

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">Players ({players.length})</h3>

      <div className="space-y-3">
        <AnimatePresence>
          {players.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 p-3 bg-background/50 rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                {p.name.slice(0, 1).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">{p.name}</span>
                  {adminId && p.id === adminId && <Crown className="w-4 h-4 text-accent" />}
                </div>
                <div className="text-sm text-muted-foreground">{p.score} points</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
