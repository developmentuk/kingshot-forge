# Project Aegis — RC4 Security Hardening & Production Readiness

Date: 19 July 2026  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `4b284e3ca265afedd5f5bcadd9065a400de8ef75`  
Supabase project: `hrvdhjscwitqpwjhnjkm`

## Outcome

RC4 completed the security and operational review and added a narrowly scoped
privilege-hardening migration plus focused static checks. The migration has
not been applied to the live Supabase project because live grant/auth changes
require owner approval. No user-facing feature or architecture was added.

The local candidate is technically improved but is not yet production-ready:
live advisor findings, Supabase Auth settings, backup/monitoring evidence and
owner-authenticated production-equivalent smoke acceptance remain open.

**Final Version 1.0 recommendation: Not Ready for Version 1.0**

## Advisor Findings and Dispositions

Advisor results were collected from the connected project on 19 July 2026.

| Finding | Count | Affected objects | Classification | Disposition / release impact |
| --- | ---: | --- | --- | --- |
| RLS enabled with no policy | 22 | `data_import_*`, contributor application tables, Forge identity tables, gift security tables, search projection/refresh tables, source staging tables | Informational | Accepted risk. These are server-owned or intentionally non-browser tables; RLS deny-by-default is safer than adding broad policies. Not a blocker. |
| Mutable function search path | 1 | `public.set_feedback_report_updated_at()` | Medium | Fixed in the RC4 migration with `search_path = public`; live application and re-advisor verification required. Blocks release until applied or explicitly accepted. |
| Anonymous execution of SECURITY DEFINER functions | 13 | Alliance membership, Forge ID, transfer helper, trigger and legacy role functions | High | Fixed in the RC4 migration by revoking `public`, `anon` and unnecessary `authenticated` execution. Live application required; blocks release while live. |
| Authenticated execution of SECURITY DEFINER functions | 16 | The same legacy functions plus role/access helpers | Medium | Eight unnecessary grants are removed in the migration. Eight intentional authenticated contracts remain: five alliance membership commands and three role/access helpers, all with auth/capability checks. Documented accepted risk after live verification. |
| Leaked-password protection disabled | 1 | Supabase Auth configuration | Medium | Deferred to owner-controlled Auth settings. Enable before public release; blocks release until confirmed or explicitly accepted by Clark. |
| Unindexed foreign keys | 53 | Alliance, player, editorial, gift, transfer and contributor relationships | Low | Deferred performance maintenance. No demonstrated v1.0 usability or security impact. |
| Auth RLS initplan | 31 | Existing player, alliance, transfer and feedback policies | Low | Deferred optimization. Policies use the established `(select auth.uid())` pattern where RC2/R8B hardening requires it; no broad policy rewrite in RC4. |
| Unused indexes | 68 | Existing domain and editorial tables | Informational | Deferred. Advisor usage history is not sufficient evidence for safe removal; no destructive index changes. |
| Multiple permissive policies | 20 | Existing alliance, art, hero, player, submission and transfer tables | Low | Deferred. Policies are additive by domain boundary; consolidation would broaden RC4 beyond safe hardening. |

No finding was treated as a false positive solely because it was inconvenient.

## SECURITY DEFINER Review

The live project contains 22 `SECURITY DEFINER` functions: two internal
`forge_private` functions and 20 public functions.

- Required and retained: `forge_private.has_permission(text)` with locked empty search path; `forge_private.prevent_editorial_history_mutation()` for append-only triggers; the service-role-only editorial commit, publication and rollback RPCs.
- Required authenticated contracts: `get_my_forge_access()`, `current_forge_role()`, `has_forge_permission(text)`, and the five alliance membership commands. Their existing function bodies validate `auth.uid()` and/or capability/ownership before mutation.
- Overly exposed and hardened: Forge ID helpers, transfer helper, legacy `current_user_role()`, trigger helpers and internal alliance capability helpers. The RC4 migration removes their Data API grants.
- Search path: the mutable feedback trigger is explicitly locked to `public`; existing privileged functions already use either `search_path = public` or `search_path = ''`.

Publication and rollback guarantees are unchanged. Their ACLs remain
`postgres`/`service_role` only, and their immutable-history/atomicity logic was
not weakened.

## Authentication Review

Repository evidence confirms:

- Google OAuth is the only browser sign-in path currently implemented.
- The client uses Supabase session restoration and `onAuthStateChange`.
- Redirects use the current browser origin and path; exact production, preview and local redirect allowlists still require dashboard confirmation.
- Server-side Supabase Admin clients disable auto-refresh, persistence and URL session detection.
- Vercel SSO protection is deployment protection, not application authorization; it must remain enabled and must not be bypassed.

The connected tools do not expose Supabase Auth dashboard settings, so these
items remain owner verification gates rather than unverified claims:

