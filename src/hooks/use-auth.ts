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
        } else {
            console.log("Auth: Profile row missing, creating...");
            const { data: { session } } = await supabase.auth.getSession();
            const meta = session?.user?.user_metadata;
            const displayName = meta?.username || meta?.display_name || 'Empire Member';

            const { data: newP } = await supabase.from('profiles').upsert({
                id: userId,
                username: displayName,
                display_name: displayName,
                cash_balance: 0.00,
                total_earned: 0.00
            }).select().single();
            if (newP) setProfile(newP);
        }
    } catch (e) {
        console.error("fetchProfile error", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setLoading(false);
      }
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

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { username, display_name: username } }
    });
    if (error) throw error;
    if (data.user) {
        await supabase.from('profiles').insert({
            id: data.user.id,
            username,
            display_name: username,
            cash_balance: 0.00,
            total_earned: 0.00
        });
    }
  };

  const addCash = useCallback(async (amount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // 1. UPDATE UI INSTANTLY (Optimistic UI)
    setProfile((prev: any) => {
        if (!prev) return prev;
        const currentBal = parseFloat(prev.cash_balance?.toString() || "0");
        const currentTotal = parseFloat(prev.total_earned?.toString() || "0");
        return {
            ...prev,
            cash_balance: (currentBal + amount).toFixed(2),
            total_earned: (currentTotal + (amount > 0 ? amount : 0)).toFixed(2)
        };
    });

    // 2. SAVE TO DATABASE
    const numericAmount = parseFloat(amount.toFixed(2));
    const { error: rpcError } = await supabase.rpc('increment_cash_balance', {
        user_id: session.user.id,
        amount: numericAmount
    });

    if (rpcError) {
        console.warn("RPC failed, using manual patch", rpcError);
        const { data: current } = await supabase.from('profiles').select('cash_balance, total_earned').eq('id', session.user.id).single();
        const oldBal = parseFloat(current?.cash_balance?.toString() || "0");
        const oldTotal = parseFloat(current?.total_earned?.toString() || "0");

        await supabase.from('profiles').update({
            cash_balance: (oldBal + numericAmount).toFixed(2),
            total_earned: (oldTotal + (numericAmount > 0 ? numericAmount : 0)).toFixed(2)
        }).eq('id', session.user.id);
    }

    // 3. FORCE SYNC (Final verify)
    await fetchProfile(session.user.id);
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, profile, loading, signIn, signUp, signOut, addCash, supabase, fetchProfile };
}
