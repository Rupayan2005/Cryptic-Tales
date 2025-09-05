"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";

interface UsernameInputProps {
  onValidUsername: (username: string) => void;
}

export default function UsernameInput({ onValidUsername }: UsernameInputProps) {
  const [username, setUsername] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationState, setValidationState] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (username.trim().length < 2) {
      setValidationState("idle");
      setErrorMessage("");
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await fetch("/api/users/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim() }),
        });

        const data = await res.json();

        if (res.ok && data.available) {
          setValidationState("valid");
          setErrorMessage("");
        } else {
          setValidationState("invalid");
          setErrorMessage(data.error || "Username not available");
        }
      } catch {
        setValidationState("invalid");
        setErrorMessage("Failed to validate username");
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async () => {
    if (validationState !== "valid") return;

    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        onValidUsername(data.username);
      } else {
        setValidationState("invalid");
        setErrorMessage(data.error || "Failed to create user");
      }
    } catch {
      setValidationState("invalid");
      setErrorMessage("Failed to create user");
    }
  };

  const getValidationIcon = () => {
    if (isValidating)
      return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
    if (validationState === "valid")
      return <Check className="w-5 h-5 text-accent" />;
    if (validationState === "invalid")
      return <X className="w-5 h-5 text-destructive" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your unique username..."
          className="w-full bg-input border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
          maxLength={20}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-destructive text-sm text-center"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleSubmit}
        disabled={validationState !== "valid"}
        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 neon-glow"
        whileTap={{ scale: 0.98 }}
      >
        Continue
      </motion.button>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Username must be 2-20 characters</p>
        <p>Only letters, numbers, hyphens, and underscores allowed</p>
      </div>
    </div>
  );
}
