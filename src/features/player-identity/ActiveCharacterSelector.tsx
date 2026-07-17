import type { CharacterCardModel } from "./CharacterCard"

export function ActiveCharacterSelector({ characters, value, onChange, announcement }: {
  characters: readonly CharacterCardModel[]
  value: string
  onChange: (id: string) => void
  announcement: string
}) {
  return (
    <section className="player-identity__panel" aria-labelledby="active-character-title">
      <div className="player-identity__section-heading">
        <div><p className="player-identity__eyebrow">Per-tab request context</p><h2 id="active-character-title">Active Character</h2></div>
        <StatusPill>Not a global setting</StatusPill>
      </div>
      <p>Select the exact character for requests in this browser tab. Sensitive operations never fall back to Primary.</p>
      <label className="player-identity__field">Character for this tab
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choose a linked character</option>
          {characters.map((character) => <option key={character.id} value={character.id} disabled={!character.activeEligible || character.linkStatus !== "linked"}>{character.name}</option>)}
        </select>
      </label>
      <p className="player-identity__live" aria-live="polite">{announcement}</p>
    </section>
  )
}

function StatusPill({ children }: { children: string }) {
  return <span className="player-identity__context-pill">{children}</span>
}
