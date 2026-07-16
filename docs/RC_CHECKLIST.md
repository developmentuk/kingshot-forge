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

- [ ] Heroes
- [ ] Hero Skills
- [ ] Buildings
- [ ] Governor Gear
- [ ] Troops
- [ ] Governor Charm
- [ ] VIP
- [ ] Hero Shards
- [ ] Hero XP
- [ ] Truegold
- [ ] War Academy
- [ ] Events
- [ ] KvK Scoring
- [ ] Masters

For each supported dataset:

- [ ] Dataset loads from the intended source
- [ ] List view works
- [ ] Search works
- [ ] Filters work where provided
- [ ] Sorting works where provided
- [ ] Pagination works
- [ ] View-record state works
- [ ] Edit action is shown only when an adapter and schema exist
- [ ] Validation errors are actionable
- [ ] Save creates or updates the editorial draft correctly
- [ ] Preview reflects the pending version
- [ ] Publish requires the correct permission
- [ ] Published projection updates atomically
- [ ] Immutable version history is retained
- [ ] Audit entries identify the actor and action
- [ ] Loading, empty and error states are intentional
- [ ] Mobile layout is usable

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
- [ ] Dataset directory reflects actual capabilities and status
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
2. Fourteen game-data datasets are registered, but adapter and Record Editor coverage is incomplete.
3. The Events dataset declares editing support but has no registered Record Editor schema.
4. Most registered datasets are marked `not-imported`; their complete editorial journeys have not yet been demonstrated.
5. Runtime, responsive and production smoke validation remain outstanding.

## Sign-off

- Engineering validation: Pending
- Product-owner validation: Pending
- RC tag: Pending
- Final `v0.6.0` tag: Pending
