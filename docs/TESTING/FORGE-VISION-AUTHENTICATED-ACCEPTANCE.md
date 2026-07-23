# Forge Vision authenticated acceptance checklist

Status: prepared; not executed in VISION-001C2A because no authorized owner/admin session was supplied and the persistence migration remains unapplied.

Use a disposable synthetic fixture and record the account, commit, migration state, timestamp, and preview URL. Do not use a real Kingshot mapping or production evidence.

## Access and authorization

- [ ] Owner/admin can load Vision Studio through the temporary `cms.view` gate and the API accepts `vision.admin.read`.
- [ ] A user without `vision.admin.read` cannot read privileged admin data.
- [ ] A user without `vision.admin.edit` cannot create or mutate authoring data.
- [ ] Anonymous requests cannot read or mutate Vision data.
- [ ] Browser clients have no direct storage INSERT, UPDATE, or DELETE access.

## Authoring and persistence

- [ ] Empty-state screen explains that no screen types or mappings are seeded.
- [ ] The canonical Tesseract extractor is visible and correctly marked for its execution mode.
- [ ] Owner/admin can create a Draft mapping version using only governed Field Registry targets.
- [ ] Draft metadata, regions, field mappings, extractor configuration, and test case persist after reload.
- [ ] Draft can enter Testing; published versions cannot be edited in place.
- [ ] A published successor can be created without mutating the published predecessor.
- [ ] Append-only test results, extraction evidence, corrections, and audit events reject update/delete attempts.

## UX and operational checks

- [ ] Loading, empty, error, permission-denied, and success states are distinguishable.
- [ ] Desktop and narrow viewport layouts remain usable without exposing privileged controls.
- [ ] Browser console has no new errors; network requests contain no accidental direct database/storage writes.
- [ ] Audit entries identify actor, action, entity, and correlation context.
- [ ] Synthetic fixture and uploaded evidence are deleted through the approved cleanup procedure.

Evidence required for sign-off: screenshots or recording, request/response capture, verifier JSON output, database/storage read-only catalog output, and explicit confirmation that no real mapping was created.
