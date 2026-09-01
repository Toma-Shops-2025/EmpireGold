import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isInitialFetchDone = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (data) {
            setProfile(data);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          if (!isInitialFetchDone.current) {
            fetchProfile(session.user.id);
            isInitialFetchDone.current = true;
          }
      } else { setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`profile-${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => { setProfile(payload.new); })
        .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addCash = useCallback(async (score: number, game = 'playnpayday_action') => {
    if (!user) return 0;

    try {
        const { data, error } = await supabase.rpc('claim_game_reward', {
            p_game: game,
            p_score: Math.floor(score)
        });

        if (error) {
            console.error("Reward claim failed:", error);
            toast.error(error.message || "Unable to claim reward.");
            return 0;
        }

        const reward = Number(data || 0);

        // Refresh the profile immediately after a successful reward.
        await fetchProfile(user.id);

        return reward;
    } catch (e: any) {
        console.error("Reward claim failed:", e);
        toast.error(e.message || "Unable to claim reward.");
        return 0;
    }
  }, [user, fetchProfile]);

  const deductCash = useCallback(async (dollarAmount: number) => {
    if (!user || dollarAmount <= 0) return false;

    try {
      const { data: curr, error: fetchErr } = await supabase
        .from('profiles')
        .select('cash_balance')
        .eq('id', user.id)
        .single();

      if (fetchErr || !curr) {
        toast.error("Unable to read balance.");
        return false;
      }

      const current = parseFloat(curr.cash_balance?.toString() || '0');
      if (current < dollarAmount) {
        toast.error("Insufficient balance.");
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ cash_balance: Number((current - dollarAmount).toFixed(4)) })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message || "Unable to deduct balance.");
        return false;
      }

      await fetchProfile(user.id);
      return true;
    } catch (e: any) {
      toast.error(e.message || "Unable to deduct balance.");
      return false;
    }
  }, [user, fetchProfile]);

  const signIn = useCallback(async (e: string, p: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
      if (error) throw error;
  }, []);

  const signUp = useCallback(async (e: string, p: string, u: string) => {
      const { data, error } = await supabase.auth.signUp({ email: e, password: p, options: { data: { username: u } } });
      if (error) throw error;
      if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, username: u, email: e, cash_balance: 0 });
      }
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { user, profile, loading, signIn, signUp, signOut, addCash, deductCash, fetchProfile, supabase };
}
