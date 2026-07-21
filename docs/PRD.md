# Outfitly — Product Requirements Document

**Tagline:** Your AI Wardrobe.
**Mission:** Help people digitize their wardrobe, discover better outfits, save time every morning, and become more confident using AI.

This document covers sections 1–6 of the founding architecture request: product analysis, feature improvements, competitive analysis, missing features, viral growth, and monetization. Technical architecture is in [ARCHITECTURE.md](ARCHITECTURE.md); sequencing is in [ROADMAP.md](ROADMAP.md).

---

## 1. Product Analysis

### 1.1 Problem

People own more clothes than they can mentally track. Choosing an outfit is a small daily decision made under time pressure (mornings) or social pressure (events, travel), and most people default to the same 20% of their wardrobe on repeat while the rest goes unworn — a problem that is simultaneously a UX pain point (decision fatigue) and an environmental/financial one (unused inventory, over-buying).

### 1.2 Core insight

The wardrobe itself is the dataset. Once clothing is digitized with structured attributes (category, color, fit, season, occasion), outfit generation, search, packing, and shopping-fit-checks all become the *same* underlying capability — "reason over a personal, photographed inventory" — applied to different surfaces. This is why Outfitly should be built around one strong primitive (the Closet Item, richly tagged) rather than as a bundle of loosely related features.

### 1.3 Target users

| Segment | Age | Primary need |
|---|---|---|
| Style-conscious professionals | 25–45 | Fast, confident daily outfit decisions |
| Students | 18–24 | Maximize a small wardrobe, avoid re-buying duplicates |
| Travelers | 22–45 | Packing without overpacking |
| Fashion lovers | 18–45 | Discovery, organization, showing off collections |
| "I don't know what looks good" users | 18–45 | Confidence, reduce decision anxiety |

Primary persona for v1 launch: the style-conscious professional/student who already owns 40+ items and wants their closet organized and to stop wearing the same five outfits.

### 1.4 Success metrics (North Star + supporting)

- **North Star:** Weekly Active Closets (users who open the app *and* interact with their closet/outfits, not just log in) — proxy for "this is now part of my routine."
- **Activation:** % of signups who reach 15+ digitized items within 7 days (the point where outfit generation becomes useful).
- **Retention:** D7 / D30 return rate; # of "Daily Outfit" notifications opened.
- **Monetization:** Free→Premium conversion rate; the 20-item / 5-generation free cap is deliberately tight enough to hit within the first real use.
- **Virality:** K-factor from outfit/closet shares.

---

## 2. Feature Improvements Over the Brief

The original brief is comprehensive; these are the highest-leverage refinements:

1. **Item digitization must feel like a single photo tap, not a form.** The reference screenshots show AI pre-filling name/category/colors/tags with the user only confirming — that confirm-don't-fill interaction is the core retention lever for the Closet feature and should be the default flow, not an "advanced" option.
2. **Collapse "AI Outfit Generator" and "AI Search" into one input surface.** Users don't distinguish "generate an outfit for X" from "show me clothes matching Y" — both are natural-language queries over the same closet index. One search/generate bar with pill suggestions (Office, Date, Rainy day…) reduces navigation and teaches the feature by example.
3. **"Why this works" explanations double as a trust *and* teaching mechanism** — write them to reference the user's own color/style data (e.g. "olive and rust are both in your warm palette") so users start to internalize style logic, which is a stronger retention hook than a generic tip.
4. **Cost-per-wear should be visible on every item card**, not buried in analytics — it's the single stat users screenshot and share, and it's what makes Premium's unlimited-items cap feel worth paying for.
5. **Confidence score on AI-detected attributes should be user-facing but low-friction** — a subtle dot/underline on low-confidence fields, not a numeric badge, so correction feels like a quick tap rather than grading the AI.
6. **Guest Mode must allow full closet-building with local/session storage**, converting to a real account only at the point of value (e.g. trying to save an outfit or getting the 6th item) — reduces signup friction to zero for first use.

---

## 3. Competitive Analysis

