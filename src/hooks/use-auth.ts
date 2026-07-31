import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import { toast } from 'sonner';

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
            const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Member';
            const { data: newP } = await supabase.from('profiles').insert({ id: userId, username: username, cash_balance: 0 }).select().single();
            if (newP) setProfile(newP);
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

    try {
        console.log(`Vault: Adding $${val}...`);

        // 1. Try the RPC call
        const { data: rpcResult, error: rpcError } = await supabase.rpc('increment_cash_balance', {
            user_id: user.id,
            amount: val
        });

        if (rpcError) {
            console.warn("RPC failed, trying direct table update...", rpcError);

            // 2. Fallback: Manual calculation and update
            const { data: current } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single();
            const newTotal = parseFloat(((current?.cash_balance || 0) + val).toFixed(2));

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ cash_balance: newTotal })
                .eq('id', user.id);

            if (updateError) throw updateError;
        }

        // 3. FORCE REFRESH: Pull the data immediately after saving
        await fetchProfile(user.id);
        console.log("Vault: Sync Complete.");

    } catch (e: any) {
        console.error("Vault Error:", e);
        toast.error("Vault Sync Error", { description: e.message || "Database connection lost." });
    }
  };

  const signIn = async (e: string, p: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
      if (error) throw error;
  };

  const signUp = async (e: string, p: string, u: string) => {
      const { data, error } = await supabase.auth.signUp({
          email: e,
          password: p,
          options: { data: { username: u } }
      });
      if (error) throw error;
      if (data.user) {
          // Now including email in the profile record
          await supabase.from('profiles').insert({
              id: data.user.id,
              username: u,
              email: e,
              cash_balance: 0
          });
      }
  };

  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile };
}
