# PLAYER-INTEL-001 — Jeabs List HAR analysis

**Status:** Research evidence; no implementation authority  
**Captured:** 29 July 2026  
**Reviewed by:** Aegis  
**Product owner instruction:** Begin a controlled live-player-data feasibility sprint  
**Repository branch:** `research/player-intelligence-discovery`

## Purpose

This record preserves the durable findings from a user-supplied browser HAR captured while using `jeabslist.com`. It identifies observable browser-facing contracts and refresh behaviour without copying Jeabs List code, depending on its private API, or claiming knowledge of its hidden upstream Kingshot transport.

The raw HAR is deliberately **not committed**. It contains a live-looking custom API token, player identifiers, profile data, comments and redemption activity.

## Evidence custody

| Property | Value |
| --- | --- |
| Evidence type | Chrome/Chromium HAR JSON |
| Original filename | `jeabslist.com.har` |
| Size | 50,587,583 bytes |
| SHA-256 | `6cd1538058f8d5142b334fdfcc7e12313232154e094a01bfd4bdded400d31173` |
| Capture interval | 2026-07-29 16:00:19 UTC to 16:04:44 UTC |
| Repository treatment | Raw evidence excluded; findings normalised and redacted |
| Secret treatment | Token value never copied into code, documentation, issues or commits |

The person who supplied the HAR should invalidate the captured session/token by signing out or rotating the Jeabs List session.

## Capture summary

- 942 total requests were recorded.
- 941 requests targeted `jeabslist.com`; one image request targeted Discord's CDN.
- 108 requests targeted browser-facing `/api/` routes.
- All 108 API requests carried a custom `x-api-token` header.
- No API request used a browser `Cookie` header or an `Authorization` header.
- No WebSocket or HTTP 101 upgrade was observed.
- API responses were served through Cloudflare with `cf-cache-status: DYNAMIC`.
- 106 API responses explicitly used `no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, no-transform`.
- Application caching is therefore inferred to occur inside Jeabs List's backend/database rather than through browser or edge response caching.

## Normalised endpoint inventory

Identifiers are replaced with placeholders. Counts describe this capture only.

| Route | Count | Observed purpose |
| --- | ---: | --- |
| `GET /api/players/search` | 44 | Bounded player search with query, scope, offset and limit |
| `GET /api/redemptions/recent` | 9 | Polling recent gift-code outcomes |
| `GET /api/players/{playerId}/loadout` | 8 | Cached and on-demand detailed profile/loadout retrieval |
| `GET /api/players/{playerId}` | 4 | Stored player summary |
| `GET /api/players/{playerId}/history` | 4 | Historical player snapshots |
| `GET /api/players/{playerId}/kingdata` | 4 | Kingship/reign summary |
| `GET /api/players/{playerId}/standings` | 4 | Leaderboard positions and scores |
| `GET /api/players/{playerId}/redemptions` | 4 | Player gift-code history |
| `GET /api/players/{playerId}/comments` | 4 | Community comments |
| `POST /api/translate/batch` | 10 | Batch text translation |
| `GET /api/stats` | 2 | Platform-wide tracking totals |
| `GET /api/kingdoms/{kingdomId}` | 1 | Aggregated kingdom overview |
| `GET /api/kingdoms/{kingdomId}/leaderboards/{boardType}` | 1 | Stored kingdom leaderboard |
| `GET /api/kingdoms/{kingdomId}/townhall` | 1 | Town Centre distribution and changes |
| `GET /api/kingdoms/{kingdomId}/kvk` | 1 | KvK history and derived ratings |
| `GET /api/kingdoms/{kingdomId}/comments` | 1 | Kingdom comments |
| `GET /api/kingdoms/stats` | 1 | Cross-kingdom derived ranking |
| `GET /api/transfers` | 1 | Detected kingdom transfers |
| `GET /api/players` | 1 | Paginated player catalogue |
| `GET /api/jeabsplus/status` | 1 | Subscription/session state |
| `GET /api/finds` | 1 | Paid feature gate; returned HTTP 402 |
| `GET /api/maps` | 1 | Paid feature gate; returned HTTP 402 |

## Observed player summary contract

