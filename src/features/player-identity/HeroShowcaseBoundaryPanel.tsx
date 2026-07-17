import { useState } from "react"

export function HeroShowcaseBoundaryPanel({ onUpdate }: { onUpdate: () => void }) {
  const [selected, setSelected] = useState(["Amadeus", "Helga"])
  function toggle(hero: string) {
    setSelected((current) => current.includes(hero) ? current.filter((value) => value !== hero) : [...current, hero])
  }
  return (
    <section className="player-identity__panel" aria-labelledby="showcase-title">
      <p className="player-identity__eyebrow">Player-owned selection</p><h2 id="showcase-title">Hero Showcase boundary</h2>
      <p>Selections and user-claimed progression belong here. Canonical Hero facts remain in the Hero Domain; guidance remains Editorial.</p>
      <div className="player-identity__check-grid">{["Amadeus", "Helga", "Jabel"].map((hero) => <label key={hero}><input type="checkbox" checked={selected.includes(hero)} onChange={() => toggle(hero)} /> <span>{hero}</span></label>)}</div>
      <button className="player-identity__button" type="button" onClick={onUpdate}>Update showcase selection</button>
    </section>
  )
}
