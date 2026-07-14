import type {
  DatasetTableColumn,
  DatasetTableRow,
} from "./datasetBrowserTypes";

interface DatasetRecordPanelProps {
  columns: DatasetTableColumn[];
  row: DatasetTableRow;
  onClose: () => void;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

export function DatasetRecordPanel({
  columns,
  row,
  onClose,
}: DatasetRecordPanelProps) {
  return (
    <section
      className="dataset-record-panel"
      aria-label="Dataset record details"
    >
      <div className="dataset-record-panel__header">
        <div>
          <p className="dataset-record-panel__eyebrow">
            Record details
          </p>

          <h2>{formatValue(row.values.name ?? row.id)}</h2>
        </div>

        <button
          type="button"
          className="dataset-record-panel__close"
          onClick={onClose}
          aria-label="Close record details"
        >
          ×
        </button>
      </div>

      <dl className="dataset-record-panel__fields">
        <div>
          <dt>Record ID</dt>
          <dd>{row.id}</dd>
        </div>

        {columns.map((column) => (
          <div key={column.key}>
            <dt>{column.label}</dt>
            <dd>{formatValue(row.values[column.key])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}