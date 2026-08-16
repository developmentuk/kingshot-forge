# OASIS-001A — Oasis Island catalogue foundation

## Status

Merged to `main` through PR #51 at `2cb35b98fb861a6323c229f19579f8a291e4ab81`. This slice is a safe source/data/UI foundation for publication handoff. It intentionally does not expose Oasis publicly and is not published to Supabase. The public route remains unwired until OASIS-001A-PUB creates and accepts a governed published projection.

## Owner visual acceptance

On 7 August 2026, the Product Owner completed local desktop and approximately 390px mobile review and recorded:

**OASIS-001A OWNER VISUAL GATE: STAGING PROTOTYPE DESIGN ACCEPTANCE**

The review covered the staging prototype hub, catalogue cards and artwork, Sleeping Drakethrone, Fountain of Life, Golden Sunset, long level progression, contrast/readability, responsive metadata cards and bottom mobile navigation interaction. Final published-release visual acceptance must be repeated after OASIS-001A-PUB connects the UI to the governed published projection.

## Scope delivered

- Accepted but temporarily unwired Oasis catalogue and detail UI implementation for OASIS-001A-PUB.
- 55 structure records from the approved Oasis source package, with non-null game values manually checked by the Product Owner.
- 111 supplied PNG assets preserved as private source evidence under `server/data-engine/source-assets/oasis-island`.
- Plain-English guidance covering unlock, Water Essence, Prosperity, Reservoirs, chests, priorities and known limits.
- Direct link to the existing `/calculators/island-chest-route-optimizer`.
- Publication-ready stable structure IDs and FRKS knowledge for the later governed publication slice.

Not delivered by this PR: public Oasis catalogue or detail routes, published projection, Search integration, public media delivery, My Island, calculator buff integration, or publication migration.

## Owner local review

Forge's existing local setup runs the Vite app and Vercel Functions as two local processes. Use two terminals from the repository root:

```text
Terminal 1: npm run dev
Terminal 2: vercel dev --listen 3000
```

Open the Vite URL shown in Terminal 1. Vite already proxies `/api` requests to the Vercel process on port 3000, which is the same API mechanism used by other API-backed Forge pages. `npm run dev` alone cannot serve those `/api` functions because it starts Vite only; Oasis does not require a unique launch path.

## Canonical data boundary

The supplied JSON is the primary structured Oasis dataset at `server/data-engine/sources/kingshot_oasis_island_buildings.json`. The staging loader and Oasis view model preserve the reviewed data contract for the later publication slice. The current React UI is intentionally unwired from public data resolution. The loader preserves source values, source evidence and the source payload hash, while marking non-null supplied game values as `owner_direct_ingame_verified`. Null or absent fields remain unknown and are not replaced by community claims.

The Phase 1 publication proposal uses the explicit `oasis-source-fingerprint-v2` contract: recursively canonicalised source records sorted by stable ID, including levels, prosperity, bonuses/effects and verification, plus governed private-media identity and source checksum sorted independently. Generated timestamps, absolute filesystem paths and machine-dependent values are not inputs. Its separate public record-content hash excludes only publication ID, version and timestamps, so idempotent publication and rollback remain bound to names, levels, bonuses, trust labels, media and canonical routes.

Before that fingerprint or any projection/media fixture is generated, a strict staged-source contract validates every consumed catalogue value and image mapping. Required identity, aliases, record type, rarity, footprint, limits, levels and verification fields must be present with their documented types; genuinely optional or nullable values remain distinguishable from malformed values. Every present string must already be non-empty and trimmed, numbers must satisfy the canonical finite/magnitude/precision boundary, and arrays may contain only valid members. Levels, `buffs`, `buffsUnlocked`, maximum effects, known effects, unlock/upgrade mechanics and verification status are mapped one-to-one after validation: the publication builder no longer trims, coerces, filters or silently replaces malformed source content.

