# COMPANION-INDEX-001 — Expanded Catalogue Visual Acceptance

**Status:** Accepted by the project owner
**Accepted visual candidate:** `de1f99fe556784a6830b1cab5ce5dbb6ae5b4c99`
**Protected deployment:** `dpl_GVxisaMDHPL2MkJAR1XA7ifG3dvT`
**Review surface:** Protected Vercel Preview for PR #37
**Production:** Unchanged
**Persisted Search:** Published by one separately authorised `items`-only refresh

## Purpose

This record governs owner acceptance of the 75-item Companion projection and its 66 published preview assets. It does not repeat or revoke the accepted ten-item text-only foundation, claim that every possible visual combination was reviewed, or approve production deployment or merge.

The accepted candidate preserves 59 full artworks, seven compact icons, 66 unique checksum-backed transparent WebPs, `owner_declared_creative_commons`, the canonical `item.mithril` identity and the absence of `item.mythril`.

## Review record

- Exact accepted candidate SHA: `de1f99fe556784a6830b1cab5ce5dbb6ae5b4c99`.
- Protected Preview deployment ID: `dpl_GVxisaMDHPL2MkJAR1XA7ifG3dvT`.
- Owner decision: accepted on 2026-08-03 after desktop and mobile review.
- Desktop acceptance: catalogue, representative full-artwork and compact-icon cards, long-title wrapping, transparent media presentation, filters, canonical navigation, focus states and honest missing-media states accepted.
- Mobile acceptance: the same representative surfaces accepted at approximately 320px, 375px, 390px and 430px.
- Scope note: acceptance covers the representative candidate and named behaviours below; it does not assert exhaustive review of every item, state or visual combination.

## Desktop review

- [x] `/companion` loads from the accepted protected candidate.
- [x] Representative full-artwork cards render without clipping or distortion.
- [x] Representative compact-icon cards use the compact role appropriately.
- [x] Canonical local catalogue filtering, including `Mithril`, works.
- [x] Category and trust-state filters update the result set correctly.
- [x] Long item names wrap without overlapping metadata or images.
- [x] Short item names retain balanced card spacing.
- [x] Transparent WebPs sit cleanly against the Forge media surface.
- [x] Card rows retain consistent alignment and spacing.
- [x] Missing or research-only descriptions remain honest and usable.
- [x] `research_needed` is communicated with text, not colour alone.
- [x] Canonical item links resolve to `/companion/items/:itemKey`.
- [x] Keyboard navigation follows a logical order.
- [x] Focus indicators remain clearly visible.
- [x] Published images expose meaningful alt text.
- [ ] A deliberately forced broken-image response was not part of the owner's representative review.

## Mobile review

The owner reviewed the candidate at approximately 320px, 375px, 390px and 430px.

- [x] Cards fit the viewport and stack as intended.
- [x] Full artwork remains contained.
- [x] Compact icons remain crisp and appropriately sized.
- [x] No reviewed image was unexpectedly cropped.
- [x] Long titles wrap without collision or truncation.
- [x] Filter controls remain readable and operable.
- [x] Touch targets remain comfortably usable.
- [x] No horizontal page overflow was observed.
- [x] Page headers retain clear hierarchy.
- [x] Detail-page source and rights metadata remain readable.
- [x] Breadcrumb and back navigation remain usable.
- [x] Missing-media and unavailable-data fallbacks remain understandable.

## Representative item sample

