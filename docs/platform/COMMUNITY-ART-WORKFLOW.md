# Community Art workflow

1. A submitter sends an immutable raw source.
2. The service records normalized and rendered-preview values plus compatibility diagnostics.
3. A moderator edits a separate approved payload, previews the Kingshot profile, and records notes and repair operations.
4. Approval creates an independently versioned payload; rejection never enters the public projection.
5. Publication exposes the approved payload and pinned profile. Gallery preview and copy use that same value.

Submitters can see their own state and feedback. Moderation notes remain private. Public reads expose published payload fields only. Raw source and payload versions are protected by RLS and owner/moderator policies.
# ART-002B role boundary

Community Art uses the shared Render Engine. Anonymous and public projections receive approved payloads only. Contributors submit pending records. Moderation queue, raw source and private notes require the explicit `moderation.manage` capability; verified status alone never grants them. Approval and publication remain server-authorised operations.

Live RLS verification confirmed raw and legacy source columns are not directly granted to `anon` or `authenticated`; server-role access is required for the moderation API. Authenticated browser role evidence remains pending owner-provided sessions.
