# Technical Debt Register

Reviewed: 13 August 2026. Severity: P0 blocker, P1 high, P2 medium, P3 low.

Resolved historical findings remain in Git and release records; this register describes current actionable debt on the Version 1.1.0 candidate line.

| ID | Severity | Area | Current debt / risk | Required action | Target |
|---|---:|---|---|---|---|
| TD-021 | P1 | Documentation | Release, roadmap and branch records drifted behind accepted `main` | Complete OPS-REBASE-001 reconciliation and keep state changes in the relevant release record | Version 1.1.0 |
| TD-022 | P1 | Pull requests | Seven legacy PRs are open and conflicting; several have already been superseded by later `main` work | Close as superseded/blocked or create a deliberately rebased replacement after evidence review | OPS-REBASE-001 |
| TD-023 | P1 | Dataset publication | Buildings has complete live publication acceptance; most other standard datasets remain partial and Items remains read-only Admin Stage 1A | Select one dataset and complete its full governed vertical slice before expanding breadth | Milestone 2 |
| TD-024 | P1 | External Player API | Century Games `/captcha` and `/player` routes are retired; legacy wrappers and supplied bot code cannot provide a safe read-only identity contract | Keep live lookup disabled; continue screenshot/hybrid claim verification until a current read-only contract is independently verified | Player Identity |
| TD-025 | P1 | Oasis publication | OASIS-001A is merged source evidence but has no governed published projection, public media or Search publication | Deliver OASIS-001A-PUB without exposing staged evidence | Next product sprint |
| TD-026 | P2 | Asset performance | Oasis header is approximately 7.4 MB and the retained scenic draft is approximately 8.4 MB | Resize/convert the published candidate and remove or archive unused runtime assets during OASIS-001A-PUB | OASIS-001A-PUB |
| TD-027 | P2 | Lint | Ten established React/Fast Refresh warnings remain | Resolve hook dependency and component-export warnings without behaviour drift | Version 1.1.x |
| TD-028 | P2 | Runtime logs | Node 24 reports inherited `url.parse()` DEP0169 warnings on successful Vercel requests | Identify the owning dependency/runtime and remove the warning without changing API behaviour | OPS issue #35 |
| TD-029 | P2 | Modularity | ADR-014 and modular companion governance are present but still owner-acceptance gated | Complete the read-only collision/ownership audit before any implementation movement | MOD-FOUND-001 |
| TD-030 | P2 | Release identity | Latest tag is v1.0.2 while accepted `main` contains extensive backwards-compatible capabilities; package metadata previously remained 1.0.0 | Release the exact accepted candidate as v1.1.0 only after deployment and smoke acceptance | Version 1.1.0 |
| TD-031 | P3 | Dependency operations | SheetJS current Community Edition is distributed from its official CDN rather than the stale npm registry package | Keep the official tarball pinned and review integrity/advisories during dependency updates | Ongoing |

## Closed by OPS-REBASE-001

- The redundant direct React Router 8 dependency was removed.
- `react-router-dom` was upgraded to the patched 7.18.2 line.
- SheetJS moved from vulnerable npm registry version 0.18.5 to the official 0.20.3 distribution.
- `npm audit --omit=dev` reports zero known vulnerabilities on the candidate.
- The obsolete claims that Forge had no tests, CI or migrations were removed; the repository has a complete scripted gate, GitHub workflows and checked-in migrations.

## Debt management rules

- New P0/P1 debt blocks milestone completion unless explicitly accepted by an ADR or release decision.
- Every accepted item requires an owner, evidence and target.
- Review this register at each milestone and release gate.
