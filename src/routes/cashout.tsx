import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Wallet, Lock, CreditCard, Trophy, Info, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { CONFIG } from "@/config";

export const Route = createFileRoute("/cashout")({
  component: CashoutScreen,
});

const REWARDS = [
  { id: "v5", name: "$5 Visa Card", cost: 5.0, type: "Visa" as const },
  { id: "a5", name: "$5 Amazon Gift", cost: 5.0, type: "Amazon" as const },
  { id: "p5", name: "$5 PayPal Cash", cost: 5.0, type: "PayPal" as const },
  { id: "v10", name: "$10 Visa Card", cost: 10.0, type: "Visa" as const },
  { id: "a10", name: "$10 Amazon Gift", cost: 10.0, type: "Amazon" as const },
  { id: "p10", name: "$10 PayPal Cash", cost: 10.0, type: "PayPal" as const },
  { id: "v25", name: "$25 Visa Card", cost: 25.0, type: "Visa" as const },
  { id: "a25", name: "$25 Amazon Gift", cost: 25.0, type: "Amazon" as const },
  { id: "p25", name: "$25 PayPal Cash", cost: 25.0, type: "PayPal" as const },
];

function CashoutScreen() {
  const navigate = useNavigate();
  const { user, profile, deductCash, supabase, signOut, fetchProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const cashBalance = parseFloat(profile?.cash_balance?.toString() || "0");

  const handlePayoutRequest = async (reward: (typeof REWARDS)[number]) => {
    if (isProcessing) return;
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    if (cashBalance < reward.cost) {
      toast.error("Insufficient Balance", {
        description: `You need $${reward.cost.toFixed(2)} to redeem this.`,
      });
      return;
    }
    if (!confirm(`Redeem ${reward.name} for $${reward.cost.toFixed(2)}?`)) return;

    setIsProcessing(true);
    try {
      // Prefer server RPC when available (atomic deduct + insert).
      const { data: rpcData, error: rpcError } = await supabase.rpc("request_payout", {
        p_reward_name: reward.name,
      });

      if (!rpcError && rpcData) {
        await fetchProfile(user.id);
        toast.success("Redemption Submitted!", {
          description: "Payouts are processed within 24-48 hours.",
        });
        return;
      }

      // Fallback: insert payout row then deduct (Loot Lagoon style).
      const { error } = await supabase.from("payout_requests").insert({
        user_id: user.id,
        reward_name: reward.name,
        points_cost: Math.round(reward.cost * 1000),
        status: "pending",
      });
      if (error) throw error;

      const deducted = await deductCash(reward.cost);
      if (!deducted) throw new Error("Unable to deduct balance.");

      toast.success("Redemption Submitted!", {
        description: "Payouts are processed within 24-48 hours.",
      });
    } catch (e: any) {
      toast.error(e?.message || "Unable to submit redemption.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans select-none flex flex-col">
      <div
        className="fixed inset-0 z-0 opacity-20"
        style={{ backgroundImage: "url(/bg-gold.png)", backgroundSize: "cover" }}
      />

      <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 flex items-center gap-4 relative z-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-yellow-400" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">
          THE <span className="text-yellow-400">GOLD VAULT</span>
        </h1>
      </header>

      <main className="flex-1 px-4 space-y-6 overflow-y-auto pb-32 relative z-10">
        <div className="bg-gradient-to-br from-yellow-900/20 to-black border border-yellow-400/10 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-24 h-24 rotate-12 text-yellow-400" />
          </div>
          <p className="text-[10px] font-black text-yellow-400/40 uppercase tracking-[0.2em] mb-1 italic">
            Total Gold Balance
          </p>
          <p className="text-6xl font-black tracking-tighter text-white tabular-nums italic">
            ${cashBalance.toFixed(2)}
          </p>
          <p className="text-[10px] text-yellow-400 font-bold mt-2 uppercase tracking-widest">
            Withdrawal Ready
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2 italic">
            Select Reward
          </h3>
          {REWARDS.map((r) => {
            const isUnlocked = cashBalance >= r.cost;
            const Icon = r.type === "PayPal" ? Wallet : CreditCard;
            const color =
              r.type === "Amazon" ? "bg-orange-500" : r.type === "PayPal" ? "bg-green-600" : "bg-blue-600";

            return (
              <div
                key={r.id}
                className={cn(
                  "bg-white/5 border border-white/5 rounded-[2rem] p-5 flex items-center justify-between transition-all",
                  isUnlocked ? "border-yellow-400/30 bg-yellow-400/5" : "opacity-40 grayscale",
                )}
              >
                <div className="flex items-center gap-4 text-left min-w-0">
                  <div
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-lg text-white",
                      color,
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm uppercase italic truncate">{r.name}</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase">
                      {isUnlocked ? "Ready to Claim" : `Unlock at $${r.cost.toFixed(2)}`}
                    </p>
                  </div>
                </div>

                {isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => void handlePayoutRequest(r)}
                    disabled={isProcessing}
                    className="shrink-0 bg-yellow-400 text-black text-[10px] font-black px-5 py-2.5 rounded-xl active:scale-95 transition-all italic disabled:opacity-50"
                  >
                    {isProcessing ? "..." : "REDEEM"}
                  </button>
                ) : (
                  <Lock className="w-4 h-4 text-white/20 shrink-0 mr-2" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-4 pt-8 pb-10">
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-white/20 text-[10px] font-black uppercase tracking-widest underline italic"
          >
            Logout
          </button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-4 pb-12 z-[5000]">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex flex-col items-center gap-1.5 text-white/40"
        >
          <Gift className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-tighter italic">Lobby</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/leaderboard" })}
          className="flex flex-col items-center gap-1.5 text-white/40"
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-tighter italic">Ranks</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1.5 text-yellow-400 scale-110">
          <Wallet className="w-6 h-6 fill-current" />
          <span className="text-[8px] font-black uppercase tracking-tighter italic">Wins</span>
        </button>
        <button
          type="button"
          onClick={() => toast.info(`${CONFIG.APP_NAME} v${CONFIG.VERSION}`)}
          className="flex flex-col items-center gap-1.5 text-white/40"
        >
          <Info className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-tighter italic">Info</span>
        </button>
      </nav>
    </div>
  );
}
