import { createClient } from '@supabase/supabase-js';

function createSupabaseClient() {
  let url = import.meta.env.VITE_SUPABASE_URL || "https://vujmezepstugbhozgtrm.supabase.co";
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1am1lemVwc3R1Z2Job3pndHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MzI3OTAsImV4cCI6MjA5OTMwODc5MH0.C1pvdemMhaBUD4GDCZ8IePitR6F18JH-QAmkKN9qXcg";

  // AGGRESSIVE CLEANUP: Remove /rest/v1 or trailing slashes
  if (url) {
    url = url.split('/rest/v1')[0].replace(/\/$/, "");
  }

  return createClient(url, key, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

export const supabase = createSupabaseClient();
