# Mobile / Responsive & PWA (roadmap 4.7)

## What's in place (code)

- **Installable PWA**: `public/manifest.webmanifest` (name, icons, `standalone`,
  theme/background colours) + a registered service worker (`public/sw.js`).
  The SW is intentionally **no-cache / passthrough** — it enables "Add to Home
  Screen" with **zero risk of stale assets or stale API data**. Registered in
  production builds only (`import.meta.env.PROD`), so local dev is never cached.
- **Meta**: responsive `viewport` (with `viewport-fit=cover` for notches),
  `theme-color`, and Apple web-app tags in `index.html`.
- **Responsive app shell**: `AppLayout` already collapses the sidebar to an
  off-canvas **drawer** (hamburger + backdrop) below 1024px.
- **Responsive forms**: the shared `<Grid>` (backs every wizard form + `SchemaForm`)
  now collapses its columns on smaller screens via `.reg-grid` media queries in
  `index.css` — **3/4-col → 2 cols on tablet (641–900px) → 1 col on phones (≤640px)**,
  with desktop unchanged. Verified across 375 / 768 / 1280px with **no horizontal
  page overflow** (`html, body { overflow-x: hidden }`; wide tables scroll inside
  `.premium-grid__scroll`).

## On-device verification checklist (needs real devices/emulators)

Automated builds can't confirm "looks right heads-on-phone" — verify on at least
one iOS (Safari) and one Android (Chrome) device, plus a tablet:

- [ ] Login page usable at 360×640 (small Android) and 390×844 (iPhone).
- [ ] Sidebar/nav collapses to a usable mobile pattern (hamburger/drawer) and is reachable.
- [ ] Registration wizard tabs + long forms scroll cleanly; inputs are tap-friendly (≥44px targets); date/select pickers work.
- [ ] Tables (Requirements, Claim Search, Pool) scroll horizontally without breaking layout.
- [ ] Dashboards/charts (Recharts) resize; no fixed-width overflow.
- [ ] Modals (Success, Cause picker) fit the viewport and are dismissible.
- [ ] Superuser screens (Access Control, Branding, Form Fields, Integration Health, System Settings) are legible on tablet.
- [ ] "Add to Home Screen" works; launched PWA opens standalone with the correct name/theme/icon.
- [ ] Landscape + notch/safe-area insets don't clip content.
- [ ] Lighthouse (mobile) PWA + Best-Practices pass; no console errors.

## If offline support becomes a requirement

The app is API-heavy (claims data must be live), so full offline is usually not
desired. If it is, replace `public/sw.js` with a versioned precache:

```bash
npm i -D vite-plugin-pwa
# vite.config.js: VitePWA({ registerType: 'autoUpdate', workbox: { ... } })
```

Workbox handles cache-busting via the build hash, precaches the app shell, and
uses network-first for `/api/*` — avoiding the stale-cache pitfalls of a
hand-rolled caching SW. Add real PNG icons (192/512) for the widest install support.

## Known follow-ups

- Add PNG app icons (192×192, 512×512) alongside the SVG for older Android launchers.
- Audit any remaining fixed-`px` widths in large tables/wizard for very small screens.
