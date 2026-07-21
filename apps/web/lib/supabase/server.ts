import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Route Handler Supabase client. Writing cookies from a
// Server Component throws (Next.js restriction) — that's fine here because
// middleware.ts already refreshes the session on every request, so this
// client only ever needs to read.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component during render — safe to
            // ignore, middleware.ts is the source of truth for refresh.
          }
        },
      },
    },
  );
}
