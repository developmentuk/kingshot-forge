import { useState, type FormEvent } from "react"

export function AliasManager({ onPropose }: { onPropose: () => void }) {
  const [alias, setAlias] = useState("")
  const [message, setMessage] = useState("")
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^[a-z][a-z0-9_-]{7,47}$/.test(alias)) {
      setMessage("Use 8–48 lowercase letters, numbers, underscores, or hyphens, beginning with a letter.")
      return
    }
    onPropose()
    setMessage("Alias proposal validated locally. It was not saved because persistence is disabled.")
  }
  return (
    <section className="player-identity__panel" aria-labelledby="alias-title">
      <p className="player-identity__eyebrow">Opaque public route</p><h2 id="alias-title">Public alias</h2>
      <form onSubmit={submit} noValidate>
        <label className="player-identity__field">Routing alias<input value={alias} onChange={(event) => setAlias(event.target.value)} aria-describedby="alias-help alias-message" autoComplete="off" /></label>
        <p id="alias-help" className="player-identity__hint">Availability and reserved words are always checked on the server. Internal IDs are never used in routes.</p>
        <button className="player-identity__button" type="submit">Propose alias</button>
      </form>
      <p id="alias-message" className="player-identity__live" aria-live="assertive">{message}</p>
    </section>
  )
}
