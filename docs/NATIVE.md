# Outfitly — Native App Guide (iOS / Android)

How the web-first build converts into native apps later, and which architecture decisions already made in [ARCHITECTURE.md](ARCHITECTURE.md) exist specifically to make this cheap. Not a milestone to start now — this is a reference for when web has validated the product (realistically after M3/M4 in [ROADMAP.md](ROADMAP.md), once retention/monetization are proven).

**Core premise:** native apps are a new *client* on top of the existing backend, not a new product. If `packages/api-client`/`packages/types` were bypassed anywhere in the web app, fix that before starting native — it's the entire reason this will be cheap.

---

## 1. What's shared vs. rebuilt

| Layer | Native treatment |
|---|---|
| Supabase schema, RLS, Edge Functions | **Unchanged.** Same backend serves web and native simultaneously. |
| `packages/types` | **Reused as-is.** |
| `packages/api-client` | **Reused as-is** for anything using plain `fetch`/`supabase-js` calls. The Supabase JS client works in React Native; only its storage adapter changes (see §3). |
| Business logic (entitlement checks, AI orchestration triggers, quota rules) | **Reused** — it lives in `api-client`/Edge Functions, not in `apps/web` components, precisely so this holds. |
| UI components (`apps/web/components`) | **Not reused.** React DOM components don't run in React Native. Rebuilt natively — see §5. |
| Design tokens (colors, spacing, radius, motion values) | **Ported, not rebuilt from scratch** — extract them from Tailwind config into a shared, framework-agnostic tokens file (`packages/design-tokens`) once native work starts, consumed by both Tailwind (web) and NativeWind/StyleSheet (native). |

## 2. Recommended stack

**Expo (React Native) + EAS Build**, not bare React Native. Rationale: fastest path to a real device build without owning Xcode/Gradle config, first-class OTA updates for non-native-code changes, and a large ecosystem for exactly the things this product needs (camera, image picker, push, secure storage, in-app purchases). Add `apps/mobile` as a new workspace member alongside `apps/web` — same monorepo, same `packages/*`.

## 3. Auth differences

- Supabase auth works identically in concept, but the **session storage adapter changes**: web uses `@supabase/ssr` cookies; native uses `expo-secure-store` (or `AsyncStorage` for non-sensitive parts) via `@supabase/supabase-js`'s configurable storage option. This is a client-init detail inside `packages/api-client`'s auth module, not a schema or logic change.
- **Google Sign-In**: use the native SDK flow (`expo-auth-session` or `@react-native-google-signin/google-signin`) instead of a web OAuth redirect — better UX (no browser hop), and required for a polished native feel.
- **Apple Sign-In**: mandatory on iOS the moment any other third-party login exists (App Store Guideline 4.8) — this is the reason Apple auth was reserved as a UI slot in ARCHITECTURE.md §10 but not built for web, where it isn't required.
- **Guest→account linking** works exactly as designed for web (`linkIdentity`, same `profile_id`) — no native-specific change needed here, which is the payoff of getting Guest Mode right early.

## 4. Payments — the one real architectural trap

**Do not assume Stripe works unchanged on native.** Apple and Google require digital subscriptions purchased *inside* a native app to go through their own in-app purchase (IAP) systems (App Store/Play Billing) in most cases — using Stripe directly inside the app for the same product Apple/Google could sell is a rejection risk. Plan for this now so the schema doesn't need surgery later:

- The `subscriptions` table (ARCHITECTURE.md §8) should be treated as **payment-provider-agnostic** from the start: `stripe_customer_id`/`stripe_subscription_id` are already nullable-shaped fields, not required — when native ships, add `revenuecat_customer_id`/store transaction fields alongside them, keyed by the same `profile_id`.
- Recommended: **RevenueCat** as the abstraction layer over StoreKit (iOS) + Play Billing (Android) once native ships, with a webhook into the same Supabase entitlement sync used for Stripe today — so `plans`/entitlement-check code (ARCHITECTURE.md §6.2) never needs to know which provider a given user paid through.
- Web keeps Stripe (no App Store cut on web payments) — this is also a business reason to keep pushing web signups even after native exists.

## 5. UI layer

- Rebuilt using React Native primitives + **NativeWind** (Tailwind syntax on native) so the *design tokens and utility classes* transfer even though component implementations don't — a developer who knows the web component's Tailwind classes can port it quickly.
- Rebuild priority should mirror ROADMAP.md milestones in reverse-validated order: Closet grid + item capture/edit first (the highest-usage surface), then Outfits/Discover, then Profile/Settings last.
- Camera-first capture is native's home turf — `expo-camera`/`expo-image-picker` should feel *better* than the mobile-web version, not just parity.

## 6. Notifications

- Web push (from ROADMAP.md M4, Daily Outfit) uses the browser Push API. Native uses **Expo Notifications** (wraps APNs/FCM) — different delivery mechanism, but the *trigger logic* (weather+calendar+rotation → "send a Daily Outfit") stays entirely server-side in an Edge Function, only the delivery client differs. Store device push tokens in a small `push_tokens` table keyed by `profile_id` + platform.

## 7. Deep linking & sharing

- Shareable outfit/style-profile links (PRD §5, ROADMAP.md M6) need **universal links (iOS) / app links (Android)** configured so a link opens the native app if installed, falls back to the mobile web page otherwise — set this up as part of the native milestone, not before (the web share links should already be plain HTTPS URLs, which is a prerequisite, not extra work).

## 8. What to explicitly NOT do early

- Don't add React Native/Expo dependencies to `apps/web` "just in case."
- Don't abstract UI components into a cross-platform framework (e.g. a shared component library rendering to both DOM and native) preemptively — that's a real engineering cost with no payoff until native is actually being built; tokens + API layer are the right amount of shared surface for now.
- Don't build Apple Sign-In or native IAP for the web app — they solve problems the web app doesn't have.
