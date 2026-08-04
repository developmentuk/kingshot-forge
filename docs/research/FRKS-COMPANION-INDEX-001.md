# FRKS-COMPANION-INDEX-001 — Companion Item Index Production Closeout

Status: **PASS / operationally accepted for the player-facing foundation**
Programme: Kingshot Forge Companion
Workstream: COMPANION-INDEX-001
Repository: `developmentuk/kingshot-forge`
Validated feature SHA: `4e3e752ea590f060ca2091168996829165531b6c`
Production main SHA: `8a64afb9a8f76d1eaf370c5725602ca9a03eee1d`
Production deployment: `dpl_6jo3pUrbcaYPihyFNR99VFYdY55H`

## Decision

The canonical Companion Item Index is accepted in production for its player-facing scope. Forge publishes 75 stable item identities at `/companion/items/:itemKey`, including 59 governed full artworks, seven governed compact icons and nine honest no-media records. The canonical spelling is `item.mithril`; `item.mythril` does not exist, while the governed global Search alias `mythril` resolves to Mithril.

This decision does not accept an Items Admin browser, editor, media-replacement workflow, review transition, atomic publication or rollback capability. Those remain a separate complete vertical slice.

## Lasting findings

1. Public Companion records can be a repository-controlled published projection without pretending that an Admin publication system already exists.
2. Media role is part of the governed contract. Full artwork and compact icons require separate immutable paths and presentation behavior.
3. Original archive names are evidence, not canonical identity. A source typo may map to an existing canonical item while Search carries a discoverability alias.
4. Missing gameplay knowledge and missing media are valid published states when they are visible, explicit and test-protected.
5. Search graph relationships must remain absent until both endpoints have canonical published Search destinations; UI-only planned relationships must not create orphan edges.
6. Image failure state must be keyed to the active source so client-side route reuse cannot make one failed image suppress later valid item media.
7. A dedicated media gate must both trigger on governed binary/generator changes and directly validate checksum, dimensions, alpha and manifest agreement.

## Production evidence

- PR #37 merged with a merge commit at `2026-08-04T12:22:48Z`.
- `main` and the deployed Git SHA are `8a64afb9a8f76d1eaf370c5725602ca9a03eee1d`.
- Vercel deployment `dpl_6jo3pUrbcaYPihyFNR99VFYdY55H` is READY and serves `https://ksforge.app/`.
- The production Data Engine returns exactly 75 unique item records.
- The production catalogue renders 66 governed images and nine honest fallbacks; a complete lazy-load pass found zero failed images.
- Representative full-artwork, compact-icon, long-title and no-media item pages resolved with visible metadata and Companion breadcrumbs.
- Global Search exposes the Items dataset filter and returns the accepted canonical sets for exact items, teleporters, emblems, Conquest Skill Books and Gen 4/5 Hero Widget Chests.
- Existing homepage, navigation, Buildings and public Search surfaces remained operational.

## Search and mutation boundary

The accepted publication remains run `search-refresh-1785795347195`, dataset mode, exactly `["items"]`, index v7. The post-release audit found 634 total projections, 75 item projections, zero duplicates, zero refresh failures, zero relationships and zero orphan endpoints. Every per-dataset projection fingerprint matched the pre-release baseline, the run count remained seven, and historical run `search-refresh-1785782191921` remained unchanged.

No refresh, invalidation, retry, rebuild or projection mutation occurred. The first production query executed the designed cache-warm path and updated only `search_index_metadata.cache_built_at`. This operational timestamp write is explicitly distinguished from canonical data, projections and refresh evidence.

## Rights and trust boundary

Published media retains rights state exactly `owner_declared_creative_commons`. Forge does not claim independent verification of the exact licence variant, artist, original website, source URL, ownership, official status or endorsement. Gameplay meaning remains research-needed where the governed intake does not support it.

## Limitations and retained risks

- The production browser session was anonymous and correctly exposed Sign in; authenticated owner-state smoke was not repeated.
- Live viewport emulation was unavailable. Mobile confidence remains the owner-accepted protected-preview widths and unchanged final responsive contracts.
- Vercel logs classify Node 24's inherited `[DEP0169] url.parse()` deprecation warning as error-level even though affected API requests returned 200. No fatal or 5xx response occurred.
- Three inherited high dependency advisories remain: one React Router RSC-mode advisory outside Forge's used mode and two SheetJS advisories on the pre-existing Admin workbook path with no available fix.
- Release versioning remains ambiguous; no tag or GitHub Release was invented.

## Remaining boundary

Issues #33 and #34 remain open. The recommended next workstream is `COMPANION-ADMIN-001` — Item Browser, Editor, Approval, Atomic Publication and Rollback. This FRKS record does not start or authorize that work.
