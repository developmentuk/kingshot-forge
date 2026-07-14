import { useMemo, useState } from "react";
import type {
  DatasetCellValue,
  DatasetTableColumn,
  DatasetTableRow,
} from "./datasetBrowserTypes";
import { TierBadge } from "./TierBadge";

type SortDirection = "ascending" | "descending";

interface SortState {
  key: string;
  direction: SortDirection;
}

interface DatasetTableProps {
  columns: DatasetTableColumn[];
  rows: DatasetTableRow[];
  searchPlaceholder?: string;
  pageSize?: number;
  onViewRow?: (row: DatasetTableRow) => void;
}

function formatCellValue(value: DatasetCellValue): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function compareValues(
  firstValue: DatasetCellValue,
  secondValue: DatasetCellValue,
): number {
  if (
    typeof firstValue === "number" &&
    typeof secondValue === "number"
  ) {
    return firstValue - secondValue;
  }

  return formatCellValue(firstValue).localeCompare(
    formatCellValue(secondValue),
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    },
  );
}

export function DatasetTable({
  columns,
  rows,
  searchPlaceholder = "Search records...",
  pageSize = 10,
  onViewRow,
}: DatasetTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortState, setSortState] = useState<SortState | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);

const tierColumnKeys = new Set([
  "rally",
  "garrison",
  "bear",
  "joiner",
]);

function renderCellValue(
  columnKey: string,
  value: DatasetCellValue,
) {
  const formattedValue =
    formatCellValue(value);

  if (
    tierColumnKeys.has(columnKey) &&
    typeof value === "string"
  ) {
    return <TierBadge value={value} />;
  }

  return formattedValue;
}

  const processedRows = useMemo(() => {
    const normalisedSearchTerm = searchTerm
      .trim()
      .toLowerCase();

    const filteredRows = rows.filter((row) => {
      if (!normalisedSearchTerm) {
        return true;
      }

      return Object.values(row.values).some((value) =>
        formatCellValue(value)
          .toLowerCase()
          .includes(normalisedSearchTerm),
      );
    });

    if (!sortState) {
      return filteredRows;
    }

    return [...filteredRows].sort((firstRow, secondRow) => {
      const comparison = compareValues(
        firstRow.values[sortState.key],
        secondRow.values[sortState.key],
      );

      return sortState.direction === "ascending"
        ? comparison
        : comparison * -1;
    });
  }, [rows, searchTerm, sortState]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedRows.length / pageSize),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const visibleRows = processedRows.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  function handleSearchChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleSort(column: DatasetTableColumn) {
    if (!column.sortable) {
      return;
    }

    setSortState((currentSort) => {
      if (currentSort?.key !== column.key) {
        return {
          key: column.key,
          direction: "ascending",
        };
      }

      return {
        key: column.key,
        direction:
          currentSort.direction === "ascending"
            ? "descending"
            : "ascending",
      };
    });

    setCurrentPage(1);
  }

  return (
    <section className="dataset-table-panel">
      <div className="dataset-table-toolbar">
        <label className="dataset-table-search">
          <span>Search</span>

          <input
            type="search"
            value={searchTerm}
            placeholder={searchPlaceholder}
            onChange={handleSearchChange}
          />
        </label>

        <p className="dataset-table-count">
          {processedRows.length}{" "}
          {processedRows.length === 1 ? "record" : "records"}
        </p>
      </div>

      <div className="dataset-table-scroll">
        <table className="dataset-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const isActiveSort =
                  sortState?.key === column.key;

                return (
                  <th
                    key={column.key}
                    style={{
                      width: column.width,
                    }}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="dataset-table-sort"
                        onClick={() => handleSort(column)}
                      >
                        <span>{column.label}</span>

                        <span aria-hidden="true">
                          {isActiveSort
                            ? sortState.direction === "ascending"
                              ? "▲"
                              : "▼"
                            : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>
                     {renderCellValue(
  column.key,
  row.values[column.key],
)}
                    </td>
                  ))}

                  <td>
                    <div className="dataset-table-actions">
                      <button
  type="button"
  onClick={() => onViewRow?.(row)}
  disabled={!onViewRow}
>
  View
</button>
                      <button type="button" disabled>
                        Edit
                      </button>
                      <button type="button" disabled>
                        Duplicate
                      </button>
                      <button type="button" disabled>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="dataset-table-empty"
                >
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="dataset-table-pagination">
        <button
          type="button"
          disabled={safeCurrentPage === 1}
          onClick={() =>
            setCurrentPage((page) => Math.max(1, page - 1))
          }
        >
          Previous
        </button>

        <span>
          Page {safeCurrentPage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={safeCurrentPage === totalPages}
          onClick={() =>
            setCurrentPage((page) =>
              Math.min(totalPages, page + 1),
            )
          }
        >
          Next
        </button>
      </div>
    </section>
  );
}