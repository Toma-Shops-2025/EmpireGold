import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (data) {
            setProfile(data);
        } else if (error) {
            console.error("Error fetching profile:", error);
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

    // 1. Try the atomic RPC call (Best Practice)
    const { data: newBalance, error } = await supabase.rpc('increment_cash_balance', {
        user_id: user.id,
        amount: val
    });

    if (!error) {
        setProfile((prev: any) => ({ ...prev, cash_balance: newBalance }));
        return newBalance;
    } else {
        console.warn("RPC failed, attempting direct update fallback...");

        // 2. FALLBACK: Direct table update if RPC isn't found
        // First, get the freshest balance
        const { data: currentData } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single();
        const currentBalance = parseFloat(currentData?.cash_balance || 0);
        const updatedBalance = currentBalance + val;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ cash_balance: updatedBalance })
            .eq('id', user.id);

        if (!updateError) {
            setProfile((prev: any) => ({ ...prev, cash_balance: updatedBalance }));
            return updatedBalance;
        }
    }
    return null;
  };

  const signIn = (e: string, p: string) => supabase.auth.signInWithPassword({ email: e, password: p });
  const signUp = (e: string, p: string, u: string) => supabase.auth.signUp({ email: e, password: p, options: { data: { username: u } } });
  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile };
}
