# Outfitly — Technical Architecture

Covers sections 7–19 of the founding architecture request. Product context in [PRD.md](PRD.md); sequencing in [ROADMAP.md](ROADMAP.md).

**Core architectural rule:** frontend never talks to Supabase directly except through `packages/api-client`. This keeps `apps/web` a pure consumer of a typed API surface, so a future React Native app reuses `packages/api-client` and `packages/types` unchanged.

---

## 7. Database Design (ERD, conceptual)

```
users (Supabase auth.users)
  └─ profiles (1:1)
       ├─ body_photos (1:N)
       ├─ style_preferences (1:1, jsonb-ish prefs)
       └─ subscriptions (1:1 → plans)

closet_items (N:1 profiles)
  ├─ item_colors (N:M, hex + role: primary/secondary)
  ├─ item_tags (N:M → tags)
  └─ worn_log (1:N — every time an item is logged worn)

outfits (N:1 profiles)
  └─ outfit_items (N:M → closet_items, join table)

collections (N:1 profiles) ─ collection_items (N:M → closet_items)
wishlist_items (N:1 profiles)
packing_lists (N:1 profiles) ─ packing_list_items (N:M → closet_items)
shopping_queries (N:1 profiles) — logged "does this fit my wardrobe" checks
plans / entitlements — referenced by subscriptions
ai_generation_logs (N:1 profiles) — every AI call, for cost tracking + rate limiting
```

Design principles:
- **Everything user-owned carries `profile_id` + RLS**, no exceptions (see §9).
- **Attributes are structured columns, not free-form JSON**, wherever they're filtered/searched on (category, color, season) — JSON only for genuinely open-ended data (style preference blobs, AI raw response payloads for debugging).
- **Soft delete via `archived_at`** on `closet_items` (maps to the "Archive" feature) rather than hard delete, since cost-per-wear/analytics need historical items.

---

## 8. Supabase Schema (core tables)

```sql
-- profiles: extends auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  gender text check (gender in ('male','female','nonbinary','unspecified')),
  height_cm numeric,
  weight_kg numeric,
  birth_date date,
  preferred_styles text[] default '{}',
  favorite_colors text[] default '{}',
  favorite_brands text[] default '{}',
  favorite_occasions text[] default '{}',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- consent_events: append-only audit trail, never updated in place — GDPR requires
-- provable consent (who, what, when, which policy version), not just a boolean flag
create table consent_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('terms_of_service','privacy_policy','body_photo_processing','marketing_email')),
  granted boolean not null,
  policy_version text not null,       -- e.g. '2026-07-21' — re-prompt when this changes
  created_at timestamptz not null default now()
);
create index on consent_events (profile_id, kind, created_at desc);

create table body_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  pose text check (pose in ('front','side','back','full_body')),
  is_avatar_source boolean default false,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'tops', 'bottoms', 'shoes', ...
  parent_id uuid references categories(id),
  label text not null
);

create table closet_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  subcategory text,
  brand text,
  name text,
  material text,
  pattern text,
  fit text,
  sleeve_length text,
  season text[] default '{}',         -- ['summer','winter',...]
  occasion text[] default '{}',
  style text[] default '{}',
  primary_color_hex text,
  secondary_color_hex text,
  ai_confidence numeric,              -- 0..1, overall detection confidence
  ai_raw_response jsonb,              -- debug/audit trail of the tagging call
  image_original_path text not null,  -- storage path, pre-processing
  image_processed_path text,          -- background-removed / enhanced
  image_thumb_path text,
  is_favorite boolean default false,
  is_wishlist boolean default false,
  archived_at timestamptz,
  last_worn_at timestamptz,
  wear_count integer not null default 0,
  purchase_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on closet_items (profile_id) where archived_at is null;
create index on closet_items using gin (season);
create index on closet_items using gin (occasion);

create table worn_log (
  id uuid primary key default gen_random_uuid(),
  closet_item_id uuid not null references closet_items(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  worn_on date not null,
  outfit_id uuid references outfits(id) on delete set null,
  created_at timestamptz not null default now()
);

create table outfits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text,
  occasion text,
  source text check (source in ('ai_generated','user_created')) default 'ai_generated',
  ai_reasoning text,                  -- the "why this works" explanation
  cover_image_path text,              -- rendered flat-lay or try-on preview
  is_favorite boolean default false,
  created_at timestamptz not null default now()
);

create table outfit_items (
  outfit_id uuid not null references outfits(id) on delete cascade,
  closet_item_id uuid not null references closet_items(id) on delete cascade,
  primary key (outfit_id, closet_item_id)
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table collection_items (
  collection_id uuid not null references collections(id) on delete cascade,
  closet_item_id uuid not null references closet_items(id) on delete cascade,
  primary key (collection_id, closet_item_id)
);

create table plans (
  id text primary key,                -- 'free', 'premium_monthly', 'premium_annual'
  closet_item_limit integer,          -- null = unlimited
  ai_generation_monthly_limit integer,
  features jsonb not null default '{}'  -- {"virtual_try_on": true, "packing_assistant": true, ...}
);

create table subscriptions (
  profile_id uuid primary key references profiles(id) on delete cascade,
  plan_id text not null references plans(id) default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text check (status in ('active','trialing','past_due','canceled')) default 'active',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text check (kind in ('item_tagging','outfit_generation','virtual_try_on','search','shopping_check')),
  cost_estimate numeric,
  created_at timestamptz not null default now()
);
```

