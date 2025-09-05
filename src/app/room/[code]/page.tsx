"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Settings, Users, ArrowLeft, UserX } from "lucide-react";
import PlayerList from "@/components/player-list";
import Scoreboard from "@/components/scoreboard";
import AdminCluePanel from "@/components/admin-clue-panel";
import ClueTimer from "@/components/clue-timer";
import FuturisticBackground from "@/components/futuristic-background";
import { getSocket } from "@/lib/socket-client";
import type { Room, Player } from "../../../../types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data, mutate } = useSWR<Room>(`/api/rooms/${code}/state`, fetcher);
  const { data: adminData } = useSWR(
    `/api/rooms/${code}/admin-status`,
    fetcher
  );
  const { data: sentenceData, mutate: mutateSentence } = useSWR(
    data?.currentClue ? `/api/rooms/${code}/sentence` : null,
    fetcher
  );
  const [story, setStory] = useState("");
  const [guess, setGuess] = useState("");
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [guessMessage, setGuessMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [totalClues, setTotalClues] = useState(1);
  const [timerStartedAt, setTimerStartedAt] = useState<string | undefined>();

  const isAdmin = adminData?.isAdmin || false;
  const currentPlayerId = adminData?.playerId;

  // Initialize timer state from room data
  useEffect(() => {
    if (data?.currentClue) {
      setCurrentClueIndex(data.currentClueIndex || 0);
      setTotalClues(
        (data.currentClueIndex || 0) + (data.clueQueue?.length || 0) + 1
      );
      if (data.currentClue.timerStartedAt && !timerStartedAt) {
        setTimerStartedAt(data.currentClue.timerStartedAt);
      }
    }
  }, [data, timerStartedAt]);

  useEffect(() => {
    const s = getSocket();
    s.emit("room:join", code);

    const refetch = () => mutate();

    s.on(
      "clue:new",
      (payload: {
        story: string;
        clueIndex?: number;
        totalClues?: number;
        timerStartedAt?: string;
      }) => {
        setStory(payload.story);
        if (payload.clueIndex !== undefined)
          setCurrentClueIndex(payload.clueIndex);
        if (payload.totalClues !== undefined) setTotalClues(payload.totalClues);
        if (payload.timerStartedAt) setTimerStartedAt(payload.timerStartedAt);
        refetch();
        mutateSentence(); // Refresh sentence data when new clue arrives
      }
    );
    s.on("score:update", refetch);
    s.on("settings:update", refetch);
    s.on("player:activity", refetch);

    // Listen for guess results
    s.on(
      "guess:result",
      (payload: {
        playerId: string;
        correct: boolean;
        matchedWord?: string;
        points?: number;
      }) => {
        if (payload.playerId === currentPlayerId) {
          if (payload.correct) {
            setGuessMessage(
              `Correct! You found "${payload.matchedWord}" (+${payload.points} points)`
            );
            setMessageType("success");
            mutateSentence(); // Refresh sentence to show new filled word
          }
        }
        refetch(); // Update scores
      }
    );

    s.on("player:kicked", (payload: { playerId: string }) => {
      if (payload.playerId === currentPlayerId) {
        alert("You have been removed from the room");
        router.push("/dashboard");
      }
      refetch();
    });

    s.on("game:completed", (payload: { message: string }) => {
      setGuessMessage(payload.message);
      setMessageType("success");
      setStory(""); // Clear current story
    });

    return () => {
      s.emit("room:leave", code);
      s.off("clue:new");
      s.off("score:update");
      s.off("settings:update");
      s.off("player:activity");
      s.off("player:kicked");
      s.off("guess:result");
      s.off("game:completed");
    };
  }, [code, mutate, mutateSentence, currentPlayerId, router]);

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (guessMessage) {
      const timer = setTimeout(() => {
        setGuessMessage("");
        setMessageType("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [guessMessage]);

  async function submitGuess() {
    if (!guess.trim()) return;

    setIsSubmittingGuess(true);
    setGuessMessage("");
    setMessageType("");

    try {
      const res = await fetch(`/api/rooms/${code}/guess`, {
        method: "POST",
        body: JSON.stringify({ guess: guess.trim() }),
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (json.correct) {
        setGuess("");
        setGuessMessage(json.message);
        setMessageType("success");
        mutateSentence(); // Refresh sentence data
      } else {
        setGuessMessage(json.message || "Wrong! Try a different word.");
        setMessageType("error");
      }
    } catch {
      console.error("Failed to submit guess");
      setGuessMessage("Failed to submit guess. Please try again.");
      setMessageType("error");
    } finally {
      setIsSubmittingGuess(false);
    }
  }

  async function kickPlayer(playerIdToKick: string) {
    if (!confirm("Are you sure you want to remove this player?")) return;

    try {
      const res = await fetch(`/api/rooms/${code}/kick-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIdToKick }),
      });

      if (res.ok) {
        mutate();
        setShowPlayerManagement(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to kick player");
      }
    } catch {
      alert("Failed to kick player");
    }
  }

  async function handleTimerExpired() {
    // Only admins can trigger the next clue manually via timer expiration
    if (!isAdmin) return;

    try {
      await fetch(`/api/rooms/${code}/next-clue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      // The socket event will handle updating the UI
    } catch {
      console.error("Failed to advance to next clue");
    }
  }

  if (!data) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <FuturisticBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Entering the realm...</p>
          </div>
        </div>
      </main>
    );
  }

  const players: Player[] = data.players || [];

  return (
    <main className="min-h-screen relative overflow-hidden">
      <FuturisticBackground />

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>

              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  Room <span className="text-primary">{code}</span>
                  {isAdmin && (
                    <Crown className="w-6 h-6 text-accent">
                      <title>You are the admin</title>
                    </Crown>
                  )}
                </h1>
                <p className="text-muted-foreground">
                  {data.status === "lobby"
                    ? "Waiting for players"
                    : data.status === "playing"
                    ? "Game in progress"
                    : "Game ended"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => setShowPlayerManagement(!showPlayerManagement)}
                  className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl hover:scale-105 transition-all duration-300"
                >
                  <Users className="w-4 h-4" />
                  Manage Players
                </button>
              )}

              <button
                onClick={() => router.push(`/room/${code}/settings`)}
                className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-xl hover:border-primary/50 transition-all duration-300"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timer Component - Show for all users */}
              {data.status === "playing" && data.currentClue && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="order-first"
                >
                  <ClueTimer
                    timerStartedAt={
                      timerStartedAt ||
                      data.currentClue.timerStartedAt ||
                      data.currentClue.createdAt
                    }
                    timerSeconds={data.settings.timerSeconds || 60}
                    noTimeLimit={Boolean(data.settings.noTimeLimit)}
                    currentClueIndex={
                      currentClueIndex || data.currentClueIndex || 0
                    }
                    totalClues={
                      totalClues ||
                      (data.currentClueIndex || 0) +
                        (data.clueQueue?.length || 0) +
                        1
                    }
                    onTimerExpired={isAdmin ? handleTimerExpired : undefined}
                  />
                </motion.div>
              )}

              {/* Story Clue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6"
              >
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  Story Clue
                  {data.status === "playing" && (
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                </h2>
                <div className="bg-background/50 rounded-xl p-4 min-h-[120px]">
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {story ||
                      data.currentClue?.story ||
                      (data.status === "ended"
                        ? "No more messages for now. If there are new stories, we will update you!"
                        : "Awaiting the admin's secret to be woven into a mystical tale...")}
                  </p>
                </div>
              </motion.div>

              {/* Guess Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6"
              >
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Your Guess
                </h2>
                <div className="flex gap-3">
                  <input
                    className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
                    placeholder="Type a hidden word from the story..."
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !isSubmittingGuess && submitGuess()
                    }
                    disabled={isSubmittingGuess}
                  />
                  <button
                    className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
                    onClick={submitGuess}
                    disabled={!guess.trim() || isSubmittingGuess}
                  >
                    {isSubmittingGuess ? "Sending..." : "Guess"}
                  </button>
                </div>

                {/* Feedback Message */}
                {guessMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 p-3 rounded-lg text-sm font-medium ${
                      messageType === "success"
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-destructive/20 text-destructive border border-destructive/30"
                    }`}
                  >
                    {guessMessage}
                  </motion.div>
                )}
              </motion.div>

              {/* Sentence Progress */}
              {sentenceData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6"
                >
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center justify-between">
                    <span>Secret Message Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {sentenceData.correctGuesses?.length || 0} /{" "}
                      {sentenceData.totalWords} words found
                    </span>
                  </h2>
                  <div className="bg-background/50 rounded-xl p-4">
                    <p className="text-foreground/90 font-mono text-lg leading-relaxed tracking-wide">
                      {sentenceData.sentenceWithBlanks}
                    </p>
                  </div>

                  {sentenceData.correctGuesses &&
                    sentenceData.correctGuesses.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Words you&apos;ve found:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {sentenceData.correctGuesses.map(
                            (word: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-accent/20 text-accent rounded-md text-sm font-medium"
                              >
                                {word}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </motion.div>
              )}

              {/* Admin Panel */}
              {isAdmin && (
                <AdminCluePanel
                  roomCode={code}
                  onStoryGenerated={(newStory) => {
                    setStory(newStory);
                    mutate();
                  }}
                  difficulty={data.settings.difficulty}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Player Management Modal */}
              <AnimatePresence>
                {showPlayerManagement && isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-card border border-border rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Manage Players
                      </h3>
                      <button
                        onClick={() => setShowPlayerManagement(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-semibold">
                              {player.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-foreground font-medium">
                                {player.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {player.score} points
                              </div>
                            </div>
                            {player.id === data.adminId && (
                              <Crown className="w-4 h-4 text-accent" />
                            )}
                          </div>

                          {player.id !== currentPlayerId && (
                            <button
                              onClick={() => kickPlayer(player.id)}
                              className="text-destructive hover:text-destructive/80 p-1"
                              title="Remove player"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PlayerList initial={players} adminId={data.adminId} />
              </motion.div>

              {/* Scoreboard */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Scoreboard players={players} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
