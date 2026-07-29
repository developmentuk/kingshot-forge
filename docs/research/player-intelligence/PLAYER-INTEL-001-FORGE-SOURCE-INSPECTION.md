# PLAYER-INTEL-001 — Current Forge player source inspection

**Status:** Read-only operational evidence  
**Inspected:** 29 July 2026  
**Supabase project:** `hrvdhjscwitqpwjhnjkm`  
**No deployment, mutation or revalidation performed**

## Purpose

Record the current server-controlled source behind Forge's existing basic Kingshot player lookup before any Player Snapshot integration is attempted.

## Active Edge Function

The connected Supabase project reports:

| Property | Observed value |
| --- | --- |
| Function | `kingshot-player` |
| Status | Active |
| Version | 6 |
| JWT verification | Required |
| Function bundle SHA-256 | `501efd137579165f8d51f5e579fd35d36dc3aa85f500d15aa14842c424bb1101` |

The function was retrieved read-only through the connected Supabase control plane. No source or configuration was changed.

## Upstream source

The function proxies a GET request to:

```text
https://kingshot.net/api/player-info?playerId={normalisedPlayerId}
```

The browser does not need to know or call that upstream directly. Forge's existing linked-player service calls the JWT-protected Edge Function from a server-authoritative path.

## Current function behaviour

1. Accepts `GET` and `OPTIONS` only.
2. Reads `playerId`, with `id` as a compatibility alias.
3. Rejects a missing Player ID with HTTP 400.
4. Calls the Kingshot.net player-info endpoint with `Accept: application/json`.
5. Reads the upstream response as text.
6. Rejects a non-JSON content type with HTTP 502.
7. Parses and returns the upstream JSON with its upstream HTTP status.
8. Adds `Cache-Control: public, max-age=300, s-maxage=300`.
9. Requires a valid JWT at the Supabase gateway.

## Existing persistence evidence

A read-only query of `public.player_accounts` found verified records whose latest projection includes:

- Player ID;
- player name;
- kingdom;
- numeric player level;
- rendered level and detailed rendered level;
- `verification_method = kingshot_player_lookup`;
- server-recorded refresh timestamps.

The newest inspected examples were refreshed on 20 July 2026. Player identifiers and names are intentionally omitted from this research document.

This proves that the configured lookup path has successfully populated Forge records previously. It does not prove current upstream availability, ownership of any game account, or suitability for bulk/scheduled collection.

## Contract alignment

The active source supports the same first-slice fields already normalised by `server/player-identity/linkedPlayerService.ts`:

- `playerId`;
- `name`;
- `kingdom`;
- `level`;
- `levelRendered`;
- `levelRenderedDetailed`;
- `levelImage`;
- `profilePhoto`.

The PLAYER-INTEL-001 adapter deliberately stays within this allowlist.

## Operational findings

### Positive

- Forge already owns the proxy boundary.
- JWT verification is enabled.
- The upstream host is independently identified.
- Existing application code already validates returned Player ID, name, kingdom and level.
- A five-minute cache reduces unnecessary upstream traffic.
- The source can be wrapped by a source-neutral adapter without changing the browser contract.

### Review items

1. `Access-Control-Allow-Origin: *` is broad. JWT verification limits invocation, but CORS should be reviewed against the intended server-only posture.
2. The function logs up to 500 characters of a non-JSON upstream response. Future hardening should log status, content type, byte length and correlation ID rather than upstream body text.
3. The function reads the full response before validation and has no explicit payload-size limit or timeout.
4. Cache semantics need review before snapshot refresh because `public` cache language and authenticated gateway behaviour must not be assumed to provide application idempotency.
5. The Edge Function returns the full upstream JSON. The new server adapter must continue to create an explicit allowlisted projection and prevent unknown fields entering browser responses.
6. Source terms, rate limits and sustained operating posture remain to be documented before any scheduled collection.

## PLAYER-INTEL-001 decision

The existing `kingshot-player` function is the approved source candidate for the basic read-only adapter proof. It is not approved for:

- bulk Player ID enumeration;
- public search;
- scheduled collection;
- Alliance or kingdom roster discovery;
- detailed hero/loadout data;
- ownership, membership or authority verification.

A controlled current-connectivity test remains separate from the deterministic adapter contract tests and must not mutate `player_accounts` or other production data.
