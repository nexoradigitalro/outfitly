import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs on every request:
// 1. Refreshes the Supabase session (required for SSR auth to work at all).
// 2. Signs the visitor in as a Guest if they have no session yet — every
//    visitor gets a real profile_id from the first request, no signup wall
//    (docs/ARCHITECTURE.md §10, docs/ROADMAP.md M0).
//
// GDPR consent gate is TEMPORARILY DISABLED here — explicit founder call
// while only the team is testing (no real users yet). It moves to M-Auth
// (real account creation) instead of gating every Guest request. This is
// NOT the final state: before any real user gets Guest access with real
// photos, a consent step must exist again *before* their first write —
// see docs/ARCHITECTURE.md §10 and docs/ROADMAP.md M0/M-Auth for the
// full reasoning and the re-enable checklist. Don't remove /consent or
// /app/legal/* — they're reused at M-Auth.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await supabase.auth.signInAnonymously();
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
