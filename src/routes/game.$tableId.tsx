import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Coins, Gift, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { showInterstitial, showRewardedAd } from "@/lib/ads";
import { toast } from "sonner";

export const Route = createFileRoute("/game/$tableId")({
  component: GameContainer,
});

function GameContainer() {
  const { tableId } = useParams({ from: "/game/$tableId" });
  const navigate = useNavigate();
  const { addCash, supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setScore] = useState(0);
  const [reward, setReward] = useState(0);
  const [doubled, setDoubled] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === "GAME_OVER" || event.data.score !== undefined)) {
        const scoreValue = event.data.score || event.data.value || 0;
        if (scoreValue > 0) processGameOver(scoreValue);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const processGameOver = async (score: number) => {
    setScore(score);
    setGameOver(true);

    const goldReward = Math.min(0.50, Math.max(0.01, score / 100000));

    try {
      await addCash(goldReward);
      setReward(goldReward);
      showInterstitial();
    } catch (e) {
      setReward(0);
    }
  };

  const handleDouble = async () => {
    const res = await showRewardedAd();
    if (res.success) {
      await addCash(reward);
      setDoubled(true);
      toast.success("REWARD DOUBLED!");
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
      {!gameOver && (
        <>
          <iframe
            src={`/games/${tableId}/index.html`}
            className="w-full h-full border-none"
            style={{ height: '100vh', width: '100vw' }}
            onLoad={() => setLoading(false)}
          />
          <button
            onClick={() => navigate({ to: "/" })}
            className="absolute top-10 left-6 h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center z-50 active:scale-90 transition-transform"
          >
            <ArrowLeft className="text-white/70 w-6 h-6" />
          </button>
        </>
      )}

      {loading && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-40">
            <Loader2 className="h-16 w-12 animate-spin text-yellow-400" />
            <p className="mt-6 font-black italic uppercase tracking-[0.3em] text-sm animate-pulse">Loading Table...</p>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 text-white text-center">
            <div className="space-y-8 w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="space-y-2 text-center">
                    <h2 className="text-6xl font-black uppercase italic tracking-tighter text-yellow-400">FINISH!</h2>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Grand Total Score</p>
                    <p className="text-7xl font-black tabular-nums tracking-tighter text-white italic">{finalScore.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-5 flex flex-col items-center gap-1">
                        <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">Earnings</p>
                        <div className="flex items-center gap-2 font-black text-2xl italic">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span>+${reward.toFixed(2)}</span>
                        </div>
                    </div>
                    <button className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-1 active:bg-white/10 transition-colors">
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Share</p>
                        <Share2 className="w-5 h-5 text-white" />
                    </button>
                </div>
                {!doubled && reward > 0 && (
                    <button onClick={handleDouble} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-glow-yellow active:scale-95 transition-all">
                        <Gift className="w-6 h-6 fill-current" /> DOUBLE YOUR GOLD (AD)
                    </button>
                )}
                <div className="flex flex-col gap-4 pt-4">
                    <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm">New Ball</button>
                    <button onClick={() => navigate({ to: "/" })} className="text-white/40 font-bold uppercase text-[10px] tracking-[.3em]">Return to Lobby</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
