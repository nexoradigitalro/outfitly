# Outfitly — Roadmap

Covers sections 20–24 of the founding architecture request. Product context in [PRD.md](PRD.md); technical architecture in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 20. UI Wireframes (textual)

**Onboarding (full-bleed, no bottom nav):**
`Welcome → Consent (Terms + Privacy required, separate ticks; Marketing optional, off by default — ARCHITECTURE.md §10) → Auth choice (Google/Apple/Magic Link/Guest) → Basic info (name/gender/height/weight/age) → Style prefs (chips: style, colors, brands, occasions) → Body photo capture (2–5 photos, pose guides, own explicit consent line before first capture) → "Generating your avatar…" → Done, enter app`

Consent step ships in **M0**, not deferred with the rest of auth (§21) — Guest sessions still process personal data (photos, body measurements) and need a lawful basis from the very first interaction, not just once real accounts exist. As implemented, M0 ships *only* the Consent screen standalone (guest sign-in is silent, done by middleware, no "Auth choice" screen yet) → straight into the empty app shell. Basic info / style prefs / body photos / avatar generation are deferred to whichever milestone first consumes them (M1 Closet for basic info, later for avatar/try-on) rather than collected upfront with nothing yet using them.

**Closet home** (matches reference screenshot 1): category tab bar pinned top (`All / Tops / Jackets / Bottoms / Accessories / Shoes / Outfits`), 2-col masonry grid below, floating capture button bottom-right, pull-to-refresh, filter/sort icon top-right opening a sheet.

**Item detail / edit** (matches reference screenshot 2): full-bleed item image top, editable `Name` + `Category` fields, `Primary color` swatch + extracted-image-suggestion chips + "Pick primary color from image," optional `Secondary color`, `Details` tag input (freeform chips like "casual," "retro"), save bar pinned bottom. Low-confidence AI fields show a subtle underline hint.

**Capture flow** (modal from anywhere): camera viewfinder → shot review → optimistic card inserted into closet with skeleton shimmer → auto-opens Item detail once processing completes (Realtime push).

**Discover (Generator/Search)**: single input bar top ("What should I wear today?"), occasion pill row below (Office/Date/Gym/Wedding/…), results as a horizontally-swipeable stack of Outfit Cards, each with "Why this works," regenerate, save, share.

**Outfits tab**: grid of saved outfits (favorites, recently generated, user-created), tap → detail with full item list + try-on preview if generated.

**Profile**: avatar + stats header (wardrobe value, items, cost-per-wear leaders), Subscription card (upgrade CTA if Free), Settings (account, notifications, privacy/body-photo controls, guest→account conversion).

**Bottom nav** (all authenticated, non-onboarding screens): `Closet · Discover · (+) · Outfits · Profile`, per ARCHITECTURE.md §16.

---

## 21. Development Roadmap

Sequenced so every milestone ships something a real user could actually use end-to-end — no "backend only" milestones with nothing to show.

**M0 — Foundations** (infra, no user-facing features)
Supabase project + core migrations (§8), RLS policies, **anonymous (Guest) auth only** — see note below, GDPR consent step (Terms/Privacy required, Marketing optional, `consent_events` logging — ARCHITECTURE.md §10), `packages/types` + `packages/api-client` skeleton, base app shell (bottom nav, route groups, dark theme tokens).

> **Login sequencing:** real sign-in (Google, Magic Link, Apple later) is deliberately deferred out of M0. Every session starts on Supabase anonymous auth (§10 in ARCHITECTURE.md), which already writes to a real `profile_id` — so there is nothing to migrate later, just an identity to attach. This lets M1/M2 (Closet, Outfits) get validated with real usage before spending time on OAuth screens, consent flows, etc. Real accounts become required at **M-Auth**, inserted right before M3 because Stripe billing needs a durable identity (an anonymous session can be lost by clearing browser storage).

**M1 — Closet MVP**
Photo capture → upload → background removal + thumbnailing → AI tagging pipeline (§12) → editable Item detail sheet → Closet grid with category tabs, favorites, archive. *No outfit generation yet.* This alone should feel useful (a clean digitized closet).

**M2 — Outfits**
Outfit generation (LLM over structured closet data) + "why this works," save/favorite outfits, unified Discover search/generate bar, regenerate.

**M-Auth — Real Accounts**
Google OAuth + Magic Link screens, guest→account linking (`linkIdentity`, no data migration needed), onboarding gate enforcement. Ships once M1/M2 have proven the core loop is worth protecting behind a real identity. Apple Sign-In stays a reserved UI slot until native app work starts (App Store requires it there; not required for web).

