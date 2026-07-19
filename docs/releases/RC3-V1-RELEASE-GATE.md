# Project Aegis — RC3 Version 1.0 Release Gate

Date: 19 July 2026  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `7cfaad7e75a2078fa04efae6edefb450610c460e`  
Final HEAD: `7cfaad7e75a2078fa04efae6edefb450610c460e`  
Supabase project: `hrvdhjscwitqpwjhnjkm`  

## Executive Summary

The exact RC3 candidate was validated locally and deployed to a protected
Vercel preview. Local structural, focused-test, TypeScript, NodeNext and build
gates pass. The final candidate deployment is READY and uses the exact
candidate SHA. No production promotion occurred.

RC3 cannot close the Version 1.0 gate. The approved authenticated browser
session was not available: the protected preview redirected to Vercel SSO
before the application loaded. Consequently User A/User B isolation,
authenticated editorial runtime acceptance, authenticated responsive
acceptance, and production-equivalent smoke acceptance remain unverified.
The live Supabase security advisors also report unresolved legacy
`SECURITY DEFINER` execution grants and disabled leaked-password protection.

**Final recommendation: Not Ready for Version 1.0**

## Exact Candidate and Deployment

| Item | Evidence |
| --- | --- |
| Candidate branch | `recovery/0.9.0-rc3-feature-reconciliation` |
| Candidate commit | `7cfaad7e75a2078fa04efae6edefb450610c460e` |
| Working tree before deployment | Clean |
| Deployment ID | `dpl_Gtg27ukWziY34K3F7yMiaZArgbnv` |
| Preview URL | https://kingshot-forge-5atjsax7h-clarksim-7474s-projects.vercel.app |
| Build result | READY; Vite build completed |
| Deployment protection | Active; unauthenticated fetch returned HTTP 302 to Vercel SSO |
| Preview runtime logs | No entries in the one-hour post-deploy query |
| Supabase binding | `hrvdhjscwitqpwjhnjkm`; Vercel preview has encrypted `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` variables |
| Client secret review | Browser source exposes publishable Supabase variables only; no service-role key was found in the client scan |

The first deployment attempt was discarded as evidence because the Vercel
link step added a local ignore entry and reported `gitDirty: 1`. The final
deployment was made only after restoring the file and rechecking a clean tree.

## RC1 and RC2 Blocker Reconciliation

| Gate | RC3 status | Evidence |
| --- | --- | --- |
| Owner-authenticated preview acceptance | Release Blocker / Owner Action Required | No approved session was available; protected preview stopped at Vercel SSO |
| User A/User B favourites isolation | Release Blocker / Owner Action Required | Not run; live `favourites` count is zero and policy shape is owner-only |
| Editorial permission isolation | Release Blocker / Owner Action Required | Structural policy/RPC evidence passes; authenticated two-role runtime proof not run |
| Production-equivalent editorial publication | Release Blocker / Owner Action Required | RC2 schema is present; deployed end-to-end acceptance not run |
| Production-equivalent rollback | Release Blocker / Owner Action Required | RPC and immutable-history structure present; deployed fixture workflow not run |
| Production smoke validation | Deferred / Owner Action Required | No production deployment or smoke test was authorized |
| Authenticated responsive validation | Release Blocker / Owner Action Required | Protected preview prevented authenticated viewport checks |
| Generic import staging | Deferred after Version 1.0 | Existing source refresh and dataset-specific editors remain bounded; unsupported generic staging is not claimed |
| Observability | Accepted Risk with owner action | Build/runtime diagnostics exist, but production and authenticated runtime evidence is absent |
| Existing lint warnings | Accepted Risk | Eight unchanged warnings in existing shared/UI files; no new warnings in `npm run check` |
| Vite bundle-size warning | Accepted Risk / Post-Version 1.0 optimisation | Main JS chunk is 1,087.93 kB minified; no regression from the candidate baseline |

## User A/User B and Favourites Evidence

RC3 performed no live fixture writes. Therefore fixture totals are:

| Operation | Total |
| --- | ---: |
| Inserted | 0 |
| Updated | 0 |
| Deleted | 0 |
| Remaining labelled fixture rows | 0 |

The live database reports `public.favourites` enabled with RLS and zero rows.
Its policies allow authenticated users to select, insert and delete only rows
where `auth.uid() = user_id`; no update policy is present. Focused local
favourites tests pass, but they are not a substitute for two authenticated
users. User A add/visibility, User B non-visibility, arbitrary `user_id`
rejection, account switching, session restoration and direct API/RLS checks
remain **Not Run**.

## Editorial Acceptance

Local editorial API, validation, permission, publication-failure and rollback
contract checks pass without database writes. Live schema inspection confirms
RLS on editorial tables and service-role-only ACLs for:

- `commit_editorial_version`
- `publish_editorial_queue_item`
- `rollback_editorial_version`

Each is a `SECURITY DEFINER` function owned by `postgres` with only
`postgres`/`service_role` execution ACLs. The deployed workflow
Source Refresh → Provenance → Review/Edit → Validation → Queue → Approval →
Publication → History → Compare → Rollback → Republish → Audit was **not run**
because the authenticated session gate was unavailable. No live editorial
fixture was inserted, and no canonical production content was changed.

