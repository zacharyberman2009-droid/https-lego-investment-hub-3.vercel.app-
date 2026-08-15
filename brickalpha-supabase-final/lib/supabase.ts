"use client";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nhxprfrnjsbdqisbdgvh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QoISdu3jE90BNFnkDby-6g_48bU2tpt";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function ensureSupabaseUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) return sessionData.session.user;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(`Supabase sign-in failed: ${error.message}`);
  if (!data.user) throw new Error("Supabase did not create a user session.");
  return data.user;
}
