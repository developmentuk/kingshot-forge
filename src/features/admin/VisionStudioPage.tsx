const foundationCapabilities = [
  {
    icon: '🗺️',
    title: 'Mapping Registry',
    status: 'Foundation ready',
    detail: 'Versioned screen types, normalised regions, governed Forge Fields and immutable publication contracts.',
  },
  {
    icon: '🧩',
    title: 'Extractor Plugins',
    status: 'First worker ready',
    detail: 'Provider-neutral OCR, computer-vision and AI-vision contracts with a bounded local Tesseract worker implementation.',
  },
  {
    icon: '⚙️',
    title: 'Worker Runtime',
    status: 'Host implemented',
    detail: 'Versioned NDJSON jobs, health gates, ImageMagick preprocessing and hard timeout, byte, pixel and token ceilings.',
  },
  {
    icon: '🧪',
    title: 'Test Bench',
    status: 'Runtime fixture ready',
    detail: 'Synthetic OCR acceptance evidence plus governed reference tests, expected values and append-only test-result contracts.',
  },
  {
    icon: '🔎',
    title: 'Evidence Centre',
    status: 'Contract ready',
    detail: 'Source screenshots, boxes, raw OCR text, confidence, validation, conflict and correction provenance.',
  },
] as const

const pipelineStages = [
  'Published mapping selection',
  'Region and anchor resolution',
  'Bounded image preprocessing',
  'Extractor plugin execution',
  'Confidence assessment',
  'Governed validation',
  'Conflict resolution',
  'User or editor confirmation',
  'Registered domain proposal',
] as const

export function VisionStudioPage() {
  return (
    <main className="admin-page vision-studio">
      <section className="vision-studio__hero">
        <div>
          <p className="admin-page__eyebrow">Forge Platform Service</p>
          <h1>Vision Studio</h1>
          <p className="admin-page__intro">
            Configure how Forge understands authorised Kingshot screenshots without hard-coded layouts,
            coordinates or direct database targets.
          </p>
        </div>
        <div className="vision-studio__programme-status" aria-label="VISION-001 programme status">
          <span>Programme</span>
          <strong>VISION-001B</strong>
          <small>Extractor host foundation</small>
        </div>
      </section>

      <section className="vision-studio__notice" aria-labelledby="vision-foundation-heading">
        <div aria-hidden="true">🛡️</div>
        <div>
          <h2 id="vision-foundation-heading">Foundation boundary</h2>
          <p>
            No Kingshot screen mapping is configured in this milestone. The checked-in database migration
            remains unapplied, and the native worker is not hosted by the browser or Vercel deployment.
            The worker code, protocol and repeatable runtime fixtures are ready for a separately configured host.
          </p>
        </div>
      </section>

      <section className="vision-studio__grid" aria-label="Forge Vision capabilities">
        {foundationCapabilities.map((capability) => (
          <article className="vision-studio__card" key={capability.title}>
            <span className="vision-studio__card-icon" aria-hidden="true">{capability.icon}</span>
            <div>
              <div className="vision-studio__card-heading">
                <h2>{capability.title}</h2>
                <span>{capability.status}</span>
              </div>
              <p>{capability.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="vision-studio__panel">
        <div className="vision-studio__panel-heading">
          <div>
            <p className="admin-page__eyebrow">Extractor catalogue</p>
            <h2>Tesseract OCR</h2>
          </div>
          <span className="vision-studio__status vision-studio__status--testing">Local worker code ready</span>
        </div>

        <div className="vision-studio__extractor-grid">
          <div><span>Plugin key</span><strong>ocr.tesseract.cli</strong></div>
          <div><span>Family</span><strong>OCR</strong></div>
          <div><span>Execution</span><strong>Separate local worker</strong></div>
          <div><span>Cost profile</span><strong>Zero recurring cost</strong></div>
          <div><span>Preprocessor</span><strong>ImageMagick CLI</strong></div>
          <div><span>Protocol</span><strong>forge-vision-worker.v1</strong></div>
        </div>

        <p className="vision-studio__muted">
          The supplied archive remains an upstream source reference rather than a Forge web dependency.
          Runtime activation requires the documented pinned Tesseract installation, trained language data,
          ImageMagick availability and an independently supervised worker process.
        </p>
      </section>

      <section className="vision-studio__panel">
        <div className="vision-studio__panel-heading">
          <div>
            <p className="admin-page__eyebrow">Extraction pipeline</p>
            <h2>Evidence before data</h2>
          </div>
          <span className="vision-studio__status">Provider neutral</span>
        </div>

        <ol className="vision-studio__pipeline">
          {pipelineStages.map((stage, index) => (
            <li key={stage}>
              <span>{index + 1}</span>
              <strong>{stage}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="vision-studio__governance" aria-label="Forge Vision governance rules">
        <div>
          <span>Published mappings</span>
          <strong>Immutable</strong>
        </div>
        <div>
          <span>Field destinations</span>
          <strong>Registry only</strong>
        </div>
        <div>
          <span>Raw screenshots</span>
          <strong>Private and retained briefly</strong>
        </div>
        <div>
          <span>Automatic data writes</span>
          <strong>Not permitted</strong>
        </div>
      </section>
    </main>
  )
}
