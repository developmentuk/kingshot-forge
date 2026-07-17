# Player Identity support, disputes and four-eyes approvals

**Status:** Disabled contract and UI only. Production execution is blocked.

The support queue models disputed/revoked links, stale Primary state, alias collisions, visibility/verification disputes, migration compatibility and revision conflict. Private notes exist only in the private repository contract and never enter owner/public projections.

Inspect, annotate, request evidence, suspend, revoke, resolve, restore, override and Primary-restoration actions are represented by stable action/result contracts. With gates OFF, the API returns `feature_disabled`; with support enabled but persistence OFF, writes return `persistence_disabled`.

High-risk operations—verification grant/restoration, disputed-link restoration, administrative limit override, leadership-sensitive restoration, migration execution and public-ID exposure changes—require an initiator, distinct approver, reason, scope, optional expiry, exact revision and immutable event. Same-actor approval returns `approver_must_differ`; missing, expired, non-approved or stale requests cannot execute.

Support capability must come from Forge’s future server capability resolver. Alliance rank, client claims and the existing CMS permission table are not substitutes. Approval execution, escalation SLAs, evidence intake, retention and reviewer privacy remain Proposed and require Clark/Aegis plus Security/Privacy/Operations approval.