## Security and Privacy Evidence

- All listed public tables are RLS-enabled.
- Favourites ownership policy is correctly scoped to `auth.uid()`.
- RC2 privileged editorial RPCs are not executable by browser roles.
- Client secret scan found no service-role key or credential literal in browser source.
- Public profile privacy and session/cache isolation have local structural evidence but no RC3 authenticated runtime proof.
- Supabase security advisors returned 22 informational and 31 warning findings. Warnings include 13 legacy anonymous `SECURITY DEFINER` execution findings, 14 authenticated execution findings, one mutable function search path, and disabled leaked-password protection. These are owner-action release risks; no live grant/auth changes were made in RC3.

## Generic Import Staging Decision

**Deferred after Version 1.0.** Supported source refresh, provenance/hash
validation and bounded dataset-specific editorial paths exist. The UI does not
claim a complete generic staging workflow. A broad Import Manager redesign is
post-v1.0 scope.

## Observability and Analytics

Existing Operations Centre, server error mapping, audit events and search
diagnostics remain the operational architecture. The final preview build had
no runtime log entries in the queried window. Authenticated error, RLS,
publication, rollback, import, render and search failures could not be
exercised on the protected preview. The analytics abstraction uses the
established measurement ID `G-8L3HYETN51`, sends only coarse permitted values,
and does not initialise or block runtime; production acceptance remains open.

## Responsive Acceptance

Authenticated checks at 390px, 768px and 1280px were **Not Run** because the
preview protection redirected before app load. Existing local/structural
responsive checks remain historical evidence only and do not close this RC3
gate. No responsive code was changed.

## Performance and Bundle Decision

The Vite build passes with one main JS chunk at 1,087.93 kB minified (279.79
kB gzip) and the existing >500 kB warning. No unexplained regression was
found, and no low-risk split was introduced during the release gate. Decision:
**Accepted for Version 1.0 only as an owner-approved technical-debt risk;
post-Version 1.0 optimisation remains planned.**

## Validation Results

- `npm run check` — pass; eight existing lint warnings and the existing Vite chunk warning remain.
- `npx tsc -p tsconfig.server.json --noEmit` — covered by the passing TypeScript/build gate; explicit RC3 rerun remains part of final owner handoff.
- `npm run validate:nodenext` — pass within `npm run check`.
- Focused editorial, identity, art, auto-redeem, render, search, workspace, contributor and favourites suites — pass within `npm run check`.
- Full Vercel preview build — pass; deployment READY.
- Cross-user RLS, authenticated browser, editorial runtime, rollback runtime and responsive acceptance — blocked by owner session/protection.
- Working tree after deployment — clean; no push, merge, tag or production promotion.

## Deferred Scope

Saved Progression Plans, the Planning Engine, generic import staging, broad
Operations enhancements, notification product work, unified audit console and
bundle optimisation remain post-v1.0 scope. ADR-0114 remains in force and no
planning schema, API or product was added.

## Owner Actions Required

1. Provide an approved authenticated preview browser session for the exact URL and approve the User A/User B fixture identities.
2. Run and record the complete two-user favourites/RLS and role/editorial acceptance, including cleanup totals.
3. Resolve or explicitly accept the Supabase security-advisor findings, especially browser-role execution of legacy `SECURITY DEFINER` functions and leaked-password protection.
4. Approve the production release window, exact commit, migration verification, backup/rollback owner and monitoring window.

## Production Promotion Plan

Production remains explicitly out of scope for RC3. The owner gate sequence is:

1. Owner approves this report’s remaining security/privacy findings and signs off the authenticated preview evidence.
2. Reconfirm clean branch and exact accepted SHA; verify checked-in migrations match the live schema and run database advisors.
3. Confirm backup/rollback readiness and named release/rollback owner.
4. Merge the accepted branch through the owner-approved strategy, update version/release notes, and create the semantic tag only after approval.
5. Deploy the exact approved SHA to production; run authentication, session restoration, My Forge/favourites, editorial publication, audit and rollback smoke checks.
6. Monitor the agreed window. Roll back if authentication loops, privacy leakage, RLS denial mismatch, publication partial state, audit loss, elevated runtime errors or failed smoke checks occur.

No merge, tag, push, production deployment or promotion was performed by RC3.

## RC4 follow-up — 19 July 2026

RC4 added the checked-in migration
`20260719210000_rc4_security_definer_hardening.sql` and focused test
`npm run test:rc4-security`. The migration locks the feedback trigger search
path and removes anonymous/unnecessary public SECURITY DEFINER execution while
preserving the existing authenticated role/access and alliance command
contracts. It has not been applied to Supabase pending owner approval.

RC4 therefore retains the RC3 recommendation **Not Ready for Version 1.0**.
See [`RC4-SECURITY-HARDENING.md`](RC4-SECURITY-HARDENING.md) for the complete
advisor disposition, authentication review and operational owner gates.
