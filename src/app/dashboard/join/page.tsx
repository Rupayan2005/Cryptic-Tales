"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Zap } from "lucide-react";
import FuturisticBackground from "@/components/futuristic-background";

export default function QuickJoinPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: roomCode.trim().toUpperCase() }),
      });

      const result = await res.json();

      if (res.ok) {
        // Successfully joined, redirect to the room
        router.push(`/room/${result.code}`);
      } else {
        // Handle different error cases
        switch (res.status) {
          case 404:
            setError("Room not found. Please check the room code.");
            break;
          case 401:
            setError("You need to be logged in to join a room.");
            router.push("/auth");
            break;
          default:
            setError(result.error || "Failed to join room. Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <FuturisticBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </motion.button>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Quick Join Room
              </h1>
              <p className="text-muted-foreground">
                Enter the room code to join an existing game
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label
                  htmlFor="roomCode"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Room Code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code (e.g., ABC123)"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  maxLength={10}
                  disabled={isJoining}
                  autoFocus
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 border border-destructive/20 rounded-xl p-4"
                >
                  <p className="text-destructive text-sm font-medium">
                    {error}
                  </p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isJoining || !roomCode.trim()}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 neon-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="flex items-center justify-center gap-3">
                  <Users className="w-5 h-5" />
                  {isJoining ? "Joining..." : "Join Room"}
                </div>
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Room codes are typically 4-6 characters long and
                case-insensitive.
                <br />
                Ask the room admin for the correct code.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