Canonical identity now uses the shared `oasis-canonical-json-v1` numeric contract in TypeScript and PostgreSQL. Permitted numbers are finite, have an absolute value no greater than 100,000,000, and are exactly representable with at most seven decimal places; scaling by 10,000,000 therefore remains below JavaScript's safe-integer ceiling. Hash text is locale-independent, never uses exponent notation, normalises negative zero to `0`, and removes redundant leading, fractional and trailing zeros without changing the numeric value. Records continue to store JSON numbers: canonical text exists only for hashing. The corrected record-content algorithm is explicitly domain-separated as `oasis-record-content-sha256-v2`, continues recursively sorting object keys and records by stable ID, and excludes only `publicationId`, `publicationVersion`, `publishedAt` and `updatedAt`. Shared reference vectors cover the JavaScript exponent boundaries, maximum magnitude/precision, nested values, ordering, rejection and a fixed TypeScript/PostgreSQL record hash. PostgreSQL execution of those vectors remains a Phase 2A runtime gate; Phase 1 proves TypeScript behavior and SQL structure only.

The proposed public-record contract is enforced recursively and identically at the TypeScript publication boundary, published-only loader, inactive Search adapter and PostgreSQL publication guard. Exact nested keys and types are required for aliases, footprint, levels, bonuses, known effects, unlock, upgrade, maximum effects and media; malformed service-role input cannot be accepted merely because the top-level collections are arrays. PostgreSQL validates this complete payload before acquiring the publication lock or mutating history. After locking, one `clock_timestamp()` value is normalised to milliseconds and made strictly newer than the current publication when needed; that captured timestamp supplies the records, rollback projection, Search request, audit and current pointer, while the identity column supplies the version. Actual concurrent database execution remains a Phase 2A acceptance requirement, not a Phase 1 claim.

Publication candidates and stored records now have deliberately separate identity contracts. An RPC candidate binds the requested `publicationId` but must provide `null` for `publicationVersion`, `publishedAt` and `updatedAt`; a caller cannot predict a sequence value or timestamp. PostgreSQL owns the `GENERATED ALWAYS AS IDENTITY` version, accepts normal sequence gaps such as rolled-back allocations, captures the authoritative timestamp, and stamps both into every stored record. The final `OasisPublicRecord` and loader remain strict: stored versions must be positive and match their publication row, and stored timestamps must be authoritative UTC values. Idempotent retries return the already stored database version without consuming a new identity or rewriting history; rollback uses the same null candidate placeholders before creating a new forward-only stored identity.

The inactive Search adapter validates the complete record set and authoritative publication identity/timestamps, recomputes `oasis-record-content-sha256-v2`, and refuses to produce any Search records when the stored hash is malformed or stale. The published-only loader independently verifies the same hash and recursively freezes the verified dataset, records, levels, bonuses, media and other nested collections before returning them. Deep immutability is defence in depth and does not replace Search-time hash verification.

The manifest boundary is likewise fail-closed for required numeric metadata. Top-level source/derivative byte totals, every entry's source/derivative byte values, placeholder derivative bytes, counts and dimensions require explicit key presence and positive integers; missing keys, JSON null, wrong types, zero, negative and fractional values are rejected. The two top-level byte totals must exactly equal their respective sums across the 111 governed entries. These checks, canonical-number validation and record-content hashing all occur before the advisory lock and before any publication, rollback, Search-refresh, audit or current-pointer mutation.

The current loader is explicitly source-staging and is not a public Data Engine API. Under `docs/AEGIS.md` and ADR-008, staged evidence must not be consumed by public route, API, Search or media resolution. The public Oasis routes and discovery are intentionally unwired. OASIS-001A-PUB will connect the reviewed foundation to the approved governed publication architecture. No migration was created or applied.

## Evidence boundaries

- Owner-recorded non-null game values are treated as direct in-game facts.
- Community-only strategy remains labelled as community guidance.
- Unknown or unrecorded fields remain unavailable or qualified without making the whole building uncertain.
- Fixed “300 Water Essence per help” guidance is not presented as canonical.
- No player-owned Island state, progression, buff injection, layout editor, OCR/Vision or public player showcase is included.

## Validation

- `npm run test:oasis-001a`
- `npm run build`
- `npm run lint`
- `npm run check` (includes `test:oasis-001a` through the Island Route check)
- `git diff --check`

The full application build and focused contract checks are local readiness evidence only; they do not prove production publication or owner acceptance.
