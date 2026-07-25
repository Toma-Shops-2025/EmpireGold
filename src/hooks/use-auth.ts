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
        // Fetch using a simple select to be more resilient than .single()
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId);

        if (error) {
            console.error("Error fetching profile:", error);
            return;
        }

        if (!data || data.length === 0) {
            const { data: { session } } = await supabase.auth.getSession();
            const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Member';

            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({ id: userId, username: username, cash_balance: 0 })
                .select()
                .single();

            if (!createError) setProfile(newProfile);
        } else {
            setProfile(data[0]);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else { setLoading(false); }
    });

    // Auth Change Listener
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

  // REAL-TIME SUBSCRIPTION
  // This makes the UI update INSTANTLY when the database changes
  useEffect(() => {
      if (!user) return;

      const channel = supabase
          .channel('schema-db-changes')
          .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
              (payload) => {
                  setProfile(payload.new);
              }
          )
          .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addCash = async (amount: number) => {
    if (!user) return;
    const val = parseFloat(amount.toFixed(2));

    try {
        // Try the atomic RPC call
        const { error: rpcError } = await supabase.rpc('increment_cash_balance', {
            user_id: user.id,
            amount: val
        });

        if (rpcError) {
            console.warn("RPC failed, attempting manual update fallback...");

            const { data: current } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single();
            const updatedBalance = parseFloat(((current?.cash_balance || 0) + val).toFixed(2));

            await supabase
                .from('profiles')
                .update({ cash_balance: updatedBalance })
                .eq('id', user.id);
        }

        // We don't need to manually refetch here because the Realtime listener above will catch it!

    } catch (e: any) {
        console.error("Sync Error:", e);
        toast.error("Vault Sync Error", { description: "Database rejected the save. Please check your connection." });
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
