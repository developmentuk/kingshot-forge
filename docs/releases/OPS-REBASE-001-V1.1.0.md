# OPS-REBASE-001 — Version 1.1.0 Re-baseline and Release Control

Date: 13 August 2026
Starting main: `a4842d5cba1bf3a46ddc876db70b0cc079a7711e`
Candidate branch: `chore/forge-rebaseline-2026-08-13`
Status: Candidate preparation; not yet deployed, tagged or production accepted

## Purpose

Reconcile the accepted Forge production line after rapid delivery of Companion, Forge Vision, authentication, observability, Player resilience, Island Route and Oasis foundation work. This sprint changes no Supabase data, provider settings, authentication settings or production deployment.

## Candidate scope

- align release metadata at Version 1.1.0 and derive the visible production label from package metadata;
- remove the unused direct React Router 8 dependency and upgrade `react-router-dom` to patched 7.18.2;
- replace vulnerable SheetJS npm registry 0.18.5 with the official pinned 0.20.3 distribution;
- reconcile AEGIS, README, Roadmap, technical debt, Island Route and Oasis status records;
- record the disposition required for seven legacy open PRs;
- preserve the retired external Player API prohibition and all published-only boundaries.

## Semantic-version decision

Version 1.1.0 is the correct next candidate. The accepted line adds substantial backwards-compatible capabilities after v1.0.2 without deliberately breaking public routes or platform contracts. A v1.1.0 tag must not be created until the exact candidate is merged, deployed READY and smoke-tested.

## Security evidence

Before remediation, the production dependency audit reported three high advisories across React Router and SheetJS. The candidate uses the patched Router line and SheetJS Community Edition 0.20.3 from the installation source documented by SheetJS. Candidate acceptance requires `npm audit --omit=dev` to report zero known vulnerabilities.

## Legacy PR disposition

| PR | Required disposition |
|---|---|
| #30 PLAYER-API-001 | Retain as blocked research or close without merge; retired upstream routes must not enter `main`. |
| #27 PLAYER-INTEL-001 | Close as superseded research after preserving any unique safe evidence; do not merge the conflicting branch. |
| #25 ART-006 | Preserve pending owner visual decision; rebase as a new focused candidate if still wanted. |
| #17 FRKS governance | Reconcile unique records into a current documentation branch, then close the conflicting PR. |
| #16 Sprint 4 FRKS archive | Reconcile unique archival records with current FRKS governance, then close the conflicting PR. |
| #11 Operations Centre | Close as superseded by later accepted `main` capabilities; do not merge the historical release branch. |
| #1 Vercel Web Analytics | Close as obsolete unless a new cost/privacy-reviewed analytics proposal is authorised. |

No PR closure is part of the candidate code diff. Repository conversation changes occur only after candidate review.

## Acceptance gates

- clean install from the committed lockfile;
- zero production dependency advisories;
- focused Auth, Player Identity, Buildings, Companion, Island/Oasis and release-label checks;
- full `npm run check`;
- `git diff --check` and secret scan;
- reviewed diff with no generated output or source-data mutation;
- merge approval;
- exact-head production deployment READY;
- bounded public smoke of homepage, Companion, Island Route, unpublished Oasis boundary and Auth callback failure state;
- create annotated `v1.1.0` tag only after production acceptance.

## Explicitly deferred

- OASIS-001A-PUB;
- Item Admin Stage 2;
- additional authentication providers;
- external Player lookup revival;
- modular implementation movement;
- database, Storage or Search publication changes.
