@AGENTS.md

## Real-device testing gotchas

- **`next dev` (Turbopack) can silently fail to run on real mobile Safari.** We hit a case where the app worked in every desktop browser and every Playwright emulation (including real WebKit) but React never hydrated at all on a real iPhone — no console error, nothing, buttons just didn't respond. The fix was testing against a production build instead: `npm run build && npm run start`. If something "works everywhere except this one real phone," rebuild for production before spending time debugging the app code — it's very likely a dev-mode/Turbopack output compatibility gap, not a bug.
- **Secure-context-only browser APIs break on a LAN IP.** `crypto.randomUUID()` (and similar) requires HTTPS or `localhost` — it's `undefined` on `http://192.168.x.x:3000`, which is exactly how a phone reaches the dev machine over Wi-Fi. `localhost` itself is treated as secure, so this never shows up testing from the same machine — only from a real device on the LAN. Any new use of a secure-context API needs a fallback (see `packages/api-client/src/storage.ts`'s `generateId()`), or it needs to be tested from an actual second device, not just `localhost`.