`packing_lists`, `packing_list_items`, `wishlist_items`, `shopping_queries`, `tags`/`item_tags` follow the same join-table pattern and are deferred to the milestone that implements them (see ROADMAP.md) rather than fully specified here — the shape above is the load-bearing core.

---

## 9. Storage Buckets

| Bucket | Contents | Access |
|---|---|---|
| `closet-original` | Raw uploaded clothing photos | Private, RLS via signed URLs, owner-only |
| `closet-processed` | Background-removed / enhanced / thumbnailed | Private, owner-only, served via CDN-cached signed URL |
| `body-photos` | User body photos for avatar/try-on | Private, owner-only, **never** used for AI training, deletable independently of account |
| `avatars` | Generated AI avatar renders | Private, owner-only |
| `outfit-renders` | Generated outfit flat-lays / try-on previews | Private by default; a copy is written to `public-shares` only when the user explicitly shares |
| `public-shares` | Opt-in shareable outfit cards / public style profile images | Public read, write via server-side function only |

All buckets: RLS policy `auth.uid() = owner_id` derived from path prefix (`{profile_id}/...`) enforced both at the bucket policy and re-checked in the API layer. Images processed through a size/type allowlist at upload (client) and re-validated server-side (Edge Function) before any AI call touches them.

---

## 10. Authentication Flow

> **Phasing:** every session runs on Guest (anonymous) auth from M0 through M2 — Google/Magic Link screens are intentionally not built until milestone **M-Auth** (see ROADMAP.md §21), so early development time goes into Closet/Outfits instead of OAuth UI. This costs nothing architecturally: anonymous auth already creates a real `profile_id`, so "adding login" later is just attaching an identity to an existing user, not a migration.

- **Providers:** Google OAuth, Apple OAuth (native-only, see NATIVE.md), Magic Link (Supabase email OTP), Guest Mode.
- **Guest Mode:** anonymous Supabase session (`signInAnonymously`) — closet data is written against a real (anonymous) `profile_id` from the start, so **no data migration is needed on conversion**; converting to a real account is Supabase's built-in anonymous-user-linking (`linkIdentity`), just attaches an email/OAuth identity to the same user id.
- **Session:** Supabase SSR cookies (`@supabase/ssr`, already a dependency) for the Next.js app router — server components read session via cookies, no client-side-only auth state.
- **Onboarding gate:** middleware checks `profiles.onboarding_completed_at`; unset → redirect into the onboarding flow before any closet route is reachable.
- **GDPR consent gate (EU/EEA/UK users, but applied globally for simplicity):** account creation — including Guest — is blocked until two **separate, mandatory** checkboxes are accepted: Terms of Service and Privacy Policy. These are recorded individually in `consent_events` (not just "agree to all" in one box) because GDPR requires consent to be *specific* per processing purpose; bundling essential-service consent with anything optional makes the optional part legally invalid. A **third, unticked-by-default** checkbox ("send me tips/offers by email") covers marketing and is genuinely optional. Uploading body photos (§9, sensitive data) requires its own explicit `body_photo_processing` consent event at the point of upload, not covered by the general Terms acceptance — shown with a one-line explanation of what it's used for (avatar/try-on) and that it's never used for AI training. Re-prompt any user whose recorded `policy_version` is older than the current one before letting them continue.
- **Post-auth routing:** new user → onboarding; returning user → last-viewed tab (persisted client-side) or Closet home.

---

## 11. AI Architecture

Outfitly's AI surface splits into five distinct jobs, each with different latency/cost/quality tradeoffs — treat them as separate pipelines behind one internal `ai` module in `packages/api-client`, not one generic "call the model" wrapper:

