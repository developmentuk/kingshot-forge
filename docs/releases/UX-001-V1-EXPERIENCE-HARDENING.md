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
local render checks. Protected authenticated/editorial runtime acceptance and
the Vercel preview remain owner-gated and are not claimed complete here.

## Responsive and accessibility evidence

Local browser evidence captured the desktop Global Search dialog and a 390px
viewport. At 390px the dialog measured 374px wide, body scroll was locked and
document horizontal overflow was false. Desktop evidence confirmed parent
`BODY`, `position: fixed`, z-index `1000`, focused input, and Escape focus
restoration to `Open global search`. Full authenticated route coverage at
768px, 1280px and 1440px requires the owner preview session/tooling.

## Validation

- `npx tsc -p tsconfig.app.json --noEmit` — pass.
- `npm run test:search-experience` — pass.
- `npm run test:search-api` — pass.
- `git diff --check` — pass.
- Production-equivalent build and full `npm run check` — pass after the
  documentation/test updates; known lint and large-chunk warnings remain.

## Deployment and recommendation

No commit, push, merge, tag, production promotion or new preview deployment
was performed in this work session. The exact protected preview cannot be
honestly reported as re-verified without owner-authenticated access. Resume
Version 1.0 acceptance after running the full check, deploying this exact
clean commit to protected preview, and completing owner checks for search,
version label, headings/spacing, player/admin screens and mobile layout.
