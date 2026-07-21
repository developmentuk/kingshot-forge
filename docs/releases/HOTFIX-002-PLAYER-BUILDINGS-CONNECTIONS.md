# Kingshot Forge — HOTFIX-002

Status: implementation candidate · 21 July 2026

HOTFIX-002 repairs the player-facing Buildings experience and Forge Connections without changing published Buildings data or publication history. Published progression is read-only and rendered as a readable table with shared number, duration and null formatting. `/buildings` is exposed in Player navigation. Numeric troop snapshot values remain backward-compatible while labels use TG1–TG6 for Infantry, Cavalry and Archers; legacy T1–T5 values display as TG1–TG5. Forge Connections now has honest domain tabs and deduplicated structured cards using published relationship results only.

No migration, insert, update, delete, publication refresh or republish was run. Buildings remains version 1 with 10 catalogue records and 587 progression records. Town Center semantics remain 71 canonical records, 70 upgrade rows, 1 base-state record and 36 Truegold stages.

Focused contract checks pass. Exact protected-preview deployment, authenticated owner/player browser acceptance, responsive checks and clean console/network evidence remain release gates.

Recommend `v1.0.1` if it is not already tagged; otherwise classify as `v1.0.2`. Do not promote to production until the exact candidate passes the protected preview matrix.

## Sprint 1.0.2 stabilisation — 21 July 2026

The progression pipeline now uses one shared structured comparator at the
published loader, Admin adapter and Player renderer. Normal/base levels sort by
`progression_phase` and `base_level`; pre-Truegold rows follow normal levels;
Truegold rows sort by `stage` then `truegold_tier`. Display labels are never
used as sort keys. A mixed-label regression fixture covers the invalid TG/31–34
ordering reported during owner acceptance.

The table remains a published, read-only projection. Resource and power values
use the existing single-pass number formatter, duration/null values are not
duplicated, and the table scrolls inside its bounded panel for narrow viewports.
Buildings is linked from Player View navigation and retains the directory,
detail and progression deep links.

Personal Progression continues to store numeric-compatible troop values and
renders Infantry, Cavalry and Archers as TG1–TG6. Legacy T1–T5 numeric values
remain readable on reload, save through the existing snapshot insert path, and
remain present in immutable snapshot history; no migration or data rewrite was
introduced.

Forge Connections now preserves relationship labels through the adapter,
requires a real published relationship and supported destination, deduplicates
cards by canonical dataset/id, and separates icon, content metadata, title,
description, relationship explanation, tags and destination. Tag-only records,
unpublished records and records without a destination are omitted.

Local regression and contract checks pass. Protected-preview browser and
authenticated owner/player acceptance remain required before production
approval; no database mutation or Buildings publication occurred in this
sprint.

## Sprint preview evidence

The exact candidate commit `8e8adfe62b7264b2079c4e4db35c69a04d62c3da` deployed
READY to protected Vercel preview `dpl_DaqhW8QbfvoZWHbhHbfGH8yZAgdg` at
`https://kingshot-forge-gi4i2vz99-clarksim-7474s-projects.vercel.app`.
The available browser session reached the Vercel authentication wall before
the application, so the 390/768/1280/1440 browser matrix and authenticated
Console/Network/React/Supabase review remain owner-session blockers. Vercel
runtime logs showed no error entries during the check.

The final protected preview follow-up is deployment
`dpl_8HZMLotXRroegNV6hg8Z2g2PTjH8` at
`https://kingshot-forge-yitsh9nhw-clarksim-7474s-projects.vercel.app`.
Player View acceptance verified the Buildings directory and the Town Center,
Academy, Barracks, Embassy, Infirmary, Storehouse and War Academy deep links.
Town Center rendered normal levels before workbook-defined Truegold stages;
published tables remained read-only; and the requested 390/768/1280/1440
settings had no document-level horizontal overflow after the containment fix.
Console diagnostics returned no warnings or errors. The available session was
not authenticated for Personal Progression save/reload/history or owner/admin
routes, so those acceptance gates remain open. No write was attempted.
