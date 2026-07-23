# FRKS Confidence Report

- **Updated:** 2026-07-23
- **Confidence model:** AEGIS standard bands

## Governance decisions

### FRKS operating model — 100 / Verified

The owner explicitly approved FRKS as the permanent knowledge approach and required future Forge conversations to follow it. Repository authority boundaries are confirmed by the existing AEGIS document.

### Cost-conscious development — 100 / Verified

The owner explicitly stated that no money should be spent on the proposed Supabase branch and approved zero-cost workflows as the default.

### Safe database migration workflow — 100 / Verified

The accepted Codex response generated migration SQL only, did not execute it, did not create a Supabase branch and left production unchanged. The policy is an explicit owner decision.

## RoeBot reference

### Package, class and enum inventory — 85 / Confirmed

The inventory was extracted from RoeBot's own JavaDocs and is reliable as a description of RoeBot's published interfaces at the review date.

### Canonical Kingshot terminology — 60 / Estimated

RoeBot labels may be source-specific, translated, stale or designed around image recognition. They require reconciliation with Forge's governed terminology.

### Building existence in the live game — 60 / Estimated

An enum constant shows that RoeBot recognises or models a label. It does not prove current live availability, upgradeability or canonical naming.

### Hidden IDs, mechanics, hero and item data — 10 / Tentative / Unsupported

The reviewed JavaDocs did not support the earlier expectation that these resources would be exposed. Those claims are superseded and must not be reused as findings.

## Operational risks affecting confidence

- External JavaDocs can change without notice.
- The extracted reference is a point-in-time snapshot.
- No automated freshness check exists yet.
- No full canonical Buildings comparison has been completed.
- Repository-based FRKS registers are new and their maintenance process still requires adoption across sprints.
