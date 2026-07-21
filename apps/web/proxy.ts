import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasCurrentRequiredConsent } from "@outfitly/api-client";

// Runs on every request:
// 1. Refreshes the Supabase session (required for SSR auth to work at all).
// 2. Signs the visitor in as a Guest if they have no session yet — every
//    visitor gets a real profile_id from the first request, no signup wall
//    (docs/ARCHITECTURE.md §10, docs/ROADMAP.md M0).
// 3. Gates every route except /consent and /legal/* behind GDPR consent
//    (docs/ARCHITECTURE.md §10) — this is the one check worth paying a DB
//    round-trip for on every request, since it's a legal requirement, not
//    just UX.
const PUBLIC_PATHS = ["/consent", "/legal"];

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

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error) user = data.user;
  }

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // Fail closed: no session (e.g. anonymous sign-in rejected because the
  // Supabase project has it disabled) is treated the same as "not
  // consented" — never silently let a request through ungated just
  // because we couldn't establish who it is.
  if (!isPublicPath) {
    const consented = user ? await hasCurrentRequiredConsent(supabase, user.id) : false;
    if (!consented) {
      const url = request.nextUrl.clone();
      url.pathname = "/consent";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
