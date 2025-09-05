"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Eye,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";

interface AdminCluePanelProps {
  roomCode: string;
  onStoryGenerated: (story: string) => void;
  difficulty: string;
}

export default function AdminCluePanel({
  roomCode,
  onStoryGenerated,
  difficulty,
}: AdminCluePanelProps) {
  const [secrets, setSecrets] = useState<string[]>([""]);
  const [preview, setPreview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      difficulty?: string;
      basePoints?: number;
      totalCluesGenerated?: number;
      [key: string]: unknown;
    };
  } | null>(null);

  const addSecret = () => {
    if (secrets.length < 5) {
      // Limit to 5 secrets
      setSecrets([...secrets, ""]);
    }
  };

  const removeSecret = (index: number) => {
    if (secrets.length > 1) {
      setSecrets(secrets.filter((_, i) => i !== index));
    }
  };

  const updateSecret = (index: number, value: string) => {
    const newSecrets = [...secrets];
    newSecrets[index] = value;
    setSecrets(newSecrets);
  };

  const getValidSecrets = () => {
    return secrets.filter((s) => s.trim().length > 0);
  };

  async function generatePreview() {
    const validSecrets = getValidSecrets();
    if (validSecrets.length === 0) return;

    setIsPreviewing(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/preview-clue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: validSecrets[0] }), // Preview first secret only
      });

      const data = await res.json();
      if (res.ok) {
        setPreview(data.preview);
        setShowPreview(true);
      } else {
        setLastResult({
          success: false,
          message: data.error || "Preview failed",
        });
      }
    } catch {
      setLastResult({ success: false, message: "Failed to generate preview" });
    } finally {
      setIsPreviewing(false);
    }
  }

  async function submitSecrets() {
    const validSecrets = getValidSecrets();
    if (validSecrets.length === 0) return;

    setIsGenerating(true);
    setLastResult(null);

    try {
      const res = await fetch(`/api/rooms/${roomCode}/clue`, {
        method: "POST",
        body: JSON.stringify({ secrets: validSecrets }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        onStoryGenerated(data.story);
        setSecrets([""]);
        setPreview("");
        setShowPreview(false);
        setLastResult({
          success: true,
          message: `${data.totalCluesGenerated} stories generated! Starting with story 1 of ${data.totalCluesGenerated}`,
          details: data,
        });
      } else {
        setLastResult({
          success: false,
          message: data.error || "Failed to generate stories",
          details: data.details,
        });
      }
    } catch {
      setLastResult({
        success: false,
        message: "Network error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur-sm border border-secondary/50 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Crown className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-semibold text-foreground">
          Admin Story Weaver
        </h2>
        <div className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
          {difficulty}
        </div>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        Transform your secret messages into immersive fantasy stories. The AI
        will hide only the important words (excluding articles, prepositions,
        etc.) within mystical narratives for players to decode. Players solve
        stories sequentially - only when one is complete will the next appear.
      </p>

      <div className="space-y-4">
        {/* Multiple Secret Inputs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Secret Messages
            </label>
            <button
              onClick={addSecret}
              disabled={secrets.length >= 5 || isGenerating}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Secret ({secrets.length}/5)
            </button>
          </div>

          {secrets.map((secret, index) => (
            <div key={index} className="relative mb-3">
              <textarea
                className="w-full bg-input border border-border rounded-xl px-4 py-3 pr-10 text-foreground placeholder-muted-foreground outline-none focus:border-secondary/50 focus:ring-2 focus:ring-ring transition-all resize-none"
                placeholder={`Secret message ${
                  index + 1
                }... (e.g., 'Meet at the old oak tree at midnight')`}
                value={secret}
                onChange={(e) => updateSecret(index, e.target.value)}
                disabled={isGenerating}
                rows={2}
                maxLength={200}
              />
              {secrets.length > 1 && (
                <button
                  onClick={() => removeSecret(index)}
                  disabled={isGenerating}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {secret.length}/200 characters
                </span>
                {index === 0 && (
                  <button
                    onClick={generatePreview}
                    disabled={!secret.trim() || isPreviewing || isGenerating}
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPreviewing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                    Preview Style
                  </button>
                )}
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Add multiple secrets to create a sequence of stories. Players will
            solve them one by one. Only important words (not articles,
            prepositions) will be used for guessing.
          </p>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {showPreview && preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-background/50 border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">
                  Story Preview
                </span>
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {preview}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Message */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                lastResult.success
                  ? "bg-accent/10 border border-accent/20"
                  : "bg-destructive/10 border border-destructive/20"
              }`}
            >
              {lastResult.success ? (
                <CheckCircle className="w-4 h-4 text-accent mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    lastResult.success ? "text-accent" : "text-destructive"
                  }`}
                >
                  {lastResult.message}
                </p>
                {lastResult.details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Difficulty: {lastResult.details.difficulty} • Base Points:{" "}
                    {lastResult.details.basePoints}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          onClick={submitSecrets}
          disabled={getValidSecrets().length === 0 || isGenerating}
          className="w-full bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Weaving Stories...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Weave{" "}
              {getValidSecrets().length > 1
                ? `${getValidSecrets().length} Stories`
                : "Into Story"}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
