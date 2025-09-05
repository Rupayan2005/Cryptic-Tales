"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Users, Crown, Play, Settings, LogOut, Zap } from "lucide-react";
import FuturisticBackground from "@/components/futuristic-background";

type RoomWithStatus = {
  code: string;
  adminId: string;
  players: Array<{ id: string; name: string; score: number; joinedAt: string }>;
  status: "lobby" | "playing" | "ended";
  settings: {
    timerSeconds: number;
    decayRate: number;
    difficulty: "easy" | "medium" | "hard";
    allowSuggestions: boolean;
  };
  createdAt: string;
  currentClue?: unknown;
  isAdmin: boolean;
  playerCount: number;
  userScore: number;
};

type DashboardData = {
  rooms: RoomWithStatus[];
  username: string;
  userId: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/users/rooms");
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      } else {
        // User not authenticated, redirect to auth
        router.push("/auth");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      router.push("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    if (!data) return;

    setIsCreatingRoom(true);
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.username }),
      });

      const result = await res.json();
      if (res.ok && result.code) {
        router.push(`/room/${result.code}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/auth");
    }
  };

  const joinRoom = (roomCode: string) => {
    router.push(`/room/${roomCode}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "lobby":
        return "text-accent";
      case "playing":
        return "text-primary";
      case "ended":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "lobby":
        return "Waiting";
      case "playing":
        return "Active";
      case "ended":
        return "Finished";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <FuturisticBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <FuturisticBackground />

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome back,{" "}
                <span className="text-primary">{data.username}</span>
              </h1>
              <p className="text-muted-foreground">
                Manage your rooms and continue your adventures
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Switch User
            </button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            <button
              onClick={createRoom}
              disabled={isCreatingRoom}
              className="bg-primary text-primary-foreground p-6 rounded-2xl font-semibold text-lg hover:scale-105 transition-all duration-300 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                <Plus className="w-6 h-6" />
                {isCreatingRoom ? "Creating..." : "Create New Room"}
              </div>
            </button>

            <button
              onClick={() => router.push("/dashboard/join")}
              className="bg-secondary text-secondary-foreground p-6 rounded-2xl font-semibold text-lg hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-6 h-6" />
                Quick Join Room
              </div>
            </button>
          </motion.div>

          {/* Rooms List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Your Rooms
            </h2>

            {data.rooms.length === 0 ? (
              <div className="bg-card/50 border border-border rounded-2xl p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No rooms yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first room to start playing with friends
                </p>
                <button
                  onClick={createRoom}
                  disabled={isCreatingRoom}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50"
                >
                  Create Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.rooms.map((room, index) => (
                  <motion.div
                    key={room.code}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                    onClick={() => joinRoom(room.code)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            Room {room.code}
                          </h3>
                          {room.isAdmin && (
                            <Crown className="w-4 h-4 text-accent">
                              <title>You are the admin</title>
                            </Crown>
                          )}
                        </div>
                        <p
                          className={`text-sm font-medium ${getStatusColor(
                            room.status
                          )}`}
                        >
                          {getStatusText(room.status)}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                          <Users className="w-3 h-3" />
                          {room.playerCount}
                        </div>
                        {room.userScore > 0 && (
                          <div className="text-primary text-sm font-semibold">
                            {room.userScore} pts
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Difficulty:</span>
                        <span className="capitalize">
                          {room.settings.difficulty}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timer:</span>
                        <span>{room.settings.timerSeconds}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            joinRoom(room.code);
                          }}
                          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          {room.status === "lobby" ? "Join" : "Continue"}
                        </button>

                        {room.isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Add room settings modal
                            }}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
