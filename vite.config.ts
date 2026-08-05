import { readFileSync } from 'node:fs'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

const deploymentEnvironment = process.env.VERCEL_ENV ?? 'local'
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'
const sentryRelease = `kingshot-forge@${commitSha}`
const sentryConfigured = Boolean(
  process.env.SENTRY_AUTH_TOKEN
  && process.env.SENTRY_ORG
  && process.env.SENTRY_PROJECT
  && process.env.SENTRY_DSN
  && (deploymentEnvironment === 'production' || deploymentEnvironment === 'preview'),
)

const plugins: PluginOption[] = [react()]

if (sentryConfigured) {
  plugins.push(
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      telemetry: false,
      release: {
        name: sentryRelease,
      },
      sourcemaps: {
        assets: './dist/**',
        filesToDeleteAfterUpload: './dist/**/*.map',
      },
    }),
  )
}

export default defineConfig({
  plugins,

  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __DEPLOYMENT_ENV__: JSON.stringify(deploymentEnvironment),
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN ?? ''),
    __SENTRY_RELEASE__: JSON.stringify(sentryRelease),
  },

  build: {
    sourcemap: sentryConfigured ? 'hidden' : false,
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
