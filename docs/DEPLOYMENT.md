# Kingshot Forge Deployment

## Canonical environments

- Production domain: `https://ksforge.app`
- Legacy Vercel domain: `https://kingshot-forge.vercel.app`
- Preview deployments: Vercel-generated preview URLs for the exact branch commit

`ksforge.app` is the canonical public production address. The Vercel address remains an infrastructure endpoint and should not be presented as the primary public URL.

## Version source of truth

The application version is defined once in the root `package.json` `version` field.

Vite injects the following build metadata:

- `__APP_VERSION__` from `package.json`;
- `__DEPLOYMENT_ENV__` from `VERCEL_ENV`;
- `__COMMIT_SHA__` from `VERCEL_GIT_COMMIT_SHA`.

All pages and shared layout surfaces that display the current application version must import the shared values from `src/config/release.ts`. Current-release labels must never be hard-coded independently.

Historical release entries may retain their historical version literals because they describe past releases rather than the currently deployed application.

## Release procedure

1. Update `package.json` to the intended semantic version.
2. Update the current release content in Roadmap and Release Notes without duplicating the version string.
3. Run `npm run check`.
4. Deploy the exact commit to Vercel preview.
5. Verify the preview channel, version and short commit identifier.
6. Promote the accepted commit to production at `ksforge.app`.
7. Verify the production channel, version and exact commit.
8. Merge and tag only after acceptance.
