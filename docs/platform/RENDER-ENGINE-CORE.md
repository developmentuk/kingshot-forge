# Render Engine Core

ART-002 makes the Render Engine a shared platform subsystem. Community Art is the first adapter; names, banners, chat, Alliance Mail and future generators consume the same contracts.

Submitted text is captured as UTF-8 bytes before parsing. The `raw-bytes` artifact is immutable and retains CRLF, CR, LF, tabs, invisible characters and Unicode exactly as submitted. Every artifact exposes SHA-256, byte length, UTF-16 length, code-point count, grapheme count, line count and whitespace counts.

The stages are raw bytes → raw Unicode → canonical Unicode → normalised Unicode → approved payload → clipboard payload → browser preview → Kingshot prediction. A transition contains before/after artifacts, operations, deltas, highlighted differences and an append-only audit record. Raw is never overwritten.

Capabilities are explicit: anonymous public gallery, player own safe projection, contributor submission, moderator queue/raw/private-note access, administrator calibration and owner administration. Verified Player status grants no moderation capability. Forced RLS and explicit grants protect raw source and private notes.

The UI uses memoised analysis, fixed-cell rendering and independently scrolling responsive panes. Large artwork must not expand the page viewport.
