import {
  Link,
} from "react-router-dom";

import type {
  ReadinessCapability,
  ReadinessStatus,
} from "../../../shared/platform/readiness";

import {
  adminDatasets,
  type AdminDatasetDefinition,
} from "./adminDatasets";

function getReadinessStatus(
  dataset: AdminDatasetDefinition,
  capability: ReadinessCapability,
): ReadinessStatus {
  return dataset.readiness.capabilities.find(
    (candidate) =>
      candidate.capability === capability,
  )?.status ?? "not-audited";
}

function formatReadinessStatus(
  status: ReadinessStatus,
): string {
  switch (status) {
    case "implemented":
      return "Implemented";
    case "partial":
      return "Partial";
    case "missing":
      return "Not implemented";
    case "not-applicable":
      return "Not applicable";
    case "not-audited":
      return "Not audited";
  }
}

export function AdminDatasetsPage() {
  const browserReadyCount =
    adminDatasets.filter(
      (dataset) =>
        dataset.capabilities.browsing,
    ).length;

  const editorReadyCount =
    adminDatasets.filter(
      (dataset) =>
        dataset.capabilities.editing,
    ).length;

  const notAuditedCount =
    adminDatasets.reduce(
      (total, dataset) =>
        total +
        dataset.readinessScore.notAudited,
      0,
    );

  return (
    <main className="admin-page">
      <section className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">
            Forge Admin CMS
          </p>

          <h1>Datasets</h1>

          <p className="admin-page__intro">
            Review the evidence-backed readiness of every registered dataset, browse live records and open the Record Editor only where its integration is complete.
          </p>
        </div>

        <div className="admin-summary">
          <article className="admin-summary__card">
            <span className="admin-summary__value">
              {adminDatasets.length}
            </span>
            <span className="admin-summary__label">
              Registered datasets
            </span>
          </article>

          <article className="admin-summary__card">
            <span className="admin-summary__value">
              {browserReadyCount}
            </span>
            <span className="admin-summary__label">
              Browsers implemented
            </span>
          </article>

          <article className="admin-summary__card">
            <span className="admin-summary__value">
              {editorReadyCount}
            </span>
            <span className="admin-summary__label">
              Editors implemented
            </span>
          </article>

          <article className="admin-summary__card">
            <span className="admin-summary__value">
              {notAuditedCount}
            </span>
            <span className="admin-summary__label">
              Capabilities not audited
            </span>
          </article>
        </div>
      </section>

      <section className="admin-dataset-grid">
        {adminDatasets.map((dataset) => {
          const browserStatus =
            getReadinessStatus(
              dataset,
              "browser",
            );
          const editorStatus =
            getReadinessStatus(
              dataset,
              "editor",
            );
          const publishingStatus =
            getReadinessStatus(
              dataset,
              "publishing",
            );
          const auditedCount =
            dataset.readiness.capabilities.length -
            dataset.readinessScore.notAudited;

          return (
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
                  className={`admin-dataset-readiness admin-dataset-readiness--${
                    dataset.capabilities.editing
                      ? "implemented"
                      : "browse-only"
                  }`}
                >
                  {dataset.id === "items"
                    ? "Partial — browser only"
                    : dataset.capabilities.editing
                      ? "Editor implemented"
                      : dataset.capabilities.browsing
                        ? "Browse only"
                        : "Browser unavailable"}
                </span>
              </div>

              <p className="admin-dataset-card__description">
                {dataset.description}
              </p>

              <dl className="admin-dataset-card__readiness">
                <div>
                  <dt>Browser</dt>
                  <dd className={`admin-readiness-value admin-readiness-value--${browserStatus}`}>
                    {formatReadinessStatus(browserStatus)}
                  </dd>
                </div>
                <div>
                  <dt>Editor</dt>
                  <dd className={`admin-readiness-value admin-readiness-value--${editorStatus}`}>
                    {formatReadinessStatus(editorStatus)}
                  </dd>
                </div>
                <div>
                  <dt>Publishing</dt>
                  <dd className={`admin-readiness-value admin-readiness-value--${publishingStatus}`}>
                    {formatReadinessStatus(publishingStatus)}
                  </dd>
                </div>
                <div>
                  <dt>Capabilities audited</dt>
                  <dd>
                    {auditedCount} / {dataset.readiness.capabilities.length}
                  </dd>
                </div>
              </dl>

              <p className="admin-dataset-card__source">
                {dataset.sourceDescription}
              </p>

              <Link
                to={dataset.route}
                className="admin-dataset-card__link"
              >
                {dataset.id === "items"
                  ? "Browse dataset"
                  : dataset.capabilities.editing
                    ? "Manage dataset"
                    : dataset.capabilities.browsing
                      ? "Browse dataset"
                      : "View readiness"}
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
