"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Zap, Brain, Trophy, Shield, Sparkles } from "lucide-react";
import FuturisticBackground from "@/components/futuristic-background";
import FeatureCard from "@/components/feature-card";

const features = [
  {
    icon: Users,
    title: "Multiplayer Realtime",
    description:
      "Connect with friends instantly. Real-time gameplay with live updates and synchronized experiences across all devices.",
  },
  {
    icon: Brain,
    title: "AI-Powered Stories",
    description:
      "Advanced AI creates unique, immersive stories from simple prompts. Every game session offers fresh, unpredictable narratives.",
  },
  {
    icon: Zap,
    title: "Lightning Fast Guessing",
    description:
      "Race against time with dynamic scoring. Quick thinking rewards higher points with intelligent decay mechanics.",
  },
  {
    icon: Trophy,
    title: "Competitive Leaderboards",
    description:
      "Track your progress and compete with others. Climb the ranks and showcase your storytelling detective skills.",
  },
  {
    icon: Shield,
    title: "Secure Encrypted Gameplay",
    description:
      "Military-grade encryption protects game secrets. Fair play guaranteed with tamper-proof answer validation.",
  },
  {
    icon: Sparkles,
    title: "Customizable Experience",
    description:
      "Tailor difficulty, timing, and game mechanics. Admins control every aspect for the perfect group experience.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <FuturisticBackground />

      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Cryptic Tales
              </span>
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl md:text-2xl text-muted-foreground mb-2"
            >
              Where Stories Become Mysteries
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Assemble your team, transform secrets into immersive AI-generated
              stories, and race to decode the hidden messages in this
              next-generation multiplayer experience.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/auth"
              className="group relative px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl text-lg transition-all duration-300 hover:scale-105 neon-glow"
            >
              <span className="relative z-10">Start Your Journey</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            <button className="px-8 py-4 border border-border text-foreground font-semibold rounded-xl text-lg hover:border-primary/50 hover:text-primary transition-all duration-300">
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Game Features
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience the future of collaborative storytelling with
              cutting-edge technology and innovative gameplay mechanics designed
              for maximum engagement.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create or Join",
                description:
                  "Set up a room as admin or join an existing game with a simple room code.",
              },
              {
                step: "02",
                title: "AI Storytelling",
                description:
                  "Admin provides a secret prompt. Our AI transforms it into an immersive story.",
              },
              {
                step: "03",
                title: "Race to Decode",
                description:
                  "Players analyze the story to guess hidden words. Speed and accuracy determine your score.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Begin Your
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}
                Adventure?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Join thousands of players already exploring the mysteries of
              Cryptic Tales. Your next great story awaits.
            </p>

            <Link
              href="/auth"
              className="inline-block px-12 py-5 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-xl text-xl transition-all duration-300 hover:scale-105 neon-glow"
            >
              Enter the Realm
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
