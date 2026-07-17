import {
  Link,
} from "react-router-dom";

import type {
  VerificationCapability,
} from "../../../../shared/platform/verification";

import {
  getVerificationSnapshot,
} from "./verificationCentreData";
import {
  formatVerificationDate,
  getCapabilityStatus,
} from "./verificationFormatting";
import {
  VerificationStatusBadge,
} from "./VerificationStatusBadge";

const tableCapabilities: readonly {
  capability: VerificationCapability;
  label: string;
}[] = [
  { capability: "browser", label: "Browse" },
  { capability: "editor", label: "Edit" },
  { capability: "workflow", label: "Workflow" },
  { capability: "publishing", label: "Publication" },
  { capability: "projection", label: "Projection" },
  { capability: "rls", label: "RLS" },
  { capability: "validation", label: "Validation" },
];

export function VerificationCentrePage() {
  const snapshot = getVerificationSnapshot();
  const { readinessCounts, resultCounts } = snapshot;

  return (
    <main className="admin-page verification-centre">
      <section className="admin-page__header verification-centre__header">
        <div>
          <p className="admin-page__eyebrow">Forge Admin CMS</p>
          <h1>Verification Centre</h1>
          <p className="admin-page__intro">
            Evidence-backed dataset readiness. Blocked, stale and untested checks remain visible and cannot be counted as Ready.
          </p>
        </div>

        <Link
          className="button button--secondary"
          to={`/admin/verification/runs/${snapshot.run.id}`}
        >
          View verification run
        </Link>
      </section>

      <section
        className="verification-environment"
        aria-labelledby="verification-environment-title"
      >
        <div>
          <p className="admin-page__eyebrow">Verification environment</p>
          <h2 id="verification-environment-title">
            {snapshot.environment.label}
          </h2>
          <p>{snapshot.environment.description}</p>
        </div>
        <dl>
          <div>
            <dt>Database access</dt>
            <dd>{snapshot.environment.databaseAccess}</dd>
          </div>
          <div>
            <dt>Classification</dt>
            <dd>{snapshot.environment.databaseClassification}</dd>
          </div>
          <div>
            <dt>Last run</dt>
            <dd>{formatVerificationDate(snapshot.run.completedAt)}</dd>
          </div>
        </dl>
      </section>

      <section
        className="verification-summary"
        aria-label="Verification readiness summary"
      >
        <article><span>Total datasets</span><strong>{snapshot.datasets.length}</strong></article>
        <article><span>Ready</span><strong>{readinessCounts.ready}</strong></article>
        <article><span>Partial</span><strong>{readinessCounts.partial}</strong></article>
        <article><span>Blocked</span><strong>{readinessCounts.blocked}</strong></article>
        <article><span>Unsupported</span><strong>{readinessCounts.unsupported}</strong></article>
        <article><span>Failed checks</span><strong>{resultCounts.failed}</strong></article>
        <article><span>Stale checks</span><strong>{resultCounts.stale}</strong></article>
      </section>

      {(resultCounts.failed > 0 || resultCounts.blocked > 0) && (
        <section className="verification-alert" role="status">
          <div>
            <h2>Readiness blockers remain</h2>
            <p>
              {resultCounts.failed} failed and {resultCounts.blocked} blocked checks are recorded. Publication remains non-ready until controlled database evidence passes.
            </p>
          </div>
          <Link to={`/admin/verification/runs/${snapshot.run.id}`}>
            Review evidence
          </Link>
        </section>
      )}

      <section className="verification-panel">
        <div className="verification-panel__heading">
          <div>
            <p className="admin-page__eyebrow">Dataset verification</p>
            <h2>Capability evidence by dataset</h2>
          </div>
          <p>
            Aggregate states are calculated from the latest evidence for required checks.
          </p>
        </div>

        <div
          className="verification-table-scroll"
          role="region"
          aria-label="Dataset verification table"
          tabIndex={0}
        >
          <table className="verification-table">
            <caption className="forge-sr-only">
              Verification readiness for all registered Forge datasets
            </caption>
            <thead>
              <tr>
                <th scope="col">Dataset</th>
                {tableCapabilities.map(({ label }) => (
                  <th scope="col" key={label}>{label}</th>
                ))}
                <th scope="col">Overall</th>
                <th scope="col">Blockers</th>
                <th scope="col">Last verified</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.datasets.map((dataset) => (
                <tr key={dataset.datasetId}>
                  <th scope="row">
                    <strong>{dataset.datasetName}</strong>
                    <small>{dataset.datasetId}</small>
                  </th>
                  {tableCapabilities.map(({ capability }) => (
                    <td key={capability}>
                      <VerificationStatusBadge
                        state={getCapabilityStatus(dataset, capability)}
                      />
                    </td>
                  ))}
                  <td><VerificationStatusBadge state={dataset.status} /></td>
                  <td>{dataset.blockers.length}</td>
                  <td>{formatVerificationDate(dataset.lastVerifiedAt)}</td>
                  <td>
                    <Link to={`/admin/verification/${dataset.datasetId}`}>
                      View evidence
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
