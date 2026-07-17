# Hero Skills Source Inventory and Evidence Matrix

## Audit boundary

Audit date: 17 July 2026.

Repository branch: `release/0.7.0-player-domain`.

Connected Supabase project: `hrvdhjscwitqpwjhnjkm`, inspected read-only. No source row, canonical record, editorial record or published projection was created or changed.

This inventory records metadata and completeness only. It does not copy Hero Skill source content into Forge.

## Decision summary

No currently available source is approved and complete enough for canonical Hero Skill promotion.

- Supplied structured datasets contain no Hero Skill dataset.
- The supplied bot archive contains no Hero Skill reference data.
- The source staging tables contain 60 unreviewed facts for 10 heroes.
- Thirty-six staged facts have no canonical name.
- Staged evidence has no recorded digest, licensing decision or record-level approval.
- Forge has zero live, editorial and published Hero Skill records.

## Supplied artifact inventory

| Artifact | SHA-256 | Source class | Hero Skill coverage | Licence/attribution recorded | Review state | Canonical suitability |
|---|---|---|---|---|---|---|
| `heroes.json` | `2580b9c5860f14af2cda027b7cf388da0f838b6c1c7f9760eb0271b21e39115e` | Structured KingshotPro artifact | 27 Hero names and classifications; no Hero Skills | CC-BY-4.0; attribution to KingshotPro | Dataset metadata only | Rejected for Hero Skills: unrelated fields |
| `hero-xp.json` | `bb3a40264e48022696633a64a4bf676e72d6c6fd4950ee8b56e9243b4236d781` | Structured KingshotPro artifact | Hero XP/deployment levels; no skills | CC-BY-4.0; attribution to KingshotPro | Dataset metadata only | Rejected: unrelated progression domain |
| `gear.json` | `3dea2808e1cd0ff0242bf60885c4db8704f0faeed54a93a4611816d6ee6b4a9e` | Structured KingshotPro artifact | Governor Gear; no Hero Skills or Exclusive Gear skill facts | CC-BY-4.0; attribution to KingshotPro | Dataset metadata only | Rejected: unrelated domain |
| `charm.json` | `7b0d08fed80a89ce9d2284d02befe52d89d7ccdf88ded79817f0660aa3ed48d8` | Structured KingshotPro artifact | Governor Charms; no Hero Skills | CC-BY-4.0; attribution to KingshotPro | Dataset metadata only | Rejected: unrelated domain |
| `masters.json` | `de2aabdc92e610a9950ad72ec26393e485c19a2cb8f0ce0df2aa625bfee2d09d` | Structured KingshotPro artifact | Four Master Academy records with Master skills, not Hero Skills | CC-BY-4.0; attribution to KingshotPro | Dataset metadata only | Rejected: different canonical domain |
| `api-1.json` | `01a5e500f2a9eb6e4f5d82aebca430216e1ee1ffae4f2a62f8908a7a977d11db` | Kingshot.net OpenAPI description | Player, KvK and gift-code API; no Hero Skill endpoint | No Hero Skill permitted-use decision | Unreviewed | Rejected: no relevant records |
| `Kingshot-Discord-Bot-2.0.3.zip` | `cf96b52d4e055a1a1d51c374dd71ea4b46425bf55bd1c70ee20583634bd770e0` | Community software archive | No Hero Skill reference dataset found | Custom Usage License; attribution required and commercial use restricted | Archive inspected only | Rejected: no relevant data; restricted licence needs separate review |

Artifact hashes identify the files audited. They are not approval of their contents.

### Candidate evidence matrix

| Candidate | Heroes covered | Fields available | Hero Skill completeness | Naming completeness | Progression completeness | Unlock completeness | Provenance quality | Licensing / attribution | Review state | Canonical suitability and reason |
|---|---:|---|---|---|---|---|---|---|---|---|
| `heroes.json` | 27 Hero records | Hero identity/classification | 0 Hero Skills | Not applicable | None | None | Strong file digest and dataset metadata | CC-BY-4.0 / KingshotPro | Artifact inventoried | Rejected: Hero facts are not Hero Skill facts |
| `hero-xp.json` | Roster-linked XP rows | Hero XP and deployment capacity | 0 Hero Skills | Not applicable | No skill levels | None | Strong file digest and dataset metadata | CC-BY-4.0 / KingshotPro | Artifact inventoried | Rejected: separate Hero XP domain |
| `gear.json` | Not Hero-scoped | Governor Gear progression | 0 Hero Skills | Not applicable | No skill levels | None | Strong file digest and dataset metadata | CC-BY-4.0 / KingshotPro | Artifact inventoried | Rejected: separate Gear domain |
| `charm.json` | Not Hero-scoped | Governor Charm progression | 0 Hero Skills | Not applicable | No skill levels | None | Strong file digest and dataset metadata | CC-BY-4.0 / KingshotPro | Artifact inventoried | Rejected: separate Charm domain |
| `masters.json` | 4 Master records | Master Academy skills | 0 Hero Skills | Not applicable | No Hero Skill levels | None | Strong file digest and dataset metadata | CC-BY-4.0 / KingshotPro | Artifact inventoried | Rejected: Master skills are a different canonical domain |
| `api-1.json` | None | Player, KvK and gift-code API schema | 0 Hero Skills | Not applicable | None | None | Has file digest and API description metadata | No Hero Skill decision / none recorded | Unreviewed | Rejected: no relevant endpoint or fact |
| `Kingshot-Discord-Bot-2.0.3.zip` | None found | General bot source and commands | 0 Hero Skills | Not applicable | None | None | File digest and archive licence retained | Custom licence / attribution required; commercial use restricted | Archive inspected only | Rejected: no relevant data and incompatible use remains possible |
| Kingshot Guide staged extraction | 10 | Category, slot, optional name, description, free-text effect, maximum level, source URL/time, confidence | 60 facts; not roster-complete | 24/60 | 60 free-text effects; 0 approved structured level sets | 0 | Medium: URL/time retained, but no evidence digest or immutable source version | No decision / no attribution record | 60 unreviewed | Blocked: incomplete, unnamed, unlicensed and unapproved |
| Kingshot.net hotfix announcement | Saul only | Isolated changed-skill names/descriptions/effects | Patch-only, not a dataset | Partial patch coverage | Changed levels only; not a complete level set | None observed | Traceable dated announcement mirror | No Forge permitted-use decision / none recorded | Unreviewed | Blocked: incomplete patch evidence and no approval |
| Sprint 8.1 documentation and legacy migrations | Architecture only | Contracts, table/view shape and historical test claims | No facts | Not applicable | No source-backed levels | No source-backed unlocks | Strong internal provenance | Internal / not applicable | Architecture evidence | Rejected as game-fact evidence; accepted for compatibility review only |

