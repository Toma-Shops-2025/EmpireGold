import { createClient } from '@supabase/supabase-js';

function createSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_API;

  if (!url || !key) {
    console.error("Supabase Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_API in Netlify.");
  }

  return createClient(url || "", key || "", {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

export const supabase = createSupabaseClient();
