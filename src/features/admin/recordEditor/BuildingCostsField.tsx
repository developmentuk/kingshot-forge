import type {
  ChangeEvent,
} from "react";

import type {
  RecordEditorValue,
} from "./recordEditorSchema.js";

type BuildingCostRow = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

interface BuildingCostsFieldProps {
  id: string;
  value: RecordEditorValue;
  disabled?: boolean;
  error?: string;
  describedBy?: string;

  onChange: (
    value: RecordEditorValue,
  ) => void;
}

const COST_COLUMN_LABELS = [
  "Level",
  "Food",
  "Wood",
  "Stone",
  "Iron",
  "Gold",
  "Time (seconds)",
] as const;

function isFiniteNonNegativeNumber(
  value: RecordEditorValue,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isBuildingCostRow(
  value: RecordEditorValue,
): value is BuildingCostRow {
  return (
    Array.isArray(value) &&
    value.length === 7 &&
    value.every(
      isFiniteNonNegativeNumber,
    )
  );
}

function normaliseRows(
  value: RecordEditorValue,
): BuildingCostRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isBuildingCostRow)
    .map((row) => [...row]);
}

function createEmptyRow(
  level: number,
): BuildingCostRow {
  return [
    level,
    0,
    0,
    0,
    0,
    0,
    0,
  ];
}

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-GB",
  ).format(value);
}

function formatDuration(
  totalSeconds: number,
): string {
  if (
    !Number.isFinite(totalSeconds) ||
    totalSeconds <= 0
  ) {
    return "No build time";
  }

  const days = Math.floor(
    totalSeconds / 86400,
  );

  const hours = Math.floor(
    (totalSeconds % 86400) /
      3600,
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) /
      60,
  );

  const parts: string[] = [];

  if (days > 0) {
    parts.push(
      `${days}d`,
    );
  }

  if (hours > 0) {
    parts.push(
      `${hours}h`,
    );
  }

  if (
    minutes > 0 &&
    days === 0
  ) {
    parts.push(
      `${minutes}m`,
    );
  }

  return (
    parts.join(" ") ||
    `${totalSeconds}s`
  );
}

export function BuildingCostsField({
  id,
  value,
  disabled = false,
  error,
  describedBy,
  onChange,
}: BuildingCostsFieldProps) {
  const rows =
    normaliseRows(value);

  function updateCell(
    rowIndex: number,
    cellIndex: number,
    rawValue: string,
  ) {
    const numericValue =
      rawValue.trim() === ""
        ? 0
        : Number(rawValue);

    const nextRows =
      rows.map((row) => [
        ...row,
      ] as BuildingCostRow);

    nextRows[rowIndex][
      cellIndex
    ] =
      Number.isFinite(
        numericValue,
      ) && numericValue >= 0
        ? numericValue
        : 0;

    onChange(nextRows);
  }

  function handleCellChange(
    rowIndex: number,
    cellIndex: number,
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    updateCell(
      rowIndex,
      cellIndex,
      event.target.value,
    );
  }

  function addRow() {
    const lastLevel =
      rows.at(-1)?.[0] ?? 0;

    onChange([
      ...rows,
      createEmptyRow(
        lastLevel + 1,
      ),
    ]);
  }

  function duplicateRow(
    rowIndex: number,
  ) {
    const sourceRow =
      rows[rowIndex];

    if (!sourceRow) {
      return;
    }

    const nextRows =
      rows.map((row) => [
        ...row,
      ] as BuildingCostRow);

    const duplicatedRow: BuildingCostRow =
      [
        sourceRow[0] + 1,
        sourceRow[1],
        sourceRow[2],
        sourceRow[3],
        sourceRow[4],
        sourceRow[5],
        sourceRow[6],
      ];

    nextRows.splice(
      rowIndex + 1,
      0,
      duplicatedRow,
    );

    onChange(nextRows);
  }

  function removeRow(
    rowIndex: number,
  ) {
    const confirmed =
      window.confirm(
        `Remove upgrade-cost row ${
          rowIndex + 1
        }?`,
      );

    if (!confirmed) {
      return;
    }

    onChange(
      rows.filter(
        (_, index) =>
          index !== rowIndex,
      ),
    );
  }

  return (
    <div
      id={id}
      className={[
        "building-costs-editor",
        error
          ? "building-costs-editor--error"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-invalid={
        error ? true : undefined
      }
      aria-describedby={
        describedBy || undefined
      }
    >
      <div className="building-costs-editor__toolbar">
        <div>
          <strong>
            {rows.length}{" "}
            {rows.length === 1
              ? "upgrade row"
              : "upgrade rows"}
          </strong>

          <span>
            Resource costs and
            build time for each
            level.
          </span>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={addRow}
        >
          Add level
        </button>
      </div>

      {rows.length > 0 ? (
        <div className="building-costs-editor__scroll">
          <table className="building-costs-editor__table">
            <thead>
              <tr>
                {COST_COLUMN_LABELS.map(
                  (label) => (
                    <th key={label}>
                      {label}
                    </th>
                  ),
                )}

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (
                  row,
                  rowIndex,
                ) => (
                  <tr
                    key={`${row[0]}-${rowIndex}`}
                  >
                    {row.map(
                      (
                        cell,
                        cellIndex,
                      ) => (
                        <td
                          key={
                            cellIndex
                          }
                        >
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={cell}
                            disabled={
                              disabled
                            }
                            aria-label={`${COST_COLUMN_LABELS[cellIndex]} for upgrade row ${
                              rowIndex +
                              1
                            }`}
                            onChange={(
                              event,
                            ) =>
                              handleCellChange(
                                rowIndex,
                                cellIndex,
                                event,
                              )
                            }
                          />

                          {cellIndex >
                            0 && (
                            <small>
                              {cellIndex ===
                              6
                                ? formatDuration(
                                    cell,
                                  )
                                : formatNumber(
                                    cell,
                                  )}
                            </small>
                          )}
                        </td>
                      ),
                    )}

                    <td>
                      <div className="building-costs-editor__actions">
                        <button
                          type="button"
                          disabled={
                            disabled
                          }
                          onClick={() =>
                            duplicateRow(
                              rowIndex,
                            )
                          }
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          disabled={
                            disabled ||
                            rows.length <=
                              1
                          }
                          onClick={() =>
                            removeRow(
                              rowIndex,
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="building-costs-editor__empty">
          <strong>
            No upgrade-cost rows
          </strong>

          <p>
            Add the first level to
            begin entering resource
            requirements.
          </p>

          <button
            type="button"
            disabled={disabled}
            onClick={addRow}
          >
            Add first level
          </button>
        </div>
      )}
    </div>
  );
}