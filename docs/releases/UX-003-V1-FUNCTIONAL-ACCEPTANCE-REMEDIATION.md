# UX-003 V1 Functional Acceptance Remediation

Status: implementation and local validation in progress from `06d9952`.

## Owner failures and fixes

| Failure | Root cause | Exact fix | Tests / evidence | Remaining limitation |
| --- | --- | --- | --- | --- |
| Search destinations | Results used a Search-page fallback when `canonical_url` was absent or invalid. | Added one destination resolver and applied it to command search, Search page, Search Explorer and Forge Connections; unsupported records are informational only. | `test-ux003-contracts`, `test-search-experience`, build. | Dataset-specific destinations depend on routes that are present in this checkout; new datasets must register a route before becoming clickable. |
| Linked identity refresh | Session establishment only read Supabase and never called the revalidation endpoint. | Added stale-session refresh, five-minute single-flight throttling, cached-data fallback and quiet error state. | `test-ux003-contracts`, build. | Live API name/avatar/Town Center evidence requires an authorised preview session. |
| Personal Progression | Generic `player_level` and rendered labels were treated as Town Center without normalization. | Added explicit Town Center parsing for canonical forms such as `Town Center 30` / `TC30`; values outside 1–30 or unrelated strings such as `TG6-0` remain unavailable. | `test-ux003-contracts`, existing progression contracts, build. | No Town Center is invented when the provider omits it. |
| User roles | Mutation reason was detached from role controls, making disabled actions look broken. | Moved reason beside role actions, added prerequisite title text and retained server-side role, self-lockout and final-owner protections. | `test-ux003-contracts`, server TypeScript. | Live audit verification requires owner/admin credentials. |
| Render Engine | Registry exposed metadata-only benchmarks without explaining artwork approval status. | Existing registry is now treated as the source of truth; usable artwork, metadata-only states, local reference comparison, calibration save/import and profile workflow are surfaced in the lab. | render-engine tests, `test-ux003-contracts`, build. | Metadata-only artwork remains unavailable until approved source artwork exists. |
| Hero ratings | Four columns and fixed minimum card heights compressed labels and star rows. | Two columns are the safe default, four columns require a 240px card budget, mobile uses one column and card height is content-driven. | `test-ux003-contracts`, build. | Browser screenshots at 390/768/1024/1280/1440 remain owner evidence. |
| Forge Connections | Loose search results were grouped into repetitive relationship rows and links could fall back to Search. | Deduplicate, exclude self and inaccessible records, rank deterministically, cap results, and present curated destination cards with reasons and Open actions. | `test-ux003-contracts`, build. | Relationship quality remains bounded by the published relationship projection. |
| KvK versus | Cards showed a flat searched-kingdom summary. | Added original Forge A/B panels, central VS marker, attacker/defender labels, winner emphasis, prep/castle/capture strip and responsive stacking; Compact remains a table. | `test-ux003-contracts`, build. | Live visual acceptance remains preview evidence. |

## Runtime evidence

Not recorded yet. The replacement preview must be opened with approved reversible fixtures and evidence captured for Search click/Enter, automatic identity refresh, progression save, role assign/revoke/audit, Render Engine selection, all five hero widths, Forge Connections and KvK cards. No private credentials or session data belong in this document.

## Validation

Focused local checks currently include NodeNext validation, server TypeScript, Vite build, Search contracts, UX-002 contracts and Render Engine persistence/registry tests. Full `npm run check`, `npm run lint`, `git diff --check`, authenticated browser evidence, fixture cleanup totals and exact-commit deployment remain release-gate work.

