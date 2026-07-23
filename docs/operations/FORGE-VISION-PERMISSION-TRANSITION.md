# Forge Vision permission transition

Status: prepared, not activated. Programme: VISION-001C2A.

The current Vision Studio route and workspace navigation remain gated by `cms.view`. This is deliberate: the persistence migration is unapplied and the live project does not yet contain the Vision permission assignments. The API already requires `vision.admin.read` for reads and `vision.admin.edit` for mutations, so the temporary UI gate cannot be treated as a substitute for API authorization.

The prepared transition helper is `shared/domains/vision-mapper/permissionTransition.ts`. It returns `vision.admin.read` only when all three independent readiness signals are true: the persistence migration is applied, live permission assignments have been verified, and authenticated API acceptance checks have passed. Until then it returns `cms.view`; App and navigation are intentionally unchanged.

Transition procedure:

1. Apply and verify the approved persistence migration, then separately apply the evidence-storage migration if storage is in scope.
2. Assign and verify the governed permissions for the owner/admin acceptance identities; do not grant broad anonymous or browser mutation access.
3. Run the read-only activation verifier and the authenticated acceptance checklist.
4. Record the owner-approved activation metadata and change the App/navigation gate to `vision.admin.read` in a separately reviewed commit.
5. Re-run the full check suite and confirm unauthorized users receive a denial rather than an empty privileged view.

Rollback is to revert the UI gate to `cms.view` while leaving the API permission boundary intact. Never grant `vision.admin.read` merely to make a preview appear usable.