| Setting | Version 1.0 recommendation |
| --- | --- |
| Email verification | Confirm the selected Google identity flow and any enabled email provider require verified email before privileged use. |
| OAuth providers | Keep only approved Google provider configuration; remove unused providers and verify production/preview redirect URLs. |
| Session lifetime | Use the approved short-lived access-token policy and Supabase refresh-token rotation; record the chosen values. |
| MFA | Confirm MFA readiness for owner/admin accounts before production access. |
| Account recovery | Test approved recovery path and ensure redirect allowlists are exact. |
| Leaked-password protection | Enable in Supabase Auth before public release. |

## Database, RLS and RPC Review

All listed public tables are RLS-enabled. Favourites policies enforce
`auth.uid() = user_id`; editorial history reads are capability-gated; editorial
mutation RPCs are service-role-only; service-role credentials remain server
side. No browser service-role key or protected environment variable was found
in `src`.

The RC4 migration is intentionally additive and reversible at the migration
level: it changes function ACLs and one function configuration only. It does
not change tables, rows, RLS predicates, publication transactions, rollback
logic or audit immutability.

## API Surface Review

Static review found privileged Vercel handlers consistently use
`requireForgeActor` and capability checks, while public search and public
player paths return projection-safe fields. Error envelopes map known auth,
permission, validation and not-found failures to safe JSON messages; server
errors avoid returning database details. Existing focused API tests cover 401,
403, 404, 409 and 422 outcomes.

Rate limiting is established for the Art Studio and Gift Redemption domains;
there is no single platform-wide rate limiter for every endpoint. This is a
deferred operational risk, not a new feature to add in RC4. Before production,
the owner should confirm Vercel/Supabase edge limits and monitor abuse-prone
public search and auth endpoints.

## Operational Readiness

| Area | RC4 finding | Disposition |
| --- | --- | --- |
| Backups | No owner-confirmed backup/restore evidence was available in the connected tools | Owner action required before release |
| Migration rollback | Checked-in RC4 ACL migration is narrow and transaction-wrapped; live rollback must be rehearsed or owner-approved | Owner action required |
| Deployment | Exact-commit preview process documented; no production promotion performed | Ready for owner-controlled next gate |
| Monitoring/logging | Vercel runtime logs, server error mapping, audit events and Operations diagnostics exist; production alert thresholds are not evidenced | Owner action required |
| Analytics | Measurement ID remains `G-8L3HYETN51`; events are coarse and privacy-filtered; runtime is not blocked | Accepted risk, verify production tag behavior |
| Incident recovery | Release and rollback runbooks exist; named on-call/monitoring window is not recorded | Owner action required |

## Performance Review

The production build remains stable with a 1,087.93 kB minified main JS chunk
(279.79 kB gzip), the same >500 kB Vite warning recorded in RC3, and no new
dependency. No risky route-splitting or architecture refactor was introduced.
Bundle splitting, unused-index review and foreign-key indexing remain
post-v1.0 technical debt.

## Validation

- `npm run check` — pass; eight unchanged lint warnings and unchanged Vite bundle warning.
- `npx tsc -p tsconfig.server.json --noEmit` — pass.
- `npm run validate:nodenext` — pass.
- `npm run test:rc4-security` — pass.
- Production-equivalent local build — pass.
- Live migration application, post-migration advisors, Auth dashboard settings, backup restore and authenticated smoke — not run; owner approval/access required.

## Owner Actions Required

1. Approve and apply `20260719210000_rc4_security_definer_hardening.sql` to the connected project through the controlled migration process.
2. Re-run Supabase security/performance advisors and confirm the intended remaining authenticated-only SECURITY DEFINER warnings.
3. Enable leaked-password protection and record email/OAuth, redirect, session, refresh-token and MFA settings.
4. Provide backup/restore evidence, monitoring thresholds, alert ownership and rollback rehearsal evidence.
5. Complete the RC3 authenticated owner, User A/User B, editorial and responsive acceptance gates.

## Release Recommendation

**Not Ready for Version 1.0.** RC4 local hardening is complete, but public
release remains blocked by unapplied live security changes and unverified
authentication/operational owner gates.

## RC5 follow-up — 19 July 2026

The owner-approved migration is applied and verified in Supabase project
`hrvdhjscwitqpwjhnjkm`. The expected anonymous grant removals and
`search_path=public` trigger lock are live. Fresh security Advisor results now
show only the intentional eight authenticated SECURITY DEFINER warnings among
the RC4 function findings; leaked-password protection remains disabled because
the project is on the Free plan. Exact preview deployment is READY, but
authenticated browser acceptance, backups/restore, rollback rehearsal and
monitoring ownership remain open. RC5 therefore remains **Not Ready for
Version 1.0**; see `RC5-OWNER-SECURITY-AND-ACCEPTANCE.md`.