The stored player response exposed fields equivalent to:

- public Player ID;
- username and avatar URL;
- kingdom/state;
- Town Centre level;
- last refresh time;
- internal numeric UID;
- power, kills, VIP and account level;
- alliance ID, abbreviation, name and rank;
- Mystic Trial score, rank, kingdom and update timestamp;
- comment count and redemption participation state.

This response is a Jeabs List projection. The capture does not prove that every field is available from one upstream Kingshot endpoint.

## Cached versus fresh loadout evidence

The strongest evidence is the paired loadout workflow:

1. `GET /api/players/{playerId}/loadout?cached=1`
2. `GET /api/players/{playerId}/loadout`

Five cached calls were observed. Their response times were approximately 331–381 ms. Four were marked `stale: true`, with `fetched_at` timestamps ranging from days to more than a month before the capture.

Three uncached calls were observed. Their response times were approximately 1,081 ms, 1,383 ms and 2,548 ms. Each returned:

- `stale: false`;
- a `fetched_at` timestamp matching the current request window;
- the same requested public Player ID;
- an internal UID;
- structured heroes, equipment, skills, exclusive equipment, skins and numeric stats.

### Loadout projection fields

Observed loadout structure included:

- `player_id` and internal `uid`;
- `fetched_at` and `stale`;
- `heroes[]` with slot, hero ID, level, star, position, skills, exclusive-equipment ID/level and equipment;
- `extras` with skins, frame ID, uploaded image and lord-equipment visibility;
- numeric `stats` keyed by internal stat identifiers.

### Supported inference

The timing and timestamp change strongly support the inference that an uncached browser request triggers a server-side refresh before Jeabs List persists and returns the result.

The structured internal fields strongly support a machine-readable upstream source rather than OCR as the primary source of this loadout response.

### Not proven

The HAR does **not** reveal the hidden upstream host, protocol, credentials or authorisation method because the browser communicates only with `jeabslist.com`.

It does not prove whether the hidden source is:

- an official or undocumented Century Games endpoint;
- a mobile-game service;
- an authenticated collector account;
- a private third-party data feed;
- or another reverse-engineered transport.

## Derived-data evidence

The following browser responses are consistent with Jeabs List calculating results from stored observations:

- player history and name/alliance/power changes;
- kingdom transfers;
- Town Centre distributions and daily/weekly changes;
- kingdom grades;
- KvK MMR, expected outcomes and strength gaps;
- alliance totals and tracked-member coverage;
- leaderboard and Mystic Trial histories.

These are not evidence of equivalent Kingshot endpoints. They are products that Forge could independently calculate after acquiring lawful, trustworthy snapshots.

## Security and privacy findings

1. The HAR token is authentication material and must not be reused.
2. Forge must not proxy, scrape or depend on Jeabs List's private API.
3. Public Player IDs do not make every associated field appropriate for unrestricted public indexing.
4. Comments, redemption activity, alliance movement and historical profiles require explicit privacy, retention and abuse decisions.
5. Raw upstream payloads may contain internal identifiers and unknown fields; public projections must be allowlisted.
6. On-demand refresh must be rate-limited, cached and protected from enumeration and amplification abuse.

## Forge interpretation

### Reusable architectural ideas

Forge may independently implement:

- source-neutral player lookup adapters;
- immutable observations and normalised snapshots;
- cached reads with bounded refresh;
- explicit freshness and provenance;
- change detection;
- player, alliance and kingdom history;
- derived statistics using explainable formulas;
- safe public and authenticated projections.

### Prohibited shortcuts

Forge must not:

- commit or distribute the raw HAR;
- copy the captured token;
- call Jeabs List as a production data provider;
- present inferred upstream behaviour as confirmed fact;
- treat player existence as ownership proof;
- expose raw upstream payloads to browsers;
- create public external-Player-ID routes without the Player API/privacy decision gates;
- bypass Century Games authentication, certificate controls or access restrictions.

## Initial conclusion

Forge already has a server-authoritative basic Kingshot lookup path for linked accounts. The safe next step is to preserve those basic lookup results as source-attributed immutable observations and snapshots, while keeping identity verification, public exposure and deeper loadout research as separate governed decisions.
