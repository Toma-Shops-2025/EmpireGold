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
        // 1. Get the current profile
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
            return;
        }

        // 2. If it doesn't exist, create it (WITHOUT resetting balance if it somehow exists)
        if (!data) {
            const { data: { session } } = await supabase.auth.getSession();
            const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Member';

            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    username: username,
                    cash_balance: 0
                }, { onConflict: 'id' }) // Only insert if not exists
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
        // 1. Try RPC (Atomic)
        const { data: rpcResult, error: rpcError } = await supabase.rpc('increment_cash_balance', {
            user_id: user.id,
            amount: val
        });

        // 2. If RPC failed or returned nothing, do manual update
        if (rpcError || rpcResult === null || rpcResult === undefined) {
            console.warn("RPC failed or returned null, falling back to manual update...");

            const { data: current, error: fetchError } = await supabase
                .from('profiles')
                .select('cash_balance')
                .eq('id', user.id)
                .single();

            if (fetchError) throw fetchError;

            const newTotal = parseFloat(((current?.cash_balance || 0) + val).toFixed(2));

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ cash_balance: newTotal })
                .eq('id', user.id);

            if (updateError) throw updateError;
        }

        // 3. ALWAYS refetch the profile after any update to ensure UI is in sync with DB
        await fetchProfile(user.id);

    } catch (e: any) {
        console.error("Critical: Balance update failed", e);
        toast.error("Vault Sync Error", { description: "Please refresh the page and try again." });
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
          await supabase.from('profiles').upsert({ id: data.user.id, username: u, cash_balance: 0 });
      }
  };

  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile };
}
