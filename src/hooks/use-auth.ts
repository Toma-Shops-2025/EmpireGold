import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (data) setProfile(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
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

  const addCash = async (amount: number) => {
    if (!user) return;
    const val = parseFloat(amount.toFixed(2));

    try {
        // 1. Try the atomic RPC call
        const { data: newBalance, error } = await supabase.rpc('increment_cash_balance', {
            user_id: user.id,
            amount: val
        });

        if (error) throw error;

        // 2. If successful, update local state immediately
        if (newBalance !== null) {
            setProfile((prev: any) => ({ ...prev, cash_balance: newBalance }));
        }

        // 3. Force a fresh fetch just to be 100% sure
        await fetchProfile(user.id);

    } catch (e) {
        console.error("Balance update failed, trying fallback...", e);

        // FALLBACK: If RPC fails, try a direct update (less secure but works if RPC isn't set up)
        const currentBalance = parseFloat(profile?.cash_balance || 0);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ cash_balance: currentBalance + val })
            .eq('id', user.id);

        if (!updateError) fetchProfile(user.id);
    }
  };

  const signIn = (e: string, p: string) => supabase.auth.signInWithPassword({ email: e, password: p });
  const signUp = (e: string, p: string, u: string) => supabase.auth.signUp({ email: e, password: p, options: { data: { username: u } } });
  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile };
}
