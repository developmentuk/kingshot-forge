# Kingshot Forge — HOTFIX-002

Status: implementation candidate · 21 July 2026

HOTFIX-002 repairs the player-facing Buildings experience and Forge Connections without changing published Buildings data or publication history. Published progression is read-only and rendered as a readable table with shared number, duration and null formatting. `/buildings` is exposed in Player navigation. Numeric troop snapshot values remain backward-compatible while labels use TG1–TG6 for Infantry, Cavalry and Archers; legacy T1–T5 values display as TG1–TG5. Forge Connections now has honest domain tabs and deduplicated structured cards using published relationship results only.

No migration, insert, update, delete, publication refresh or republish was run. Buildings remains version 1 with 10 catalogue records and 587 progression records. Town Center semantics remain 71 canonical records, 70 upgrade rows, 1 base-state record and 36 Truegold stages.

Focused contract checks pass. Exact protected-preview deployment, authenticated owner/player browser acceptance, responsive checks and clean console/network evidence remain release gates.

Recommend `v1.0.1` if it is not already tagged; otherwise classify as `v1.0.2`. Do not promote to production until the exact candidate passes the protected preview matrix.
