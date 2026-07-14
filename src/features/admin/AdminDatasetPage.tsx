import { Link, useParams } from "react-router-dom";
import { getAdminDataset } from "./adminDatasets";

export function AdminDatasetPage() {
  const { datasetId } = useParams<{ datasetId: string }>();

  const dataset = datasetId
    ? getAdminDataset(datasetId)
    : undefined;

  if (!dataset) {
    return (
      <main className="admin-page">
        <section className="admin-empty-state">
          <p className="admin-page__eyebrow">Data Engine Admin</p>

          <h1>Dataset not found</h1>

          <p>
            The requested dataset is not registered in the admin dataset list.
          </p>

          <Link
            to="/admin"
            className="admin-empty-state__link"
          >
            Return to datasets
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-page__header">
        <div>
          <Link
            to="/admin"
            className="admin-page__back-link"
          >
            ← All datasets
          </Link>

          <p className="admin-page__eyebrow">
            Data Engine Admin
          </p>

          <h1>{dataset.name}</h1>

          <p className="admin-page__intro">
            {dataset.description}
          </p>
        </div>
      </section>

      <section className="admin-placeholder-panel">
        <div className="admin-placeholder-panel__header">
          <div>
            <p className="admin-placeholder-panel__label">
              Dataset ID
            </p>

            <p className="admin-placeholder-panel__value">
              {dataset.id}
            </p>
          </div>

          <span
            className={`admin-dataset-status admin-dataset-status--${dataset.status}`}
          >
            {dataset.status === "not-imported"
              ? "Not imported"
              : dataset.status}
          </span>
        </div>

        <div className="admin-placeholder-panel__body">
          <h2>Dataset browser coming in Phase B</h2>

          <p>
            Search, filtering, pagination and record management will be added
            after the admin routing and dashboard foundation are complete.
          </p>
        </div>
      </section>
    </main>
  );
}