# Kingshot Forge Release Candidate Checklist

This checklist is the canonical release-readiness record for Kingshot Forge. A release gate may be marked complete only when the behaviour has been verified, not merely implemented or inferred.

## Release

- Version: `0.6.0`
- Branch: `release/0.6.0-hero-domain`
- Active validation sprint: Sprint 9 — Final Editorial Platform Validation
- Status: In progress

## Gate 1 — Repository and build integrity

- [ ] Exact branch head recorded before validation
- [ ] `npm ci` completes from a clean checkout
- [ ] `npm run check` passes
- [ ] TypeScript build passes
- [ ] Lint passes with no new warnings
- [ ] NodeNext import validation passes
- [ ] PM2B validation passes
- [ ] Hero Skills validation passes
- [ ] Vercel deployment matches the validated commit SHA

## Gate 2 — Editorial dataset coverage

For every registered dataset, verify the declared capabilities match the implemented behaviour.

- [x] Heroes
- [x] Hero Skills
- [x] Buildings
- [x] Governor Gear
- [x] Troops
- [x] Governor Charm
- [x] VIP
- [x] Hero Shards
- [x] Hero XP
- [x] Truegold
- [x] War Academy
- [x] Events
- [x] KvK Scoring
- [x] Masters

For each supported dataset:

- [x] Dataset loads from the intended source
- [x] List view works
- [x] Search works
- [x] Filters work where provided
- [x] Sorting works where provided
- [x] Pagination works
- [x] View-record state works
- [x] Edit action is shown only when an adapter and schema exist
- [ ] Validation errors are actionable
- [ ] Save creates or updates the editorial draft correctly
- [ ] Preview reflects the pending version
- [ ] Publish requires the correct permission
- [ ] Published projection updates atomically
- [ ] Immutable version history is retained
- [ ] Audit entries identify the actor and action
- [x] Loading, empty and error states are intentional
- [x] Mobile layout is usable

Release Gate 3 Admin Dataset Experience evidence is recorded in `docs/testing/RELEASE-GATE-3-ADMIN-DATASET-EXPERIENCE.md`. The unchecked editorial journey items above remain Release Gate 4 work and apply only where the audited capability matrix declares support.

## Gate 3 — Editorial workflow and permissions

- [ ] Viewer access is read-only
- [ ] Contributor/content creator can edit permitted drafts
- [ ] Moderator can perform the intended review actions
- [ ] Publisher permission is enforced server-side
- [ ] Admin access is enforced server-side
- [ ] Public surfaces cannot read draft records
- [ ] Invalid workflow transitions are rejected
- [ ] Failed publishing leaves the previous published projection intact
- [ ] Concurrent edits do not silently overwrite newer versions

## Gate 4 — Hero Domain

- [ ] Hero catalogue consumes published Heroes only
- [ ] Hero detail consumes published Hero Skills only
- [ ] Hero synergies are present and evidence-based
- [ ] Recommended formations are present and evidence-based
- [ ] Strengths and weaknesses are complete
- [ ] Best-use editorial guidance is complete
- [ ] Widget progression guidance is complete
- [ ] Exclusive Gear guidance is complete
- [ ] Hero progression recommendations are complete
- [ ] Player-owned progression remains separate from canonical guidance
- [ ] Unknown, incomplete and unavailable data states are handled
- [ ] Desktop experience is verified
- [ ] Tablet experience is verified
- [ ] Mobile experience is verified

## Gate 5 — Admin platform

- [ ] Dashboard reflects current platform state
- [x] Dataset directory reflects actual capabilities and status
- [ ] Import Manager is implemented or intentionally removed from navigation
- [ ] Version History is implemented or intentionally removed from navigation
- [ ] Global Search is implemented or intentionally removed from navigation
- [ ] Publish Centre is implemented or intentionally removed from navigation
- [ ] Data Engine diagnostics return meaningful states
- [ ] Feedback administration is permission-protected
- [ ] Navigation contains no dead or placeholder destinations

## Gate 6 — Public platform

- [ ] Public navigation is coherent
- [ ] Authentication states are correct
- [ ] Admin navigation is hidden without permission
- [ ] Public pages use published canonical data where applicable
- [ ] Error boundaries and not-found states are usable
- [ ] Core journeys are verified on desktop
- [ ] Core journeys are verified on mobile

## Gate 7 — APIs and production smoke

- [ ] Data Engine health endpoint succeeds
- [ ] Dataset endpoints return expected status codes
- [ ] Editorial endpoints enforce authentication and permissions
- [ ] Publishing endpoints are validated end-to-end
- [ ] Published projections are readable in production
- [ ] Production routes load without console-breaking errors
- [ ] Google Analytics uses measurement ID `G-8L3HYETN51`
- [ ] No secret or service-role value is exposed to the client bundle

## Gate 8 — Documentation and release acceptance

- [ ] `docs/AEGIS.md` reflects the active sprint and current state
- [ ] Roadmap reflects verified completion and deferred work
- [ ] Release Notes describe shipped behaviour only
- [ ] Architecture documentation remains accurate
- [ ] Known limitations are documented
- [ ] Deferred items have an explicit destination
- [ ] Release candidate commit SHA recorded
- [ ] Product-owner runtime validation completed
- [ ] Release approved for RC tag

## Current verified blockers

The following items were identified at the start of Sprint 9 and must be resolved or explicitly deferred before release acceptance:

1. Admin routes for Import Manager, Version History, Global Search and Publish Centre still render placeholder content.
2. Release Gate 4 workflow and permission validation remains outstanding for the three editor-backed datasets. Buildings intentionally has no live publication capability.
3. The generic server runtime dataset definition still declares broader capabilities than the audited Admin registry and must be reconciled during server-side workflow validation.
4. Exact-commit preview and production smoke validation remain outstanding. Local desktop and mobile Admin dataset validation is complete.

## Sign-off

- Engineering validation: Pending
- Product-owner validation: Pending
- RC tag: Pending
- Final `v0.6.0` tag: Pending
