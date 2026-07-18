# Forge Operations Centre audit

## Release 0.8.0 workspace decision

The Operations Centre is now a separate workspace selected through the shared
workspace registry and header switcher. Player View no longer renders these
internal links in its navigation. Existing `/admin/*` URLs remain compatibility
aliases while individual feature routes are migrated. Workspace preference is
not authorization: direct routes and API calls still require their existing
server-side permissions.

## Scope

Release 0.7.5 preview validation covers the Admin Gift Redemption surface and
its surrounding information architecture. Provider credentials, full Player
IDs and redemption transport remain server-only.

## Findings and decisions

- Admin Gift Redemption is a Player Operations destination and is grouped with
  Player Identity in the sidebar.
- Dashboard cards provide entry points for datasets, verification, community
  work and Gift Redemption; unfinished destinations retain honest restricted or
  planned labels.
- Provider configuration, environment flag, provider health, circuit state and
  aggregate activity are separate signals. A disabled environment flag cannot
  be overridden by an Admin action.
- The active-code catalogue and zero-valued aggregate metrics load independently
  of provider health and redemption history failures.
- Non-JSON or empty API responses are reported as a safe panel error; the UI
  never blindly calls `response.json()`.

## Responsive review checklist

Validate the Operations Centre at 390px, 768px and 1440px. The provider summary,
metrics, filters and catalogue table must remain readable; the table may scroll
horizontally on narrow screens without exposing secrets or complete Player IDs.

## Security boundary

Validation uses `KINGSHOT_REDEMPTION_ENABLED=false`. No provider request is made,
the Admin enable control is disabled, consent and verification remain enforced,
and Supabase RLS/service-role access is unchanged.

## Current release classification

Gift Redemption is **functional but incomplete** pending authenticated
end-to-end validation. Datasets, Verification Centre, Community Art and Data
Engine are **functional but incomplete**. Import Manager, Version History,
Global Search and Publish Centre remain **planned/UI-shell-only**. Player
Identity support is **partial** and now receives an explicit permission guard;
its safe support projection and mutation audit still require validation. User
Management, Roles and Permissions, Audit Log and Feature Flags are **planned**.
