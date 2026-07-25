import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { CONFIG } from '@/config'
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'
import {
    Wallet, Play, Gamepad2, Coins, TrendingUp, Trophy,
    Gift, ArrowRight, Loader2, Sparkles, Zap, Flame,
    User as UserIcon, LogOut, ChevronRight, Clock, Star,
    ClipboardCheck, History, MousePointer2, ExternalLink,
    X, LayoutGrid, Award, ShoppingBag, CreditCard, Lock, Mail, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

// THE EMPIRE GOLD CATALOG
const GAME_CATALOG = [
    { id: 'g1', name: 'Subway Surfers', category: 'Action', url: 'https://poki.com/en/g/subway-surfers', img: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&q=80', reward: 1.20 },
    { id: 'g2', name: 'Temple Run 2', category: 'Running', url: 'https://poki.com/en/g/temple-run-2', img: 'https://images.unsplash.com/photo-1550745671-03d630974922?w=400&q=80', reward: 0.80 },
    { id: 'g3', name: 'Moto X3M', category: 'Racing', url: 'https://poki.com/en/g/moto-x3m', img: 'https://images.unsplash.com/photo-1558981403-c5f91cbba523?w=400&q=80', reward: 2.50 },
    { id: 'g4', name: 'Crossy Road', category: 'Arcade', url: 'https://poki.com/en/g/crossy-road', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80', reward: 1.00 },
    { id: 'g5', name: 'Brain Test', category: 'Puzzle', url: 'https://poki.com/en/g/brain-test-tricky-puzzles', img: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=400&q=80', reward: 5.00 },
    { id: 'g6', name: 'Fruit Ninja', category: 'Skill', url: 'https://poki.com/en/g/fruit-ninja', img: 'https://images.unsplash.com/photo-1567531934444-bc4159c6ce81?w=400&q=80', reward: 1.50 },
    { id: 'g7', name: 'Stickman Hook', category: 'Action', url: 'https://poki.com/en/g/stickman-hook', img: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80', reward: 0.75 },
    { id: 'g8', name: 'Bubble Shooter', category: 'Puzzle', url: 'https://poki.com/en/g/bubble-shooter', img: 'https://images.unsplash.com/photo-1553481199-6565a5bbdd1f?w=400&q=80', reward: 3.00 },
    { id: 'g9', name: 'Jetpack Joyride', category: 'Action', url: 'https://poki.com/en/g/jetpack-joyride', img: 'https://images.unsplash.com/photo-1550745671-03d630974922?w=400&q=80', reward: 2.00 },
    { id: 'g10', name: 'Vex 4', category: 'Platformer', url: 'https://poki.com/en/g/vex-4', img: 'https://images.unsplash.com/photo-1558981403-c5f91cbba523?w=400&q=80', reward: 1.80 },
];

const REWARDS = [
    { id: 'v5', name: '$5 Visa Card', cost: 5.00, type: 'Visa' },
    { id: 'a5', name: '$5 Amazon Gift', cost: 5.00, type: 'Amazon' },
    { id: 'p5', name: '$5 PayPal Cash', cost: 5.00, type: 'PayPal' },
    { id: 'v10', name: '$10 Visa Card', cost: 10.00, type: 'Visa' },
    { id: 'a10', name: '$10 Amazon Gift', cost: 10.00, type: 'Amazon' },
    { id: 'p10', name: '$10 PayPal Cash', cost: 10.00, type: 'PayPal' },
];

function AppBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
            src="/bg-gold.png"
            className="w-full h-full object-cover opacity-30 animate-in fade-in duration-1000"
            alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4c1d95]/80 via-black/85 to-black" />
    </div>
  )
}

export default function EmpireGoldHub() {
    const auth = useAuth()
    const [activeTab, setActiveTab] = useState<'home' | 'games' | 'payouts'>('home')
    const [activeGame, setActiveGame] = useState<any>(null)
    const [isAdLoading, setIsAdLoading] = useState(false)

    // Auth UI States
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [agreed, setAgreed] = useState(false)

    useEffect(() => {
        if (!auth.user) return;
        const isNative = (window as any).Capacitor?.isNativePlatform();
        if (isNative) {
            AdMob.initialize().then(() => {
                AdMob.showBanner({
                    adId: CONFIG.ADMOB_BANNER_ID,
                    position: BannerAdPosition.TOP_CENTER,
                    size: BannerAdSize.BANNER,
                    isTesting: CONFIG.IS_TESTING,
                    margin: 0
                });
            });
        }
    }, [auth.user]);

    const openGame = async (game: any) => {
        setIsAdLoading(true);
        const isNative = (window as any).Capacitor?.isNativePlatform();
        if (isNative) {
            try {
                await AdMob.prepareInterstitialAd({ adId: CONFIG.ADMOB_INTERSTITIAL_ID });
                await AdMob.showInterstitialAd();
            } catch(e) {}
        }
        setIsAdLoading(false);
        setActiveGame(game);
    }

    const closeGame = async () => {
        const game = activeGame;
        setActiveGame(null);
        setIsAdLoading(true);
        const isNative = (window as any).Capacitor?.isNativePlatform();
        if (isNative) {
            try {
                await AdMob.prepareInterstitialAd({ adId: CONFIG.ADMOB_INTERSTITIAL_ID });
                await AdMob.showInterstitialAd();
            } catch(e) {}
        }
        await auth.addCash(0.05);
        toast.success(`${game?.name} progress saved! +$0.05`, { icon: '💰' });
        setIsAdLoading(false);
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLogin && !agreed) return toast.error("Please agree to terms.");
        try {
            if (isLogin) await auth.signIn(email, password);
            else await auth.signUp(email, password, username);
        } catch (err: any) { toast.error(err.message); }
    }

    const handleEmpireBoost = async () => {
        setIsAdLoading(true);
        const isNative = (window as any).Capacitor?.isNativePlatform();
        if (isNative) {
            try {
                await AdMob.prepareRewardVideoAd({ adId: CONFIG.ADMOB_REWARDED_ID });
                await AdMob.showRewardVideoAd();
            } catch(e) {}
        }
        await auth.addCash(0.50);
        toast.success("Empire Boost Applied! +$0.50");
        setIsAdLoading(false);
    }

    if (auth.loading || isAdLoading) return (
        <div className="h-screen w-full bg-[#5b21b6] flex flex-col items-center justify-center text-white p-8">
            <AppBackground />
            <Loader2 className="animate-spin h-16 w-16 mb-6 text-yellow-400 relative z-10" />
            <span className="text-xs font-black uppercase tracking-[0.4em] animate-pulse text-center relative z-10">Entering Empire Vault...</span>
        </div>
    );

    if (!auth.user) {
        return (
            <div className="h-[100dvh] w-full flex flex-col items-center justify-start p-8 pt-24 text-white relative overflow-y-auto no-scrollbar">
                <AppBackground />
                <img src="/logo.png" className="w-40 h-40 mb-6 drop-shadow-glow relative z-10" alt="Logo" />
                <h1 className="text-6xl font-black italic mb-2 tracking-tighter uppercase text-center leading-none relative z-10">
                    Empire<br/><span className="text-yellow-400 font-serif">Gold</span>
                </h1>

                <form onSubmit={handleAuth} className="w-full max-w-sm space-y-3 relative z-10 mt-8 pb-20">
                    {!isLogin && (
                        <div className="bg-white/10 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                            <UserIcon className="h-5 w-5 text-white/40 mr-3" />
                            <input type="text" placeholder="Username" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                    )}
                    <div className="bg-white/10 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <Mail className="h-5 w-5 text-white/40 mr-3" />
                        <input type="email" placeholder="Email" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="bg-white/10 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                        <Lock className="h-5 w-5 text-white/40 mr-3" />
                        <input type="password" placeholder="Password" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {!isLogin && (
                        <div className="flex items-center gap-3 px-2 py-2">
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-yellow-400" />
                            <span className="text-[10px] text-white/40 font-bold uppercase">I agree to the Royal Terms</span>
                        </div>
                    )}
                    <button type="submit" className="w-full bg-white text-[#4c1d95] py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-4">
                        {isLogin ? 'Enter Vault' : 'Join Empire'}
                    </button>
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-xs text-white/40 font-bold uppercase mt-6 underline tracking-widest relative z-10">
                        {isLogin ? "Need a membership? Sign Up" : "Back to Login"}
                    </button>
                </form>
            </div>
        )
    }

    const rawBalance = auth.profile?.cash_balance || 0;
    const cashBalance = typeof rawBalance === 'number' ? rawBalance : parseFloat(rawBalance) || 0;

    // Progress relative to next available card (starting at $5.00)
    const nextMilestone = REWARDS.find(r => cashBalance < r.cost)?.cost || 50.00;
    const goalProgress = Math.min(100, Math.max(0, Math.floor((cashBalance / nextMilestone) * 100))) || 0;

    return (
        <div className="h-screen w-full text-slate-900 flex flex-col overflow-hidden font-sans relative">
            <AppBackground />

            {/* ROYAL HEADER */}
            <div className="pt-16 pb-12 px-6 rounded-b-[60px] shadow-2xl relative overflow-hidden glass-panel z-10">
                <div className="flex justify-between items-start mb-10 relative z-10 text-white">
                    <div className="space-y-1 text-left">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Empire Balance</span>
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-400/20 p-2 rounded-xl border border-yellow-400/20">
                                <Coins className="h-6 w-6 text-yellow-400 drop-shadow-glow" />
                            </div>
                            <span className="text-5xl font-black text-white italic tracking-tighter animate-in fade-in zoom-in duration-700">${cashBalance.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* HEATMAP PROGRESS */}
                <div className="space-y-3 relative z-10 px-1">
                    <div className="flex justify-between text-[11px] font-black text-white uppercase italic tracking-wider">
                        <span>{goalProgress >= 100 ? "Reward Available!" : "One step away!"}</span>
                        <span className="text-yellow-400">{goalProgress}%</span>
                    </div>
                    <div className="h-5 w-full bg-black/30 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 rounded-full shadow-glow transition-all duration-1000 ease-out"
                            style={{ width: `${goalProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ACTION LINKS */}
            <div className="grid grid-cols-2 gap-4 px-6 -translate-y-8 relative z-20">
                <button onClick={() => setActiveTab('home')} className="bg-[#0ea5e9]/90 backdrop-blur-md p-5 rounded-3xl flex items-center justify-between shadow-xl active:scale-95 transition-all text-white border-b-8 border-black/10">
                    <div className="flex flex-col text-left">
                        <span className="font-black uppercase text-[10px] opacity-60">Cash</span>
                        <span className="font-black uppercase text-sm">Flow</span>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                </button>
                <button onClick={() => setActiveTab('payouts')} className="bg-[#ea580c]/90 backdrop-blur-md p-5 rounded-3xl flex items-center justify-between shadow-xl active:scale-95 transition-all text-white border-b-8 border-black/10">
                    <div className="flex flex-col text-left">
                        <span className="font-black uppercase text-[10px] opacity-60">Collect</span>
                        <span className="font-black uppercase text-sm">Wealth</span>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Wallet className="h-4 w-4" />
                    </div>
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-6 pt-2 pb-32 no-scrollbar relative z-10">

                {activeTab === 'home' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">

                        {/* AD BOOST CARD */}
                        <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-6 rounded-[35px] shadow-lg flex items-center justify-between active:scale-95 transition-all">
                            <div className="flex flex-col text-left">
                                <span className="font-black text-white uppercase text-sm leading-none">Empire Boost</span>
                                <span className="text-[10px] text-white/60 font-bold uppercase mt-1">Watch Ad for $0.50</span>
                            </div>
                            <button
                                onClick={handleEmpireBoost}
                                className="bg-white text-emerald-700 p-4 rounded-2xl shadow-xl"
                            >
                                <Zap className="h-6 w-6 fill-current" />
                            </button>
                        </div>

                        {/* ROYAL QUESTS */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2 text-white">
                                <Trophy className="h-4 w-4 text-yellow-400 fill-current" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic">Royal Quests</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {GAME_CATALOG.slice(0, 4).map(game => (
                                    <TaskCard
                                        key={game.id}
                                        title={game.name}
                                        desc={game.category}
                                        reward={`$${game.reward.toFixed(2)}`}
                                        img={game.img}
                                        onClick={() => openGame(game)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* GLOBAL LIBRARY */}
                        <div className="space-y-4 pb-12 border-t border-white/5 pt-8">
                            <div className="flex items-center gap-2 px-2 text-white">
                                <LayoutGrid className="h-4 w-4 opacity-40" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Global Library</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {GAME_CATALOG.slice(4).map(game => (
                                    <div key={game.id} onClick={() => openGame(game)} className="glass-card p-4 rounded-[35px] active:scale-95 transition-all text-center">
                                        <img src={game.img} className="w-full h-24 object-cover rounded-[24px] mb-3" />
                                        <span className="block font-black text-[10px] uppercase truncate text-white">{game.name}</span>
                                        <span className="block text-[8px] font-bold text-green-400 mt-1">${game.reward.toFixed(2)} Rewards</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'games' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                         <h2 className="text-4xl font-black italic uppercase text-center mt-4 text-white">Empire <span className="text-primary">Arcade</span></h2>
                         <div className="grid grid-cols-2 gap-4 pb-32">
                            {GAME_CATALOG.map(game => (
                                <div key={game.id} onClick={() => openGame(game)} className="glass-card p-2 rounded-[35px] active:scale-95 transition-all relative overflow-hidden">
                                    <img src={game.img} className="w-full h-40 object-cover rounded-[30px]" />
                                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md p-3 rounded-2xl">
                                        <span className="block text-[10px] font-black text-white uppercase truncate">{game.name}</span>
                                        <span className="block text-[8px] font-bold text-yellow-400 mt-0.5">${game.reward.toFixed(2)} Goal</span>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300 px-2 pb-32">
                        <h2 className="text-4xl font-black italic uppercase text-center mt-4 text-white">Empire <span className="text-primary">Vault</span></h2>

                        <div className="glass-panel p-8 rounded-[50px] shadow-2xl relative overflow-hidden">
                             <div className="flex justify-between items-start">
                                <Gift className="h-12 w-12 text-primary mb-4" />
                                <div className="text-right">
                                    <span className="block text-[8px] font-black text-white/40 uppercase">Vault Secure</span>
                                    <span className="text-2xl font-black italic text-white">${cashBalance.toFixed(2)}</span>
                                </div>
                             </div>
                             <h3 className="text-2xl font-black uppercase italic leading-none mb-2 text-white">Jackpot Rewards</h3>
                             <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-6 leading-tight italic underline decoration-yellow-400/20">Redeem points for real world money</p>
                             <button className="w-full bg-white text-slate-900 font-black py-5 rounded-3xl uppercase tracking-widest text-xs active:scale-95 transition-transform relative z-[100]" onClick={() => setActiveTab('home')}>Browse Catalog</button>
                        </div>

                        <div className="space-y-3">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-4 text-white">Available Prizes</h4>
                             {REWARDS.map(r => (
                                 <RewardCard key={r.id} title={r.name} cost={`$${r.cost.toFixed(2)}`} icon={r.type === 'PayPal' ? Wallet : CreditCard} color={r.type === 'Amazon' ? "bg-orange-500" : r.type === 'PayPal' ? "bg-green-600" : "bg-blue-600"} locked={cashBalance < r.cost} />
                             ))}
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-4 text-center pb-20 relative z-10">
                            <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] text-white">Active Player</div>
                            <span className="text-xl font-black italic border-b border-primary/20 pb-1 text-primary">{auth.profile?.username || 'Empire Member'}</span>
                            <button onClick={auth.signOut} className="flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest active:scale-90 transition-all mt-4"><LogOut className="h-4 w-4" /> Exit Vault</button>
                        </div>
                    </div>
                )}
            </div>

            {/* GAME PLAYER */}
            {activeGame && (
                <div className="fixed inset-0 z-[10000] bg-black animate-in fade-in duration-300 flex flex-col">
                    <div className="h-20 bg-slate-900 flex items-center justify-between px-6 border-b border-white/10">
                        <div className="flex items-center gap-3 text-left">
                            <div className="bg-primary/20 p-2 rounded-lg">
                                <Gamepad2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <span className="block text-xs font-black text-white uppercase">{activeGame.name}</span>
                                <span className="block text-[9px] font-bold text-green-500 uppercase tracking-tighter">Empire Sync Active</span>
                            </div>
                        </div>
                        <button onClick={closeGame} className="bg-white/10 p-3 rounded-full active:scale-90 transition-transform">
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    <iframe
                        src={activeGame.url}
                        className="flex-1 w-full border-none"
                        allow="autoplay; gamepad; fullscreen"
                    />
                </div>
            )}

            {/* BOTTOM NAVIGATION */}
            <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-3xl border-t border-slate-200 flex justify-around items-center px-4 pb-4 z-[5000] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <NavButton icon={TrendingUp} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavButton icon={Gamepad2} label="Arcade" active={activeTab === 'games'} onClick={() => setActiveTab('games')} />
                <NavButton icon={Award} label="Wins" active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} />
            </nav>
        </div>
    )
}

function TaskCard({ title, desc, reward, img, onClick }: any) {
    return (
        <div onClick={onClick} className="glass-card p-4 rounded-[40px] shadow-sm flex items-center justify-between active:scale-[0.98] transition-all group">
            <div className="flex items-center gap-4 text-left">
                <img src={img} className="w-14 h-14 rounded-[20px] object-cover shadow-lg border border-white/5" />
                <div className="flex flex-col">
                    <span className="font-black text-white uppercase text-xs tracking-tight leading-none">{title}</span>
                    <span className="text-[9px] text-white/40 font-bold mt-1 uppercase tracking-wider">{desc}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="bg-green-500/20 text-green-400 border border-green-500/20 font-black px-3 py-2 rounded-xl text-[9px]">{reward}</span>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-yellow-400 transition-colors" />
            </div>
        </div>
    )
}

function RewardCard({ title, cost, icon: Icon, color, locked }: any) {
    return (
        <div className={cn("glass-card p-5 rounded-[35px] flex justify-between items-center shadow-sm", locked && "opacity-40")}>
            <div className="flex items-center gap-4 text-left">
                <div className={cn("p-3 rounded-2xl text-white shadow-lg", color)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-tight text-white">{title}</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{cost} Required</span>
                </div>
            </div>
            {locked ? <Lock className="h-4 w-4 text-white/20" /> : <ChevronRight className="h-4 w-4 text-white/60" />}
        </div>
    )
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
      <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1 w-20 py-2 transition-all active:scale-90", active ? "text-purple-600" : "text-slate-400")}>
        <Icon className={cn("h-6 w-6", active && "fill-current")} />
        <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "opacity-100" : "opacity-40")}>{label}</span>
      </button>
    );
}
