import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isInitialFetchDone = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (data) {
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
          if (!isInitialFetchDone.current) {
            fetchProfile(session.user.id);
            isInitialFetchDone.current = true;
          }
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

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`profile-${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => { setProfile(payload.new); })
        .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addCash = useCallback(async (amount: number) => {
    if (!user) return;
    const val = parseFloat(amount.toFixed(4));
    try {
        const { error: rpcError } = await supabase.rpc('increment_cash_balance', { user_id: user.id, amount: val });
        if (rpcError) {
            const { data: current } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single();
            const newTotal = parseFloat(((current?.cash_balance || 0) + val).toFixed(4));
            await supabase.from('profiles').update({ cash_balance: newTotal }).eq('id', user.id);
        }
    } catch (e: any) { console.error(e); }
  }, [user]);

  const signIn = useCallback(async (e: string, p: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
      if (error) throw error;
  }, []);

  const signUp = useCallback(async (e: string, p: string, u: string) => {
      const { data, error } = await supabase.auth.signUp({ email: e, password: p, options: { data: { username: u } } });
      if (error) throw error;
      if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, username: u, email: e, cash_balance: 0 });
      }
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile, supabase };
}
