# UX-002 — Version 1.0 release-blocker remediation

Date: 20 July 2026  
Branch: `recovery/0.9.0-rc3-feature-reconciliation`  
Starting HEAD: `e2e6fe6`  
Supabase project: `hrvdhjscwitqpwjhnjkm`

## Scope and disposition

This focused sprint addresses the owner-reported UX-002 blockers while keeping
the existing Router, Forge design tokens, search/relationship engine, KvK data
contract and Supabase constraints.

| Blocker | Root cause | Remediation |
| --- | --- | --- |
| Search activation | Activation restored stale focus and had a weak destination fallback | Canonical relative destinations use router navigation; successful navigation suppresses stale focus restoration |
| Progression save | `player_level` was copied into Town Center although the database contract is 1–30 | Out-of-contract values are unknown; client/service validation and friendly constraint translation preserve the database contract |
| Settings / operations contrast | Legacy light panels overrode Forge surfaces | Shared dark surfaces, readable contrast, smaller headings and responsive grids |
| Hero ratings | Absolutely positioned explanations and oversized headings caused collisions | Normal flow, dedicated rating spacing and safe wrapping |
| Forge Connections | Filler discovery copy and duplicate/self results obscured real relationships | Published related records are deduplicated, self references excluded, grouped and explicitly empty when absent |
| Operations readability | User and application pages used disconnected light styling | Shared dark filters, tables, badges, focus states and bounded overflow |
| Render Engine navigation | Existing route was absent from the Operations registry | Permission-gated `Render Engine` item added beside Data Engine |
| Release copy | Personal and obsolete release wording remained player-facing | Neutral `Forge Preview` / `Version 1.0` presentation |
| KvK presentation | Results were card-only | Persisted Cards / Compact toggle and compact table added without changing data contracts |

## Schema and evidence

No schema weakening or live migration was applied. The inspected
`player_progression_town_center_range` constraint remains nullable or integer
1–30. The live snapshot count was zero at inspection, so no valid history was
changed. Authenticated visual screenshots, a clean protected preview and owner
review remain required follow-up evidence; local checks do not imply approval.

## Exact preview candidate

The implementation commit `6fae77bcdac789b162b8bc1e429aaef8890aef99` was
first deployed successfully as Vercel deployment
`dpl_Hcw1Eg3bWkqVovyQ7AjTkAeanLEK`:

`https://kingshot-forge-6m5f3t8cv-clarksim-7474s-projects.vercel.app`

This was a protected preview target and was not promoted to production. The
documentation follow-up `e7dc0830a047d1fd7a624d26717d7602bf01a28d` was also
deployed READY as `dpl_JBEoW5XHHnHnyLXVmaSQkwcoiVdR` at
`https://kingshot-forge-ahzw0qw8f-clarksim-7474s-projects.vercel.app`.

The exact final deployed commit is `e7dc0830a047d1fd7a624d26717d7602bf01a28d`.

## Owner review checklist

Search activation; valid and invalid progression save; Settings; Hero ratings;
Forge Connections; User Management; Contributor Applications; authorised
Render Engine navigation; KvK Cards / Compact modes; and neutral release copy
at 390px, 768px, 1280px and 1440px.
