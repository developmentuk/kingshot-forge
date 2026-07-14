import { Link } from "react-router-dom";
import {
  adminDatasets,
  type AdminDatasetStatus,
} from "./adminDatasets";
import { getDatasetStats } from "./adminDatasetStats";

function getStatusLabel(status: AdminDatasetStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "warning":
      return "Warning";
    case "error":
      return "Error";
    case "not-imported":
      return "Not imported";
  }
}

function getStatusClassName(status: AdminDatasetStatus): string {
  return `admin-dataset-status admin-dataset-status--${status}`;
}

export function AdminDashboardPage() {
  const readyCount = adminDatasets.filter(
    (dataset) => dataset.status === "ready",
  ).length;

  const pendingCount = adminDatasets.filter(
    (dataset) => dataset.status === "not-imported",
  ).length;

  return (
    <main className="admin-page">
      <section className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Data Engine Admin</p>

          <h1>Dataset Management</h1>

          <p className="admin-page__intro">
            Review dataset availability, open individual datasets and monitor
            their current import status.
          </p>
        </div>

        <div className="admin-summary">
          <article className="admin-summary__card">
            <span className="admin-summary__value">
              {adminDatasets.length}
            </span>

            <span className="admin-summary__label">
              Total datasets
            </span>
          </article>

          <article className="admin-summary__card">
            <span className="admin-summary__value">
              {readyCount}
            </span>

            <span className="admin-summary__label">
              Ready
            </span>
          </article>

          <article className="admin-summary__card">
            <span className="admin-summary__value">
              {pendingCount}
            </span>

            <span className="admin-summary__label">
              Awaiting import
            </span>
          </article>
        </div>
      </section>

      <section className="admin-dataset-grid">
        {adminDatasets.map((dataset) => (
          <article
            key={dataset.id}
            className="admin-dataset-card"
          >
            <div className="admin-dataset-card__top">
              <div>
                <p className="admin-dataset-card__id">
                  {dataset.id}
                </p>

                <h2>{dataset.name}</h2>
              </div>

              <span className={getStatusClassName(dataset.status)}>
                {getStatusLabel(dataset.status)}
              </span>
            </div>

            <p className="admin-dataset-card__description">
              {dataset.description}
            </p>

            <dl className="admin-dataset-card__meta">
              <div>
                <dt>Records</dt>
                <dd>{getDatasetStats(dataset.id).records}</dd>
              </div>

              <div>
                <dt>Last imported</dt>
                <dd>{getDatasetStats(dataset.id).lastImported}</dd>
              </div>
            </dl>

            <Link
              to={dataset.route}
              className="admin-dataset-card__link"
            >
              Open dataset
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
