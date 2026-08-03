# COMPANION-INDEX-001 — Expanded Catalogue Visual Acceptance

**Status:** Pending owner acceptance  
**Review surface:** Protected Vercel Preview for the exact PR #37 head  
**Production:** Unchanged  
**Supabase:** Unchanged  
**Expanded persisted Search refresh:** Not authorised and not performed

## Purpose

This checklist governs visual acceptance of the 75-item Companion projection and its 66 published preview assets. It does not repeat or revoke the accepted ten-item text-only foundation. No item below may be marked passed without directly captured evidence and explicit owner acceptance.

The review candidate must preserve 59 full artworks, seven compact icons, unique checksum-backed media paths, `owner_declared_creative_commons`, the canonical `item.mithril` identity and the absence of `item.mythril`.

## Review record

- Exact candidate SHA: record in PR #37 after the final documentation commit.
- Protected Preview deployment ID: record in PR #37 after deployment.
- Preview URL: use the protected PR deployment recorded by Vercel.
- Browser evidence: pending.
- Owner decision: pending.
- Reviewer notes: pending.

Authentication redirects are infrastructure evidence only. An HTTP 302 to Vercel SSO is not application or visual acceptance.

## Desktop review

- [ ] `/companion` loads from the exact protected candidate.
- [ ] Representative full-artwork cards render without clipping or distortion.
- [ ] Representative compact-icon cards use the compact role appropriately.
- [ ] Search finds canonical names and approved aliases.
- [ ] Category and trust-state filters update the result set correctly.
- [ ] Long item names wrap without overlapping metadata or images.
- [ ] Short item names retain balanced card spacing.
- [ ] Transparent WebPs sit cleanly against the Forge media surface.
- [ ] Card rows retain consistent alignment and spacing.
- [ ] Missing or research-only descriptions remain honest and usable.
- [ ] `research_needed` is communicated with text, not colour alone.
- [ ] Canonical item links resolve to `/companion/items/:itemKey`.
- [ ] Keyboard navigation follows a logical order.
- [ ] Focus indicators remain clearly visible.
- [ ] Published images expose meaningful alt text.
- [ ] A forced image failure produces the accessible fallback without layout collapse.

## Mobile review

Repeat the checklist at approximately 320px, 375px, 390px and 430px.

- [ ] Cards fit the viewport and stack as intended.
- [ ] Full artwork remains contained.
- [ ] Compact icons remain crisp and appropriately sized.
- [ ] No image is unexpectedly cropped.
- [ ] Long titles wrap without collision or truncation.
- [ ] Filter controls remain readable and operable.
- [ ] Touch targets remain comfortably usable.
- [ ] No horizontal page overflow is introduced.
- [ ] Page headers retain clear hierarchy.
- [ ] Detail-page source and rights metadata remain readable.
- [ ] Breadcrumb and back navigation remain usable.
- [ ] Missing-media and unavailable-data fallbacks remain understandable.

## Representative item sample

| Item | Canonical route | Media role | Review emphasis | Status |
|---|---|---|---|---|
| Mithril | `/companion/items/mithril` | Full artwork | Existing identity, canonical correction, accepted foundation regression | Pending |
| Lesser Truegold | `/companion/items/lesser-truegold` | Full artwork | Short name and transparent material artwork | Pending |
| Transfer Pass | `/companion/items/transfer-pass` | Full artwork | Typical item card and detail page | Pending |
| Governor Gear Materials Chest | `/companion/items/governor-gear-materials-chest` | Full artwork | Long title wrapping | Pending |
| Pet Advancement Materials Custom Chest | `/companion/items/pet-advancement-materials-custom-chest` | Full artwork | Longest-title stress case | Pending |
| Gen 5 Custom Hero Widget Chest | `/companion/items/gen-5-custom-hero-widget-chest` | Full artwork | Hero-widget chest naming | Pending |
| Mythic Expedition Skill Manual | `/companion/items/mythic-expedition-skill-manual` | Full artwork | Manual artwork and research state | Pending |
| Pan's Emblem | `/companion/items/pans-emblem` | Full artwork | Corrected possessive display name | Pending |
| Advanced Teleporter | `/companion/items/advanced-teleporter` | Full artwork | Teleporter sample | Pending |
| Bread | `/companion/items/bread` | Compact icon | Compact resource presentation | Pending |
| Arena Token | `/companion/items/arena-token` | Compact icon | Compact token/event presentation | Pending |

## Evidence capture requirements

Capture the `/companion` catalogue and representative detail pages at desktop and the four target mobile widths where tooling and protected-preview authentication permit. Store screenshots only when they show the exact candidate. Record SSO or tooling blockers rather than substituting production screenshots or fabricating acceptance.

## Remaining release gates

1. Protected Preview reaches READY for the exact final SHA.
2. Automated and available authenticated smoke checks complete without application 5xx, media 404, invalid MIME, hydration or Search projection errors.
3. Desktop and mobile evidence is captured or the precise authentication/tooling blocker is recorded.
4. The owner explicitly accepts the expanded visual candidate.
5. A separate explicit owner approval is received before any expanded persisted Search refresh.
6. PR #37 remains Draft and unmerged until those decisions are recorded.
