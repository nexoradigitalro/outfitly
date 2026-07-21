# Outfitly

Outfitly is a premium, mobile-first AI wardrobe SaaS — not a demo, not a CRUD app. Built to eventually scale to millions of users and to share its backend with future native iOS/Android apps. Every feature decision should be filtered through: "Would this make someone recommend Outfitly to a friend?"

The full founding product brief (target users, feature list, design philosophy, subscription tiers, non-negotiables) lives in [docs/PRD.md](docs/PRD.md). Read it before proposing product changes. Technical architecture (schema, storage, auth, AI pipeline, folder structure, design system) lives in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Sequencing (wireframes, roadmap, milestones, risks) lives in [docs/ROADMAP.md](docs/ROADMAP.md). How the web app later becomes native iOS/Android apps lives in [docs/NATIVE.md](docs/NATIVE.md) — don't build for native now, but don't make decisions that contradict it either.

## Ground rules

- **API-first, backend/frontend decoupled.** All product logic goes through the API layer (`packages/api-client` + Supabase), never embedded directly in Next.js pages/components, because the same backend must serve a future native app.
- **Mobile-first, dark-mode-first.** Design for a one-handed phone screen; desktop is a secondary breakpoint, not the primary target.
- **The design bar is 2026, not default shadcn/Tailwind.** No screen ships as flat, generic-dashboard styling — reach for depth, motion, and where it fits, 3D/dimensional visuals; see `docs/ARCHITECTURE.md` §18 for the full direction. If it could pass for a 2020 SaaS template, it's not done.
- **Plan before building.** For any new feature area, write or update the relevant section of `docs/` before writing implementation code — don't skip straight to code for anything beyond a trivial fix.
- **Strict TypeScript, no shortcuts.** No `any`, no disabled RLS, no skipped image optimization "for now."
- Do not implement features from the v2/v3 future roadmap in `docs/ROADMAP.md` unless explicitly asked — they're intentionally deferred.
- **No account (including Guest) may be created without recording consent first.** Terms of Service + Privacy Policy are mandatory and separate from the optional Marketing tick; log every consent as its own row in `consent_events`, never as a single boolean — see `docs/ARCHITECTURE.md` §8/§10.

## Repo layout

- `apps/web` — Next.js 16 / React 19 app (TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand, Framer Motion). Has its own `apps/web/CLAUDE.md` for Next.js-version-specific notes.
- `packages/types` — shared TypeScript types (domain models, DB row types) consumed by both `apps/web` and any future native client.
- `packages/api-client` — thin typed client wrapping Supabase calls / REST endpoints; the only layer allowed to talk to Supabase directly.
- `supabase/migrations` — SQL schema migrations (source of truth for the DB, see `docs/ARCHITECTURE.md`).
- `supabase/functions` — Edge Functions (AI calls, image processing, webhooks).

## Commands

- `npm run dev` — start the web app
- `npm run build` — build the web app
- `npm run lint` — lint the web app
- `npm run typecheck` — typecheck all workspaces
