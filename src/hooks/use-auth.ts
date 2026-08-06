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
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (data) {
            setProfile(data);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Handle Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else { setLoading(false); }
    });

    // 2. Handle Auth Changes
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

    // 3. REAL-TIME BALANCE UPDATES
    let profileSubscription: any;
    if (user) {
        profileSubscription = supabase
            .channel(`profile-${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`
            }, (payload) => {
                setProfile(payload.new);
            })
            .subscribe();
    }

    return () => {
        subscription.unsubscribe();
        if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, [user, fetchProfile]);

  const addCash = async (amount: number) => {
    if (!user) return;
    const val = parseFloat(amount.toFixed(4));

    try {
        const { error: rpcError } = await supabase.rpc('increment_cash_balance', {
            user_id: user.id,
            amount: val
        });

        if (rpcError) {
            const { data: current } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single();
            const newTotal = parseFloat(((current?.cash_balance || 0) + val).toFixed(4));
            await supabase.from('profiles').update({ cash_balance: newTotal }).eq('id', user.id);
        }
    } catch (e: any) {
        console.error("Vault Error:", e);
    }
  };

  const signIn = async (email: string, pass: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email, password: pass });
      if (error) throw error;
  };

  const signUp = async (email: string, pass: string, username: string) => {
      const { data, error } = await supabase.auth.signUp({
          email: email,
          password: pass,
          options: { data: { username } }
      });
      if (error) throw error;
      if (data.user) {
          await supabase.from('profiles').insert({
              id: data.user.id,
              username,
              email,
              cash_balance: 0
          });
      }
  };

  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile, supabase };
}
