import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Browser } from '@capacitor/browser'
import { Wallet, Gamepad2, Coins, TrendingUp, Trophy, Gift, Loader2, Zap, User as UserIcon, LogOut, ChevronRight, LayoutGrid, Award, CreditCard, Lock, Mail, ExternalLink, History, PlayCircle, Sparkles, DollarSign, Eye, EyeOff, Info, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { initAds, showRewardedAd, showInterstitial, setBannerVisible } from '@/lib/ads'

export const Route = createFileRoute("/")({
  component: PlayNPaydayHub,
});

const PROVIDERS = [
    { id: 'poki', name: 'POKI ARCADE', desc: 'The biggest web arcade', url: 'https://poki.com', color: 'from-blue-600 to-blue-900', icon: Gamepad2, bonus: "POPULAR" },
    { id: 'crazy', name: 'CRAZY GAMES', desc: 'Top action & strategy', url: 'https://www.crazygames.com', color: 'from-purple-600 to-purple-900', icon: Zap, bonus: "HOT" },
    { id: 'gdist', name: 'GAME DISTRO', desc: 'Premium HTML5 library', url: 'https://gamedistribution.com', color: 'from-orange-600 to-orange-900', icon: LayoutGrid, bonus: "ELITE" },
    { id: 'y8', name: 'Y8 GAMES', desc: 'Classic arcade hits', url: 'https://www.y8.com', color: 'from-emerald-600 to-emerald-900', icon: Trophy, bonus: "LEGACY" },
];

const MINI_GAMES = [
  { id: "1", name: "Neon Strike", emoji: "🚀" },
  { id: "2", name: "Cyber Dash", emoji: "💎" },
  { id: "3", name: "Galactic Quest", emoji: "👾" },
  { id: "4", name: "Retro Pulse", emoji: "🕹️" },
  { id: "5", name: "Pixel Jump", emoji: "🏃" },
  { id: "6", name: "Sonic Wave", emoji: "🌊" },
  { id: "7", name: "Star Blazer", emoji: "✨" },
  { id: "8", name: "Void Runner", emoji: "🌑" },
];

function AppBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <div
            className="absolute inset-0 opacity-[0.3]"
            style={{
                backgroundImage: 'url(/bg-gold.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
    </div>
  )
}

function PlayNPaydayHub() {
    const auth = useAuth()
    const { user, profile, loading: authLoading, signIn, signUp, signOut, addCash, fetchProfile, supabase } = auth
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'home' | 'history'>('home')
    const [isProcessing, setIsProcessing] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false);

    const [history, setHistory] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('pnp_history_v4');
        try { return saved ? JSON.parse(saved) : {}; } catch(e) { return {}; }
    });

    const [formData, setFormData] = useState({ email: '', password: '', username: '' });
    const [isLogin, setIsLogin] = useState(true)
    const [agreed, setAgreed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    useEffect(() => {
        if (user) setBannerVisible(true);
        else setBannerVisible(false);
    }, [user]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        if (!isLogin && !agreed) {
            toast.error("Please agree to the Empire Code.");
            return;
        }
        setLoading(true);
        try {
            const res = isLogin
                ? await signIn(formData.email, formData.password)
                : await signUp(formData.email, formData.password, formData.username);

            if (res?.error) throw res.error;
            setHasInteracted(true);
        } catch (error: any) {
            toast.error("Auth Failed", { description: error.message });
        } finally {
            setLoading(false);
        }
    }

    const bgmRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (user && hasInteracted && !bgmRef.current) {
            const audio = new Audio('/audio/promo.MP3');
            audio.loop = true;
            audio.volume = 0.15;
            audio.play().catch(e => console.log("Audio play blocked"));
            bgmRef.current = audio;
        }
        return () => {
            if (bgmRef.current) {
                bgmRef.current.pause();
                bgmRef.current = null;
            }
        };
    }, [user, hasInteracted]);

    useEffect(() => {
        const handleFirstInteraction = () => setHasInteracted(true);
        window.addEventListener('click', handleFirstInteraction, { once: true });
        window.addEventListener('touchstart', handleFirstInteraction, { once: true });
        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };
    }, []);

    const checkRewards = useCallback(async () => {
        const startTime = localStorage.getItem('pnp_session_start');
        if (startTime && user) {
            const start = parseInt(startTime);
            const now = Date.now();
            const diffMs = now - start;
            localStorage.removeItem('pnp_session_start');

            if (diffMs > 7200000) return; // Expiration

            let elapsedMinutes = Math.floor(diffMs / 60000);
            if (elapsedMinutes > 30) elapsedMinutes = 30;

            if (elapsedMinutes >= 1) {
                const reward = 0.05 + (elapsedMinutes * 0.01);
                await addCash(reward);
                toast.success(`Royal Rewards! +$${reward.toFixed(2)}`, { icon: '👑' });
            }
        } else if (user) {
            fetchProfile(user.id);
        }
    }, [user, addCash, fetchProfile]);

    useEffect(() => {
        if (!user) return;
        checkRewards();
        const onVisibilityChange = () => { if (document.visibilityState === 'visible') checkRewards(); };
        window.addEventListener('visibilitychange', onVisibilityChange);
        return () => window.removeEventListener('visibilitychange', onVisibilityChange);
    }, [user, checkRewards]);

    const openPortal = async (portalId: string, url: string) => {
        setHasInteracted(true);
        const newHistory = { ...history, [portalId]: Date.now() };
        setHistory(newHistory);
        localStorage.setItem('pnp_history_v4', JSON.stringify(newHistory));
        localStorage.setItem('pnp_session_start', Date.now().toString());
        showInterstitial();
        if (Capacitor.isNativePlatform()) {
            await Browser.open({ url, toolbarColor: '#000000' });
        } else {
            window.open(url, '_blank');
        }
    }

    const handleWatchReward = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setHasInteracted(true);
        try {
            const ad = await showRewardedAd();
            if (ad.success) {
                await addCash(0.10);
                toast.success("Cash Earned!");
            }
        } catch (e) { console.error(e); } finally { setIsProcessing(false); }
    }

    if (authLoading) return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
            <AppBackground />
            <Loader2 className="animate-spin h-10 w-10 text-yellow-400 z-10" />
        </div>
    );

    if (!user) {
        return (
            <div className="min-h-screen w-full bg-black flex flex-col text-white relative p-8 justify-center overflow-y-auto" onClick={() => setHasInteracted(true)}>
                <AppBackground />
                <div className="relative z-10 text-center space-y-2 mb-12">
                    <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none text-white">PLAY 'N<br/><span className="text-yellow-400">PAYDAY</span></h1>
                    <p className="text-xs font-bold tracking-[0.3em] text-white/40 uppercase italic">The Empire Awaits</p>
                </div>
                <form onSubmit={handleAuth} className="w-full max-w-sm space-y-3 relative z-10 mx-auto text-left">
                    {!isLogin && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                            <UserIcon className="h-5 w-5 text-white/40 mr-3" />
                            <input type="text" placeholder="EMPIRE NAME" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20 uppercase" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                        </div>
                    )}
                    <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <Mail className="h-5 w-5 text-white/40 mr-3" />
                        <input type="email" placeholder="EMAIL ADDRESS" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20 uppercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md relative">
                        <Lock className="h-5 w-5 text-white/40 mr-3" />
                        <input type={showPass ? "text" : "password"} placeholder="PASSWORD" handle-auto-focus="false" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20 pr-12" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                    </div>
                    {!isLogin && (
                        <div className="flex items-center gap-3 px-4 py-2">
                            <input type="checkbox" id="terms-pnp" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-black/40 text-yellow-400" />
                            <label htmlFor="terms-pnp" className="text-[10px] text-white/60 font-bold uppercase italic leading-tight">I am 18+ and agree to the Empire Code</label>
                        </div>
                    )}
                    <button type="submit" disabled={loading} className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-4 italic">
                        {loading && <Loader2 className="animate-spin h-5 w-5" />}
                        {isLogin ? 'Enter Empire' : 'Join Empire'}
                    </button>
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-[10px] text-white/40 font-black uppercase mt-6 underline tracking-[0.2em] relative z-10 italic">
                        {isLogin ? "New Recruit? Sign Up" : "Back to Login"}
                    </button>
                </form>
            </div>
        )
    }

    const cashBalance = parseFloat(profile?.cash_balance?.toString() || "0");

    return (
        <div className="h-screen w-full text-white flex flex-col overflow-y-auto font-sans relative bg-black no-scrollbar pb-32">
            <AppBackground />

            <header className="px-6 pt-12 pb-4 flex justify-between items-center z-20 relative">
                <div className="flex items-center gap-3 text-left">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                        <div className="h-full w-full bg-black rounded-[14px] flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" className="w-10 h-10 object-contain" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none uppercase">PLAY 'N<span className="text-yellow-400 not-italic tracking-normal">PAYDAY</span></h1>
                        <p className="text-[9px] text-white/40 uppercase tracking-[0.3em] font-bold mt-1 flex items-center gap-1 italic">
                            <ShieldCheck className="w-2.5 h-2.5 text-yellow-400" /> Gold Verified
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="font-black text-lg tabular-nums tracking-tighter text-white italic">${cashBalance.toFixed(2)}</span>
                </div>
            </header>

            <main className="flex-1 px-4 py-4 space-y-8 relative z-10 text-left">
                {activeTab === 'home' && (
                    <>
                        <section>
                            <div className="flex items-center justify-between px-2 mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 italic">Empire Zones</h3>
                                <div className="h-px flex-1 mx-4 bg-white/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {PROVIDERS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => openPortal(p.id, p.url)}
                                        className="relative h-32 rounded-[2rem] overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-5 flex flex-col justify-between active:scale-95 transition-all group text-left shadow-xl"
                                    >
                                        <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", p.color)} />
                                        <div className="flex justify-between items-start z-10">
                                            <p.icon className={cn("w-7 h-7 text-white")} />
                                            <span className="text-[8px] font-black bg-yellow-400/20 px-2 py-0.5 rounded-full text-yellow-400 border border-yellow-400/20">{p.bonus}</span>
                                        </div>
                                        <div className="z-10 text-left">
                                            <h4 className="text-sm font-black uppercase italic leading-none tracking-tight">{p.name}</h4>
                                            <p className="text-[9px] text-white/40 mt-1 font-bold">{p.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <button onClick={handleWatchReward} disabled={isProcessing} className="w-full bg-white/5 border border-white/10 p-8 rounded-[3rem] flex items-center justify-between active:scale-95 transition-all group backdrop-blur-xl">
                            <div className="flex items-center gap-6">
                                <div className="bg-yellow-400 p-4 rounded-3xl text-black shadow-2xl shadow-yellow-400/20">
                                    {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <PlayCircle className="h-8 w-8" />}
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-white uppercase text-lg italic tracking-tight">{isProcessing ? "Connecting..." : "Watch Video"}</span>
                                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-[0.2em]">Earn $0.10 Gold</span>
                                </div>
                            </div>
                            <ChevronRight className="h-6 w-6 text-yellow-400/40 group-hover:text-yellow-400 transition-colors" />
                        </button>

                        <section>
                            <div className="flex items-center justify-between px-2 mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 italic">Arcade Games</h3>
                                <div className="h-px flex-1 mx-4 bg-white/10" />
                                <Gamepad2 className="w-4 h-4 text-white/20" />
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {MINI_GAMES.map((game) => (
                                    <button
                                        key={game.id}
                                        onClick={() => navigate({ to: "/game/$tableId", params: { tableId: game.id } })}
                                        className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between active:bg-white/10 transition-colors group backdrop-blur-sm"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <span className="text-2xl drop-shadow-md">{game.emoji}</span>
                                            <span className="font-black uppercase italic text-sm tracking-tight text-white/90">{game.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-yellow-400 tracking-widest uppercase">Play Now</span>
                                            <ArrowUpRight className="w-4 h-4 text-yellow-400/40 group-hover:text-yellow-400 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-3 animate-in slide-in-from-right duration-300">
                         <div className="flex items-center justify-between px-2 mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 italic">Activity Feed</h3>
                            <div className="h-px flex-1 mx-4 bg-white/10" />
                        </div>
                        {PROVIDERS.map(p => {
                            const time = history[p.id];
                            return (
                                <div key={p.id} onClick={() => openPortal(p.id, p.url)} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 flex items-center justify-between active:bg-white/10 transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className={cn("p-4 rounded-2xl text-white shadow-lg", p.color)}><p.icon className="h-6 w-6" /></div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-white uppercase text-xs tracking-tight italic">{p.name}</span>
                                            <span className="text-[10px] text-yellow-400/80 font-bold mt-1 uppercase tracking-wider">
                                                {time ? `Last: ${new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "No activity yet"}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-white/20" />
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-4 pb-12 z-[5000]">
                <NavButton icon={Zap} label="Lobby" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavButton icon={Trophy} label="Ranks" active={false} onClick={() => navigate({ to: "/leaderboard" })} />
                <NavButton icon={Wallet} label="Wins" active={false} onClick={() => navigate({ to: "/cashout" })} />
                <NavButton icon={Info} label="Info" active={false} onClick={() => toast.info("Play 'n Payday v2.4 - The Gold Standard")} />
            </nav>
        </div>
    )
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
      <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1.5 w-20 py-2 transition-all active:scale-90", active ? "text-yellow-400 scale-110 font-black" : "text-white/40")}>
        <Icon className={cn("h-6 w-6", active && "fill-current")} />
        <span className={cn("text-[8px] font-black uppercase tracking-widest italic", active ? "opacity-100" : "opacity-40")}>{label}</span>
      </button>
    );
}
