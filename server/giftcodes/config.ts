import type {
  GiftCodeRedemptionProvider,
} from './provider.ts'

export const GIFT_CODE_REDEMPTION_FLAG =
  'GIFTCODE_REDEMPTION_ENABLED'

export type GiftCodeRedemptionConfig = {
  enabled: boolean
}

export function readGiftCodeRedemptionConfig(
  environment: NodeJS.ProcessEnv = process.env,
): GiftCodeRedemptionConfig {
  return {
    enabled:
      environment[GIFT_CODE_REDEMPTION_FLAG] === 'true',
  }
}

export function assertProviderCanRun(
  config: GiftCodeRedemptionConfig,
  provider: GiftCodeRedemptionProvider,
) {
  if (!config.enabled) {
    throw new Error('Gift-code redemption is disabled.')
  }

  if (!provider.productionReady) {
    throw new Error(
      'A simulation-only provider cannot run as a production redemption provider.',
    )
  }
}
