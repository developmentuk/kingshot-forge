import type {
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValue,
} from "./recordEditorSchema";

function isNonEmptyString(
  value: RecordEditorValue,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length > 0
  );
}

function isPositiveInteger(
  value: RecordEditorValue,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isInteger(
      value,
    ) &&
    value > 0
  );
}

function validateUpgradeCosts(
  value: RecordEditorValue,
): string | null {
  if (
    !Array.isArray(value)
  ) {
    return "Upgrade costs must be an array.";
  }

  if (
    value.length === 0
  ) {
    return "At least one upgrade-cost row is required.";
  }

  const seenLevels =
    new Set<number>();

  for (
    let rowIndex = 0;
    rowIndex <
    value.length;
    rowIndex += 1
  ) {
    const row =
      value[rowIndex];

    if (
      !Array.isArray(row) ||
      row.length !== 7
    ) {
      return `Upgrade-cost row ${
        rowIndex + 1
      } must contain exactly seven values.`;
    }

    const hasInvalidCell =
      row.some(
        (cell) =>
          typeof cell !==
            "number" ||
          !Number.isFinite(
            cell,
          ) ||
          cell < 0,
      );

    if (hasInvalidCell) {
      return `Upgrade-cost row ${
        rowIndex + 1
      } must contain seven non-negative numbers.`;
    }

    const level =
      row[0];

    if (
      typeof level !==
        "number" ||
      !Number.isInteger(
        level,
      ) ||
      level < 1
    ) {
      return `Upgrade-cost row ${
        rowIndex + 1
      } must use a positive whole-number level.`;
    }

    if (
      seenLevels.has(level)
    ) {
      return `Upgrade level ${level} appears more than once.`;
    }

    seenLevels.add(level);
  }

  return null;
}

function validateBuildingsRecord(
  record:
    RecordEditorRecord,
): Record<string, string> {
  const errors: Record<
    string,
    string
  > = {};

  const key =
    record.values.key;

  const name =
    record.values.name;

  const maxLevel =
    record.values.maxLevel;

  const source =
    record.values.source;

  const costs =
    record.values.costs;

  if (
    !isNonEmptyString(key)
  ) {
    errors.key =
      "Building key is required.";
  } else if (
    !/^[a-z0-9-]+$/.test(
      key,
    )
  ) {
    errors.key =
      "Use lowercase letters, numbers and hyphens only.";
  }

  if (
    !isNonEmptyString(name)
  ) {
    errors.name =
      "Building name is required.";
  }

  if (
    !isPositiveInteger(
      maxLevel,
    )
  ) {
    errors.maxLevel =
      "Maximum level must be a positive whole number.";
  }

  if (
    !isNonEmptyString(
      source,
    )
  ) {
    errors.source =
      "Source is required.";
  }

  const costsError =
    validateUpgradeCosts(
      costs,
    );

  if (costsError) {
    errors.costs =
      costsError;
  }

  if (
    Array.isArray(costs) &&
    isPositiveInteger(
      maxLevel,
    )
  ) {
    const levels =
      costs
        .filter(
          (
            row,
          ): row is RecordEditorValue[] =>
            Array.isArray(
              row,
            ),
        )
        .map(
          (row) =>
            row[0],
        )
        .filter(
          (
            level,
          ): level is number =>
            typeof level ===
              "number" &&
            Number.isFinite(
              level,
            ),
        );

    const highestLevel =
      levels.length > 0
        ? Math.max(
            ...levels,
          )
        : 0;

    if (
      highestLevel >
      maxLevel
    ) {
      errors.costs =
        `Upgrade level ${highestLevel} exceeds the maximum building level of ${maxLevel}.`;
    }
  }

  return errors;
}

export const buildingsRecordEditorSchema:
  RecordEditorSchema = {
    datasetId:
      "buildings",

    singularLabel:
      "Building",

    pluralLabel:
      "Buildings",

    idField:
      "key",

    titleField:
      "name",

    allowCreate:
      false,

    allowDuplicate:
      false,

    allowDelete:
      false,

    sections: [
      {
        id:
          "identity",

        title:
          "Building details",

        description:
          "Core identifying information for this building.",

        order:
          10,
      },

      {
        id:
          "source",

        title:
          "Source and notes",

        description:
          "Source attribution and verification notes.",

        order:
          20,
      },

      {
        id:
          "upgrade-costs",

        title:
          "Upgrade costs",

        description:
          "Per-level resource requirements and build times.",

        order:
          30,
      },
    ],

    fields: [
      {
        key:
          "key",

        label:
          "Building key",

        type:
          "text",

        section:
          "identity",

        order:
          10,

        required:
          true,

        readOnly:
          true,

        description:
          "Stable internal identifier used by the dataset.",

        validation: {
          required:
            true,

          minLength:
            2,

          maxLength:
            80,

          pattern:
            /^[a-z0-9-]+$/,

          message:
            "Use lowercase letters, numbers and hyphens only.",
        },
      },

      {
        key:
          "name",

        label:
          "Building name",

        type:
          "text",

        section:
          "identity",

        order:
          20,

        required:
          true,

        placeholder:
          "Town Center",

        validation: {
          required:
            true,

          minLength:
            2,

          maxLength:
            120,
        },
      },

      {
        key:
          "maxLevel",

        label:
          "Maximum level",

        type:
          "number",

        section:
          "identity",

        order:
          30,

        required:
          true,

        validation: {
          required:
            true,

          min:
            1,

          max:
            100,

          integer:
            true,
        },
      },

      {
        key:
          "source",

        label:
          "Source",

        type:
          "url",

        section:
          "source",

        order:
          10,

        required:
          true,

        placeholder:
          "https://kingshot.net/database/buildings/...",

        validation: {
          required:
            true,

          maxLength:
            500,
        },
      },

      {
        key:
          "note",

        label:
          "Verification note",

        type:
          "textarea",

        section:
          "source",

        order:
          20,

        placeholder:
          "Add sourcing or estimation notes...",

        validation: {
          maxLength:
            2000,
        },
      },

      {
        key:
          "costs",

        label:
          "Upgrade-cost records",

        type:
          "building-costs",

        section:
          "upgrade-costs",

        order:
          10,

        required:
          true,

        description:
          "Each row contains level, food, wood, stone, iron, gold and time in seconds.",

        validation: {
          required:
            true,

          validate:
            validateUpgradeCosts,
        },
      },
    ],

    validateRecord:
      validateBuildingsRecord,
  };