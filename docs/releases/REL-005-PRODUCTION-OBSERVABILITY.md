# REL-005 — Production Observability & Analytics

Status: implementation complete locally; deployment and owner review pending.

REL-005 establishes Forge's permanent observability foundation. The shared analytics service emits an allow-listed event vocabulary for player, editorial, creator, contributor, rendering and operations modules. Future modules register by calling `track(event, properties)`; private identifiers, emails, tokens, Supabase IDs, secrets and free-form content are rejected before transport.

## Architecture

- GA4 loads once with measurement ID `G-8L3HYETN51` and `send_page_view: false`; route transitions emit one Forge `page_view` and one `route_change` event.
- Browser events are sent to GA4 and the server ingestion endpoint using an anonymous local session UUID. The server stores only safe aggregate properties, coarse device/browser/source metadata and route.
- Supabase persistence is `forge_analytics_events`, RLS-enabled and inaccessible to `anon` and `authenticated`; only the server service role can insert or report.
- Admin reports are server-authorized through `cms.view` and aggregate a bounded 30-day projection.
- Global browser errors, unhandled rejections, search failures, search outcomes and authentication transitions are wired into the service.

## Admin surfaces

`/admin/analytics` contains Overview, Users, Search, Content, Performance, Errors and Operations sections. It reports users, page/device/browser/source breakdowns, search failures and latency, feature events, recent errors and publication activity, with honest empty states when no production data exists.

## Remaining work

Daily trend charts, retention cohorts, server-side correlation propagation, percentile latency views, alert delivery and a dedicated log retention job remain follow-up work.
