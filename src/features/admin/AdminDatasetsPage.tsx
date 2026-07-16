import { Link } from "react-router-dom";
import {
  adminDatasets,
  type AdminDatasetStatus,
} from "./adminDatasets";

function getStatusLabel(
  status: AdminDatasetStatus,
): string {
  switch (status) {
    case "editor-ready":
      return "Editor ready";

    case "browse-only":
      return "Browse only";

    case "registered":
      return "Registered";
  }
}

function getStatusClassName(
  status: AdminDatasetStatus,
): string {
  return (
    `admin-dataset-status ` +
    `admin-dataset-status--${status}`
  );
}

export function AdminDatasetsPage() {
  const editorReadyCount = adminDatasets.filter(
    (dataset) => dataset.status === "editor-ready",
  ).length;

  const browseOnlyCount = adminDatasets.filter(
    (dataset) =>
      dataset.status === "browse-only",
  ).length;

  return (
    <main className="admin-page">
      <section className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">
            Forge Admin CMS
          </p>

          <h1>Datasets</h1>

          <p className="admin-page__intro">
            Every registered dataset has a truthful Admin
            experience. Browse live records where supported,
            and see clearly when editing is not yet available.
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
              {editorReadyCount}
            </span>

            <span className="admin-summary__label">
              Editor ready
            </span>
          </article>

          <article className="admin-summary__card">
            <span className="admin-summary__value">
              {browseOnlyCount}
            </span>

            <span className="admin-summary__label">
              Browse only
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

                <span
                  className={getStatusClassName(
                    dataset.status,
                  )}
                >
                  {getStatusLabel(dataset.status)}
                </span>
              </div>

              <p className="admin-dataset-card__description">
                {dataset.description}
              </p>

              <p className="admin-dataset-card__status-description">
                {dataset.statusDescription}
              </p>

              <ul
                className="admin-dataset-capabilities"
                aria-label={`${dataset.name} capabilities`}
              >
                {dataset.capabilities.browsing ? (
                  <li>Browser</li>
                ) : (
                  <li className="admin-dataset-capabilities__unavailable">
                    No browser
                  </li>
                )}
                {dataset.capabilities.search && (
                  <li>Search</li>
                )}
                {dataset.capabilities.editing ? (
                  <li>Record Editor</li>
                ) : (
                  <li className="admin-dataset-capabilities__unavailable">
                    No Record Editor
                  </li>
                )}
                {dataset.capabilities.creation && (
                  <li>Create records</li>
                )}
                {dataset.capabilities.publishing ? (
                  <li>Live publishing</li>
                ) : dataset.capabilities.editing ? (
                  <li className="admin-dataset-capabilities__unavailable">
                    No live publishing
                  </li>
                ) : null}
              </ul>

              <p className="admin-dataset-card__source">
                {dataset.sourceDescription}
              </p>

              <Link
                to={dataset.route}
                className="admin-dataset-card__link"
              >
                {dataset.actionLabel}
              </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
