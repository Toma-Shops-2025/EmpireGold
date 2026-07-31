import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Browser } from '@capacitor/browser'
import {
    Wallet, Gamepad2, Coins, TrendingUp, Trophy,
    Gift, Loader2, Zap, User as UserIcon, LogOut,
    ChevronRight, LayoutGrid, Award, CreditCard, Lock, Mail, ExternalLink, History,
    PlayCircle, Sparkles, DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { showRewardedAd } from '@/lib/ads'

// CONFIG CONSTANTS
const CONFIG = {
    POINTS_PER_DAUB: 10,
    BINGO_BONUS: 500,
    X_PATTERN_BONUS: 1000,
    ROUND_TIME_LIMIT: 120,
};

// THE EMPIRE GOLD PROVIDERS
const PROVIDERS = [
    { id: 'poki', name: 'Poki Arcade', desc: 'The biggest web arcade', url: 'https://poki.com', color: 'bg-blue-600', icon: Gamepad2 },
    { id: 'crazy', name: 'CrazyGames', desc: 'Top action & strategy', url: 'https://www.crazygames.com', color: 'bg-purple-600', icon: Zap },
    { id: 'gdist', name: 'GameDistro', desc: 'Premium HTML5 library', url: 'https://gamedistribution.com', color: 'bg-orange-600', icon: LayoutGrid },
    { id: 'y8', name: 'Y8 Games', desc: 'Classic arcade hits', url: 'https://www.y8.com', color: 'bg-emerald-600', icon: Trophy },
];

const REWARDS = [
    { id: 'v5', name: '$5 Visa Card', jp: 250000, type: 'Visa' },
    { id: 'a5', name: '$5 Amazon Gift', jp: 250000, type: 'Amazon' },
    { id: 'p5', name: '$5 PayPal Cash', jp: 250000, type: 'PayPal' },
    { id: 'v10', name: '$10 Visa Card', jp: 500000, type: 'Visa' },
    { id: 'a10', name: '$10 Amazon Gift', jp: 500000, type: 'Amazon' },
    { id: 'p10', name: '$10 PayPal Cash', jp: 500000, type: 'PayPal' },
    { id: 'v25', name: '$25 Visa Card', jp: 1250000, type: 'Visa' },
    { id: 'a25', name: '$25 Amazon Gift', jp: 1250000, type: 'Amazon' },
    { id: 'p25', name: '$25 PayPal Cash', jp: 1250000, type: 'PayPal' },
    { id: 'v50', name: '$50 Visa Card', jp: 2500000, type: 'Visa' },
    { id: 'a50', name: '$50 Amazon Gift', jp: 2500000, type: 'Amazon' },
    { id: 'p50', name: '$50 PayPal Cash', jp: 2500000, type: 'PayPal' },
];

function AppBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 20 + Math.random() * 30,
      delay: Math.random() * -40,
      size: 60 + Math.random() * 80,
      opacity: 0.1 + Math.random() * 0.2,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#050505]">
        <div className="absolute inset-0 overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute animate-float-complex"
                    style={{
                        left: p.left,
                        top: p.top,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        opacity: p.opacity,
                    }}
                >
                    <DollarSign
                        size={p.size}
                        className="text-yellow-600/40"
                        style={{ transform: `rotate(${p.rotate}deg)` }}
                    />
                </div>
            ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        <style>{`
            @keyframes float-complex {
                0% { transform: translate(0, 0) rotate(0deg); }
                33% { transform: translate(-30px, 30px) rotate(120deg); }
                66% { transform: translate(30px, -20px) rotate(240deg); }
                100% { transform: translate(0, 0) rotate(360deg); }
            }
            .animate-float-complex {
                animation: float-complex infinite linear;
            }
        `}</style>
    </div>
  )
}

