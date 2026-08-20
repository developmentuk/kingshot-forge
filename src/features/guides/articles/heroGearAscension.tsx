import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const imbuementRows = [
  ['20', 'Mithril + required Mythic Gear', '1st imbuement'],
  ['40', 'Mithril + required Mythic Gear', '2nd imbuement'],
  ['60', 'Mithril + required Mythic Gear', '3rd imbuement'],
  ['80', 'Mithril + required Mythic Gear', '4th imbuement'],
  ['100', 'Mithril + required Mythic Gear', '5th imbuement'],
] as const

export const heroGearAscensionGuide: GuideArticleDefinition = {
  slug: 'kingshot-hero-gear-ascension-imbuement-guide',
  title: 'Kingshot Hero Gear Ascension & Imbuement: Mithril Progression Guide',
  shortTitle: 'Hero Gear Ascension',
  eyebrow: 'System Guide · Hero Gear',
  summary: 'Understand the current official Hero Gear Ascension and Imbuement rules, Mithril checkpoints, material boundaries and safe upgrade planning.',
  intro: 'Hero Gear Ascension is a late-game progression layer for individual Hero Gear pieces. The current Century Games Help Center gives a compact but useful ruleset: Ascension becomes available after a server-age gate, requires Enhancement Level 100 and Mastery Level 10, and leads into five Mithril-based Imbuement checkpoints. Forge keeps those official mechanics separate from older community Red Gear models and does not invent missing costs.',
  theme: 'royal',
  tags: ['Hero Gear', 'Gear Ascension', 'Gear Imbuement', 'Mithril', 'Mythic Gear', 'Legendary Gear', 'Enhancement Level', 'Mastery Level', 'heroes', 'progression', 'F2P', 'resource management'],
  sourceNote: 'Fresh official verification completed 20 August 2026 against the current Century Games / Kingshot Help Center Hero Gear Ascension and Imbuement section. Official material confirms that Ascension upgrades existing Gear, becomes available after an unspecified server-age threshold for Hero Gear at Enhancement Level 100 and Mastery Level 10, and that an ascended Mythic piece becomes Legendary Gear for the Imbuement path. Imbuement is available at enhancement levels 20, 40, 60, 80 and 100, consumes Mithril plus the required number of Mythic Gear pieces, and can currently be performed up to five times. The Help Center also confirms that reforged Mythic Gear can be used as Ascension/Imbuement material and states that the maximum enhancement level after Ascension is 100. Exact server-day unlock timing, Mithril quantities and Mythic-Gear quantities are not published in the Help Center, so Forge does not supply invented values.',
  alert: <><strong>Current official wording takes precedence.</strong> Some community guides still describe older or different Red Gear level models beyond 100. The current Century Games Help Center says the post-Ascension maximum enhancement level is 100 and defines Imbuement checkpoints at 20/40/60/80/100. Verify the live Hero Gear screen before spending Mithril or consuming Mythic Gear.</>,
  connections: [
    { kind: 'item', label: 'Mithril', description: 'Open the governed Companion record for the material Century Games identifies as the core Imbuement resource.', to: '/companion/items/mithril' },
    { kind: 'item', label: 'Forgehammer', description: 'Keep Hero Gear enhancement materials visible while planning the route into Ascension.', to: '/companion/items/forgehammer' },
    { kind: 'tool', label: 'Hero Companion', description: 'Choose which heroes and marches deserve the deepest gear investment before consuming scarce materials.', to: '/companion/heroes' },
    { kind: 'guide', label: 'Hero Progression', description: 'Keep Hero XP and shard progression separate from the Hero Gear layer.', to: '/guides/kingshot-hero-xp-shard-progression-guide' },
    { kind: 'guide', label: 'Mystic Trial', description: 'Use Mystic Trial as a connected account-progression check and Trial Crystal economy reference.', to: '/guides/kingshot-mystic-trial-guide' },
    { kind: 'guide', label: 'Governor Gear', description: 'Hero Gear and Governor Gear are different progression systems; use the Governor Gear guide for Satin, Gilded Threads and Artisan’s Vision.', to: '/guides/kingshot-governor-gear-upgrade-cost-guide' },
  ],
  sections: [
    {
      id: 'official-path', eyebrow: 'Official progression path', title: 'Ascension starts at Enhancement 100 + Mastery 10',
      content: <>
        <p>Century Games defines Gear Ascension as a way to upgrade the level and stats of existing Gear. The feature itself is also gated by server age.</p>
        <div className="guide-article__grid guide-article__grid--three">
          <article className="guide-article__card"><strong>100</strong><h3>Enhancement Level</h3><p>The Hero Gear piece must be at Enhancement Level 100 before it can be ascended.</p></article>
          <article className="guide-article__card"><strong>10</strong><h3>Mastery Level</h3><p>The same Hero Gear piece must be at Mastery Level 10.</p></article>
          <article className="guide-article__card"><strong>Server age</strong><h3>Feature gate</h3><p>The Help Center says the server must have been active for a certain number of days, but it does not publish an exact day count.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Do not hard-code a day:</strong> if another guide gives a precise unlock day, treat that as community/live-observation data unless the current in-game screen confirms it.</p>
      </>,
    },
    {
      id: 'imbuement', eyebrow: 'Five checkpoints', title: 'Legendary Gear can be imbued at 20 / 40 / 60 / 80 / 100',
      content: <>
        <p>The current Help Center says that after a Mythic Gear piece has been ascended to Legendary Gear, it can be imbued when it reaches specific enhancement levels. Each Imbuement consumes Mithril and the required number of Mythic Gear pieces.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Enhancement level</th><th>Official material description</th><th>Progress</th></tr></thead><tbody>{imbuementRows.map(([level, materials, step]) => <tr key={level}><td>{level}</td><td>{materials}</td><td>{step}</td></tr>)}</tbody></table></div>
        <p>Century Games currently says a Gear piece can be imbued up to <strong>five times</strong>. Forge deliberately does not add Mithril costs to this table because the Help Center does not publish the quantities.</p>
      </>,
    },
    {
      id: 'mithril', eyebrow: 'Material boundary', title: 'Mithril is an Imbuement material — not a generic Hero Gear currency',
      content: <>
        <p>The official definition of Mithril is concise: it is a material used to imbue Gear. That makes it a late-stage progression resource in this system rather than something Forge should casually value against unrelated gear materials.</p>
        <ul>
          <li>Save Mithril for the live Imbuement requirement shown on the target Hero Gear piece.</li>
          <li>Do not assume a community cost table is current simply because its level labels look familiar.</li>
          <li>Check the governed <Link to="/companion/items/mithril">Mithril Companion record</Link> alongside event/shop sources before deciding when to spend.</li>
        </ul>
      </>,
    },
    {
      id: 'material-gear', eyebrow: 'Mythic Gear consumption', title: 'Reforged Mythic Gear can be used as material',
      content: <>
        <p>Century Games explicitly confirms that <strong>reforged Mythic Gear can be used as material for Gear Ascension and Imbuement</strong>. That is useful, but it also makes material selection consequential: a usable Mythic piece can become upgrade fodder.</p>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><h3>Protect equipped pieces</h3><p>Before consuming Mythic Gear, verify that it is not part of a current or planned Hero build.</p></article>
          <article className="guide-article__card"><h3>Plan by primary march</h3><p>Forge strategy: concentrate scarce late-game gear resources on heroes you actually field before spreading progression across secondary sets.</p></article>
        </div>
      </>,
    },
    {
      id: 'level-boundary', eyebrow: 'Do not mix old models', title: 'The current official maximum is stated as Enhancement Level 100 after Ascension',
      content: <>
        <p>The current Help Center explicitly answers the maximum-enhancement question with <strong>100 after Ascension</strong>. That wording is consistent with the five Imbuement checkpoints ending at 100.</p>
        <p>Some current community pages still describe a Red Gear progression model using level checkpoints beyond 100. Forge does not silently reconcile those two models. For this guide, the current Century Games wording is the factual layer; the live Hero Gear UI is the final authority if your account shows a newer or region-specific progression state.</p>
      </>,
    },
    {
      id: 'planning', eyebrow: 'Forge planning framework', title: 'A safe way to prepare without inventing costs',
      content: <>
        <ol>
          <li><strong>Select the target Hero Gear piece.</strong> Tie the investment to a hero and march you actually use.</li>
          <li><strong>Reach Enhancement 100 and Mastery 10.</strong> Those are the current official piece requirements for Ascension eligibility.</li>
          <li><strong>Confirm the server-age unlock in-game.</strong> The Help Center does not give Forge a stable exact day.</li>
          <li><strong>Inspect the live material requirement.</strong> Record the exact Mithril and Mythic Gear quantities before consuming anything.</li>
          <li><strong>Plan the five Imbuement checkpoints.</strong> Treat 20/40/60/80/100 as the current official progression ladder and verify each step live.</li>
        </ol>
        <p className="guide-article__callout"><strong>Resource discipline:</strong> because exact quantities are omitted from the official support article, Forge would rather leave a number blank than turn an old community estimate into a false guarantee.</p>
      </>,
    },
  ],
}
