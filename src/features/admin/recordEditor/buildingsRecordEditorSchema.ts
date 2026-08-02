import type {
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValue,
} from "./recordEditorSchema.js";

function isNonEmptyString(
  value: RecordEditorValue,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isPositiveInteger(
  value: RecordEditorValue,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

function validateUpgradeCosts(
  value: RecordEditorValue,
): string | null {
  if (!Array.isArray(value)) {
    return "Upgrade costs must be an array.";
  }

  if (value.length === 0) {
    return "At least one upgrade-cost row is required.";
  }

  const seenLevels = new Set<number>();

  for (
    let rowIndex = 0;
    rowIndex < value.length;
    rowIndex += 1
  ) {
    const row = value[rowIndex];

    if (!Array.isArray(row) || row.length !== 7) {
      return `Upgrade-cost row ${rowIndex + 1} must contain exactly seven values.`;
    }

    const hasInvalidCell = row.some(
      (cell) =>
        typeof cell !== "number" ||
        !Number.isFinite(cell) ||
        cell < 0,
    );

    if (hasInvalidCell) {
      return `Upgrade-cost row ${rowIndex + 1} must contain seven non-negative numbers.`;
    }

    const level = row[0];

    if (
      typeof level !== "number" ||
      !Number.isInteger(level) ||
      level < 1
    ) {
      return `Upgrade-cost row ${rowIndex + 1} must use a positive whole-number level.`;
    }

    if (seenLevels.has(level)) {
      return `Upgrade level ${level} appears more than once.`;
    }

    seenLevels.add(level);
  }

  return null;
}

function validateBuildingsRecord(
  record: RecordEditorRecord,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const key = record.values.key;
  const name = record.values.name;
  const maxLevel = record.values.maxLevel;
  const source = record.values.source;
  const costs = record.values.costs;
  const imageUrl = record.values.image_url;
  const imageAltText = record.values.image_alt_text;

  if (!isNonEmptyString(key)) {
    errors.key = "Building key is required.";
  } else if (!/^[a-z0-9-]+$/.test(key)) {
    errors.key = "Use lowercase letters, numbers and hyphens only.";
  }

  if (!isNonEmptyString(name)) {
    errors.name = "Building name is required.";
  }

  if (!isPositiveInteger(maxLevel)) {
    errors.maxLevel = "Maximum level must be a positive whole number.";
  }

  if (!isNonEmptyString(source)) {
    errors.source = "Source is required.";
  }

  if (
    isNonEmptyString(imageUrl) &&
    !isNonEmptyString(imageAltText)
  ) {
    errors.image_alt_text =
      "Alt text is required when a building image is supplied.";
  }

  const costsError = validateUpgradeCosts(costs);

  if (costsError) {
    errors.costs = costsError;
  }

  if (
    Array.isArray(costs) &&
    isPositiveInteger(maxLevel)
  ) {
    const levels = costs
      .filter(
        (row): row is RecordEditorValue[] =>
          Array.isArray(row),
      )
      .map((row) => row[0])
      .filter(
        (level): level is number =>
          typeof level === "number" &&
          Number.isFinite(level),
      );

    const highestLevel =
      levels.length > 0
        ? Math.max(...levels)
        : 0;

    if (highestLevel > maxLevel) {
      errors.costs =
        `Upgrade level ${highestLevel} exceeds the maximum building level of ${maxLevel}.`;
    }
  }

  return errors;
}

export const buildingsRecordEditorSchema:
RecordEditorSchema = {
  datasetId: "buildings",
  singularLabel: "Building",
  pluralLabel: "Buildings",
  idField: "key",
  titleField: "name",
  allowCreate: false,
  allowDuplicate: false,
  allowDelete: false,

  sections: [
    {
      id: "identity",
      title: "Building details",
      description: "Core identifying information for this building.",
      order: 10,
    },
    {
      id: "media",
      title: "Building image",
      description: "Upload the public companion image and record its accessibility and provenance details.",
      order: 20,
    },
    {
      id: "source",
      title: "Source and notes",
      description: "Source attribution and verification notes for the building data.",
      order: 30,
    },
    {
      id: "upgrade-costs",
      title: "Upgrade costs",
      description: "Per-level resource requirements and build times.",
      order: 40,
    },
    {
      id: "published-progression",
      title: "Published progression",
      description: "Published progression remains read-only here. Save changes through an editorial draft.",
      order: 50,
    },
  ],

  fields: [
    {
      key: "key",
      label: "Building key",
      type: "text",
      section: "identity",
      order: 10,
      required: true,
      readOnly: true,
      description: "Stable internal identifier used by the dataset.",
      validation: {
        required: true,
        minLength: 2,
        maxLength: 80,
        pattern: /^[a-z0-9-]+$/,
        message: "Use lowercase letters, numbers and hyphens only.",
      },
    },
    {
      key: "name",
      label: "Building name",
      type: "text",
      section: "identity",
      order: 20,
      required: true,
      placeholder: "Town Center",
      validation: {
        required: true,
        minLength: 2,
        maxLength: 120,
      },
    },
    {
      key: "maxLevel",
      label: "Maximum level",
      type: "number",
      section: "identity",
      order: 30,
      required: true,
      validation: {
        required: true,
        min: 1,
        max: 100,
        integer: true,
      },
    },
    {
      key: "image_url",
      label: "Building image",
      type: "url",
      section: "media",
      order: 10,
      description: "Upload or replace the image shown on the public Buildings directory and detail page.",
      validation: {
        maxLength: 1000,
      },
    },
    {
      key: "image_alt_text",
      label: "Image alt text",
      type: "text",
      section: "media",
      order: 20,
      description: "Describe the useful visual content for players using a screen reader. Do not begin with ‘image of’. Required when an image is supplied.",
      placeholder: "Town Center building at night with its central tower and banners",
      validation: {
        maxLength: 220,
      },
    },
    {
      key: "image_credit",
      label: "Image credit",
      type: "text",
      section: "media",
      order: 30,
      description: "Name the creator, owner or source organisation when attribution is required.",
      validation: {
        maxLength: 200,
      },
    },
    {
      key: "image_source_url",
      label: "Image source URL",
      type: "url",
      section: "media",
      order: 40,
      description: "Optional evidence URL for the original image or permission record.",
      validation: {
        maxLength: 1000,
      },
    },
    {
      key: "image_license",
      label: "Image licence or permission",
      type: "text",
      section: "media",
      order: 50,
      description: "Examples: Original Forge asset, owner supplied, used with permission, or the applicable licence.",
      placeholder: "Owner supplied for Kingshot Forge",
      validation: {
        maxLength: 200,
      },
    },
    {
      key: "source",
      label: "Data source",
      type: "url",
      section: "source",
      order: 10,
      required: true,
      placeholder: "https://kingshot.net/database/buildings/...",
      validation: {
        required: true,
        maxLength: 500,
      },
    },
    {
      key: "note",
      label: "Verification note",
      type: "textarea",
      section: "source",
      order: 20,
      placeholder: "Add sourcing or estimation notes...",
      validation: {
        maxLength: 2000,
      },
    },
    {
      key: "costs",
      label: "Upgrade-cost records",
      type: "building-costs",
      section: "upgrade-costs",
      order: 10,
      required: true,
      description: "Each row contains level, food, wood, stone, iron, gold and time in seconds.",
      validation: {
        required: true,
        validate: validateUpgradeCosts,
      },
    },
    {
      key: "progression",
      label: "Associated progression records",
      type: "readonly",
      section: "published-progression",
      order: 10,
      readOnly: true,
      formatValue: (value) => JSON.stringify(value, null, 2),
    },
  ],

  validateRecord: validateBuildingsRecord,
};