| App | Strength | Weakness Outfitly exploits |
|---|---|---|
| **Pinterest** | Best-in-class visual discovery/inspiration feed | Zero connection to clothes you actually own — pure inspiration, no personalization or inventory |
| **Whering** | Strong closet digitization, outfit calendar, carbon/cost-per-wear stats | UI feels utilitarian/spreadsheet-like rather than premium; AI outfit quality inconsistent |
| **Indyx** | AI tagging quality, shopping-match features | Weaker social/sharing loop, limited free tier depth |
| **Acloset** | Large user base, simple free digitization | Dated UI, ad-supported feel undermines the "premium" positioning; weak AI reasoning |
| **Stylebook** | Power-user features (packing, outfit calendar) loved by fashion enthusiasts | iOS-only, no AI, steep manual-entry cost — huge activation drop-off |
| **Combyne** | Social outfit creation/remixing | Community-first, not personal-wardrobe-first; little AI |

**Outfitly's wedge:** nobody in this set combines (a) low-friction AI digitization, (b) genuinely premium/Apple-grade design, and (c) AI reasoning that explains itself and improves outfit *and* purchase decisions. Whering is the closest competitor on substance; Pinterest/Instagram are the aesthetic bar to hit.

---

## 4. Missing Features (beyond the brief)

- **Outfit calendar / "what did I wear" log** — passive logging (confirm what you wore each day, one tap) is what actually powers accurate cost-per-wear, laundry rotation, and "don't repeat this outfit" logic. Without it, Daily Outfit and Smart Closet have no ground truth.
- **Duplicate/near-duplicate detection at capture time** ("you already own something like this") — directly serves the Shopping Assistant and prevents wardrobe bloat, should trigger at photo-upload, not just in analytics.
- **Body-photo privacy controls** — explicit per-photo visibility/deletion and a clear data-retention statement, given photos of the user's body are the most sensitive data type in the product (GDPR-critical, also a trust/conversion factor).
- **Multi-user / shared closets (future)** — couples or friends comparing wardrobes, relevant to virality (see below) even if v1 is single-user.
- **Weather + calendar integration permissions UX** — needs a clear, non-scary onboarding moment since Daily Outfit's value depends on both.
- **Return/undo on AI edits** — since AI pre-fills structured data, users need a fast "revert to AI suggestion" affordance after manual edits.

---

## 5. Viral Growth Ideas

1. **Shareable outfit cards** — a single generated outfit rendered as a clean, branded image card (product-shot style, like the reference screenshots) for Instagram Stories/DMs. Every share is an ad for the try-on quality.
2. **"Rate my outfit" links** — shareable read-only link to a specific outfit for friends to react/vote without needing an account; converts viewers via a soft "build yours" CTA.
3. **Closet stats flex** — shareable wardrobe-value / cost-per-wear "wrapped"-style card (Spotify Wrapped pattern), naturally seasonal (year-end, back-to-school).
4. **Referral unlocks Premium features**, not generic credit — e.g. "invite 3 friends, unlock Virtual Try-On for a month" ties the reward to the most visually impressive feature.
5. **Public style profiles (opt-in)** — a lightweight portfolio view of someone's closet/outfits (curated, not raw), discoverable, planting the Pinterest-style discovery loop on top of real closets instead of generic pins.

---

## 6. Monetization

### 6.1 Tiers (as specified)

| | Free | Premium |
|---|---|---|
| Closet items | 20 | Unlimited |
| AI outfit generations | 5/month | Unlimited |
| Virtual Try-On | — | Unlimited |
| Packing Assistant | — | ✓ |
| Daily Outfit | — | ✓ |
| Advanced Analytics | — | ✓ |
| AI priority (speed/queue) | — | ✓ |

### 6.2 Design notes

- The free cap (20 items, 5 generations) is intentionally tight enough that an engaged user hits it within their first real session of digitizing a closet — the paywall moment should feel like "I'm already getting value, I want more of this," not a hard wall before value is shown.
- Architecture must support **multiple future plans** (e.g. annual, a mid-tier, family/shared plans) — do not hardcode a binary free/premium check; model entitlements as a table of feature flags/limits per plan (see `ARCHITECTURE.md` §7 `plans` table), so new tiers are data, not code changes.
- Stripe Billing (subscriptions + customer portal) is the payments backbone; webhooks sync subscription state into Supabase so entitlement checks stay fast (DB read, not a live Stripe call) on every request.
- Future monetization surfaces (not v1, but architecture should not block them): affiliate commission via the Shopping Assistant ("buy" links), brand partnerships surfaced in outfit recommendations.
