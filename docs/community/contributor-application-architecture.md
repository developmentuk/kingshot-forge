# Contributor application architecture

## Boundary

Recruitment is an Operations-owned workflow over Forge Identity. Public role
content remains the typed catalogue in `src/data/contributorRoles.ts`.
Applications are personal operational data and are not canonical game content.

The browser never receives service-role credentials and never writes recruitment
tables directly. Vercel API handlers authenticate a bearer token with the
existing `requireForgeActor` path, then call the server recruitment service.

## Persistence

Migration `20260718220000_contributor_applications_foundation.sql` adds the
application, role-specific answer, review, message, event and onboarding
tables. All six tables have forced RLS, no anonymous/authenticated table grants,
and service-role-only persistence. Applicant and reviewer access is therefore
mediated through server projections rather than broad browser table access.

## Status and audit

The server owns the allowed transition graph for `draft`, `submitted`,
`under_review`, `more_information_requested`, `conversation`, `accepted`,
`declined`, `withdrawn`, `onboarding`, `active` and `closed`. Each material
action inserts a safe application event. Reviewer notes are stored separately
from applicant-visible messages and are excluded from applicant projections.

## Access separation

`applications.*` capabilities are assigned only to Owner and Administrator by
the migration. Moderators, Contributors, Content Creators and Players receive
no recruitment review capability by default. Acceptance does not call the
canonical role-assignment service and never grants a platform role, publishing,
repository, production, Supabase, Vercel or secret access.

## API surface

Applicant API: `GET /api/contributor-applications`, `POST
/api/contributor-applications?action=draft`, `PATCH
/api/contributor-applications?id=:id`, and action posts for submit, withdraw and
information response.

Operations API: `GET /api/operations/applications`, `GET
/api/operations/applications?applicationId=:id`, and protected POST actions for
reviewer assignment, status changes, messages, internal notes and onboarding.
