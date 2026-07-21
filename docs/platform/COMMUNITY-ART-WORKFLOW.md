# Community Art workflow

1. A submitter sends an immutable raw source.
2. The service records normalized and rendered-preview values plus compatibility diagnostics.
3. A moderator edits a separate approved payload, previews the Kingshot profile, and records notes and repair operations.
4. Approval creates an independently versioned payload; rejection never enters the public projection.
5. Publication exposes the approved payload and pinned profile. Gallery preview and copy use that same value.

Submitters can see their own state and feedback. Moderation notes remain private. Public reads expose published payload fields only. Raw source and payload versions are protected by RLS and owner/moderator policies.

## ART-002G submission boundary

Player submission is server-authorized and atomic. The handler requires `contributions.submit`, validates the request, and invokes the service-role-only `submit_community_art_submission` command. The command preserves UTF-8 raw source bytes, SHA-256, byte length, CRLF/LF evidence, normalized text, render profile, pending status and a submission audit event together. A repeated request UUID returns the existing submission and does not create a second row.

Submission never creates an approved payload or payload-version history entry. Approval remains a later moderation operation. Player-facing failures include a safe reason and correlation ID; technical database details remain in server logs.

The ART-002G candidate is certified in protected preview only. Authenticated player
and moderator sessions are still required to certify the live submission, retry,
moderation and Gallery path before promotion.
# ART-002B role boundary

Community Art uses the shared Render Engine. Anonymous and public projections receive approved payloads only. Contributors submit pending records. Moderation queue, raw source and private notes require the explicit `moderation.manage` capability; verified status alone never grants them. Approval and publication remain server-authorised operations.

Live RLS verification confirmed raw and legacy source columns are not directly granted to `anon` or `authenticated`; server-role access is required for the moderation API. Authenticated browser role evidence remains pending owner-provided sessions.

ART-002C replaces the ambiguous `moderation.manage` gate for this workflow with
`community_art.moderate` and keeps `community_art.approve` separate for action
authorization. Verified Player is never used as a capability source.
