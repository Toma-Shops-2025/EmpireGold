import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Award, Crown, Lock, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  EMPIRE_PERKS,
  EMPIRE_RANKS,
  balanceToPoints,
  formatPoints,
  getEmpireRank,
  getNextEmpireRank,
  getRankProgress,
  isPerkUnlocked,
} from "@/lib/points";

export const Route = createFileRoute("/cashout")({
  component: EmpireRewardsScreen,
});

function EmpireRewardsScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const balance = parseFloat(profile?.cash_balance?.toString() || "0");
  const points = balanceToPoints(balance);
  const rank = getEmpireRank(points);
  const nextRank = getNextEmpireRank(points);
  const progress = getRankProgress(points);

  return (
    <div className="min-h-screen bg-black text-white font-sans select-none flex flex-col">
      <div
        className="fixed inset-0 z-0 opacity-20"
        style={{ backgroundImage: "url(/bg-gold.png)", backgroundSize: "cover" }}
      />

      <header className="px-6 pt-12 pb-6 flex items-center gap-4 relative z-10">
        <button
          onClick={() => navigate({ to: "/" })}
          className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-yellow-400" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">
          EMPIRE <span className="text-yellow-400">REWARDS</span>
        </h1>
      </header>

      <main className="flex-1 px-4 space-y-6 overflow-y-auto pb-32 relative z-10">
        <div className="bg-gradient-to-br from-yellow-900/20 to-black border border-yellow-400/10 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Crown className="w-24 h-24 rotate-12 text-yellow-400" />
          </div>
          <p className="text-[10px] font-black text-yellow-400/40 uppercase tracking-[0.2em] mb-1 italic">
            Your Gold Points
          </p>
          <p className="text-6xl font-black tracking-tighter text-white tabular-nums italic">
            {formatPoints(balance)}
          </p>
          <p className="text-sm font-black uppercase italic text-yellow-400 mt-3">{rank.name}</p>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">
            {rank.tagline}
          </p>
        </div>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2 italic">
            Rank Progress
          </h3>
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase italic">{rank.name}</span>
              <span className="text-[10px] text-white/40 font-bold uppercase">
                {nextRank ? `Next: ${nextRank.name}` : "Max Rank"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
              {nextRank
                ? `${(nextRank.minPoints - points).toLocaleString()} GP to ${nextRank.name}`
                : "You reached the top of the empire"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {EMPIRE_RANKS.map((entry) => {
              const unlocked = points >= entry.minPoints;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "rounded-2xl border p-4 flex items-center justify-between",
                    unlocked
                      ? "border-yellow-400/30 bg-yellow-400/5"
                      : "border-white/5 bg-white/[0.02] opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Award className={cn("w-5 h-5", unlocked ? "text-yellow-400" : "text-white/20")} />
                    <div>
                      <p className="font-black text-sm uppercase italic">{entry.name}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase">
                        {entry.minPoints.toLocaleString()} GP
                      </p>
                    </div>
                  </div>
                  {unlocked ? (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-white/20" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2 italic">
            Empire Perks
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider px-2 leading-relaxed">
            Perks unlock automatically as you earn Gold Points by playing arcade zones and optional
            reward videos. All rewards stay inside the app.
          </p>
          {EMPIRE_PERKS.map((perk) => {
            const unlocked = isPerkUnlocked(points, perk);
            return (
              <div
                key={perk.id}
                className={cn(
                  "rounded-[2rem] border p-5 flex items-center justify-between gap-4",
                  unlocked ? "border-yellow-400/30 bg-yellow-400/5" : "border-white/5 bg-white/5 opacity-60"
                )}
              >
                <div className="flex items-center gap-4 text-left">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center",
                      unlocked ? "bg-yellow-400 text-black" : "bg-white/10 text-white/30"
                    )}
                  >
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase italic">{perk.name}</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase mt-1">
                      {unlocked ? "Unlocked" : `Unlock at ${perk.cost.toLocaleString()} GP`}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1 normal-case tracking-normal font-medium">
                      {perk.description}
                    </p>
                  </div>
                </div>
                {unlocked ? (
                  <span className="text-[10px] font-black text-yellow-400 uppercase italic shrink-0">
                    Active
                  </span>
                ) : (
                  <Lock className="w-4 h-4 text-white/20 shrink-0" />
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
