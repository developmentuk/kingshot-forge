# Render Engine Core

ART-002 makes the Render Engine a shared platform subsystem. Community Art is the first adapter; names, banners, chat, Alliance Mail and future generators consume the same contracts.

Submitted text is captured as UTF-8 bytes before parsing. The `raw-bytes` artifact is immutable and retains CRLF, CR, LF, tabs, invisible characters and Unicode exactly as submitted. Every artifact exposes SHA-256, byte length, UTF-16 length, code-point count, grapheme count, line count and whitespace counts.

The stages are raw bytes → raw Unicode → canonical Unicode → normalised Unicode → approved payload → clipboard payload → browser preview → Kingshot prediction. A transition contains before/after artifacts, operations, deltas, highlighted differences and an append-only audit record. Raw is never overwritten.

Capabilities are explicit: anonymous public gallery, player own safe projection, contributor submission, moderator queue/raw/private-note access, administrator calibration and owner administration. Verified Player status grants no moderation capability. Forced RLS and explicit grants protect raw source and private notes.

The UI uses memoised analysis, fixed-cell rendering and independently scrolling responsive panes. Large artwork must not expand the page viewport.

## ART-002B certification evidence

Migration `20260721170000_art002_render_engine_core.sql` was applied to Supabase project `hrvdhjscwitqpwjhnjkm` on 21 July 2026. Live catalog checks report `community_art_submissions` with RLS and FORCE RLS enabled, 12/12 existing rows hashed, and the immutable trigger installed. Direct grants deny `anon` and `authenticated` access to `raw_source_text` and legacy `artwork_text`; approved payload reads remain available. Payload-version writes are service-role-only.

The canonical local fixture remains byte-identical: SHA-256 `c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79`, 386 bytes, 276 code points, 278 UTF-16 units, 10 lines and 9 CRLF sequences. No database publication rows were changed by ART-002B; the migration backfilled metadata for 12 existing submissions.

The authenticated browser role matrix is not certified in this checkout because approved sessions for player, verified player, contributor, moderator, administrator and owner were not available. Verified-player access must be tested as a release-blocking owner action.

## ART-002G submission repair

ART-002G repaired the post-ART-002 insert contract: `raw_source_sha256` and `raw_source_byte_length` are now computed and persisted by the atomic service-role submission command. The command also records `submission_request_id` for duplicate prevention and appends a pending submission audit event. No approved payload or calibration ownership is required at submit time.

ART-003 adds versioned Kingshot chat, alliance-chat and mail prediction profiles.
Screenshot anchors measure left/right width, baseline and line-height drift; profile
adjustments never mutate source or approved payload. The canonical fixture is a
10-line calibration benchmark. Font assets and device-scale metadata remain the
principal residual limitations.

## ART-002C access-control repair

The regression root cause was a capability vocabulary mismatch: navigation used
`cms.view`, the route used `render_engine.inspect`, and the live role-permission
tables contained neither Render Engine capability. The owner therefore saw the
link through CMS access but was denied by the route guard. ART-002C makes
`render_engine.view` the page capability and adds explicit inspect, calibration,
profile-management, Community Art moderation and Community Art approval keys.

Owner and administrator receive all six capabilities; moderators receive
view/inspect and Community Art moderation/approval; players, verified players
and contributors receive none by default. RoleContext refreshes on sign-in,
window focus, visibility changes and the `forge-capabilities-changed` event.
API and RLS moderation checks use `community_art.moderate`.
