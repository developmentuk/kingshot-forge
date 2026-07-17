import { StatusBadge } from "./StatusBadge"

export interface CharacterCardModel {
  readonly id: string
  readonly name: string
  readonly kingdom: string
  readonly alliance: string
  readonly linkStatus: "linked" | "revoked" | "disputed"
  readonly verificationStatus: "unverified" | "pending" | "expired"
  readonly primary: boolean
  readonly activeEligible: boolean
}

export function CharacterCard({ character, selectedPrimary, onPrimaryChange, onDispute }: {
  character: CharacterCardModel
  selectedPrimary: boolean
  onPrimaryChange: (id: string) => void
  onDispute: (id: string) => void
}) {
  return (
    <article className="player-character-card">
      <header>
        <div><p className="player-identity__eyebrow">Game Character</p><h3>{character.name}</h3></div>
        <StatusBadge status={character.linkStatus} />
      </header>
      <dl className="player-character-card__facts">
        <div><dt>Kingdom</dt><dd>{character.kingdom}</dd></div>
        <div><dt>Alliance</dt><dd>{character.alliance}</dd></div>
        <div><dt>Ownership</dt><dd><StatusBadge status={character.verificationStatus} /></dd></div>
        <div><dt>Active eligible</dt><dd>{character.activeEligible ? "Yes" : "No"}</dd></div>
      </dl>
      <div className="player-character-card__actions">
        <label className="player-identity__radio">
          <input type="radio" name="primary-character" checked={selectedPrimary} disabled={character.linkStatus !== "linked"} onChange={() => onPrimaryChange(character.id)} />
          <span>Primary Character{character.primary ? " (current)" : ""}</span>
        </label>
        <button type="button" className="player-identity__button player-identity__button--quiet" onClick={() => onDispute(character.id)}>Dispute link</button>
      </div>
    </article>
  )
}
