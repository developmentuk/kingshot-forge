# Production Observability Runbook

After deployment, verify `/api/analytics` accepts anonymous event posts with HTTP 204 and rejects Admin report reads without a valid Forge bearer token. An authenticated user with `cms.view` should load `/admin/analytics`; other users should receive the existing protected-route state.

Check GA4 Realtime for one `page_view` and one `route_change` per SPA transition, then inspect Search, error and publication events. Do not use production credentials or private identifiers in test properties. If ingestion fails, the browser remains functional because analytics transport is best-effort; inspect server logs and Supabase migration status before retrying.
