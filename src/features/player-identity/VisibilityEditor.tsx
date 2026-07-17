import { useState } from "react"

const FIELDS = ["Display name", "Avatar", "Kingdom", "Alliance", "Hero Showcase"] as const

export function VisibilityEditor({ onSave }: { onSave: () => void }) {
  const [audience, setAudience] = useState("private")
  const [selected, setSelected] = useState<readonly string[]>([])
  const [announcement, setAnnouncement] = useState("")
  function toggle(field: string) {
    setSelected((current) => current.includes(field) ? current.filter((value) => value !== field) : [...current, field])
  }
  function save() {
    onSave()
    setAnnouncement("Preview only. Persistence is disabled, so no visibility settings were saved.")
  }
  return (
    <section className="player-identity__panel" aria-labelledby="visibility-title">
      <p className="player-identity__eyebrow">Default deny</p><h2 id="visibility-title">Visibility</h2>
      <label className="player-identity__field">Audience
        <select value={audience} onChange={(event) => setAudience(event.target.value)}>
          <option value="private">Private</option><option value="selected_fields">Selected fields</option><option value="authenticated">Authenticated Forge users</option><option value="alliance">Alliance-scoped (contract only)</option><option value="public">Public</option>
        </select>
      </label>
      <fieldset><legend>Fields to include</legend><div className="player-identity__check-grid">
        {FIELDS.map((field) => <label key={field}><input type="checkbox" checked={selected.includes(field)} onChange={() => toggle(field)} /> <span>{field}</span></label>)}
      </div></fieldset>
      <p className="player-identity__hint">Unknown fields always remain hidden. Choosing an audience does not publish unselected fields.</p>
      <button type="button" className="player-identity__button" onClick={save}>Save visibility</button>
      <p className="player-identity__live" aria-live="polite">{announcement}</p>
    </section>
  )
}
