import type {
  VisionFieldDefinition,
  VisionValidationResult,
  VisionValidationRuleResult,
} from '../../shared/platform/vision/contracts.js'

export const FORGE_VISION_VALIDATOR_VERSION = 'forge-vision-json-schema-lite-v1'

export function validateVisionValue(
  field: VisionFieldDefinition,
  value: unknown,
  overrides: Record<string, unknown> = {},
  now: () => Date = () => new Date(),
): VisionValidationResult {
  const schema = { ...field.validationSchema, ...overrides }
  const rules: VisionValidationRuleResult[] = []

  if (value == null || value === '') {
    const nullable = schema.nullable === true
    rules.push({
      ruleKey: 'required',
      status: nullable ? 'passed' : 'failed',
      message: nullable ? 'Blank value is allowed.' : 'A value is required.',
      observedValue: value,
    })
    return buildResult(rules, now)
  }

  validateType(field, value, rules)
  if (typeof value === 'string') validateString(schema, value, rules)
  if (typeof value === 'number' || typeof value === 'bigint') validateNumber(schema, value, rules)
  validateEnumeration(schema, value, rules)

  return buildResult(rules, now)
}

function validateType(field: VisionFieldDefinition, value: unknown, rules: VisionValidationRuleResult[]): void {
  const valid = field.valueType === 'text'
    ? typeof value === 'string'
    : field.valueType === 'integer'
      ? typeof value === 'number' && Number.isInteger(value)
      : field.valueType === 'bigint'
        ? typeof value === 'bigint' || (typeof value === 'number' && Number.isSafeInteger(value))
        : field.valueType === 'boolean'
          ? typeof value === 'boolean'
          : field.valueType === 'percentage'
            ? typeof value === 'number' && Number.isFinite(value)
            : field.valueType === 'json'
              ? true
              : typeof value === 'string'

  rules.push({
    ruleKey: 'type',
    status: valid ? 'passed' : 'failed',
    message: valid ? `Value matches ${field.valueType}.` : `Value does not match ${field.valueType}.`,
    observedValue: value,
    expected: field.valueType,
  })
}

function validateString(schema: Record<string, unknown>, value: string, rules: VisionValidationRuleResult[]): void {
  const minLength = numericSchemaValue(schema.minLength)
  const maxLength = numericSchemaValue(schema.maxLength)
  if (minLength != null) rules.push({
    ruleKey: 'minLength',
    status: value.length >= minLength ? 'passed' : 'failed',
    message: `Value must contain at least ${minLength} characters.`,
    observedValue: value.length,
    expected: minLength,
  })
  if (maxLength != null) rules.push({
    ruleKey: 'maxLength',
    status: value.length <= maxLength ? 'passed' : 'failed',
    message: `Value must contain no more than ${maxLength} characters.`,
    observedValue: value.length,
    expected: maxLength,
  })
  if (typeof schema.pattern === 'string') {
    let matches = false
    try {
      matches = new RegExp(schema.pattern, 'u').test(value)
    } catch {
      rules.push({ ruleKey: 'pattern', status: 'unavailable', message: 'The governed validation pattern is invalid.' })
      return
    }
    rules.push({
      ruleKey: 'pattern',
      status: matches ? 'passed' : 'failed',
      message: matches ? 'Value matches the governed pattern.' : 'Value does not match the governed pattern.',
      observedValue: value,
      expected: schema.pattern,
    })
  }
}

function validateNumber(schema: Record<string, unknown>, value: number | bigint, rules: VisionValidationRuleResult[]): void {
  const numericValue = Number(value)
  const minimum = numericSchemaValue(schema.minimum)
  const maximum = numericSchemaValue(schema.maximum)
  if (minimum != null) rules.push({
    ruleKey: 'minimum',
    status: numericValue >= minimum ? 'passed' : 'failed',
    message: `Value must be at least ${minimum}.`,
    observedValue: value,
    expected: minimum,
  })
  if (maximum != null) rules.push({
    ruleKey: 'maximum',
    status: numericValue <= maximum ? 'passed' : 'failed',
    message: `Value must be no more than ${maximum}.`,
    observedValue: value,
    expected: maximum,
  })
}

function validateEnumeration(schema: Record<string, unknown>, value: unknown, rules: VisionValidationRuleResult[]): void {
  if (!Array.isArray(schema.enum)) return
  const valid = schema.enum.some((candidate) => Object.is(candidate, value))
  rules.push({
    ruleKey: 'enum',
    status: valid ? 'passed' : 'failed',
    message: valid ? 'Value is in the governed allowed set.' : 'Value is not in the governed allowed set.',
    observedValue: value,
    expected: schema.enum,
  })
}

function buildResult(rules: VisionValidationRuleResult[], now: () => Date): VisionValidationResult {
  const status = rules.some((rule) => rule.status === 'failed')
    ? 'invalid'
    : rules.some((rule) => rule.status === 'warning')
      ? 'warning'
      : rules.some((rule) => rule.status === 'unavailable')
        ? 'unavailable'
        : 'valid'
  return { status, rules, validatedAt: now().toISOString(), validatorVersion: FORGE_VISION_VALIDATOR_VERSION }
}

function numericSchemaValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
