"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import UsernameInput from "@/components/username-input"
import FuturisticBackground from "@/components/futuristic-background"

export default function SetupPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [mode, setMode] = useState<"pick" | "join">("pick")
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState("")

  const handleValidUsername = (validatedUsername: string) => {
    setUsername(validatedUsername)
    // Redirect to dashboard where user can see existing rooms and create/join
    router.push("/dashboard")
  }

  async function joinRoom() {
    if (!username || !joinCode) return

    setIsJoining(true)
    setJoinError("")

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        body: JSON.stringify({ code: joinCode.toUpperCase(), name: username }),
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()

      if (res.ok && json.code) {
        router.push(`/room/${json.code}`)
      } else {
        setJoinError(json.error || "Failed to join room")
      }
    } catch{
      setJoinError("Failed to join room")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <FuturisticBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl">
            {!username ? (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Choose Your Identity</h2>
                  <p className="text-muted-foreground">Create a unique username to begin your adventure</p>
                </div>

                <UsernameInput onValidUsername={handleValidUsername} />
              </div>
            ) : mode === "pick" ? (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome, {username}</h2>
                  <p className="text-muted-foreground">What would you like to do?</p>
                </div>

                <div className="grid gap-4">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:scale-105 transition-all duration-300 neon-glow"
                  >
                    Go to Dashboard
                  </button>

                  <button
                    onClick={() => setMode("join")}
                    className="w-full bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl hover:scale-105 transition-all duration-300"
                  >
                    Quick Join Room
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Enter Room Code</h2>
                  <p className="text-muted-foreground">Join an existing game session</p>
                </div>

                <div className="space-y-4">
                  <input
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all text-center text-lg font-mono"
                    placeholder="ABCD1234"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={8}
                  />

                  {joinError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-sm"
                    >
                      {joinError}
                    </motion.div>
                  )}

                  <button
                    onClick={joinRoom}
                    disabled={!joinCode || isJoining}
                    className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  >
                    {isJoining ? "Joining..." : "Enter the Realm"}
                  </button>

                  <button
                    onClick={() => setMode("pick")}
                    className="w-full text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to Options
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