| Job | Trigger | Approach |
|---|---|---|
| **Background removal + crop/center/enhance** | On item photo upload | Dedicated image-segmentation service (e.g. a background-removal API) — not a general LLM; runs in an Edge Function, async with a processing status on the row |
| **Attribute detection & tagging** | After background removal | Multimodal LLM call (vision-capable) against the processed image → structured JSON matching the `closet_items` columns, including per-field confidence; validated with a schema before writing to DB |
| **Color extraction** | Alongside tagging | Deterministic image-processing (k-means/dominant-color on the processed image), *not* left to the LLM — matches the reference UI's "image suggestions" swatch picker; LLM only names/labels the extracted hex values |
| **Outfit generation & AI Search** | User request | LLM call constrained to a **closet-scoped context**: only the requesting user's structured item rows (never raw images at this stage, to keep it cheap) are passed in; output is a set of `closet_item_id` combinations + `ai_reasoning` text, validated to ensure every referenced id actually belongs to the user |
| **Virtual Try-On** | User request, Premium-gated | Image-generation model composing body photo + selected item images into a rendered preview; highest cost/latency job, so it's the one explicitly gated to Premium and queued (not synchronous) |

Cross-cutting: every AI call is written to `ai_generation_logs` (cost + kind) — this is what powers both free-tier quota enforcement and future cost monitoring, so quota checks are a DB read, not a re-derivation.

---

## 12. Image Processing Pipeline

```
1. Client: capture/select photo → client-side resize/compress (cap long edge, strip EXIF except orientation)
2. Upload to `closet-original` bucket → closet_items row created with status='processing'
3. Edge Function triggered (storage webhook or explicit call):
     a. Background removal → write to `closet-processed`
     b. Generate thumbnail (webp, multiple sizes for grid/detail/share)
     c. Dominant color extraction → primary/secondary hex candidates
     d. Vision LLM tagging call → structured attributes + confidence
4. closet_items row updated: status='ready', all AI fields populated
5. Client (already showing an optimistic skeleton card) receives update via Supabase Realtime → swaps in final image + editable AI-filled form
```

Failure handling: any pipeline step failure sets `status='needs_review'` with the original image still usable — the item is never lost, worst case the user fills fields manually. Images are re-encoded to WebP/AVIF at multiple breakpoints on write (not on every request) so the Next.js `<Image>` component serves precomputed sizes.

---

## 13. API Architecture

- **`packages/api-client`** is the single boundary to Supabase (DB + Storage + Edge Functions). Exposes typed functions grouped by domain (`closet.list()`, `closet.create()`, `outfits.generate()`, `auth.signInWithGoogle()`, …), each returning `packages/types` domain types — never raw Supabase row types leak past this layer, so a schema change is a one-package fix.
- **`apps/web`** consumes only `api-client` + TanStack Query hooks wrapping it (`useClosetItems()`, `useGenerateOutfit()`, …) — no `supabase-js` import anywhere under `app/` or `components/`.
- **Supabase Edge Functions** own anything that needs a server-side secret or heavy compute: AI calls (LLM/image-gen API keys), Stripe webhooks, image processing triggers. Next.js API routes are used only for things Edge Functions can't do well (Stripe redirect/session creation tied to Next.js request context) — kept minimal.
- **Realtime** subscriptions (Supabase Realtime) for async job completion (image processing, outfit generation) instead of client polling.
- This split is what lets a future React Native app reuse `packages/api-client` + `packages/types` wholesale and only rebuild the UI layer.

---

## 14. Folder Structure

```
outfitly/
├─ apps/
│  └─ web/
│     ├─ app/
│     │  ├─ (auth)/                # sign-in, magic link, callback
│     │  ├─ (onboarding)/          # multi-step onboarding flow
│     │  └─ (app)/                 # authenticated shell, bottom-nav layout
│     │     ├─ closet/
│     │     ├─ outfits/
│     │     ├─ discover/           # AI search + generator surface
│     │     ├─ packing/
│     │     └─ profile/
│     ├─ components/
│     │  ├─ ui/                    # shadcn primitives (already scaffolded)
│     │  ├─ closet/                # ClosetGrid, ItemCard, ItemEditSheet...
│     │  ├─ outfits/                # OutfitCard, OutfitGeneratorBar...
│     │  └─ shared/                # BottomNav, EmptyState, ConfidenceHint...
│     ├─ lib/
│     │  ├─ supabase/               # SSR client setup only (session, cookies)
│     │  ├─ stores/                 # zustand stores
│     │  └─ utils.ts
│     └─ hooks/                     # react-query hooks wrapping api-client
├─ packages/
│  ├─ types/src/                    # domain types shared across clients
│  └─ api-client/src/
│     ├─ closet.ts
│     ├─ outfits.ts
│     ├─ auth.ts
│     ├─ ai.ts
│     └─ billing.ts
├─ supabase/
│  ├─ migrations/
│  └─ functions/
│     ├─ process-item-image/
│     ├─ generate-outfit/
│     ├─ virtual-try-on/
│     └─ stripe-webhook/
└─ docs/
```

Route groups `(auth)/(onboarding)/(app)` keep layout concerns (bottom nav vs. full-bleed onboarding vs. auth) cleanly separated at the routing level rather than via conditional rendering in one root layout.

