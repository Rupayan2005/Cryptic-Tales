"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FuturisticBackground from "@/components/futuristic-background";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"choice" | "existing" | "new">("choice");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is already authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/users/rooms");
        if (res.ok) {
          router.replace("/dashboard");
        }
      } catch {
        // User not authenticated, stay on auth page
      }
    }

    checkAuth();
  }, [router]);

  // Handle existing user login
  async function handleExistingUserLogin() {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle new user registration
  async function handleNewUserRegister() {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        if (data.error && data.error.includes("already exists")) {
          setError("Username already exists. Please try a different username.");
        } else {
          setError(data.error || "Registration failed");
        }
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <FuturisticBackground />

      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          {step === "choice" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-card/10 backdrop-blur-xl border border-border/20 rounded-3xl p-8 text-center space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Cryptic Tales
                  </span>
                </h1>
                <p className="text-muted-foreground">
                  Choose your path to enter the realm of mysteries
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setStep("existing")}
                  className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl hover:scale-105 transition-all duration-300 neon-glow"
                >
                  Existing User
                </button>

                <button
                  onClick={() => setStep("new")}
                  className="w-full bg-secondary text-secondary-foreground font-semibold py-4 rounded-xl hover:scale-105 transition-all duration-300"
                >
                  New User
                </button>
              </div>
            </motion.div>
          )}

          {step === "existing" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card/10 backdrop-blur-xl border border-border/20 rounded-3xl p-8 space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Welcome Back
                </h2>
                <p className="text-muted-foreground">
                  Enter your credentials to continue
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />

                <input
                  type="password"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isLoading && handleExistingUserLogin()
                  }
                  disabled={isLoading}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  onClick={handleExistingUserLogin}
                  disabled={!username || !password || isLoading}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>

                <button
                  onClick={() => {
                    setStep("choice");
                    setError("");
                    setUsername("");
                    setPassword("");
                  }}
                  className="w-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          )}

          {step === "new" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card/10 backdrop-blur-xl border border-border/20 rounded-3xl p-8 space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Create Account
                </h2>
                <p className="text-muted-foreground">
                  Choose a username and password to begin your journey
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Username (min 3 characters)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />

                <input
                  type="password"
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isLoading && handleNewUserRegister()
                  }
                  disabled={isLoading}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  onClick={handleNewUserRegister}
                  disabled={!username || !password || isLoading}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>

                <button
                  onClick={() => {
                    setStep("choice");
                    setError("");
                    setUsername("");
                    setPassword("");
                  }}
                  className="w-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}
