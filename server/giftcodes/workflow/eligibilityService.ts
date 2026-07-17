import type {
  GiftCodeConsentMode,
  GiftCodeConsentValidationContext,
  GiftCodeRedemptionConsent,
} from '../../../shared/domains/giftcodes/consent.ts'
import { evaluateGiftCodeConsent } from '../../../shared/domains/giftcodes/consent.ts'
import type {
  GiftCodeEligibilityDecision,
  GiftCodePlayerEligibilityProjection,
  GiftCodePublicationEligibilityProjection,
} from '../../../shared/domains/giftcodes/eligibility.ts'
import { evaluateGiftCodeEligibility } from '../../../shared/domains/giftcodes/eligibility.ts'

export type GiftCodeEligibilityCommand = Readonly<{
  characterRef: string
  codePublicationRef: string
  expectedPublicationVersion: string
  providerId: string
  providerMode: GiftCodeConsentMode
  environment: string
  consentPolicyVersion: string
  consentPolicyDigest: string
  now: string
}>

export type GiftCodeResolvedActor = Readonly<{
  authenticated: boolean
  userId: string | null
}>

export type GiftCodeResolvedPlayer =
  GiftCodePlayerEligibilityProjection &
    Readonly<{
      characterInternalId: string | null
      characterRevision: number | null
    }>

export type GiftCodeEligibilityPorts = Readonly<{
  resolveActor: () => Promise<GiftCodeResolvedActor>
  resolvePlayer: (input: {
    userId: string
    characterRef: string
    purpose: 'official_gift_code_redemption'
  }) => Promise<GiftCodeResolvedPlayer>
  resolvePublication: (input: {
    codePublicationRef: string
    expectedPublicationVersion: string
    now: string
  }) => Promise<GiftCodePublicationEligibilityProjection>
  resolveConsent: (input: {
    userId: string
    characterInternalId: string
    providerId: string
    providerMode: GiftCodeConsentMode
    environment: string
  }) => Promise<GiftCodeRedemptionConsent | null>
  resolveFeaturePolicy: (input: {
    providerId: string
    environment: string
  }) => Promise<{
    featureEnabled: boolean
    environmentEnabled: boolean
    providerEnabled: boolean
  }>
  resolveProviderAvailability: (input: {
    providerId: string
    environment: string
  }) => Promise<{
    available: boolean
    healthy: boolean
  }>
  resolveRateLimit: (input: {
    userId: string
    characterInternalId: string
    providerId: string
    environment: string
  }) => Promise<{ allowed: boolean }>
  resolveSecurityHold: (input: {
    userId: string
    characterInternalId: string
    providerId: string
    environment: string
  }) => Promise<{ active: boolean }>
}>

const missingPlayer: GiftCodeResolvedPlayer = Object.freeze({
  found: false,
  actorOwnsCharacter: false,
  verified: false,
  active: false,
  ownership: 'former',
  providerIdentityAvailable: false,
  characterInternalId: null,
  characterRevision: null,
})

const missingPublication: GiftCodePublicationEligibilityProjection =
  Object.freeze({
    found: false,
    published: false,
    active: false,
    publicationVersionMatches: false,
    expired: false,
    withdrawn: false,
  })

export class GiftCodeEligibilityService {
  private readonly ports: GiftCodeEligibilityPorts

  constructor(ports: GiftCodeEligibilityPorts) {
    this.ports = ports
  }

  async evaluate(
    command: GiftCodeEligibilityCommand,
  ): Promise<GiftCodeEligibilityDecision> {
    const actor = await this.ports.resolveActor()
    const userId = actor.userId ?? ''
    const player = actor.authenticated
      ? await this.ports.resolvePlayer({
          userId,
          characterRef: command.characterRef,
          purpose: 'official_gift_code_redemption',
        })
      : missingPlayer
    const characterInternalId =
      player.characterInternalId ?? ''
    const characterRevision = player.characterRevision ?? 0

    const [publication, consent, featurePolicy, availability, rate, hold] =
      await Promise.all([
        this.ports.resolvePublication({
          codePublicationRef: command.codePublicationRef,
          expectedPublicationVersion:
            command.expectedPublicationVersion,
          now: command.now,
        }),
        actor.authenticated && player.found
          ? this.ports.resolveConsent({
              userId,
              characterInternalId,
              providerId: command.providerId,
              providerMode: command.providerMode,
              environment: command.environment,
            })
          : Promise.resolve(null),
        this.ports.resolveFeaturePolicy({
          providerId: command.providerId,
          environment: command.environment,
        }),
        this.ports.resolveProviderAvailability({
          providerId: command.providerId,
          environment: command.environment,
        }),
        actor.authenticated && player.found
          ? this.ports.resolveRateLimit({
              userId,
              characterInternalId,
              providerId: command.providerId,
              environment: command.environment,
            })
          : Promise.resolve({ allowed: true }),
        actor.authenticated && player.found
          ? this.ports.resolveSecurityHold({
              userId,
              characterInternalId,
              providerId: command.providerId,
              environment: command.environment,
            })
          : Promise.resolve({ active: false }),
      ])

    const consentContext: GiftCodeConsentValidationContext = {
      now: command.now,
      expectedPolicyVersion: command.consentPolicyVersion,
      expectedPolicyDigest: command.consentPolicyDigest,
      userId,
      characterInternalId,
      characterRevision,
      providerId: command.providerId,
      providerMode: command.providerMode,
      environment: command.environment,
    }

    return evaluateGiftCodeEligibility({
      authenticated: actor.authenticated,
      characterSelected: command.characterRef.trim().length > 0,
      player,
      consent: evaluateGiftCodeConsent(consent, consentContext),
      publication: publication ?? missingPublication,
      featureEnabled: featurePolicy.featureEnabled,
      environmentEnabled: featurePolicy.environmentEnabled,
      providerEnabled: featurePolicy.providerEnabled,
      providerAvailable: availability.available,
      providerHealthy: availability.healthy,
      rateLimitAllowed: rate.allowed,
      securityHoldActive: hold.active,
    })
  }
}