**M3 — Monetization**
Stripe Billing integration, `plans`/`subscriptions` tables wired to entitlement checks, free-tier limits enforced (20 items / 5 generations), upgrade flows, customer portal.

**M4 — Retention loop**
Worn-log (confirm what you wore), cost-per-wear on item cards, analytics dashboard, Daily Outfit (weather + calendar + rotation) with push notifications, PWA installability.

**M5 — Premium AI surfaces**
Virtual Try-On, Packing Assistant, Shopping Assistant (paste-a-URL fit check).

**M6 — Growth loop**
Shareable outfit cards, public style profiles (opt-in), referral unlocks (PRD §5).

Each milestone assumes the prior one is deployed and dogfoodable, not just merged.

---

## 22. Milestones (exit criteria)

| Milestone | Ships when... |
|---|---|
| M0 | A guest session can't be created without recording Terms/Privacy consent (`consent_events`), lands on an empty, correctly-themed app shell, and can write closet data; RLS verified with a second anonymous session (no cross-account data leakage) |
| M1 | A user can photograph 10 real items and end up with a correctly categorized, edited closet grid in under 5 minutes total |
| M2 | A user can request "outfit for a date" and get 3 usable, explained combinations using only their own items |
| M-Auth | A guest with an existing closet can sign in with Google/Magic Link and keep every item — same `profile_id`, zero data loss |
| M3 | A user can hit the free cap, see a real Stripe checkout, and have Premium entitlements reflected immediately after payment |
| M4 | Cost-per-wear numbers on item cards are accurate against logged wears; a real push notification fires with a Daily Outfit |
| M5 | A generated Virtual Try-On image is visually convincing enough to share without embarrassment (subjective gate — validate with real users before shipping wider) |
| M6 | A shared outfit card link is viewable with zero auth and has a working "build yours" conversion path |

---

## 23. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| AI tagging/color-extraction quality too low → users abandon during digitization | Confidence scores + fast manual correction UX (§18 ConfidenceHint) from day one, not bolted on later; track correction rate as a quality metric |
| Virtual Try-On renders look uncanny/off-putting | Gate behind Premium and behind an internal quality bar (M5 exit criteria) before wide release; allow easy fallback to flat-lay outfit cards |
| Body photo storage is a trust/legal liability | Strict bucket isolation (§9), explicit deletion controls, clear no-AI-training statement, GDPR data export/delete flow scoped from M0 |
| Consent collected sloppily (single "agree to everything" box) is legally weak in the EU | Separate mandatory Terms/Privacy ticks from optional Marketing tick, log every consent as an individually-timestamped, versioned `consent_events` row (ARCHITECTURE.md §8, §10) rather than a boolean — applies from M0, before any real accounts exist, since Guest sessions already process personal data |
| AI cost scales faster than revenue (generation/try-on calls are expensive) | Every AI call logged to `ai_generation_logs` from M1 (§11) so real unit economics are visible before scaling marketing spend; free-tier caps are cost-protective, not just monetization |
| Cold-start empty closet feels unimpressive, kills activation | Free tier's first-session flow must get to a usable digitized closet fast (M1 exit criteria: <5 min for 10 items) — this is the single highest-leverage activation metric |
| Two-sided complexity (web now, native later) causes architecture drift | Hard rule in `CLAUDE.md`/ARCHITECTURE.md §7,13: nothing outside `packages/api-client` touches Supabase directly — enforce via code review, not just convention |
| Scope creep across 20+ specified features stalls launch | Roadmap sequencing (§21) deliberately defers Try-On, Packing, and Shopping Assistant past the core Closet+Outfits+Monetization loop — resist building v2 features before M3 ships |

---

## 24. Future Roadmap (v2 / v3)

- **Native iOS/Android apps** reusing `packages/api-client` + `packages/types` (the reason for the API-first rule from day one).
- **Shared/couple closets** — compare wardrobes, joint packing lists for trips.
- **Video try-on** (brief explicitly asks the architecture to not block this — image-gen pipeline in §11 should be swappable for a video-capable model without a schema change, since `outfit-renders` storage and `outfits` table are already media-type-agnostic).
- **Marketplace/resale integration** — surfacing unworn items as listable, closing the loop on "unused clothes" analytics.
- **Affiliate-powered Shopping Assistant** — commission on "buy" links once volume justifies retailer partnerships (flagged as future in PRD §6.2).
- **Stylist marketplace** — human stylists offering paid closet reviews/outfit curation on top of the AI baseline.
- **Brand partnerships** — sponsored-but-clearly-labeled placement in outfit recommendations, gated on trust being firmly established first.
- **Multi-tier plans** — the `plans` table (ARCHITECTURE.md §8) already supports this as a data change; v2 might add an annual or family plan without touching entitlement-check code.
