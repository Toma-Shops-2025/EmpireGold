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
        // Fetch profile
        let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
            return;
        }

        // If no profile, create one (Crucial for new users/projects)
        if (!data) {
            const { data: { session } } = await supabase.auth.getSession();
            const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Member';

            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    username: username,
                    cash_balance: 0
                })
                .select()
                .single();

            if (createError) {
                console.error("Error creating profile:", createError);
            } else {
                setProfile(newProfile);
            }
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
        // 1. Try the atomic RPC call (The best way)
        const { data: newBalance, error } = await supabase.rpc('increment_cash_balance', {
            user_id: user.id,
            amount: val
        });

        if (!error) {
            setProfile((prev: any) => ({ ...prev, cash_balance: newBalance }));
            return newBalance;
        }

        // 2. FALLBACK: Direct table update if RPC fails
        // Get freshest balance first
        const { data: freshData, error: fetchError } = await supabase
            .from('profiles')
            .select('cash_balance')
            .eq('id', user.id)
            .single();

        if (fetchError) throw fetchError;

        const currentBalance = parseFloat(freshData?.cash_balance || 0);
        const updatedBalance = parseFloat((currentBalance + val).toFixed(2));

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ cash_balance: updatedBalance })
            .eq('id', user.id);

        if (updateError) throw updateError;

        setProfile((prev: any) => ({ ...prev, cash_balance: updatedBalance }));
        return updatedBalance;

    } catch (e: any) {
        console.error("Balance update failed:", e);
        toast.error("Vault Sync Error", { description: e.message || "Could not update balance." });
        return null;
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
          // Manually create profile immediately to avoid race conditions
          await supabase.from('profiles').upsert({ id: data.user.id, username: u, cash_balance: 0 });
      }
  };

  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile };
}
