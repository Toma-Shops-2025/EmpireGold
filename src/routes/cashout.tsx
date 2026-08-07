import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Wallet, Landmark, Smartphone, Gift, ChevronRight, Lock, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/cashout")({
  component: CashoutScreen,
});

const REWARDS = [
    { id: 'v5', name: '$5 Visa Card', cost: 5.00, type: 'Visa' },
    { id: 'a5', name: '$5 Amazon Gift', cost: 5.00, type: 'Amazon' },
    { id: 'p5', name: '$5 PayPal Cash', cost: 5.00, type: 'PayPal' },
    { id: 'v10', name: '$10 Visa Card', cost: 10.00, type: 'Visa' },
    { id: 'a10', name: '$10 Amazon Gift', cost: 10.00, type: 'Amazon' },
    { id: 'p10', name: '$10 PayPal Cash', cost: 10.00, type: 'PayPal' },
];

function CashoutScreen() {
  const navigate = useNavigate();
  const { user, profile, addCash, supabase, signOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const cashBalance = parseFloat(profile?.cash_balance || "0");

  const handlePayoutRequest = async (reward: any) => {
    if (isProcessing) return;
    if (cashBalance < reward.cost) {
        toast.error("Insufficient Balance");
        return;
    }

    setIsProcessing(true);
    try {
        const { error } = await supabase.from('payout_requests').insert({
            user_id: user?.id,
            reward_name: reward.name,
            points_cost: reward.cost * 1000,
            status: 'pending'
        });
        if (error) throw error;
        await addCash(-reward.cost);
        toast.success("Redemption Submitted!");
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans select-none flex flex-col">
      <div className="fixed inset-0 z-0 opacity-20" style={{ backgroundImage: 'url(/bg-gold.png)', backgroundSize: 'cover' }} />

      <header className="px-6 pt-12 pb-6 flex items-center gap-4 relative z-10">
        <button onClick={() => navigate({ to: "/" })} className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-yellow-400" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">THE <span className="text-yellow-400">GOLD VAULT</span></h1>
      </header>

      <main className="flex-1 px-4 space-y-6 overflow-y-auto pb-32 relative z-10">
        <div className="bg-gradient-to-br from-yellow-900/20 to-black border border-yellow-400/10 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-24 h-24 rotate-12 text-yellow-400" /></div>
            <p className="text-[10px] font-black text-yellow-400/40 uppercase tracking-[0.2em] mb-1 italic">Current Balance</p>
            <p className="text-6xl font-black tracking-tighter text-white tabular-nums italic">${cashBalance.toFixed(2)}</p>
        </div>

        <div className="space-y-3">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2 italic">Select Reward</h3>
            {REWARDS.map((r) => {
                const isUnlocked = cashBalance >= r.cost;
                const Icon = r.type === 'PayPal' ? Wallet : CreditCard;
                const color = r.type === 'Amazon' ? "bg-orange-500" : r.type === 'PayPal' ? "bg-green-600" : "bg-blue-600";
                return (
                    <div key={r.id} className={cn("group bg-white/5 border border-white/5 rounded-[2rem] p-5 flex items-center justify-between transition-all", isUnlocked ? "border-yellow-400/30 bg-yellow-400/5" : "opacity-40 grayscale")}>
                        <div className="flex items-center gap-4 text-left">
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg text-white", color)}><Icon className="w-6 h-6" /></div>
                            <div>
                                <h4 className="font-black text-sm uppercase italic">{r.name}</h4>
                                <p className="text-[10px] text-white/40 font-bold uppercase">{isUnlocked ? "Ready to Claim" : `Unlock at $${r.cost.toFixed(2)}`}</p>
                            </div>
                        </div>
                        {isUnlocked ? (
                            <button onClick={() => handlePayoutRequest(r)} className="bg-yellow-400 text-black text-[10px] font-black px-5 py-2.5 rounded-xl shadow-glow-yellow active:scale-95 transition-all italic">REDEEM</button>
                        ) : <Lock className="w-4 h-4 text-white/20 mr-2" />}
                    </div>
                );
            })}
        </div>
      </main>
    </div>
  );
}
