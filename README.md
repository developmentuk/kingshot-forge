# Kingshot Forge

Kingshot Forge is a community companion platform for Kingshot players, alliances and kingdoms. It combines governed game knowledge, player identity, planning tools, community creation and operational workflows in one React/Vite application.

## Canonical systems

- Production: `https://ksforge.app/`
- Repository: `developmentuk/kingshot-forge`
- Operational constitution: `docs/AEGIS.md`
- Product direction: `docs/FORGE_BLUEPRINT.md`
- Persistent platform data: Supabase project `hrvdhjscwitqpwjhnjkm`

`main` is the accepted production line. Feature branches, ZIP snapshots and source-staging data are not canonical release baselines.

## Local development

Requirements: a current Node.js LTS release and npm.

```bash
npm ci
npm run dev
```

Vite serves the browser application. API-backed workflows also require the Vercel Functions runtime in a second terminal:

```bash
vercel dev --listen 3000
```

Never commit `.env.local`, Supabase service-role keys, provider credentials, OAuth secrets or access tokens.

## Validation

Run the complete release gate before requesting merge:

```bash
npm run check
```

The gate covers structural validation, domain contracts, security boundaries, publication, Search, Player Identity, Forge Vision, Art Studio, Companion, Island/Oasis, lint and the production build. Focused commands are listed in `package.json` and supplement rather than replace the complete gate.

For production dependency advisories:

```bash
npm audit --omit=dev
```

## Delivery rules

- Begin from the latest clean `origin/main`.
- Work on one bounded branch and vertical slice at a time.
- Preserve published-only, server-authoritative and immutable-history boundaries.
- Do not apply migrations, mutate production data or deploy without the milestone's explicit authority and acceptance controls.
- Update AEGIS, the relevant release record and Roadmap when a capability changes state.

See `governance/DEVELOPMENT_WORKFLOW.md`, `governance/RELEASE_PROCESS.md` and `governance/VERSIONING.md` for the full workflow.