export default function PlayNPaydayHub() {
    const { user, profile, loading: authLoading, signIn, signUp, signOut, addCash, supabase, fetchProfile } = useAuth()
    const [activeTab, setActiveTab] = useState<'home' | 'portals' | 'history' | 'wins'>('home')
    const [isProcessing, setIsProcessing] = useState(false)
    const [sessionTotal, setSessionTotal] = useState(0);
    const [gameStartTime, setGameStartTime] = useState<number | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [adminPayouts, setAdminPayouts] = useState<any[]>([]);
    const [history, setHistory] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('pnp_history_v1');
        try { return saved ? JSON.parse(saved) : {}; } catch(e) { return {}; }
    });

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [agreed, setAgreed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | 'faq' | 'rules' | null>(null)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        if (!isLogin && !agreed) {
            toast.error("Please agree to the Terms of Service.");
            return;
        }
        setLoading(true);
        try {
            if (isLogin) {
                await signIn(email, password);
                toast.success("Welcome back!");
            } else {
                await signUp(email, password, username);
                try {
                    await signIn(email, password);
                    toast.success("Welcome to Play 'n Payday!");
                } catch {
                    setIsLogin(true);
                    toast.success("Account created! Please log in.");
                }
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            toast.error("Auth Failed", { description: error.message });
        } finally {
            setLoading(false);
        }
    }

    const bgmRef = useRef<HTMLAudioElement | null>(null);

    const playTrack = useCallback((src: string, volume: number) => {
        if (!bgmRef.current) {
            bgmRef.current = new Audio();
            bgmRef.current.loop = true;
        }
        const currentFullUrl = window.location.origin + src;
        if (bgmRef.current.src !== currentFullUrl) {
            bgmRef.current.src = src;
        }
        bgmRef.current.volume = volume;
        if (hasInteracted) {
            bgmRef.current.play().catch(e => console.log("Audio play blocked:", e));
        }
    }, [hasInteracted]);

    useEffect(() => {
        if (!user) return;
        if (gameStartTime) {
            bgmRef.current?.pause();
        } else if (activeTab === 'wins') {
            playTrack('/audio/vault.MP3', 0.15);
        } else {
            playTrack('/audio/promo.MP3', 0.1);
        }
    }, [activeTab, gameStartTime, user, playTrack]);

    useEffect(() => {
        const handleFirstInteraction = () => {
            setHasInteracted(true);
            window.removeEventListener('touchstart', handleFirstInteraction);
            window.removeEventListener('mousedown', handleFirstInteraction);
            window.removeEventListener('click', handleFirstInteraction);
        };
        window.addEventListener('touchstart', handleFirstInteraction);
        window.addEventListener('mousedown', handleFirstInteraction);
        window.addEventListener('click', handleFirstInteraction);
        return () => {
            window.removeEventListener('touchstart', handleFirstInteraction);
            window.removeEventListener('mousedown', handleFirstInteraction);
            window.removeEventListener('click', handleFirstInteraction);
        };
    }, []);

    const lastPlayed = useMemo(() => {
        const entries = Object.entries(history);
        if (entries.length === 0) return null;
        const [id] = entries.sort((a, b) => b[1] - a[1])[0];
        return PROVIDERS.find(p => p.id === id);
    }, [history]);

    const checkRewards = useCallback(async () => {
        const startTime = localStorage.getItem('pnp_session_start');
        if (startTime && user) {
            const start = parseInt(startTime);
            const now = Date.now();
            const elapsedMinutes = Math.floor((now - start) / 60000);
            if (elapsedMinutes < 1) return;
            const reward = 0.05 + (elapsedMinutes * 0.02);
            localStorage.removeItem('pnp_session_start');
            setGameStartTime(null);
            setSessionTotal(prev => prev + reward);
            await addCash(reward);
            toast.success(`Royal Rewards! +$${reward.toFixed(2)}`, { description: `Session: ${elapsedMinutes} min`, icon: '👑' });
        }
    }, [user, addCash]);

    useEffect(() => {
        if (!user) return;
        checkRewards();
        const onVisibilityChange = () => { if (document.visibilityState === 'visible') checkRewards(); };
        window.addEventListener('focus', onVisibilityChange);
        return () => window.removeEventListener('focus', onVisibilityChange);
    }, [user, checkRewards]);

    const openPortal = async (portalId: string, url: string) => {
        const newHistory = { ...history, [portalId]: Date.now() };
        setHistory(newHistory);
        localStorage.setItem('pnp_history_v1', JSON.stringify(newHistory));
        localStorage.setItem('pnp_session_start', Date.now().toString());
        setGameStartTime(Date.now());
        if (Capacitor.isNativePlatform()) {
            await Browser.open({ url, toolbarColor: '#000000' });
        } else {
            window.open(url, '_blank');
        }
    }

    const handleWatchReward = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        toast.info("Accessing sponsor network...");
        try {
            const ad = await showRewardedAd();
            if (ad.success) {
                await addCash(0.10);
                setSessionTotal(prev => prev + 0.10);
                toast.success("Cash Earned!", { description: "+$0.10 added to your vault." });
            } else {
                toast.error("Ad not ready", { description: "Please try again in a moment." });
            }
        } catch (e) {
            console.error("Ad error", e);
        } finally {
            setIsProcessing(false);
        }
    }

    const handlePayoutRequest = async (reward: any) => {
        if ((profile?.cash_balance || 0) < (reward.jp / 50000)) return; // Simple conversion logic
        if (!confirm(`Redeem ${reward.jp.toLocaleString()} JS for a ${reward.name}?`)) return;
        try {
            const { error } = await supabase.from('payout_requests').insert({ user_id: user?.id, reward_name: reward.name, points_cost: reward.jp, status: 'pending' });
            if (error) throw error;
            await addCash(-(reward.jp / 50000));
            toast.success("Redemption Submitted!", {
                description: "Check your email for instructions. Payouts are processed within 24-48 hours.",
                duration: 6000
            });
        } catch (e: any) { alert(e.message); }
    }

    useEffect(() => {
        if (activeTab === 'wins' && supabase) {
            const fetchL = async () => {
                try {
                    const { data } = await supabase
                        .from('profiles')
                        .select('username, cash_balance, total_earned')
                        .order('total_earned', { ascending: false })
                        .limit(10);
                    if (data) setLeaderboard(data);

                    // ADMIN ONLY: Fetch pending payouts
                    if (user?.email?.includes('gmail.com') || user?.email?.includes('playnpayday.fun')) {
                        const { data: payouts } = await supabase
                            .from('payout_requests')
                            .select('*, profiles(username, email)')
                            .eq('status', 'pending')
                            .order('created_at', { ascending: false });
                        if (payouts) setAdminPayouts(payouts);
                    }
                } catch (e) {
                    console.warn("Leaderboard error", e);
                }
            };
            fetchL();
        }
    }, [activeTab, supabase, user]);

    if (authLoading) return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-8">
            <AppBackground />
            <Loader2 className="animate-spin h-10 w-10 mb-4 text-yellow-400 relative z-10" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] relative z-10">Accessing Vault...</span>
        </div>
    );

    if (!user) {
        return (
            <div className="h-[100dvh] w-full flex flex-col items-center justify-start p-8 pt-24 text-white relative overflow-y-auto no-scrollbar text-left">
                <AppBackground />
                <h1 className="text-6xl font-black italic mb-2 tracking-tighter uppercase text-center leading-none relative z-10">
                    Play 'n<br/><span className="text-yellow-400 font-serif">Payday</span>
                </h1>
                <form onSubmit={handleAuth} className="w-full max-w-sm space-y-3 relative z-10 mt-12 pb-20">
                    {!isLogin && (
                        <div className="bg-black/60 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                            <UserIcon className="h-5 w-5 text-white/40 mr-3" />
                            <input type="text" placeholder="Username" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                    )}
                    <div className="bg-black/60 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <Mail className="h-5 w-5 text-white/40 mr-3" />
                        <input type="email" placeholder="Email" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="bg-black/60 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md relative">
                        <Lock className="h-5 w-5 text-white/40 mr-3" />
                        <input type={showPass ? "text" : "password"} placeholder="Password" title="password" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 text-white/20">{showPass ? <Sparkles size={16}/> : <Lock size={16}/>}</button>
                    </div>
                    {!isLogin && (
                        <div className="flex items-center gap-3 px-4 py-2">
                            <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-black/40 text-yellow-400" />
                            <label htmlFor="terms" className="text-[10px] text-white/60 font-bold uppercase">I am 18+ and agree to the <button type="button" onClick={() => setShowLegal('terms')} className="text-yellow-400 underline">Terms</button> & <button type="button" onClick={() => setShowLegal('privacy')} className="text-yellow-400 underline">Privacy</button></label>
                        </div>
                    )}
                    <button type="submit" disabled={loading} className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-2">
                        {loading && <Loader2 className="animate-spin h-5 w-5" />}
                        {isLogin ? 'Enter Vault' : 'Join Empire'}
                    </button>
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-[10px] text-white/40 font-black uppercase mt-6 underline tracking-[0.2em] relative z-10">
                        {isLogin ? "Need an account? Sign Up" : "Back to Login"}
                    </button>
                </form>
                {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
            </div>
        )
    }

    const cashBalance = parseFloat(profile?.cash_balance?.toString() || "0");
    const goalPct = Math.min(100, Math.max(0, (cashBalance / 50) * 100));

    return (
        <div className="h-screen w-full text-white flex flex-col overflow-hidden font-sans relative bg-black">
            <AppBackground />
            <div className="pt-12 pb-6 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden glass-panel z-10 border-b border-white/5">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Payday Balance</span>
                            <span className="text-[7px] bg-yellow-400/10 text-yellow-400 px-1 py-0.5 rounded border border-yellow-400/20 font-bold">V2.0</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-400/20 p-1.5 rounded-lg border border-yellow-400/10">
                                <Coins className="h-5 w-5 text-yellow-400 drop-shadow-glow" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black italic tracking-tighter">${cashBalance.toFixed(2)}</span>
                                {sessionTotal > 0 && <span className="text-[8px] text-green-400 font-bold uppercase">Session: +${sessionTotal.toFixed(2)}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 relative z-10 px-1">
                    <div className="flex justify-between text-[9px] font-black uppercase italic tracking-wider text-left">
                        <span className="opacity-40">Milestone Progress</span>
                        <span className="text-yellow-400">{goalPct.toFixed(0)}% to $50.00</span>
                    </div>
                    <div className="relative pt-3 pb-1">
                        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.3)] transition-all duration-1000 ease-out" style={{ width: `${goalPct}%` }} />
                        </div>
                        <div className="absolute top-0 inset-x-0 flex justify-between px-2 text-[7px] font-black text-white/40 uppercase">
                            <span>$0</span>
                            <div className="flex flex-col items-center"><div className="h-1.5 w-px bg-white/20 mb-0.5" />$5</div>
                            <div className="flex flex-col items-center"><div className="h-1.5 w-px bg-white/20 mb-0.5" />$10</div>
                            <div className="flex flex-col items-center"><div className="h-1.5 w-px bg-white/20 mb-0.5" />$25</div>
                            <span>$50</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-48 no-scrollbar relative z-10 text-left">
                {activeTab === 'home' && (
                    <div className="space-y-4">
                        {lastPlayed && (
                            <button onClick={() => openPortal(lastPlayed.id, lastPlayed.url)} className="w-full bg-gradient-to-r from-yellow-400/20 to-transparent p-[1px] rounded-[35px] group">
                                <div className="bg-black/60 backdrop-blur-xl p-5 rounded-[34px] flex items-center justify-between border border-white/5 group-active:scale-95 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-2xl text-white", lastPlayed.color)}><PlayCircle className="h-6 w-6" /></div>
                                        <div className="flex flex-col text-left text-white">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Continue Playing</span>
                                            <span className="text-sm font-black uppercase italic">{lastPlayed.name}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-yellow-400" />
                                </div>
                            </button>
                        )}
                        <DashButton icon={LayoutGrid} label="All Portals" color="bg-blue-600" onClick={() => setActiveTab('portals')} />
                        <DashButton icon={History} label="History" color="bg-purple-600" onClick={() => setActiveTab('history')} />
                        <button onClick={handleWatchReward} disabled={isProcessing} className="w-full glass-card p-8 rounded-[45px] flex items-center justify-between active:scale-95 transition-all border border-yellow-400/20 bg-yellow-400/5 shadow-glow-yellow disabled:opacity-50 mt-4">
                            <div className="flex items-center gap-6">
                                <div className="bg-yellow-400 p-4 rounded-3xl text-black shadow-2xl">{isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <PlayCircle className="h-8 w-8" />}</div>
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-white uppercase text-lg italic">{isProcessing ? "Loading..." : "Watch Ad"}</span>
                                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-[0.2em]">Earn $0.10 Gold</span>
                                </div>
                            </div>
                            <ChevronRight className="h-6 w-6 text-yellow-400" />
                        </button>
                    </div>
                )}

                {activeTab === 'portals' && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right duration-300">
                        {PROVIDERS.map(p => (
                            <button key={p.id} onClick={() => openPortal(p.id, p.url)} className={cn("p-6 h-48 rounded-[45px] text-left relative overflow-hidden active:scale-95 transition-all glass-card border border-white/10 shadow-2xl", p.color)}>
                                <div className="absolute top-0 right-0 p-4 opacity-10"><ExternalLink className="h-12 w-12" /></div>
                                <span className="block font-black uppercase text-base italic leading-tight">{p.name}</span>
                                <span className="block text-[8px] font-bold opacity-60 mt-1 uppercase tracking-tighter">Enter Arcade</span>
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-3 animate-in slide-in-from-right duration-300">
                        {PROVIDERS.map(p => {
                            const time = history[p.id];
                            return (
                                <div key={p.id} onClick={() => openPortal(p.id, p.url)} className="glass-card p-6 rounded-[45px] flex items-center justify-between border border-white/5 shadow-2xl">
                                    <div className="flex items-center gap-5">
                                        <div className={cn("p-4 rounded-2xl text-white shadow-lg", p.color)}><p.icon className="h-6 w-6" /></div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-white uppercase text-xs tracking-tight">{p.name}</span>
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

                {activeTab === 'wins' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-32">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-4 text-white">Vault Rewards</h4>
                            {REWARDS.map(r => (
                                <RewardCard key={r.id} title={r.name} cost={r.jp} balance={cashBalance * 50000} icon={r.type === 'PayPal' ? Wallet : CreditCard} color={r.type === 'Amazon' ? "bg-orange-500" : r.type === 'PayPal' ? "bg-green-600" : "bg-blue-600"} onRedeem={() => handlePayoutRequest(r)} />
                            ))}
                        </div>

                        <div className="bg-white/5 border border-white/10 p-6 rounded-[40px] mt-8">
                            <div className="flex flex-col items-center gap-2 mb-6">
                                <Trophy className="h-8 w-8 text-yellow-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400">Global Leaderboard</h3>
                            </div>
                            <div className="space-y-3">
                                {leaderboard.map((u, i) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-2">
                                        <span className="flex items-center gap-2"><span className="opacity-30">{i+1}.</span> {u.username}</span>
                                        <span className="text-primary italic">{(u.total_earned || u.cash_balance * 50000 || 0).toLocaleString()} JS</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {adminPayouts.length > 0 && (
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[40px] mt-8 animate-pulse">
                                <h3 className="text-xs font-black uppercase tracking-widest text-red-500 mb-4 text-center">Admin: Pending Payouts</h3>
                                <div className="space-y-4">
                                    {adminPayouts.map((p, i) => (
                                        <div key={i} className="text-[10px] bg-black/40 p-3 rounded-2xl border border-white/5">
                                            <div className="flex justify-between font-black uppercase italic mb-1">
                                                <span>{p.profiles?.username}</span>
                                                <span className="text-green-400">{p.reward_name}</span>
                                            </div>
                                            <div className="opacity-40 font-mono truncate">{p.profiles?.email}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button onClick={() => setShowLegal('rules')} className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px]">Rules</button>
                            <button onClick={() => setShowLegal('privacy')} className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black uppercase text-[10px]">Privacy</button>
                        </div>

                        <div className="flex flex-col items-center gap-4 text-center mt-12 pb-20">
                            <span className="text-sm font-black uppercase italic text-yellow-400/60">{profile?.username || 'Empire Member'}</span>
                            <button onClick={() => window.location.assign('mailto:support@playnpayday.fun')} className="text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-yellow-400/20 px-8 py-3 rounded-xl">Contact Support</button>
                            <button onClick={signOut} className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-4">Log Out</button>
                            <button onClick={() => { if(confirm("Permanently delete account?")) signOut(); }} className="text-red-500/20 text-[10px] font-black uppercase tracking-widest mt-2">Delete Account</button>
                        </div>
                    </div>
                )}
            </div>

            <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-4 pb-12 z-[5000]">
                <NavButton icon={TrendingUp} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavButton icon={Layers} label="Portals" active={activeTab === 'portals'} onClick={() => setActiveTab('portals')} />
                <NavButton icon={History} label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                <NavButton icon={Award} label="Wins" active={activeTab === 'wins'} onClick={() => setActiveTab('wins')} />
            </nav>

            {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
        </div>
    )
}

function LegalModal({ type, onClose }: { type: 'privacy' | 'terms' | 'faq' | 'rules', onClose: () => void }) {
    const titles = { privacy: 'Privacy Policy', terms: 'Terms of Service', faq: 'F.A.Q.', rules: 'Official Rules' };
    return (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex flex-col p-8 pt-20 animate-in fade-in duration-300 overflow-y-auto">
            <button onClick={onClose} className="absolute top-8 left-8 text-white/40 uppercase font-black text-[10px] flex items-center gap-2">
                <ChevronRight className="h-4 w-4 rotate-180" /> Back
            </button>
            <h2 className="text-4xl font-black italic uppercase mb-8 mt-4">{titles[type]}</h2>
            <div className="text-white/60 text-xs font-bold uppercase leading-relaxed space-y-4 pb-20">
                <p>Please visit our website for full legal documentation at playnpayday.fun</p>
            </div>
        </div>
    );
}

function DashButton({ icon: Icon, label, color, onClick }: any) {
    return (
        <button onClick={onClick} className="glass-card p-7 rounded-[45px] flex items-center justify-between active:scale-95 transition-all border border-white/5 shadow-2xl w-full">
            <div className="flex items-center gap-6 text-left">
                <div className={cn("p-4 rounded-3xl text-white shadow-lg", color)}><Icon className="h-6 w-6" /></div>
                <span className="font-black text-white uppercase text-lg italic tracking-tight">{label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-white/20" />
        </button>
    )
}

function RewardCard({ title, cost, balance, icon: Icon, color, onRedeem }: any) {
    const isUnlocked = balance >= cost;
    return (
        <div className={cn("glass-card p-6 rounded-[40px] flex justify-between items-center transition-all border", isUnlocked ? "border-yellow-400/50 bg-yellow-400/10" : "border-white/5 opacity-40")}>
            <div className="flex items-center gap-4 text-left">
                <div className={cn("p-3 rounded-2xl text-white shadow-lg", color)}><Icon className="h-5 w-5" /></div>
                <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-tight text-white">{title}</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{isUnlocked ? "READY TO CLAIM" : `${cost.toLocaleString()} JS Required`}</span>
                </div>
            </div>
            {isUnlocked ? (
                <button onClick={onRedeem} className="bg-yellow-400 text-black text-[10px] font-black px-4 py-2 rounded-xl shadow-glow-yellow animate-pulse">REDEEM</button>
            ) : <Lock className="h-4 w-4 text-white/20" />}
        </div>
    )
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
      <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1 w-20 py-2 transition-all active:scale-90", active ? "text-yellow-400 scale-110 font-black" : "text-white/40")}>
        <Icon className={cn("h-6 w-6", active && "fill-current")} />
        <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "opacity-100" : "opacity-40")}>{label}</span>
      </button>
    );
}

function Layers(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    )
}
