import { DataEngineDiagnostics } from "../../components/admin/DataEngineDiagnostics";

export function DataEngineDiagnosticsPage() {
  return (
    <main className="page-shell">
      <section className="page-hero">
        <p className="eyebrow">
          Admin tools
        </p>

        <h1>Data Engine</h1>

        <p>
          Review the health of each Kingshot dataset
          and manually refresh the data used by Forge.
        </p>
      </section>

      <DataEngineDiagnostics />
    </main>
  );
}