| Item | Canonical route | Media role | Review emphasis | Status |
|---|---|---|---|---|
| Mithril | `/companion/items/mithril` | Full artwork | Existing identity and canonical correction | Accepted |
| Lesser Truegold | `/companion/items/lesser-truegold` | Full artwork | Short name and transparent material artwork | Accepted |
| Transfer Pass | `/companion/items/transfer-pass` | Full artwork | Typical item card and detail page | Accepted |
| Governor Gear Materials Chest | `/companion/items/governor-gear-materials-chest` | Full artwork | Long title wrapping | Accepted |
| Pet Advancement Materials Custom Chest | `/companion/items/pet-advancement-materials-custom-chest` | Full artwork | Longest-title stress case | Accepted |
| Gen 5 Custom Hero Widget Chest | `/companion/items/gen-5-custom-hero-widget-chest` | Full artwork | Hero-widget chest naming | Accepted |
| Mythic Expedition Skill Manual | `/companion/items/mythic-expedition-skill-manual` | Full artwork | Manual artwork and research state | Accepted |
| Pan's Emblem | `/companion/items/pans-emblem` | Full artwork | Corrected possessive display name | Accepted |
| Advanced Teleporter | `/companion/items/advanced-teleporter` | Full artwork | Teleporter sample | Accepted |
| Bread | `/companion/items/bread` | Compact icon | Compact resource presentation | Accepted |
| Arena Token | `/companion/items/arena-token` | Compact icon | Compact token/event presentation | Accepted |

## Accepted known limitations

- Canonical `Mithril` filtering works in the local Companion catalogue.
- The local catalogue filter does not match the source typo `mythril`; this task does not change that behaviour.
- Global governed Search supports `mythril` through a dedicated Search-only alias. Persisted v7 verification resolved it to `item.mithril` at `/companion/items/mithril`.
- A deliberately forced broken-image response was not reviewed by the owner, so no exhaustive broken-image visual claim is made.
- Admin item browsing, editing, approval, publication and rollback remain outside this accepted visual slice.

## Controlled persisted Search publication

The owner separately authorised exactly one dataset-scoped refresh after accepting the visual candidate.

- Run ID: `search-refresh-1785795347195`.
- Authenticated actor: `d245eb2e-b295-4c9b-bcef-cd134bfe981a` (Forge role `owner`; verified primary player in Kingdom 850).
- Actor evidence note: `search_refresh_runs` has no actor column; the actor was captured from the authenticated owner session and corroborated against read-only Forge role and player-account records at execution.
- Mode and scope: `dataset`, exactly `["items"]`.
- Started: `2026-08-03T22:15:47.195Z`.
- Completed: `2026-08-03T22:16:21.194Z`.
- Expected/inspected projections: 75/75.
- Result: 65 inserted, one updated, nine unchanged, zero removed.
- Search index: v6 to v7; total projections 569 to 634.
- Relationships: zero inserted, zero removed, zero orphan relationships.
- Failures and run warnings: none (`failures: []`).
- Cache note: the API's normal post-refresh invalidation left the metadata `stale` marker set until read-through cache reconstruction; authenticated persisted queries subsequently returned index v7 and the new 75-item projection.
- Historical evidence preserved: `search-refresh-1785782191921` remains unchanged at v6 with its original ten-item counts.

Post-refresh comparison found 75 expected and 75 actual canonical item records, with zero missing, zero unexpected and zero duplicate records. `item.mithril` exists exactly once, `item.mythril` does not exist, all routes use `/companion/items/:itemKey`, all 66 projected image paths use governed role-specific media paths, all aliases/keywords are trimmed, no invalid dataset key exists, no unrelated projection was touched during the run and no other refresh run occurred in the mutation window.

## Validation result

The focused Companion media/index and Buildings Companion suites passed. The complete workspace `npm run check` gate passed in 180.5 seconds, including Search persistence/API/experience, workspace navigation, Forge identity, lint, TypeScript, production build and the full Forge/Vision suite. Lint retained exactly the same ten existing warnings and introduced no new warning. `git diff --check` passed. Exact final commit and remote workflow identifiers are recorded in PR #37 after push because a commit cannot contain its own resulting SHA.

## Remaining release gates

1. Preserve the exact-head automated validation and protected Preview evidence in PR #37.
2. Keep PR #37 Draft and unmerged until the owner separately authorises review/merge.
3. Complete the Admin item management requirements tracked by issue #33 before that issue can close.
4. Keep issue #34 open and do not start another Companion family from this acceptance.
5. Production deployment and production smoke testing remain explicitly unperformed.
