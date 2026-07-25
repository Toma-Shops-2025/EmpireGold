import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { CONFIG } from '@/config'
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'
import {
    Wallet, Gamepad2, Coins, TrendingUp, Trophy,
    Gift, Loader2, Zap, User as UserIcon, LogOut,
    ChevronRight, LayoutGrid, Award, CreditCard, Lock, Mail, ExternalLink, History
} from 'lucide-react'
import { toast } from 'sonner'

// THE EMPIRE GOLD PROVIDERS
const PROVIDERS = [
    { id: 'poki', name: 'Poki Arcade', desc: 'The biggest web arcade', url: 'https://poki.com', color: 'bg-blue-600', icon: Gamepad2 },
    { id: 'crazy', name: 'CrazyGames', desc: 'Top action & strategy', url: 'https://www.crazygames.com', color: 'bg-purple-600', icon: Zap },
    { id: 'gdist', name: 'GameDistro', desc: 'Premium HTML5 library', url: 'https://gamedistribution.com', color: 'bg-orange-600', icon: LayoutGrid },
    { id: 'y8', name: 'Y8 Games', desc: 'Classic arcade hits', url: 'https://www.y8.com', color: 'bg-emerald-600', icon: Trophy },
];

const REWARDS = [
    { id: 'v5', name: '$5 Visa Card', cost: 5.00, type: 'Visa' },
    { id: 'a5', name: '$5 Amazon Gift', cost: 5.00, type: 'Amazon' },
    { id: 'p5', name: '$5 PayPal Cash', cost: 5.00, type: 'PayPal' },
    { id: 'v10', name: '$10 Visa Card', cost: 10.00, type: 'Visa' },
    { id: 'a10', name: '$10 Amazon Gift', cost: 10.00, type: 'Amazon' },
    { id: 'p10', name: '$10 PayPal Cash', cost: 10.00, type: 'PayPal' },
    { id: 'v25', name: '$25 Visa Card', cost: 25.00, type: 'Visa' },
    { id: 'a25', name: '$25 Amazon Gift', cost: 25.00, type: 'Amazon' },
    { id: 'p25', name: '$25 PayPal Cash', cost: 25.00, type: 'PayPal' },
];

function AppBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <img
            src="/bg-gold.png"
            className="w-full h-full object-cover opacity-60 scale-105 transition-opacity duration-1000"
            alt=""
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
    </div>
  )
}

