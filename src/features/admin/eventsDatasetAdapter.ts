import type {
  DatasetLoadResult,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
} from "./datasetBrowserTypes";

import {
  createRowsFromRecords,
  createSlugId,
  toCellValue,
  type DatasetAdapter,
} from "./datasetAdapters";

function formatInterval(
  value: unknown,
): string | number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  if (value < 24) {
    return `${value} hours`;
  }

  if (value === 24) {
    return "Daily";
  }

  if (value % 24 === 0) {
    const days = value / 24;

    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  return `${value} hours`;
}

export const eventsDatasetAdapter: DatasetAdapter = {
  datasetId: "events",

  createBrowserDefinition(
    result: DatasetLoadResult,
  ): DatasetBrowserDefinition {
    const rows = createRowsFromRecords(
      result.records,
      (event, index) => {
        const name =
          typeof event.name === "string"
            ? event.name
            : `Event ${index + 1}`;

        const slug =
          typeof event.slug === "string"
            ? event.slug
            : createSlugId(
                name,
                `event-${index + 1}`,
              );

        return {
          id: slug,
          values: {
            name,
            schedule: toCellValue(
              event.schedule,
            ),
            interval: formatInterval(
              event.recur_every_hours,
            ),
            intervalHours: toCellValue(
              event.recur_every_hours,
            ),
            active: toCellValue(
              event.is_active,
            ),
            sourceUpdated: toCellValue(
              event.source_updated_at,
            ),
          },
        };
      },
    );

    return {
      datasetId: "events",
      columns: [
        {
          key: "name",
          label: "Event",
          sortable: true,
          width: "220px",
        },
        {
          key: "schedule",
          label: "Schedule",
          sortable: true,
          width: "220px",
        },
        {
          key: "interval",
          label: "Recurrence",
          sortable: true,
          width: "130px",
        },
        {
          key: "intervalHours",
          label: "Hours",
          sortable: true,
          width: "90px",
        },
        {
          key: "active",
          label: "Active",
          sortable: true,
          width: "90px",
        },
        {
          key: "sourceUpdated",
          label: "Source updated",
          sortable: true,
          width: "140px",
        },
      ],
      rows,
    };
  },
};