"use client";

import { useState, useEffect } from "react";
import { Clock, Timer } from "lucide-react";

interface ClueTimerProps {
  timerStartedAt?: string;
  timerSeconds: number;
  noTimeLimit: boolean;
  currentClueIndex: number;
  totalClues: number;
  onTimerExpired?: () => void;
}

export default function ClueTimer({
  timerStartedAt,
  timerSeconds,
  noTimeLimit,
  currentClueIndex,
  totalClues,
  onTimerExpired,
}: ClueTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (noTimeLimit || !timerStartedAt) {
      setTimeRemaining(null);
      return;
    }

    const startTime = new Date(timerStartedAt).getTime();
    const duration = timerSeconds * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, duration - elapsed);

      setTimeRemaining(remaining);

      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onTimerExpired?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [
    timerStartedAt,
    timerSeconds,
    noTimeLimit,
    isExpired,
    onTimerExpired,
    currentClueIndex,
    totalClues,
  ]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (!timeRemaining) return "text-muted-foreground";
    const percentage = timeRemaining / (timerSeconds * 1000);
    if (percentage > 0.5) return "text-accent";
    if (percentage > 0.25) return "text-orange-400";
    return "text-destructive";
  };

  const getProgressPercentage = () => {
    if (!timeRemaining) return 0;
    return (timeRemaining / (timerSeconds * 1000)) * 100;
  };

  if (noTimeLimit) {
    return (
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              No Time Limit
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Story {currentClueIndex + 1} of {totalClues}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Next story appears when current one is solved
        </p>
      </div>
    );
  }

  if (!timerStartedAt || timeRemaining === null) {
    return (
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Waiting for timer to start...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer className={`w-4 h-4 ${getTimerColor()}`} />
          <span className={`text-sm font-medium ${getTimerColor()}`}>
            {isExpired ? "Time's Up!" : formatTime(timeRemaining)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Story {currentClueIndex + 1} of {totalClues}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-background/50 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isExpired
              ? "bg-destructive"
              : "bg-gradient-to-r from-accent to-primary"
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {isExpired
          ? "Timer expired - next story will appear shortly"
          : "Time remaining for this story"}
      </p>
    </div>
  );
}
