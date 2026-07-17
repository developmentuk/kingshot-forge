import type {
  GiftCodeProviderCapabilities,
  GiftCodeProviderDefinition,
} from './provider.ts'

function requireIdentifier(value: string, label: string) {
  const trimmed = value.trim()

  if (
    trimmed.length < 2 ||
    trimmed.length > 64 ||
    !/^[a-z][a-z0-9-]*$/.test(trimmed)
  ) {
    throw new Error(
      `${label} must be a lowercase provider identifier.`,
    )
  }

  return trimmed
}

function requireDisplayName(value: string) {
  const trimmed = value.trim()

  if (trimmed.length < 2 || trimmed.length > 100) {
    throw new Error(
      'Provider display name must be between 2 and 100 characters.',
    )
  }

  return trimmed
}

function freezeCapabilities(
  capabilities: GiftCodeProviderCapabilities,
): GiftCodeProviderCapabilities {
  if (
    capabilities.executionMode === 'simulation' &&
    capabilities.externalRequestsAllowed
  ) {
    throw new Error(
      'A simulation provider cannot allow external requests.',
    )
  }

  if (
    capabilities.externalRequestsAllowed &&
    capabilities.redemptionSupport !== 'live'
  ) {
    throw new Error(
      'External requests require live redemption support.',
    )
  }

  return Object.freeze({ ...capabilities })
}

function freezeDefinition(
  definition: GiftCodeProviderDefinition,
): GiftCodeProviderDefinition {
  return Object.freeze({
    id: requireIdentifier(definition.id, 'Provider ID'),
    displayName: requireDisplayName(
      definition.displayName,
    ),
    capabilities: freezeCapabilities(
      definition.capabilities,
    ),
  })
}

export class GiftCodeProviderCapabilityRegistry {
  private readonly definitions = new Map<
    string,
    GiftCodeProviderDefinition
  >()

  constructor(
    definitions: readonly GiftCodeProviderDefinition[],
  ) {
    for (const candidate of definitions) {
      const definition = freezeDefinition(candidate)

      if (this.definitions.has(definition.id)) {
        throw new Error(
          `Gift-code provider "${definition.id}" is registered more than once.`,
        )
      }

      this.definitions.set(definition.id, definition)
    }
  }

  has(providerId: string) {
    return this.definitions.has(providerId)
  }

  get(providerId: string) {
    return this.definitions.get(providerId) ?? null
  }

  require(providerId: string) {
    const definition = this.get(providerId)

    if (!definition) {
      throw new Error(
        `Gift-code provider "${providerId}" is not registered.`,
      )
    }

    return definition
  }

  list() {
    return Object.freeze(
      [...this.definitions.values()].sort((left, right) =>
        left.id.localeCompare(right.id),
      ),
    )
  }
}
