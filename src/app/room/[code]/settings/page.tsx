"use client";

import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import FuturisticBackground from "@/components/futuristic-background";
import type { Room } from "../../../../../types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data, mutate } = useSWR<Room>(`/api/rooms/${code}/state`, fetcher);
  const { data: adminData } = useSWR(
    `/api/rooms/${code}/admin-status`,
    fetcher
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const isAdmin = adminData?.isAdmin || false;

  async function save(values: Partial<Room["settings"]>) {
    if (!isAdmin) {
      alert("Only admins can modify settings");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/rooms/${code}/settings`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        await mutate();
        setSaveMessage("Settings saved!");
        setTimeout(() => setSaveMessage(""), 2000);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save settings");
      }
    } catch {
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (!data) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <FuturisticBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  if (adminData && !isAdmin) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <FuturisticBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-6">
              Only room admins can access settings.
            </p>
            <button
              onClick={() => router.push(`/room/${code}`)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
            >
              Back to Room
            </button>
          </div>
        </div>
      </main>
    );
  }

  const s = data.settings;

  return (
    <main className="min-h-screen relative overflow-hidden">
      <FuturisticBackground />

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/room/${code}`)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Room
              </button>

              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Room Settings
                </h1>
                <p className="text-muted-foreground">
                  Configure your game experience
                </p>
              </div>
            </div>

            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-accent"
              >
                <Save className="w-4 h-4" />
                {saveMessage}
              </motion.div>
            )}
          </motion.div>

          {/* Settings Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 space-y-8"
          >
            <div>
              <label className="block text-foreground font-semibold mb-3">
                Timer Duration
              </label>
              <input
                type="number"
                min="10"
                max="300"
                defaultValue={s.timerSeconds}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
                onBlur={(e) =>
                  save({ timerSeconds: Number(e.target.value || 60) })
                }
                disabled={isSaving}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Time limit for each round in seconds
              </p>
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-3">
                Point Decay Rate
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                defaultValue={s.decayRate}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
                onBlur={(e) => save({ decayRate: Number(e.target.value || 1) })}
                disabled={isSaving}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Seconds per point reduction (lower = faster decay)
              </p>
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-3">
                Difficulty Level
              </label>
              <select
                defaultValue={s.difficulty}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
                onChange={(e) =>
                  save({
                    difficulty: e.target
                      .value as Room["settings"]["difficulty"],
                  })
                } ///any
                disabled={isSaving}
              >
                <option value="easy">
                  Easy - Simple stories with obvious clues
                </option>
                <option value="medium">Medium - Balanced complexity</option>
                <option value="hard">
                  Hard - Complex narratives with subtle hints
                </option>
              </select>
            </div>

            <div className="flex items-start gap-4">
              <input
                id="noTimeLimit"
                type="checkbox"
                defaultChecked={s.noTimeLimit}
                onChange={(e) => save({ noTimeLimit: e.target.checked })}
                disabled={isSaving}
                className="mt-1"
              />
              <div>
                <label
                  htmlFor="noTimeLimit"
                  className="text-foreground font-semibold cursor-pointer"
                >
                  No Time Limit
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Next story appears only when the current one is solved, not
                  after timer expires
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <input
                id="allowSuggestions"
                type="checkbox"
                defaultChecked={s.allowSuggestions}
                onChange={(e) => save({ allowSuggestions: e.target.checked })}
                disabled={isSaving}
                className="mt-1"
              />
              <div>
                <label
                  htmlFor="allowSuggestions"
                  className="text-foreground font-semibold cursor-pointer"
                >
                  Allow Player Suggestions
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Let players suggest secrets for the AI to transform into
                  stories
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
