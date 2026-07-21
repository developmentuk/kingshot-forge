# Stable Entity Identity Audit — Sprint 1.1.1

This non-mutating code-and-schema baseline records current identity sources.

| Domain | Current canonical key | Database identity | Route/search identity | Stability risk | Sprint position |
| --- | --- | --- | --- | --- | --- |
| Buildings | `building_key` | `buildings` primary key | `/buildings/:key`, Search `dataset:id` | route and projection IDs are legacy-compatible | `building.<building_key>` adapter |
| Building progression | `record_id` + `building_key` | `building_progression` primary key | nested under Building | import-shaped detail ID | parent identity only |
| Heroes | canonical `slug` | source/editorial record ID | `/companion/heroes/:slug`, Search projection | translated names must not define identity | `hero.<canonical_slug>` adapter |
| Hero skills | `editorial_key` | published projection `id` | Search `hero-skills:<key>` | projection/editorial IDs differ | registered, nested adapter deferred |
| Hero gear/widgets | dataset/editorial keys | domain-specific IDs | current UI routes | no stable published contract audited | registered, no public adapter |
| Events, troops, gear, charms, research, War Academy | dataset record key | dataset record ID | dataset routes/projections | import keys may change | registered, no placeholder identities |
| Players, alliances, kingdoms | existing domain keys/Forge IDs | domain IDs | public profile/directory routes | visibility and ownership rules | registered, domain-owned resolver |
| Guides, articles, videos, creators | editorial/search identifiers | editorial record IDs | public content routes | publication identity not unified | registered, no public adapter |
| Tools, calculators, datasets | dataset/route keys | dataset IDs | app routes | route key can be mutable | registered, no public adapter |

Legacy slugs, dataset keys, record IDs, Search projection IDs and editorial
record IDs remain compatibility inputs. They are never promoted silently.
