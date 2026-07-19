import { useState } from "react";

import { adminDatasets } from "./adminDatasets";
import { fetchDataset, type DatasetKey, type DatasetLoadResult } from "./dataEngineApi";

export function EditorialImportManagerPage() {
  const [dataset, setDataset] = useState<DatasetKey>(adminDatasets[0]?.id as DatasetKey);
  const [result, setResult] = useState<DatasetLoadResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function preview(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      setResult(await fetchDataset(dataset));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Import preview failed.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="admin-page editorial-import-page">
    <section className="admin-page__header"><p className="admin-page__eyebrow">Forge Admin CMS</p><h1>Import Manager</h1><p className="admin-page__intro">Refresh a registered source, inspect its provenance and validate the payload before editorial records are staged.</p></section>
    <section className="editorial-operations-selector"><label>Dataset<select value={dataset} onChange={(event) => setDataset(event.target.value as DatasetKey)}>{adminDatasets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button type="button" className="button button--primary" onClick={() => void preview()} disabled={busy}>{busy ? "Refreshing…" : "Refresh source"}</button></section>
    {error && <div className="error-state" role="alert">{error}</div>}
    {result && <section className="editorial-admin-card" aria-live="polite"><div className="editorial-admin-card__heading"><div><p className="editorial-admin-eyebrow">Source snapshot</p><h2>{result.metadata?.title ?? result.dataset}</h2></div><strong>{result.recordCount} records</strong></div><dl className="editorial-admin-meta"><div><dt>Fetched</dt><dd>{new Date(result.fetchedAt).toLocaleString()}</dd></div><div><dt>HTTP status</dt><dd>{result.httpStatus}</dd></div><div><dt>Payload hash</dt><dd>{result.payloadHash}</dd></div><div><dt>Source</dt><dd>{result.sourceUrl}</dd></div></dl><p className="success-state" role="status">Preview validated. No database write is performed until the dataset-specific editorial save/review flow is used.</p></section>}
  </main>;
}
