# Project Aegis — RC5 Owner Security and Acceptance

Date: 19 July 2026  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `55583a325330eba55689b68a2963c2731c21d911`  
Supabase project: `hrvdhjscwitqpwjhnjkm`

## Scope and outcome

RC5 was limited to owner-controlled security configuration, production-readiness review, exact preview deployment and acceptance evidence. No user-facing feature, architecture, merge, tag, push or production promotion was performed.

The checked-in RC4 migration was applied to the connected Supabase project with owner approval. The exact clean candidate was deployed to a Vercel preview. Local validation and the remote build passed. RC5 remains **Not Ready for Version 1.0** because leaked-password protection did not persist on the Free plan, authenticated two-user/editorial/responsive acceptance was not evidenced, and backup/restore and operational ownership evidence remain open.

## RC4 migration and database security

Migration applied: `supabase/migrations/20260719210000_rc4_security_definer_hardening.sql`. Supabase records the applied migration as `20260719201845 rc4_security_definer_hardening`.

Post-migration SQL verification showed:

- the 13 legacy/public SECURITY DEFINER functions have `anon` and `authenticated` execution revoked;
- the five intended authenticated commands remain callable only by `authenticated` plus service roles: `approve_alliance_membership`, `cancel_alliance_membership_request`, `leave_current_alliance`, `reject_alliance_membership`, and `request_alliance_membership`;
- the three intended signed-in access helpers remain callable by `authenticated` plus service roles: `current_forge_role`, `get_my_forge_access`, and `has_forge_permission`;
- `set_feedback_report_updated_at()` has `search_path=public` and remains available for its trigger use;
- publication, rollback, audit immutability, RLS predicates and service-role boundaries were not weakened.

The remaining authenticated SECURITY DEFINER Advisor warnings are **accepted intentional warnings**, pending owner review of the application contracts. They are not evidence of anonymous exposure.

## Advisor disposition

Fresh security Advisor results after migration and Auth review:

| Finding | Count | Classification | Disposition |
| --- | ---: | --- | --- |
| RLS enabled with no policy | 22 | Informational / accepted design | Service-owned or staging/audit tables retain RLS and have no client policy. Add policies only with a reviewed access contract. Does not block V1.0 by itself. |
| Authenticated SECURITY DEFINER executable | 8 | Accepted risk / intentional | Five authenticated commands and three access helpers are required by the application capability boundary. Anonymous execution was removed. |
| Leaked password protection disabled | 1 | High / owner blocker | The Auth dashboard showed a Free plan and the toggle reverted to disabled after reopening. This is exploitable for compromised-password reuse and blocks public V1.0 until Pro protection is enabled or the owner explicitly accepts the residual risk. |

No anonymous SECURITY DEFINER warning and no mutable `search_path` warning remain. Performance Advisor findings remain unchanged technical debt: 53 unindexed foreign keys, 31 RLS init-plan notices, 68 unused-index notices and 20 multiple-permissive-policy notices. No speculative index or policy changes were made.

## Authentication review

Owner-authenticated Supabase dashboard review recorded:

- project plan: Free;
- sign-ups enabled; anonymous sign-ins disabled; manual linking disabled;
- email confirmation enabled;
- Email provider enabled; Google provider enabled; other listed providers disabled; no custom providers;
- secure email change enabled; secure password change and current-password-on-update remain disabled;
- leaked-password protection could not be saved on the current plan and remains disabled;
- Site URL and redirect allowlist, session lifetime, refresh-token rotation, MFA readiness, account recovery and Vercel OAuth redirect behavior require owner confirmation.

No secrets, cookies, tokens or provider credentials were read or recorded.

## Preview and acceptance

The exact clean starting commit was deployed with Vercel CLI as a preview only:

- deployment: `dpl_EuXYfCzhQf8xB38PWEXuZonSig8Z`;
- URL: `https://kingshot-forge-gmfqjr85y-clarksim-7474s-projects.vercel.app`;
- status: READY; remote Vite build passed;
- deployment was uploaded from verified clean HEAD `55583a325330eba55689b68a2963c2731c21d911`; Vercel inspect did not expose a source SHA for this filesystem-upload deployment.

The protected preview boundary was not bypassed. An authenticated application session for the exact RC5 URL was not available, so User A/User B isolation, signed-out rejection, favourites persistence, editorial publication and rollback runtime, admin/API role matrix, authenticated error handling, and responsive checks at 390px, 768px and 1280px are **Not Run / owner action**. No RC5 fixtures were created; fixture creation and cleanup totals are both zero.

## API, operations and performance review

Static review retained the existing `requireForgeActor` and capability checks, safe error envelopes, server-only service-role usage and endpoint-specific rate-limit boundaries. There is no platform-wide limiter for every public endpoint; the owner should confirm Vercel/Supabase edge limits and abuse monitoring before launch.

Backups/restore evidence, migration rollback rehearsal, named incident owner, production alert thresholds and a monitoring window were not available in the connected tools. Analytics remains privacy-filtered and non-blocking under measurement ID `G-8L3HYETN51`. The main bundle remains 1,087.93 kB minified / 279.79 kB gzip with the existing Vite >500 kB warning; no risky optimisation was introduced.

## Validation

- `npm run check` — pass; existing eight lint warnings and existing large-chunk warning remain.
- `npx tsc -p tsconfig.server.json --noEmit` — pass.
- `npm run validate:nodenext` — pass.
- focused security and project checks — pass within `npm run check`.
- production-equivalent Vercel preview build — READY.
- `git diff --check` — pass.
- working tree — clean before RC5 documentation commit; final clean-tree verification is required after commit.

## Owner actions required

1. Upgrade Supabase to Pro and enable leaked-password protection, then reopen Auth settings and rerun the security Advisor.
2. Confirm exact Site URL, redirect allowlist, session and refresh-token policy, MFA requirement for owner/admin accounts and recovery behavior.
3. Provide approved authenticated User A and User B preview sessions and complete the cross-user, editorial publication/rollback and responsive acceptance matrix.
4. Attach backup/restore evidence, migration rollback rehearsal, named incident owner, alert thresholds and the production monitoring window.

## Final recommendation

**Not Ready for Version 1.0.** RC5 security hardening is applied and verified, but the unresolved leaked-password protection setting and missing owner-authenticated/operational evidence are release blockers.

## RC5A follow-up — 19 July 2026

RC5A fixed the verified Global Search inline-rendering defect and deployed
replacement preview `dpl_6n8fUzHAJ3sGUTdyQf6mESxXrw6j` from commit
`c130173b31444bf6b47a86412f1c54e17efe6f91`. The owner-authenticated browser
session reached the replacement and verified body-level dialog placement,
scroll lock, focus entry/restoration, explicit close behaviour and clean
preview diagnostics. The authoritative RC5A report records the remaining
owner gates and final **Not Ready** recommendation.

# Final Version 1.0 gate update

The final evidence record is `docs/releases/V1-FINAL-RELEASE-GATE.md`.
RC5's accepted security decisions remain unchanged; the final gate still needs
approved User A/User B/editorial/admin sessions and owner operational evidence.
