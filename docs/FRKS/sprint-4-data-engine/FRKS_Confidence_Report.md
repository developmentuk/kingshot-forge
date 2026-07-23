# FRKS Confidence Report — Sprint 4 Data Engine

## Confidence method

Scores describe how strongly the archived conversation supports each conclusion. They do not replace workflow status, editorial review or publication approval.

## Architecture confidence

| Area | Confidence | Assessment |
|---|---:|---|
| Browser/API/server/shared separation | 100 | Explicitly implemented and validated through the working Vercel health endpoint. |
| Vercel Node handler convention | 100 | Earlier handler styles failed; the `VercelRequest`/`VercelResponse` form worked in deployment. |
| Server-only Supabase authority | 100 | Required by security boundaries and the Forge constitution. |
| Stable payload hashing | 100 | Deterministic SHA-256 approach is technically sound for unchanged detection and provenance. |
| Registry and runner foundation | 100 | User confirmed the files were committed and built without issue. |
| Dataset-centric module architecture | 95 | Strong design direction, but final implementation should be reconciled with the newer Editorial Platform architecture. |
| Preview → Stage/Apply → Review → Publish → Rollback lifecycle | 95 | Strongly aligned with AEGIS; exact API and persistence contracts remain to be implemented. |
| Transactional soft-deactivation strategy | 95 | Strong safety design; implementation and database tests remain outstanding. |
| Vercel Cron as initial scheduler | 90 | Reasonable for static datasets; may be revisited if scheduling requirements change. |

## Dataset confidence

| Dataset | Confidence | Assessment |
|---|---:|---|
| Heroes identity fields | 95 | Source metadata reports cross-verification. |
| Heroes combat tiers | 60 | Editorial/community judgement rather than measured fact. |
| Hero XP values | 70 | Single referenced source; deployment capacity is partly estimated. |
| Hero shard costs | 45 | Explicitly community-estimated and requires in-game verification. |
| Governor Gear Green–Red T2 | 99 | Multiple-source and in-game corroboration reported by source metadata. |
| Governor Gear Red T3–T4 | 91 | Two current sources agree but an older independent source conflicts. |
| Governor Gear Red T5–T6 | 87 | Current sources agree but independent in-game confirmation is missing. |
| Governor Charm | 90 | Full source agreement plus in-game stat-ladder corroboration reported. |
| Troops | 70 | Mixture of direct observation and estimated values; completeness gap exists. |
| Buildings | 78 | Single primary database source with some estimated rows and partial catalogue coverage. |
| Truegold | 92 overall | Strong cross-checking; War Academy sub-records are lower at 80. |
| War Academy research | 78 | Single-source dataset; mirrored category assumption needs verification. |
| VIP | 90 | Source metadata reports multiple-source confirmation. |
| Events | 70 | Observational cadence data can change over time. |
| Masters roster | 95 | Roster cross-verified. |
| Masters power/manuscripts | 50 | Material conflict remains unresolved. |
| KvK scoring | 90 | Source metadata reports two independent sources. |

## Low-confidence publication blockers

- Hero shard costs must not be labelled verified.
- Masters power and manuscript totals must not be published as settled facts.
- Hero tier rankings require editorial labels and rationale.
- Estimated troop tiers and deployment capacity require field-level confidence.
- Live event schedules require timestamps and override support.

## Overall conclusion

The Data Engine architectural knowledge is high confidence. Dataset confidence varies materially and must remain structured at dataset, record and field level. No source score should bypass the Forge review and publication workflow.
