# Outfitly — web app

Next.js 16 / React 19 app. See the repo root [CLAUDE.md](../../CLAUDE.md) for the ground rules and [docs/](../../docs/) for product/architecture — this file only covers running `apps/web` itself.

## Getting started

```bash
npm run dev        # from the repo root, or inside apps/web
```

Copy `.env.local.example` to `.env.local` and fill in the Supabase project URL + anon key first (see `docs/ARCHITECTURE.md` §10).

## Design direction: Prism

Before writing Closet UI code, three visual directions (Atelier, Prism, Studio Concrete) were mocked up as a self-contained HTML artifact — same screen, same real content (category seeds, bottom nav, one AI moment), only the design language different — and compared before picking one. **Prism won**: void-black glass surfaces, one warm amber accent meant to read as *pulled from the user's own wardrobe colors* rather than a fixed brand hue (deliberately not the violet/indigo glow every other AI app defaults to). Full token spec — colors, type, icons, motion rules — is in `docs/ARCHITECTURE.md` §18.1. Applies to native too (docs/NATIVE.md), not just web.

This mockup-first workflow (a handful of interactive HTML directions compared before code) is worth repeating for any future screen where the visual treatment isn't obvious from the token spec alone.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — eslint
- `npm run typecheck` — `tsc --noEmit`
