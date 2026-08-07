import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Crown, Medal, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardScreen,
});

function LeaderboardScreen() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      const { data } = await supabase
        .from('profiles')
        .select('username, cash_balance')
        .order('cash_balance', { ascending: false })
        .limit(20);

      if (data) setLeaders(data);
      setLoading(false);
    }
    fetchLeaders();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans select-none flex flex-col">
      <div className="fixed inset-0 z-0 opacity-20" style={{ backgroundImage: 'url(/bg-gold.png)', backgroundSize: 'cover' }} />

      <header className="px-6 pt-12 pb-6 flex items-center gap-4 relative z-10">
        <button onClick={() => navigate({ to: "/" })} className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-yellow-400" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter text-white">EMPIRE <span className="text-yellow-400">HALL OF FAME</span></h1>
      </header>

      <main className="flex-1 px-4 overflow-y-auto pb-32 relative z-10">
        <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-xl">
            {leaders.map((u, i) => {
                const isTop3 = i < 3;
                const RankIcon = i === 0 ? Crown : i === 1 ? Medal : Trophy;
                const rankColor = i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-white/20";

                return (
                    <div key={i} className={cn(
                        "flex items-center justify-between p-6 border-b border-white/5 last:border-0",
                        i === 0 && "bg-yellow-400/5"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className={cn("h-12 w-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center", isTop3 && "border-yellow-400/30")}>
                                    <User className="w-6 h-6 text-white/20" />
                                </div>
                                <div className={cn("absolute -top-2 -left-2 h-6 w-6 rounded-full bg-black border border-white/10 flex items-center justify-center text-[10px] font-black", rankColor)}>
                                    {i + 1}
                                </div>
                            </div>
                            <div>
                                <p className="font-black uppercase italic text-sm">{u.username || 'Anonymous'}</p>
                                <p className="text-[10px] text-white/40 font-bold uppercase">Member Since 2026</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-yellow-400 italic tabular-nums">${(u.cash_balance || 0).toFixed(2)}</p>
                            <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Total Gold</p>
                        </div>
                    </div>
                );
            })}
        </div>
      </main>
    </div>
  );
}
