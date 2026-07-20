export type DeploymentEnvironment = 'production' | 'preview' | 'development' | 'local' | string

export const APP_VERSION = __APP_VERSION__
export const APP_VERSION_LABEL = `v${APP_VERSION}`
export const DEPLOYMENT_ENVIRONMENT: DeploymentEnvironment = __DEPLOYMENT_ENV__
export const COMMIT_SHA = __COMMIT_SHA__
export const SHORT_COMMIT_SHA = COMMIT_SHA === 'local' ? 'local' : COMMIT_SHA.slice(0, 7)

export const IS_PRODUCTION = DEPLOYMENT_ENVIRONMENT === 'production'
export const RELEASE_CHANNEL = IS_PRODUCTION
  ? 'Version 1.0'
  : DEPLOYMENT_ENVIRONMENT === 'preview'
    ? 'Forge Preview'
    : 'Forge Local'

export const RELEASE_DISPLAY = RELEASE_CHANNEL