No additional official or authoritative Hero Skill record source is registered in the repository. Absence from this inventory is not evidence that a source does not exist; a new source must enter the governance workflow before review.

## Staged source evidence

Source run metadata:

| Field | Observed value |
|---|---|
| Source | Kingshot Guide |
| Root URL | `https://www.kingshotguide.org` |
| Extraction | One-off structured extraction |
| Retrieved | `2026-07-16T20:07:44.418418Z` |
| Run count | 1 |
| Fact count | 60 |
| Review state | 60 `unreviewed` |
| Licensing decision | Not recorded |
| Content digest | Not recorded |
| Canonical promotion | None |

Available staged fields are Hero UUID/slug/name, category, slot, optional skill name, description, free-text progression effect, maximum level, source name/URL/retrieval time, confidence score and review state. Unlock conditions and immutable source versions are absent.

### Hero coverage matrix

| Hero | Facts | Categories/slots | Names present | Descriptions present | Progression text present | Unlock facts | Review/licence | Suitability |
|---|---:|---|---:|---:|---:|---:|---|---|
| Amadeus | 6 | 3 conquest + 3 expedition | 3/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Eric | 6 | 3 conquest + 3 expedition | 3/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Helga | 6 | 3 conquest + 3 expedition | 0/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Hilde | 6 | 3 conquest + 3 expedition | 3/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Jabel | 6 | 3 conquest + 3 expedition | 0/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Jaeger | 6 | 3 conquest + 3 expedition | 3/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Marlin | 6 | 3 conquest + 3 expedition | 3/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Petra | 6 | 3 conquest + 3 expedition | 3/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Saul | 6 | 3 conquest + 3 expedition | 3/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| Zoe | 6 | 3 conquest + 3 expedition | 3/6 | 6/6 | 6/6 | 0 | Unreviewed / unknown | Blocked |
| **Total** | **60** | **30 + 30** | **24/60** | **60/60** | **60/60** | **0** | **All blocked** | **Not canonical** |

The staged Hero UUID/slug/name relationships match the current Heroes table for all 60 facts, and no duplicate Hero/category/slot combination was observed. This validates binding metadata only; it does not approve facts or identities.

## Other recorded source references

| Candidate | Coverage and fields | Provenance/licensing | Review state | Decision |
|---|---|---|---|---|
| Kingshot.net 3 March 2025 hotfix announcement | Isolated changes for Saul; names, descriptions and level effects for changed skills only | Public announcement mirror; Forge permitted-use decision not recorded | Unreviewed | Blocked; incomplete patch evidence cannot define the roster |
| `docs/SPRINTS/8.1-Hero-Skills.md` | Historical contract and architectural assertions; no canonical facts | Internal Forge documentation | Historical | Accepted as architecture evidence only |
| `supabase/migrations/20260716110000_hero_skills_editorial_projection.sql` | Legacy live projection fields and public view | Internal schema source | Applied under a different remote timestamp | Accepted as compatibility evidence only |
| Remote `kingshotguide_one_off_source_staging` migration | Source staging tables and one scrape run | Internal migration history; SQL is not checked into this branch | Applied remotely | Accepted as schema/inventory evidence only |
| Current `published_hero_skills` view | Legacy public projection contract | Read-only database inspection | Zero rows | Accepted as compatibility evidence only |

## Current repository and database locations

| Location | Role | Current gap |
|---|---|---|
| `source_scrape_runs` | Extraction-run metadata | No licence, digest or reviewer fields |
| `source_hero_skill_facts` | Unreviewed normalised source facts | No canonical names for 36 rows; no record-level evidence decision |
| `shared/domains/heroes/heroSkills.ts` | Sprint 9.3 canonical contract | Foundation only; no game facts |
| `hero_skills` | Legacy live published projection table | No structured levels/unlocks; conflicting policies and constraints |
| Editorial versions/heads | Draft/workflow/history | Zero Hero Skill records |
| `published_hero_skills` | Public-safe projection target | Zero records; legacy shape only until proposal approval |
| Verification Centre | Readiness evidence | Source coverage and migration application remain Blocked |

## Required approval decisions

1. Approve a source class, exact source/version, permitted use and attribution.
2. Decide whether the Kingshot Guide extraction may enter formal review.
3. Obtain canonical names for the 36 unnamed rows from approved evidence.
4. Approve record-level review and conflict-resolution responsibilities.
5. Approve the stable identifier ADR.
6. Approve the schema proposal and compatible publication migration plan.
7. Re-audit freshness before any canonical record is created.

Until these decisions are recorded, every source candidate remains rejected or blocked for canonical use.
