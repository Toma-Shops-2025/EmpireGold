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

        if (error) {
            console.error("Error fetching profile:", error);
            return;
        }

        if (!data) {
            const { data: { session } } = await supabase.auth.getSession();
            const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Member';

            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({ id: userId, username: username, cash_balance: 0 })
                .select()
                .single();

            if (!createError) setProfile(newProfile);
        } else {
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
        const { data: newBalance, error: rpcError } = await supabase.rpc('increment_cash_balance', {
            user_id: user.id,
            amount: val
        });

        if (rpcError) {
            console.warn("RPC failed, attempting manual update fallback...");

            // 2. FALLBACK: Manual update
            const { data: current } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single();
            const updatedBalance = parseFloat(((current?.cash_balance || 0) + val).toFixed(2));

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ cash_balance: updatedBalance })
                .eq('id', user.id);

            if (updateError) throw updateError;
            setProfile((prev: any) => ({ ...prev, cash_balance: updatedBalance }));
        } else {
            setProfile((prev: any) => ({ ...prev, cash_balance: newBalance }));
        }

        // Final sync
        await fetchProfile(user.id);

    } catch (e: any) {
        console.error("Sync Error:", e);
        toast.error("Vault Sync Error", {
            description: "If you haven't run the SQL script in Supabase, your balance cannot be saved.",
            duration: 10000
        });
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
          await supabase.from('profiles').insert({ id: data.user.id, username: u, cash_balance: 0 });
      }
  };

  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile };
}
