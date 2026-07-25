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
        if (data) {
            setProfile(data);
        } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: newP } = await supabase.from('profiles').upsert({
                    id: userId,
                    cash_balance: 0.00,
                    total_earned: 0.00
                }).select().single();
                if (newP) setProfile(newP);
            }
        }
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

    // 1. Try the Database Function (Fastest/Safest)
    const { data: newBalance, error } = await supabase.rpc('increment_cash_balance', {
        user_id: user.id,
        amount: val
    });

    if (error) {
        console.warn("RPC failed, falling back to manual update", error);
        // 2. Fallback: Manual Math (Guaranteed to work)
        const { data: current } = await supabase.from('profiles').select('cash_balance, total_earned').eq('id', user.id).single();
        const updatedBal = (parseFloat(current?.cash_balance || 0) + val).toFixed(2);
        const updatedTotal = (parseFloat(current?.total_earned || 0) + val).toFixed(2);

        await supabase.from('profiles').update({
            cash_balance: updatedBal,
            total_earned: updatedTotal
        }).eq('id', user.id);

        await fetchProfile(user.id);
    } else {
        // Update local UI immediately with the DB response
        setProfile((prev: any) => ({ ...prev, cash_balance: newBalance }));
        await fetchProfile(user.id);
    }
  };

  const signIn = (e: string, p: string) => supabase.auth.signInWithPassword({ email: e, password: p });
  const signUp = (e: string, p: string, u: string) => supabase.auth.signUp({ email: e, password: p, options: { data: { username: u } } });
  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile };
}