export default function EmpireGoldHub() {
    const auth = useAuth()
    const [activeTab, setActiveTab] = useState<'portals' | 'mygames' | 'payouts'>('portals')
    const [isAdLoading, setIsAdLoading] = useState(false)
    const [gameStartTime, setGameStartTime] = useState<number | null>(null)
    const [history, setHistory] = useState<Record<string, { name: string, time: number }>>(() => {
        const saved = localStorage.getItem('empire_gold_history_v3');
        try { return saved ? JSON.parse(saved) : {}; } catch(e) { return {}; }
    });

    // Auth UI States
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [agreed, setAgreed] = useState(false)

    // AdMob Initialization
    useEffect(() => {
        const initAds = async () => {
            try {
                const isNative = (window as any).Capacitor?.isNativePlatform();
                if (isNative) {
                    await AdMob.initialize();
                }
            } catch (e) {
                console.error("AdMob init error", e);
            }
        };
        if (auth.user) initAds();
    }, [auth.user]);

    // Handle App Resume (Reward logic)
    useEffect(() => {
        let listener: any = null;

        const setupListener = async () => {
            const isNative = (window as any).Capacitor?.isNativePlatform();
            if (!isNative) return;

            listener = await App.addListener('appStateChange', async (state) => {
                if (state.isActive && gameStartTime) {
                    const elapsed = Math.max(1, Math.floor((Date.now() - gameStartTime) / 60000));
                    const reward = 0.05 + (elapsed * 0.02);
                    setGameStartTime(null);

                    await auth.addCash(reward);

                    toast.success(`Royal Rewards! +$${reward.toFixed(2)}`, {
                        description: `You played for ${elapsed} minute(s).`,
                        icon: '👑'
                    });

                    try {
                        await AdMob.prepareInterstitialAd({ adId: CONFIG.ADMOB_INTERSTITIAL_ID });
                        await AdMob.showInterstitial();
                    } catch(e) {}
                }
            });
        };

        if (auth.user) setupListener();
        return () => { if (listener) listener.remove(); };
    }, [gameStartTime, auth.user, auth.addCash]);

    const openPortal = async (portalId: string, portalName: string, url: string) => {
        // Save history
        const newHistory = { ...history, [portalId]: { name: portalName, time: Date.now() } };
        setHistory(newHistory);
        localStorage.setItem('empire_gold_history_v3', JSON.stringify(newHistory));

        const isNative = (window as any).Capacitor?.isNativePlatform();
        if (isNative) {
            try {
                await AdMob.prepareInterstitialAd({ adId: CONFIG.ADMOB_INTERSTITIAL_ID });
                await AdMob.showInterstitialAd();
            } catch(e) {}
            setGameStartTime(Date.now());
            await Browser.open({ url, toolbarColor: '#000000' });
        } else {
            window.open(url, '_blank');
            setGameStartTime(Date.now());
            toast.info(`Opening ${portalName}...`);
        }
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLogin && !agreed) return toast.error("Please agree to the terms.");
        try {
            if (isLogin) {
                await auth.signIn(email, password);
            } else {
                await auth.signUp(email, password, username);
            }
        } catch (err: any) {
            toast.error(err.message || "Authentication failed");
        }
    }

    if (auth.loading) return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-8">
            <AppBackground />
            <Loader2 className="animate-spin h-10 w-10 mb-4 text-yellow-400 relative z-10" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] relative z-10">Accessing Vault...</span>
        </div>
    );

    if (!auth.user) {
        return (
            <div className="h-[100dvh] w-full flex flex-col items-center justify-start p-8 pt-24 text-white relative overflow-y-auto no-scrollbar">
                <AppBackground />
                <h1 className="text-6xl font-black italic mb-2 tracking-tighter uppercase text-center leading-none relative z-10">
                    Empire<br/><span className="text-yellow-400 font-serif">Gold</span>
                </h1>

                <form onSubmit={handleAuth} className="w-full max-w-sm space-y-3 relative z-10 mt-12 pb-20">
                    {!isLogin && (
                        <div className="bg-black/60 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                            <UserIcon className="h-5 w-5 text-white/40 mr-3" />
                            <input type="text" placeholder="Username" className="bg-transparent outline-none w-full font-bold text-white" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                    )}
                    <div className="bg-black/60 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <Mail className="h-5 w-5 text-white/40 mr-3" />
                        <input type="email" placeholder="Email" className="bg-transparent outline-none w-full font-bold text-white" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="bg-black/60 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <Lock className="h-5 w-5 text-white/40 mr-3" />
                        <input type="password" placeholder="Password" className="bg-transparent outline-none w-full font-bold text-white" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {!isLogin && (
                        <div className="flex items-center gap-3 px-2 py-2">
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-yellow-400" />
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">I agree to terms</span>
                        </div>
                    )}
                    <button type="submit" className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-4">
                        {isLogin ? 'Enter Vault' : 'Claim Bonus'}
                    </button>
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-[10px] text-white/40 font-black uppercase mt-6 underline tracking-[0.2em] relative z-10">
                        {isLogin ? "Need access? Sign Up" : "Back to Login"}
                    </button>
                </form>
            </div>
        )
    }

    const cashBalance = parseFloat(auth.profile?.cash_balance?.toString() || "0");
    const nextMilestone = REWARDS.find(r => cashBalance < r.cost)?.cost || 50.00;
    const goalPct = Math.min(100, Math.max(0, Math.floor((cashBalance / nextMilestone) * 100))) || 0;

    return (
        <div className="h-screen w-full text-white flex flex-col overflow-hidden font-sans relative bg-black">
            <AppBackground />

            {/* ROYAL HEADER */}
            <div className="pt-16 pb-12 px-6 rounded-b-[60px] shadow-2xl relative overflow-hidden glass-panel z-10 border-b border-white/5">
                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="space-y-1 text-left">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Empire Balance</span>
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-400/20 p-2 rounded-xl border border-yellow-400/10">
                                <Coins className="h-6 w-6 text-yellow-400 drop-shadow-glow" />
                            </div>
                            <span className="text-5xl font-black italic tracking-tighter">${cashBalance.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* LABELED PROGRESS BAR */}
                <div className="space-y-4 relative z-10 px-1">
                    <div className="flex justify-between text-[10px] font-black uppercase italic tracking-wider">
                        <span className="opacity-40">{goalPct >= 100 ? "Reward Ready!" : "One step away!"}</span>
                        <span className="text-yellow-400">{goalPct}% to ${nextMilestone.toFixed(0)}</span>
                    </div>
                    <div className="relative pt-4">
                        <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden p-1 border border-white/5">
                            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all duration-1000 ease-out" style={{ width: `${goalPct}%` }} />
                        </div>
                        {/* Labels and Breaks */}
                        <div className="absolute -top-1 inset-x-0 flex justify-between px-2 text-[8px] font-black text-white/40 uppercase tracking-tighter">
                            <span>$0</span>
                            <div className="flex flex-col items-center">
                                <div className="h-2 w-px bg-white/20 mb-1" />
                                <span>$5</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-2 w-px bg-white/20 mb-1" />
                                <span>$10</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-2 w-px bg-white/20 mb-1" />
                                <span>$25</span>
                            </div>
                            <span>$50</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32 no-scrollbar relative z-10">

                {activeTab === 'home' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                        {/* CONTINUE PLAYING */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2 text-white/60">
                                <History className="h-4 w-4" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Continue Playing</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {PROVIDERS.map(p => {
                                    const entry = history[p.id];
                                    return (
                                        <div key={p.id} onClick={() => openPortal(p.id, p.name, p.url)} className="glass-card p-5 rounded-[40px] flex items-center justify-between active:scale-[0.98] transition-all group border border-white/5 shadow-xl">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className={cn("p-3 rounded-2xl text-white shadow-lg", p.color)}>
                                                    <p.icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-white uppercase text-xs tracking-tight">{p.name}</span>
                                                    <span className="text-[9px] text-white/30 font-bold mt-1 uppercase tracking-wider">
                                                        {entry ? `Last active: ${new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Play to track your last game"}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-yellow-400 transition-colors" />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* ELITE PORTALS */}
                        <div className="space-y-4 pb-12 border-t border-white/5 pt-8">
                            <div className="flex items-center gap-2 px-2 text-white/60">
                                <LayoutGrid className="h-4 w-4" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Elite Portals</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {PROVIDERS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => openPortal(p.id, p.name, p.url)}
                                        className={cn("p-6 rounded-[35px] text-left relative overflow-hidden active:scale-95 transition-all glass-card border border-white/10 shadow-2xl", p.color)}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <ExternalLink className="h-10 w-10" />
                                        </div>
                                        <span className="block font-black uppercase text-sm italic leading-tight">{p.name}</span>
                                        <span className="block text-[8px] font-bold opacity-60 mt-1 uppercase tracking-tighter">{p.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300 px-2 pb-32">
                        <div className="space-y-4 mt-4">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-4 text-white">Vault Rewards</h4>
                             {REWARDS.map(r => (
                                 <RewardCard key={r.id} title={r.name} cost={r.cost} balance={cashBalance} icon={r.type === 'PayPal' ? Wallet : CreditCard} color={r.type === 'Amazon' ? "bg-orange-500" : r.type === 'PayPal' ? "bg-green-600" : "bg-blue-600"} />
                             ))}
                        </div>

                        <div className="mt-12 flex flex-col items-center gap-4 text-center pb-20 relative z-10 text-white">
                            <span className="text-xl font-black italic border-b border-yellow-400/20 pb-1">{auth.profile?.username || 'Empire Member'}</span>
                            <button onClick={auth.signOut} className="flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest active:scale-90 transition-all mt-4"><LogOut className="h-4 w-4" /> Exit Vault</button>
                        </div>
                    </div>
                )}
            </div>

            {/* NAVIGATION */}
            <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-4 pb-4 z-[5000]">
                <NavButton icon={TrendingUp} label="Portals" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavButton icon={Gamepad2} label="My Games" active={activeTab === 'arcade'} onClick={() => setActiveTab('arcade')} />
                <NavButton icon={Award} label="Wins" active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} />
            </nav>
        </div>
    )
}

function RewardCard({ title, cost, balance, icon: Icon, color }: any) {
    const isUnlocked = balance >= cost;
    return (
        <div className={cn("glass-card p-6 rounded-[40px] flex justify-between items-center transition-all border", isUnlocked ? "border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.2)] bg-yellow-400/10" : "border-white/5 opacity-40 shadow-2xl")}>
            <div className="flex items-center gap-4 text-left">
                <div className={cn("p-3 rounded-2xl text-white shadow-lg", color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-tight text-white">{title}</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{isUnlocked ? "READY TO CLAIM" : `$${cost.toFixed(2)} Required`}</span>
                </div>
            </div>
            {isUnlocked ? <button className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl animate-pulse shadow-glow">REDEEM</button> : <Lock className="h-4 w-4 text-white/20" />}
        </div>
    )
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
      <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1 w-20 py-2 transition-all active:scale-90", active ? "text-yellow-400" : "text-white/40")}>
        <Icon className={cn("h-6 w-6", active && "fill-current")} />
        <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "opacity-100" : "opacity-40")}>{label}</span>
      </button>
    );
}
