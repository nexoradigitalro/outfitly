import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — session lives in cookies via @supabase/ssr,
// kept in sync with the server by middleware.ts. This is the only place
// under apps/web allowed to construct a Supabase client directly; every
// other client component gets one by calling this function.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
