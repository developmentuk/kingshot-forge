import type {
  DatasetDefinition,
  DatasetFieldDefinition,
  DatasetRecordDraft,
  DatasetValidationContext,
  DatasetValidationIssue,
  DatasetValidationResult,
  DatasetValue,
} from '../contracts'

import type {
  DatasetDefinitionSource,
} from '../services/DatasetService'

function isEmptyValue(value: DatasetValue | undefined): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}

function createFieldIssue(
  field: DatasetFieldDefinition,
  code: string,
  message: string,
): DatasetValidationIssue {
  return {
    code,
    message,
    severity: 'error',
    fieldId: field.id,
    path: field.id,
  }
}

function validateFieldType(
  field: DatasetFieldDefinition,
  value: DatasetValue,
): DatasetValidationIssue[] {
  const issues: DatasetValidationIssue[] = []

  if (
    (field.type === 'number' || field.type === 'percentage') &&
    typeof value !== 'number'
  ) {
    issues.push(
      createFieldIssue(
        field,
        'field.invalid_number',
        `${field.label} must be a number.`,
      ),
    )
  }

  if (field.type === 'boolean' && typeof value !== 'boolean') {
    issues.push(
      createFieldIssue(
        field,
        'field.invalid_boolean',
        `${field.label} must be true or false.`,
      ),
    )
  }

  if (
    ['text', 'textarea', 'date', 'datetime', 'url', 'markdown', 'image', 'relation'].includes(
      field.type,
    ) &&
    typeof value !== 'string'
  ) {
    issues.push(
      createFieldIssue(
        field,
        'field.invalid_string',
        `${field.label} must be text.`,
      ),
    )
  }

  if (
    ['array', 'gallery', 'multiselect'].includes(field.type) &&
    !Array.isArray(value)
  ) {
    issues.push(
      createFieldIssue(
        field,
        'field.invalid_array',
        `${field.label} must be a list.`,
      ),
    )
  }

  if (
    field.type === 'object' &&
    (typeof value !== 'object' || value === null || Array.isArray(value))
  ) {
    issues.push(
      createFieldIssue(
        field,
        'field.invalid_object',
        `${field.label} must be an object.`,
      ),
    )
  }

  return issues
}

function validateFieldRules(
  definition: DatasetDefinition,
  field: DatasetFieldDefinition,
  record: DatasetRecordDraft,
): DatasetValidationIssue[] {
  const value = record.values[field.id]
  const rule = field.validation
  const required = field.required === true || rule?.required === true

  if (required && isEmptyValue(value)) {
    return [
      createFieldIssue(
        field,
        'field.required',
        rule?.message ?? `${field.label} is required.`,
      ),
    ]
  }

  if (isEmptyValue(value)) {
    return []
  }

  const issues = validateFieldType(field, value)

  if (!rule) {
    return issues
  }

  if (typeof value === 'number') {
    if (rule.minimum !== undefined && value < rule.minimum) {
      issues.push(
        createFieldIssue(
          field,
          'field.minimum',
          rule.message ?? `${field.label} must be at least ${rule.minimum}.`,
        ),
      )
    }

    if (rule.maximum !== undefined && value > rule.maximum) {
      issues.push(
        createFieldIssue(
          field,
          'field.maximum',
          rule.message ?? `${field.label} must be no more than ${rule.maximum}.`,
        ),
      )
    }

    if (rule.integer === true && !Number.isInteger(value)) {
      issues.push(
        createFieldIssue(
          field,
          'field.integer',
          rule.message ?? `${field.label} must be a whole number.`,
        ),
      )
    }
  }

  if (typeof value === 'string') {
    if (
      rule.minimumLength !== undefined &&
      value.length < rule.minimumLength
    ) {
      issues.push(
        createFieldIssue(
          field,
          'field.minimum_length',
          rule.message ??
            `${field.label} must contain at least ${rule.minimumLength} characters.`,
        ),
      )
    }

    if (
      rule.maximumLength !== undefined &&
      value.length > rule.maximumLength
    ) {
      issues.push(
        createFieldIssue(
          field,
          'field.maximum_length',
          rule.message ??
            `${field.label} must contain no more than ${rule.maximumLength} characters.`,
        ),
      )
    }

    if (rule.pattern !== undefined) {
      try {
        if (!new RegExp(rule.pattern).test(value)) {
          issues.push(
            createFieldIssue(
              field,
              'field.pattern',
              rule.message ?? `${field.label} is not in the expected format.`,
            ),
          )
        }
      } catch {
        issues.push(
          createFieldIssue(
            field,
            'field.invalid_pattern',
            `${field.label} has an invalid validation pattern.`,
          ),
        )
      }
    }
  }

  if (
    field.options &&
    field.options.length > 0 &&
    (field.type === 'select' || field.type === 'multiselect')
  ) {
    const allowedValues = new Set(
      field.options.map((option) => option.value),
    )
    const selectedValues = Array.isArray(value) ? value : [value]

    if (selectedValues.some((selectedValue) => !allowedValues.has(selectedValue as never))) {
      issues.push(
        createFieldIssue(
          field,
          'field.invalid_option',
          rule.message ?? `${field.label} contains an unsupported option.`,
        ),
      )
    }
  }

  if (rule.validate) {
    const message = rule.validate(value, {
      datasetId: definition.id,
      fieldId: field.id,
      recordId: record.id,
      values: record.values,
    })

    if (message) {
      issues.push(
        createFieldIssue(
          field,
          'field.custom',
          message,
        ),
      )
    }
  }

  return issues
}

export class DatasetValidationService {
  private readonly datasets: DatasetDefinitionSource

  constructor(datasets: DatasetDefinitionSource) {
    this.datasets = datasets
  }

  async validate(
    record: DatasetRecordDraft,
    context: DatasetValidationContext,
  ): Promise<DatasetValidationResult> {
    const definition = this.datasets.require(context.datasetId)
    const issues: DatasetValidationIssue[] = []

    if (record.datasetId !== context.datasetId) {
      issues.push({
        code: 'record.dataset_mismatch',
        message: `Record dataset "${record.datasetId}" does not match validation dataset "${context.datasetId}".`,
        severity: 'error',
      })
    }

    for (const field of definition.fields) {
      issues.push(
        ...validateFieldRules(
          definition,
          field,
          record,
        ),
      )
    }

    for (const validator of definition.validators ?? []) {
      issues.push(
        ...(await validator(record, context)),
      )
    }

    return {
      valid: !issues.some((issue) => issue.severity === 'error'),
      issues,
    }
  }
}
