import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getVerificationSnapshot,
} from "./verificationCentreData";
import {
  formatVerificationDate,
} from "./verificationFormatting";
import {
  VerificationStatusBadge,
} from "./VerificationStatusBadge";

export function VerificationRunPage() {
  const { runId } = useParams<{ runId: string }>();
  const snapshot = getVerificationSnapshot();

  if (runId !== snapshot.run.id) {
    return (
      <main className="admin-page verification-centre">
        <section className="admin-empty-state">
          <p className="admin-page__eyebrow">Verification Centre</p>
          <h1>Verification run not found</h1>
          <p>No synthetic run or fallback evidence was substituted.</p>
          <Link className="admin-empty-state__link" to="/admin/verification">
            Return to Verification Centre
          </Link>
        </section>
      </main>
    );
  }

  const { resultCounts } = snapshot;

  return (
    <main className="admin-page verification-centre">
      <section className="admin-page__header">
        <div>
          <Link className="admin-page__back-link" to="/admin/verification">
            ← Verification Centre
          </Link>
          <p className="admin-page__eyebrow">Verification run</p>
          <h1>{snapshot.run.id}</h1>
          <p className="admin-page__intro">
            Local evidence snapshot. It does not claim database, preview or production validation.
          </p>
        </div>
      </section>

      <section className="verification-summary" aria-label="Verification result totals">
        <article><span>Checks</span><strong>{snapshot.results.length}</strong></article>
        <article><span>Passed</span><strong>{resultCounts.passed}</strong></article>
        <article><span>Failed</span><strong>{resultCounts.failed}</strong></article>
        <article><span>Blocked</span><strong>{resultCounts.blocked}</strong></article>
        <article><span>Not run</span><strong>{resultCounts.notRun}</strong></article>
        <article><span>Stale</span><strong>{resultCounts.stale}</strong></article>
        <article><span>Unsupported</span><strong>{resultCounts.notApplicable}</strong></article>
      </section>

      <section className="verification-detail-grid">
        <article className="verification-panel">
          <div className="verification-panel__heading"><h2>Run metadata</h2></div>
          <dl className="verification-metadata">
            <div><dt>Started</dt><dd>{formatVerificationDate(snapshot.run.startedAt)}</dd></div>
            <div><dt>Completed</dt><dd>{formatVerificationDate(snapshot.run.completedAt)}</dd></div>
            <div><dt>Verifier</dt><dd>{snapshot.run.verifier}</dd></div>
            <div><dt>Source revision</dt><dd>{snapshot.run.sourceRevision}</dd></div>
          </dl>
        </article>
        <article className="verification-panel">
          <div className="verification-panel__heading"><h2>Environment</h2></div>
          <dl className="verification-metadata">
            <div><dt>Surface</dt><dd>{snapshot.environment.label}</dd></div>
            <div><dt>Database</dt><dd>{snapshot.environment.databaseClassification}</dd></div>
            <div><dt>Access</dt><dd>{snapshot.environment.databaseAccess}</dd></div>
            <div><dt>Project</dt><dd>{snapshot.environment.databaseProjectId ?? "Not connected"}</dd></div>
          </dl>
        </article>
      </section>

      <section className="verification-panel">
        <div className="verification-panel__heading">
          <div>
            <p className="admin-page__eyebrow">Safe run log</p>
            <h2>Execution notes</h2>
          </div>
        </div>
        <ol className="verification-run-log">
          {snapshot.run.safeLog.map((entry) => <li key={entry}>{entry}</li>)}
        </ol>
      </section>

      <section className="verification-panel">
        <div className="verification-panel__heading">
          <div>
            <p className="admin-page__eyebrow">Evidence ledger</p>
            <h2>Checks and outcomes</h2>
          </div>
        </div>
        <div
          className="verification-table-scroll"
          role="region"
          aria-label="Verification run evidence table"
          tabIndex={0}
        >
          <table className="verification-table verification-table--run">
            <caption className="forge-sr-only">
              Every check recorded in this local verification run
            </caption>
            <thead>
              <tr>
                <th scope="col">Check</th>
                <th scope="col">Dataset</th>
                <th scope="col">Capability</th>
                <th scope="col">Result</th>
                <th scope="col">Severity</th>
                <th scope="col">Reason</th>
                <th scope="col">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.results.map((result) => (
                <tr key={result.id}>
                  <th scope="row">{result.name}</th>
                  <td>{result.datasetId ?? "Platform"}</td>
                  <td>{result.capability}</td>
                  <td><VerificationStatusBadge state={result.result} /></td>
                  <td>{result.severity}</td>
                  <td>{result.reason}</td>
                  <td>
                    <ul className="verification-table__evidence">
                      {result.evidenceReferences.map((reference) => (
                        <li key={reference}><code>{reference}</code></li>
                      ))}
                    </ul>
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
