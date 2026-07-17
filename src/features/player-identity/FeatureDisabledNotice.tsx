export function FeatureDisabledNotice({ area = "Player Identity" }: { area?: string }) {
  return (
    <section className="player-identity__notice" role="status" aria-labelledby="player-disabled-title">
      <span className="player-identity__notice-icon" aria-hidden="true">🛡️</span>
      <div>
        <p className="player-identity__eyebrow">Release 0.7.1 · disabled vertical slice</p>
        <h2 id="player-disabled-title">{area} is safely switched off</h2>
        <p>The complete experience is installed locally, but its feature and persistence gates remain OFF pending migration recovery, non-production validation, and approval.</p>
        <dl className="player-identity__gate-list">
          <div><dt>Production writes</dt><dd>Disabled</dd></div>
          <div><dt>Ownership verification</dt><dd>No provider configured</dd></div>
          <div><dt>Public exposure</dt><dd>Default deny</dd></div>
        </dl>
      </div>
    </section>
  )
}