---

## 15. Component Library

Already scaffolded via shadcn (`components/ui`): `avatar, badge, button, card, dialog, dropdown-menu, input, label, scroll-area, select, separator, sheet, skeleton, sonner, tabs, textarea, tooltip`. These cover primitives; Outfitly-specific composites still needed (build on top, don't fork the primitives):

- **ClosetGrid / ItemCard** — Pinterest-style masonry, cost-per-wear badge, confidence-hint underline
- **ItemEditSheet** — bottom sheet (mobile) built on `sheet.tsx`, houses the AI-prefilled editable form + color swatch picker (matches reference screenshot 2)
- **CategoryTabBar** — horizontal scroll tab bar (All/Tops/Jackets/…, matches reference screenshot 1), built on `tabs.tsx`
- **OutfitCard** — flat-lay/try-on image + "why this works" expandable text + save/share actions
- **GeneratorBar** — the unified generate/search input (see PRD §2.2) with occasion pill suggestions
- **BottomNav** — 4–5 item native-feel tab bar (Closet, Discover, +Capture, Outfits, Profile)
- **ColorSwatchPicker** — extracted-color chips + custom hex, used by ItemEditSheet
- **ConfidenceHint** — subtle low-confidence indicator wrapper for any AI-filled field
- **EmptyState, LoadingSkeletons** — shared across all list views for the "premium, no jank" bar

Add new shadcn primitives as needed via `npx shadcn add <name>`; don't hand-roll something shadcn already provides.

---

## 16. Navigation Architecture

Bottom tab bar (mobile primary), 5 slots:

```
[ Closet ]  [ Discover ]  [ (+) Capture ]  [ Outfits ]  [ Profile ]
```

- **Capture** is a raised center action (camera-first, per brief) — opens the photo-capture flow as a modal/sheet from anywhere, not a page.
- **Discover** hosts the unified AI Search/Generator surface (PRD §2.2).
- Desktop breakpoint (secondary) mirrors the same 5 sections as a left sidebar rather than introducing new information architecture — no desktop-only nav paths.
- Deep-linkable routes for every tab + item/outfit detail (share links depend on this).

---

## 17. State Management

- **Server/remote state:** TanStack Query exclusively — closet items, outfits, profile, subscription status. No duplication of server state into zustand.
- **Zustand** reserved for genuinely client-only, cross-component UI state: capture-flow wizard step, active filter/sort selection on the closet grid, bottom-sheet open state, onboarding progress. Small, focused stores per domain (`useCaptureFlowStore`, `useClosetFilterStore`) rather than one global store.
- **Optimistic updates** via React Query mutations for anything the user expects instant feedback on (favoriting, archiving, marking worn) — reconcile on the Realtime/refetch confirmation.
- Guest Mode state lives in the same Supabase-backed model (§10), not local-only state, so there's exactly one data path regardless of auth status.

---

## 18. Design System

- **Mode:** Dark-mode-first (default), light mode supported — both defined as CSS variable sets (Tailwind v4 + `next-themes`, already installed), never hardcoded colors in components.
- **Palette:** neutral near-black base (`zinc/neutral` scale), single accent color reserved for primary actions/AI moments (generation, try-on) so it reads as premium rather than colorful; clothing-item imagery supplies the visual color, the UI chrome stays restrained.
- **Typography:** one geometric/humanist sans for UI, generous type scale for headers (Instagram/Linear-level hierarchy), tabular numerals for stats (cost-per-wear, analytics).
- **Radius:** consistently rounded (shadcn `--radius` token), larger radii on image cards/sheets than on buttons/inputs, matching the reference screenshots' soft card corners.
- **Motion:** Framer Motion for: item-card enter (staggered grid), sheet/modal transitions, outfit-generation "reveal," tab transitions — every transition ≤300ms, spring-based not linear, nothing blocks input.
- **Imagery:** large, edge-to-edge where possible; clothing photos are the hero visual, chrome recedes (per reference screenshots' clean product-shot style).

---

## 19. Responsive Design System

- **Mobile-first breakpoints** (Tailwind defaults, mobile = no prefix): base styles target ~375–430px viewport; `sm`/`md`/`lg` layer on desktop enhancements (multi-column grid, sidebar nav) rather than the reverse.
- **Touch targets** ≥44px, bottom-nav and primary actions reachable within thumb zone (bottom half of screen).
- **Closet grid:** 2-column on mobile, scaling to 4–6 column masonry on desktop — same component, column count driven by container query, not a separate desktop layout.
- **Safe-area aware:** bottom nav respects `env(safe-area-inset-bottom)` for PWA/notch devices.
- **PWA:** installable manifest + service worker for offline shell/caching (not yet in `apps/web/package.json` — tracked as a Milestone 1 task in ROADMAP.md).
