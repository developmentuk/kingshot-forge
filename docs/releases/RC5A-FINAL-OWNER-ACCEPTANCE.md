# Project Aegis — RC5A Final Owner Acceptance

Date: 19 July 2026  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `f249f153f75c424a6ed9889fae8c793f2fac5525`  
Implementation HEAD: `c130173b31444bf6b47a86412f1c54e17efe6f91`  
Supabase project: `hrvdhjscwitqpwjhnjkm`

## Outcome

RC5A fixed the verified Global Search presentation defect using the existing
implementation. No search-engine, data, architecture or new user-facing
feature work was introduced. No merge, tag, push, production promotion or
production write was performed.

The owner-authenticated Chrome session reached the replacement preview. The
owner-controlled decision to accept leaked-password protection disabled on the
Supabase Free plan remains recorded as a temporary Version 1.0 risk, with
Google OAuth preferred, email verification retained, and immediate enablement
after upgrade.

RC5A is **Not Ready** because approved User A/User B and editorial-role
identities, responsive viewport tooling, and backup/monitoring evidence were
not available.

## Fixed defect

Before RC5A, `SearchExperience` rendered inline after the footer and feedback
control. Commit `c130173b31444bf6b47a86412f1c54e17efe6f91` now:

- portals non-embedded search to `document.body`;
- supplies a fixed bounded backdrop dialog with `role="dialog"` and
  `aria-modal="true"`;
- locks body scroll while open;
- focuses the search field and restores launcher focus on close;
- traps Tab focus and preserves Escape, backdrop and explicit close behaviour;
- adds bounded desktop, tablet and mobile styles and regression assertions.

## Replacement deployment

| Item | Evidence |
| --- | --- |
| Deployment | `dpl_6n8fUzHAJ3sGUTdyQf6mESxXrw6j` |
| Preview | https://kingshot-forge-n2ywu430a-clarksim-7474s-projects.vercel.app |
| Status | READY; remote production-equivalent build passed |
| Source | Clean local HEAD `c130173b31444bf6b47a86412f1c54e17efe6f91` |

## Owner-authenticated evidence

Completed on the replacement preview:

- owner authentication and application access;
- corrected Global Search opened as a body-level dialog;
- dialog parent `BODY`, `position: fixed`, z-index `1000`, body overflow
  locked, and search input focused;
- Escape restored body state and focus to the launcher;
- explicit Close search restored body state;
- preview diagnostics returned no console warnings or errors.

Not run because the required owner-controlled identities or tooling were not
available:

- User A/User B favourites isolation, stale state, injection and RLS;
- editorial permission, publication/history/compare/rollback/republish/audit;
- signed-out and cross-role API rejection;
- authenticated responsive checks at 390px, 768px and 1280px;
- backup/restore, migration rollback, monitoring window and incident owner.

No RC5A fixtures were created; inserted, updated, deleted and remaining totals
are all zero. No cookies, tokens, credentials or secret values were inspected.

## Validation

- `npm run check` — pass; eight pre-existing lint warnings and the existing
  Vite large-chunk warning remain.
- `npx tsc -p tsconfig.server.json --noEmit` — pass.
- `npm run validate:nodenext` — pass.
- `npm run lint` — pass with the same eight warnings.
- `npm run test:search-experience` — pass.
- focused favourites and RC4 security checks — pass within `npm run check`.
- `git diff --check` — pass; final working tree clean after documentation.
- replacement Vercel build — READY.

The main bundle is approximately 1,088.85 kB minified / 280.10 kB gzip,
without an unexplained regression. Vercel reported existing audit output of
10 vulnerabilities (4 moderate, 6 high); dependency remediation is deferred
to a separate review.

## Owner actions

1. Provide approved User A, User B and editorial-role sessions and complete the
   runtime acceptance matrix with zero-fixture confirmation.
2. Provide viewport tooling or screenshots for authenticated 390px, 768px and
   1280px acceptance, including Global Search.
3. Confirm Auth Site URL, redirects, session/refresh policy, MFA, recovery and
   Vercel OAuth interaction.
4. Provide backup/restore evidence, migration rollback rehearsal, monitoring
   thresholds/window and a named incident owner.
5. Upgrade Supabase and enable leaked-password protection, then rerun Advisor.

## Final recommendation

**Not Ready**

# Final Version 1.0 gate update

The superseding report is `docs/releases/V1-FINAL-RELEASE-GATE.md`. The exact
replacement preview still passes the Global Search owner smoke check. The
recommendation remains **Not Ready** until approved cross-user/role sessions,
responsive viewport evidence and operational readiness evidence are supplied.
