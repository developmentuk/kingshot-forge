# UX-001 — Version 1.0 Experience Hardening

Date: 19 July 2026  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `9ca5c4dd8e59672e2a4e80cd1bea323e25e791d2`

## Delivered

- Global Search remains a single body-level portal with a fixed, bounded,
  responsive command palette.
- The search client now rejects redirected/non-JSON/failed responses before
  parsing and shows a controlled Forge error state.
- Ctrl/Cmd+K, Escape, close, focus entry/restoration, scroll lock, focus trap,
  arrow navigation and Enter activation are covered by the implementation and
  focused assertions.
- The header launcher is an accessible button with responsive collapse and
  platform-appropriate shortcut text.
- Product release presentation is centralized: `Version 1.0`, `Forge Preview`
  and `Forge Local`; the obsolete `Preview · v0.7.5` pattern is removed from
  release configuration.
- Shared typography, spacing, focus, control, surface, content-width and
  motion tokens are documented and reconciled in the existing UX polish layer.

## Root causes

The JSON error came from unconditional `response.json()` on an HTML fallback
or protection response. The visual risk was made easier to regress by relying
on a route component for the search surface without a system-level overlay
contract; the corrected implementation proves `BODY` ownership, `position:
fixed`, modal z-index and scroll lock in the local rendered browser.

## Route audit record

The shared shell and search launcher were inspected on the public home route,
`/search`, `/my-forge`, `/companion/heroes`, `/player-lookup`, `/gift-codes`,
`/kingdom-explorer`, `/kingdom-community`, `/alliance-directory`, `/kvk-tracker`,
`/contributor`, `/creator`, `/moderation`, `/operations`, `/operations/users`,
`/admin/datasets`, `/admin/data-engine`, `/admin/verification`,
`/admin/community-art`, `/admin/imports`, `/admin/publish`, `/admin/history`,
`/release-notes` and `/settings` through the route registry and representative
preview render checks. The replacement preview additionally checked `/`,
`/companion/heroes`, `/kingdom-explorer`, `/alliance-directory`, `/my-forge`,
`/my-forge/hero-collection`, `/my-forge/progression`,
`/my-forge/transfer-profile`, `/operations`, `/admin/data/buildings`,
`/admin/imports`, `/admin/publish`, `/admin/history` and
`/admin/community-art`.

## Responsive and accessibility evidence

The replacement preview was checked at 390px, 768px, 1280px and 1440px.
Horizontal overflow was false at every requested size; filters stacked at the
mobile breakpoint and the modal remained bounded with body scroll locked.
Desktop evidence confirmed parent `BODY`, `position: fixed`, z-index `1000`,
focused input, Escape focus restoration, 38 published results, arrow selection
and Enter navigation. The browser's 390px override reported a 433px CSS
layout viewport due to device scaling; the rendered screenshot still showed
the mobile layout with no overflow.

## Validation

- `npx tsc -p tsconfig.app.json --noEmit` — pass.
- `npm run test:search-experience` — pass.
- `npm run test:search-api` — pass.
- `git diff --check` — pass.
- Production-equivalent build and full `npm run check` — pass after the
  documentation/test updates; known lint and large-chunk warnings remain.

## Deployment and owner decision

Replacement deployment: commit `1a2f9d55a3ec1a1b233cec7448672cfc453192c`;
deployment `dpl_7iMvfxJd7ZVkqbqr5duAq9te9Ae9`; status `READY`; preview
`https://kingshot-forge-qhho6ce8q-clarksim-7474s-projects.vercel.app`.
The earlier `dpl_Xiyj53cVAJGZYF5JHo6wApr9VWDU` preview was superseded after
the verified keyboard fallback defect and is not the acceptance target.
Vercel build completed successfully with the existing 10 audit findings and
large-chunk warning. Vercel runtime logs returned no errors.

Owner visual decision: **Pending owner confirmation**. The preview is ready
for inspection; no agent observation is treated as owner approval.

Owner checklist: inspect Global Search, preview label, page heading/spacing,
one player route, one admin route, and the 390px mobile layout. Record
Approved, Approved with Minor Deferred Visual Debt, or Rejected with route,
viewport and screenshot details.
