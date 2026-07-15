import type {
  DatasetPermissionAction,
  DatasetPermissionRule,
} from '../datasets/index.js'
import {
  createPermissionContext,
  DatasetPermissionDeniedError,
  type DatasetPermissionRequest,
  type DatasetPermissionServiceOptions,
  type PermissionDecision,
} from './contracts.js'

const defaultOptions: Required<
  DatasetPermissionServiceOptions
> = {
  allowUnconfiguredRead: true,
  allowUnconfiguredActions: [],
}

function normaliseRoles(
  roles: string[],
): string[] {
  return [...new Set(
    roles
      .map((role) => role.trim())
      .filter((role) => role.length > 0),
  )]
}

function resolveUnconfiguredDecision(
  request: DatasetPermissionRequest,
  options: Required<DatasetPermissionServiceOptions>,
): PermissionDecision {
  const allowed =
    (
      request.action === 'read' &&
      options.allowUnconfiguredRead
    ) ||
    options.allowUnconfiguredActions.includes(
      request.action,
    )

  return {
    allowed,
    action: request.action,
    datasetId: request.definition.id,
    recordId: request.recordId,
    reason: allowed
      ? 'The action is allowed by the unconfigured-action policy.'
      : 'No permission rule is configured for this action.',
    matchedRoles: [],
  }
}

async function evaluateRule(
  rule: DatasetPermissionRule,
  request: DatasetPermissionRequest,
): Promise<PermissionDecision> {
  const roles = normaliseRoles(request.roles)

  if (Array.isArray(rule)) {
    const permittedRoles = normaliseRoles(rule)
    const matchedRoles = roles.filter((role) =>
      permittedRoles.includes(role),
    )
    const allowed = matchedRoles.length > 0

    return {
      allowed,
      action: request.action,
      datasetId: request.definition.id,
      recordId: request.recordId,
      reason: allowed
        ? `Matched permitted role: ${matchedRoles.join(', ')}.`
        : 'None of the actor roles are permitted.',
      matchedRoles,
    }
  }

  const allowed = await rule(
    createPermissionContext({
      ...request,
      roles,
    }),
  )

  return {
    allowed,
    action: request.action,
    datasetId: request.definition.id,
    recordId: request.recordId,
    reason: allowed
      ? 'The contextual permission rule allowed the action.'
      : 'The contextual permission rule denied the action.',
    matchedRoles: [],
  }
}

export class DatasetPermissionService {
  private readonly options: Required<
    DatasetPermissionServiceOptions
  >

  constructor(
    options: DatasetPermissionServiceOptions = {},
  ) {
    this.options = {
      ...defaultOptions,
      ...options,
      allowUnconfiguredActions:
        options.allowUnconfiguredActions ??
        defaultOptions.allowUnconfiguredActions,
    }
  }

  async evaluate(
    request: DatasetPermissionRequest,
  ): Promise<PermissionDecision> {
    const rule =
      request.definition.permissions?.[
        request.action
      ]

    if (!rule) {
      return resolveUnconfiguredDecision(
        request,
        this.options,
      )
    }

    return evaluateRule(rule, request)
  }

  async can(
    request: DatasetPermissionRequest,
  ): Promise<boolean> {
    return (await this.evaluate(request)).allowed
  }

  async assert(
    request: DatasetPermissionRequest,
  ): Promise<PermissionDecision> {
    const decision = await this.evaluate(request)

    if (!decision.allowed) {
      throw new DatasetPermissionDeniedError(
        decision,
      )
    }

    return decision
  }

  async listAllowedActions(
    request: Omit<
      DatasetPermissionRequest,
      'action'
    >,
    actions: DatasetPermissionAction[],
  ): Promise<DatasetPermissionAction[]> {
    const decisions = await Promise.all(
      actions.map(async (action) => ({
        action,
        allowed: await this.can({
          ...request,
          action,
        }),
      })),
    )

    return decisions
      .filter((decision) => decision.allowed)
      .map((decision) => decision.action)
  }
}
