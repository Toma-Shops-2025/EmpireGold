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
    ChevronRight, LayoutGrid, Award, CreditCard, Lock, Mail, ExternalLink, History,
    CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

// THE EMPIRE GOLD PROVIDERS
const PROVIDERS = [
    { id: 'poki', name: 'Poki Arcade', url: 'https://poki.com', color: 'bg-blue-600', icon: Gamepad2 },
    { id: 'crazy', name: 'CrazyGames', url: 'https://www.crazygames.com', color: 'bg-purple-600', icon: Zap },
    { id: 'gdist', name: 'GameDistro', url: 'https://gamedistribution.com', color: 'bg-orange-600', icon: LayoutGrid },
    { id: 'y8', name: 'Y8 Games', url: 'https://www.y8.com', color: 'bg-emerald-600', icon: Trophy },
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
            className="w-full h-full object-cover opacity-60 scale-105"
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
        const saved = localStorage.getItem('empire_gold_history_v2');
        try { return saved ? JSON.parse(saved) : {}; } catch(e) { return {}; }
    });

    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [agreed, setAgreed] = useState(false)

    useEffect(() => {
        if (isActive && gameStartTime) {
            // ... (keeping existing ad/reward logic)
        }
    }, [gameStartTime]);

    const openPortal = async (portalId: string, portalName: string, url: string, gameName?: string) => {
        // Save to history
        const newHistory = {
            ...history,
            [portalId]: {
                name: gameName || "Portal Home",
                time: Date.now()
            }
        };
        setHistory(newHistory);
        localStorage.setItem('empire_gold_history_v2', JSON.stringify(newHistory));

        if ((window as any).Capacitor?.isNativePlatform()) {
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
                <form onSubmit={(e) => { e.preventDefault(); isLogin ? auth.signIn(email, password) : auth.signUp(email, password, username); }} className="w-full max-w-sm space-y-3 relative z-10 mt-12 pb-20">
                    <div className="bg-black/60 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <Mail className="h-5 w-5 text-white/40 mr-3" />
                        <input type="email" placeholder="Email" className="bg-transparent outline-none w-full font-bold text-white" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="bg-black/60 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <Lock className="h-5 w-5 text-white/40 mr-3" />
                        <input type="password" placeholder="Password" className="bg-transparent outline-none w-full font-bold text-white" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
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
    const goalProgress = Math.min(100, Math.max(0, (cashBalance / 50) * 100));

    return (
        <div className="h-screen w-full text-white flex flex-col overflow-hidden font-sans relative">
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

                {/* LABELED PROGRESS BAR ($0 to $50 Scale) */}
                <div className="space-y-4 relative z-10 px-1">
                    <div className="flex justify-between text-[10px] font-black uppercase italic tracking-wider">
                        <span className="opacity-40">Wealth Goal</span>
                        <span className="text-yellow-400">{goalProgress.toFixed(0)}% to $50.00</span>
                    </div>
                    <div className="relative pt-5 pb-2">
                        <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all duration-1000 ease-out" style={{ width: `${goalProgress}%` }} />
                        </div>

                        {/* ACCURATE MILESTONE LABELS */}
                        <div className="absolute top-0 left-0 text-[8px] font-black text-white/30">0</div>
                        <div className="absolute top-0 text-[8px] font-black text-yellow-400/60 flex flex-col items-center" style={{ left: '10%' }}>
                            <div className="h-1.5 w-px bg-white/20 mb-0.5" />$5
                        </div>
                        <div className="absolute top-0 text-[8px] font-black text-yellow-400/60 flex flex-col items-center" style={{ left: '20%' }}>
                            <div className="h-1.5 w-px bg-white/20 mb-0.5" />$10
                        </div>
                        <div className="absolute top-0 text-[8px] font-black text-yellow-400/60 flex flex-col items-center" style={{ left: '50%' }}>
                            <div className="h-1.5 w-px bg-white/20 mb-0.5" />$25
                        </div>
                        <div className="absolute top-0 right-0 text-[8px] font-black text-white/30">50</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32 no-scrollbar relative z-10">

                {activeTab === 'portals' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2 text-white/60">
                                <Layers className="h-4 w-4" />
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
                                        <span className="block text-[8px] font-bold opacity-60 mt-1 uppercase tracking-tighter">Enter Arcade</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* MINI ARCADE SECTION */}
                        <div className="space-y-4 pb-12 border-t border-white/5 pt-8">
                             <div className="flex items-center gap-2 px-2 text-white/60">
                                <Gamepad2 className="h-4 w-4" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Quick Launch</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {GAME_CATALOG.map(game => (
                                    <div key={game.id} onClick={() => openPortal('poki', 'Poki Arcade', game.url, game.name)} className="glass-card p-4 rounded-[40px] flex items-center justify-between active:scale-95 transition-all border border-white/5 shadow-xl">
                                        <div className="flex items-center gap-4 text-left">
                                            <img src={game.img} className="w-12 h-12 rounded-[18px] object-cover" />
                                            <div className="flex flex-col">
                                                <span className="font-black text-white uppercase text-xs tracking-tight">{game.name}</span>
                                                <span className="text-[8px] font-bold text-green-400 uppercase tracking-widest">+${game.reward.toFixed(2)} Bonus</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-white/20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mygames' && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2 text-white/60">
                                <History className="h-4 w-4" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Continue Playing</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {PROVIDERS.map(p => {
                                    const entry = history[p.id];
                                    return (
                                        <div key={p.id} onClick={() => openPortal(p.id, p.name, p.url)} className="glass-card p-6 rounded-[45px] flex items-center justify-between active:scale-[0.98] transition-all group border border-white/5 shadow-2xl">
                                            <div className="flex items-center gap-5 text-left">
                                                <div className={cn("p-4 rounded-2xl text-white shadow-lg", p.color)}>
                                                    <p.icon className="h-6 w-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-white uppercase text-xs tracking-tight">{p.name}</span>
                                                    <span className="text-[10px] text-yellow-400/80 font-bold mt-1 uppercase tracking-wider">
                                                        {entry ? `Last: ${entry.name}` : "Your last game from this portal will appear here"}
                                                    </span>
                                                    {entry && <span className="text-[8px] text-white/20 uppercase mt-1">{new Date(entry.time).toLocaleTimeString()}</span>}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-yellow-400 transition-colors" />
                                        </div>
                                    )
                                })}
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

                        <div className="mt-12 flex flex-col items-center gap-4 text-center pb-20 relative z-10 text-white font-black uppercase">
                            <span className="text-xl italic border-b border-yellow-400/20 pb-1">{auth.profile?.username || 'Empire Member'}</span>
                            <button onClick={auth.signOut} className="flex items-center gap-2 text-red-500 text-[10px] tracking-widest active:scale-90 transition-all mt-4"><LogOut className="h-4 w-4" /> Exit Vault</button>
                        </div>
                    </div>
                )}
            </div>

            <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-4 pb-4 z-[5000]">
                <NavButton icon={Layers} label="Portals" active={activeTab === 'portals'} onClick={() => setActiveTab('portals')} />
                <NavButton icon={Gamepad2} label="My Games" active={activeTab === 'mygames'} onClick={() => setActiveTab('mygames')} />
                <NavButton icon={Award} label="Wins" active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} />
            </nav>
        </div>
    )
}

function RewardCard({ title, cost, balance, icon: Icon, color }: any) {
    const isUnlocked = balance >= cost;
    return (
        <div className={cn(
            "glass-card p-6 rounded-[40px] flex justify-between items-center transition-all border",
            isUnlocked ? "border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.2)] bg-yellow-400/10" : "border-white/5 opacity-40 shadow-2xl"
        )}>
            <div className="flex items-center gap-4 text-left">
                <div className={cn("p-3 rounded-2xl text-white shadow-lg", color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-tight text-white">{title}</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        {isUnlocked ? "READY TO CLAIM" : `$${cost.toFixed(2)} Required`}
                    </span>
                </div>
            </div>
            {isUnlocked ? (
                <button className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl animate-pulse shadow-glow">REDEEM</button>
            ) : (
                <Lock className="h-4 w-4 text-white/20" />
            )}
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

// ICON HELPER
function Layers(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    )
}
