# ART-001 / ART-002B certification record

ART-002B committed the Render Engine Core and applied migration `20260721170000_art002_render_engine_core.sql` to Supabase project `hrvdhjscwitqpwjhnjkm`.

## Evidence

- Branch: `feature/art-rendering-moderation-engine`
- Final pushed commit at certification update: recorded in Git history
- RLS: enabled and forced on `community_art_submissions`; immutable source trigger live
- Direct grants: approved payload only for public reads; raw and legacy artwork source denied to `anon` and `authenticated`
- Fixture: SHA-256 `c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79`; 276 code points / 278 UTF-16 units
- Database mutation: 12 existing submissions received raw hash/byte metadata; no publication status or payload was changed
- Local performance: pipeline inspection completed in 36.23 ms / 93.28 ms / 167.73 ms for 10 KB / 50 KB / 100 KB inputs

## Remaining acceptance gates

Authenticated role sessions, live clipboard paste capture, responsive screenshots at 390/768/1280/1440, browser console/network capture and protected-preview role smoke testing remain owner-session evidence. No production deployment was made.

## ART-002C access-control repair

The owner false-denial regression was repaired in commit `b179e24`. Live
migration `art002c_render_engine_capabilities` applied successfully with
version `20260721171958`. Owner capabilities now resolve as four Render Engine
capabilities plus two Community Art capabilities. Moderator capabilities are
limited to view/inspect and Community Art moderation/approval. Verified players
receive none of these capabilities by verification alone.
