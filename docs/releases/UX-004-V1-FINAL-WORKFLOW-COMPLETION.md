# UX-004 — V1 Final Workflow Completion

This release completes the accepted UX-003 workflows: progression parsing, opt-in automatic gift-code redemption, identity-change notifications, structured Forge Connections, Render Engine workflow guidance and benchmark availability, and final layout refinement.

- `TG1-0` through `TG30-0` normalize to the integer Town Center snapshot schema; malformed and out-of-range values remain unavailable.
- Automatic redemption is opt-in, authenticated, verified-player-only, locked and idempotent, with failures isolated from login. Manual Run now remains available.
- Role/status mutations create in-app notifications and audit-linked delivery records; email is sent only when `RESEND_API_KEY` and `EMAIL_FROM` are configured.
- Forge Connections exposes tags and excludes unpublished, self, duplicate, generic, and destination-less records.
- Render Engine distinguishes ready and unavailable benchmark classes and embeds the numbered guide.

No production merge, tag, or promotion is included.
