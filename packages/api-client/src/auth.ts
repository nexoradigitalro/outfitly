import type { SupabaseClient } from "@supabase/supabase-js";

// Every function here takes a SupabaseClient as its first argument instead
// of constructing one internally. Session storage (cookies on web,
// SecureStore on native — see docs/NATIVE.md §3) is the caller's concern;
// this module only knows domain logic, so it works unchanged on both.

export async function signInAsGuest(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(
  supabase: SupabaseClient,
  email: string,
  redirectTo?: string,
) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

export async function signInWithGoogle(supabase: SupabaseClient, redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

// Attaches a real identity (Google/email) to the current anonymous
// session — same profile_id throughout, no data migration. See
// docs/ARCHITECTURE.md §10 and docs/ROADMAP.md M-Auth.
export async function linkGoogleIdentity(supabase: SupabaseClient, redirectTo?: string) {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function signOut(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
