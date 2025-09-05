"use client";
import type { Player } from "../../types";
import { Crown, Medal } from "lucide-react";

function RankIcon({ index }: { index: number }) {
  if (index === 0)
    return <Crown className="size-5 text-fuchsia-500" aria-label="1st place" />;
  if (index === 1)
    return <Medal className="size-5 text-cyan-400" aria-label="2nd place" />;
  if (index === 2)
    return <Medal className="size-5 text-cyan-300" aria-label="3rd place" />;
  return <span className="w-5 text-cyan-400">{index + 1}</span>;
}

export default function Scoreboard({ players }: { players: Player[] }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-700/40 p-4">
      <h3 className="text-cyan-200 font-semibold mb-3">Leaderboard</h3>
      <ul className="space-y-2">
        {sorted.map((p, i) => (
          <li key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RankIcon index={i} />
              <span className="text-cyan-100">{p.name}</span>
            </div>
            <span className="text-cyan-300">{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
