import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getRegisteredDatasetCapabilities,
} from "../../../../shared/data-engine/dataset-capabilities";

import {
  getVerificationSnapshot,
} from "./verificationCentreData";
import {
  formatVerificationDate,
} from "./verificationFormatting";
import {
  VerificationStatusBadge,
} from "./VerificationStatusBadge";

const capabilityLabels: Readonly<Record<string, string>> = {
  browsing: "Browse",
  creation: "Create",
  editing: "Edit",
  importing: "Import",
  publishing: "Publish",
  search: "Search",
  validation: "Validate",
  versionHistory: "Version history",
  archive: "Archive",
  restore: "Restore",
  rollback: "Rollback",
};

function formatCapability(value: boolean): string {
  return value ? "Declared" : "Unsupported";
}

export function DatasetVerificationPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const snapshot = getVerificationSnapshot();
  const dataset = snapshot.datasets.find(
    (candidate) => candidate.datasetId === datasetId,
  );
  const declarations = datasetId
    ? getRegisteredDatasetCapabilities(datasetId)
    : undefined;

  if (!dataset || !declarations) {
    return (
      <main className="admin-page verification-centre">
        <section className="admin-empty-state">
          <p className="admin-page__eyebrow">Verification Centre</p>
          <h1>Dataset verification not found</h1>
          <p>
            The requested dataset has no registered verification definition and no fallback capability was created.
          </p>
          <Link
            className="admin-empty-state__link"
            to="/admin/verification"
          >
            Return to Verification Centre
          </Link>
        </section>
      </main>
    );
  }

  const migrationChecks = dataset.checks.filter(
    ({ capability }) => capability === "migration",
  );
  const staleChecks = dataset.checks.filter(
    ({ result }) => result === "stale",
  );

  return (
    <main className="admin-page verification-centre">
      <section className="admin-page__header verification-centre__header">
        <div>
          <Link className="admin-page__back-link" to="/admin/verification">
            ← Verification Centre
          </Link>
          <p className="admin-page__eyebrow">Dataset evidence</p>
          <div className="verification-title-row">
            <h1>{dataset.datasetName}</h1>
            <VerificationStatusBadge state={dataset.status} />
          </div>
          <p className="admin-page__intro">
            {dataset.checks.length} checks with {dataset.blockers.length} current readiness blockers. Confidence: {dataset.confidence}.
          </p>
        </div>
        <Link className="button button--secondary" to={`/admin/data/${dataset.datasetId}`}>
          Open dataset
        </Link>
      </section>

      <section className="verification-detail-grid">
        <article className="verification-panel">
          <div className="verification-panel__heading">
            <div>
              <p className="admin-page__eyebrow">Capability authority</p>
              <h2>Registered declaration</h2>
            </div>
          </div>
          <dl className="verification-capability-list">
            {Object.entries(declarations).map(([capability, supported]) => (
              <div key={capability}>
                <dt>{capabilityLabels[capability] ?? capability}</dt>
                <dd className={supported ? "is-declared" : "is-unsupported"}>
                  {formatCapability(supported)}
                </dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="verification-panel">
          <div className="verification-panel__heading">
            <div>
              <p className="admin-page__eyebrow">Current evidence</p>
              <h2>Readiness summary</h2>
            </div>
          </div>
          <dl className="verification-metadata">
            <div><dt>Overall</dt><dd><VerificationStatusBadge state={dataset.status} /></dd></div>
            <div><dt>Confidence</dt><dd>{dataset.confidence}</dd></div>
            <div><dt>Last verified</dt><dd>{formatVerificationDate(dataset.lastVerifiedAt)}</dd></div>
            <div><dt>Environment</dt><dd>{snapshot.environment.label}</dd></div>
          </dl>
        </article>
      </section>

      {dataset.blockers.length > 0 && (
        <section className="verification-panel verification-panel--blockers">
          <div className="verification-panel__heading">
            <div>
              <p className="admin-page__eyebrow">Known blockers</p>
              <h2>Required evidence still outstanding</h2>
            </div>
          </div>
          <ul className="verification-blocker-list">
            {dataset.blockers.map((check) => (
              <li key={check.id}>
                <div>
                  <strong>{check.name}</strong>
                  <p>{check.reason}</p>
                  {check.remediation && <p><b>Remediation:</b> {check.remediation}</p>}
                </div>
                <VerificationStatusBadge state={check.result} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {migrationChecks.length > 0 && (
        <section className="verification-alert" role="status">
          <div>
            <h2>Migration dependency</h2>
            <p>
              The approved atomic publication and editorial RLS migration remains local and unapplied. No production or unclassified database write is permitted.
            </p>
          </div>
          <VerificationStatusBadge state="blocked" />
        </section>
      )}

      {staleChecks.length > 0 && (
        <section className="verification-alert" role="status">
          <div>
            <h2>Stale verification evidence</h2>
            <p>
              {staleChecks.length} required check{staleChecks.length === 1 ? " has" : "s have"} expired and must be rerun before this dataset can be Ready.
            </p>
          </div>
          <VerificationStatusBadge state="stale" />
        </section>
      )}

      <section className="verification-panel">
        <div className="verification-panel__heading">
          <div>
            <p className="admin-page__eyebrow">Latest results</p>
            <h2>Verification checks</h2>
          </div>
          <p>Failed, blocked, stale and not-run evidence remains visible.</p>
        </div>

        <div className="verification-check-list">
          {dataset.checks.map((check) => (
            <article key={check.id} className="verification-check">
              <div className="verification-check__heading">
                <div>
                  <small>{check.capability} · {check.severity}</small>
                  <h3>{check.name}</h3>
                </div>
                <VerificationStatusBadge state={check.result} />
              </div>
              <p>{check.reason}</p>
              <p>
                <strong>Expected evidence:</strong> {check.expectedEvidence}
              </p>
              <dl>
                <div><dt>Environment</dt><dd>{check.environment.label}</dd></div>
                <div><dt>Last attempted</dt><dd>{formatVerificationDate(check.attemptedAt)}</dd></div>
                <div><dt>Expiry</dt><dd>{check.expiresAt ? formatVerificationDate(check.expiresAt) : "Source-change review"}</dd></div>
                <div><dt>Verifier</dt><dd>{check.verifier}</dd></div>
              </dl>
              {check.remediation && (
                <p className="verification-check__remediation">
                  <strong>Recommended remediation:</strong> {check.remediation}
                </p>
              )}
              <div className="verification-check__evidence">
                <strong>Evidence references</strong>
                <ul>
                  {check.evidenceReferences.map((reference) => (
                    <li key={reference}><code>{reference}</code></li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
