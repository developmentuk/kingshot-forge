# ADR-012: Cost-Conscious Development

- **Status:** Accepted
- **Date:** 2026-07-23
- **Decision owner:** Clark
- **Applies to:** Kingshot Forge engineering, infrastructure and delivery workflows

## Context

Forge is an independently developed platform and must avoid unnecessary recurring infrastructure costs. Convenience-only cloud services can introduce ongoing spend without providing proportional product or engineering value.

A Supabase disposable branch was proposed for rehearsal at a metered hourly cost. The owner explicitly declined paid branching and instructed the development workflow to generate migration SQL only, leave production unchanged and create no paid branch.

## Decision

Forge will prefer zero-cost development workflows wherever they provide an acceptably safe and maintainable path.

The default priority order is:

1. local development and local validation;
2. Git feature branches;
3. version-controlled SQL migration files;
4. human review and explicit approval;
5. controlled deployment to the existing production environment;
6. post-deployment validation and rollback readiness.

Unless the owner explicitly authorises otherwise:

- do not create paid Supabase branches;
- do not provision paid preview databases or recurring cloud resources for convenience;
- do not enable metered infrastructure merely because a tool recommends it;
- present material cost implications before provisioning any paid resource;
- prefer existing free-tier and repository-based controls;
- do not weaken security, data integrity or recoverability merely to avoid cost.

## Consequences

### Positive

- Infrastructure spend remains intentional and owner-controlled.
- Migrations and operational changes remain visible in Git history.
- Forge avoids accidental subscriptions and metered resources.
- Development practices remain accessible and sustainable.

### Trade-offs

- Some rehearsals require more manual preparation and review.
- Production deployment gates must be stricter when no isolated cloud database branch is available.
- Backups, idempotency, rollback planning and post-deployment verification become especially important.

## Exceptions

A paid service may be used only when:

- the owner explicitly approves the cost;
- the expected cost and billing basis are clearly stated;
- the technical or business benefit cannot reasonably be achieved through the default zero-cost workflow;
- an exit, deletion or cost-control plan is documented.

## Related records

- `docs/ADR/ADR-013-safe-database-migration-workflow.md`
- `docs/AEGIS.md`
- `docs/frks/FRKS_Decision_Register.json`
