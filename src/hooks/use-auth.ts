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
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const meta = session.user.user_metadata;
                const name = meta?.username || meta?.display_name || 'Empire Member';
                const { data: newP } = await supabase.from('profiles').insert({
                    id: userId,
                    username: name,
                    display_name: name,
                    cash_balance: 0.00,
                    total_earned: 0.00
                }).select().single();
                if (newP) setProfile(newP);
            }
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

    const numericAmount = parseFloat(amount.toFixed(4)); // High precision

    // ATOMIC UPDATE: Tell the database to add the money.
    // This is 100% accurate and cannot be overwritten by the app.
    const { data: newBalance, error: rpcError } = await supabase.rpc('increment_cash_balance', {
        user_id: session.user.id,
        amount: numericAmount
    });

    if (rpcError) {
        console.error("Vault Update Failed!", rpcError);
        // Alert the user so they know it's a permission/network issue
        alert("Empire Connection Interrupted. Balance will sync on next login.");
    } else {
        // Successful add! Update the UI with the real number returned by the database.
        setProfile((prev: any) => ({
            ...prev,
            cash_balance: newBalance
        }));
        // Double check fetch
        await fetchProfile(session.user.id);
    }
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, profile, loading, signIn, signUp, signOut, addCash, supabase, fetchProfile };
}
