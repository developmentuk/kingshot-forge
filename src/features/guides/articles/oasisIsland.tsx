import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const fountainRows = [
  ['1', '—', '120', '+30% Healing Speed (base, always active)'],
  ['2', '150', '150', '+10% Squads’ Deployment Capacity'],
  ['3', '600', '180', '—'],
  ['4', '1,200', '210', '+5% Squads’ Defense'],
  ['5', '2,400', '240', '—'],
  ['6', '4,000', '270', '+5% Squads’ Attack'],
  ['7', '7,000', '300', '—'],
  ['8', '10,000', '330', '+40% Squads’ Deployment Capacity (replaces +10%)'],
  ['9', '15,000', '360', '+5% Squads’ Health'],
  ['10', '20,000', '420', '+5% Squads’ Lethality'],
] as const

const highlights = [
  ['Construction Hut', 'Epic', 'Lv5', 'Construction Speed +6%', '2,500'],
  ['Oasis Spring', 'Rare', 'Lv5', 'Research Speed +4%', '1,000'],
  ['Picnic Mat', 'Rare', 'Lv5', 'Training Speed +5%', '1,000'],
  ['Court of Knowledge', 'Mythic', 'Lv20', 'Squads Attack +20%', '20,000'],
  ['Lion of Glory', 'Mythic', 'Lv10', 'Squads Attack +15%', '10,000'],
  ['Sleeping Drakethrone', 'Mythic', 'Lv10', 'Attack, Defense, Lethality & Health +20% each', '50,000'],
] as const

export const oasisIslandGuide: GuideArticleDefinition = {
  slug: 'kingshot-oasis-island-player-guide',
  title: 'Kingshot Oasis Island: Complete Player & Progression Guide',
  shortTitle: 'Oasis Island',
  eyebrow: 'System Guide · Oasis Island',
  summary: 'Plan Water Essence, Prosperity, Fountain and Reservoir progression, cactus clearing, treasure routes, building buffs and Golden Sunset without treating unverified community values as official constants.',
  intro: 'Oasis Island is a persistent account-progression system unlocked at Town Center Level 19. The supplied Forge research combines the original 65-page intake with official Century Games help material and explicitly labelled community corroboration. The practical goal is simple: keep Water Essence flowing, turn Prosperity into Fountain levels, rush worker milestones, clear valuable land efficiently and invest in permanent buffs that match your account.',
  theme: 'oasis',
  tags: ['Oasis Island', 'Water Essence', 'Prosperity', 'Fountain of Life', 'Reservoir', 'F2P', 'buildings', 'buffs', 'route planning', 'Golden Sunset'],
  sourceNote: 'This article is based on the supplied Kingshot Forge Oasis Island research guide, which already separates officially confirmed mechanics, community-corroborated values and fields still needing live-client verification. Forge preserves those distinctions here instead of flattening everything into one confidence level.',
  alert: <><strong>Do not use a fixed “300 Water Essence per alliance help” rule.</strong> The verified research says caretaker Water Essence scales with Fountain of Life level. The exact live amount should be treated as variable unless a current formula is captured in game.</>,
  connections: [
    { kind: 'tool', label: 'Island Chest Route Optimizer', description: 'Turn the treasure-routing section into an action plan with Forge’s existing island chest route tool.', to: '/calculators/island-chest-route-optimizer' },
    { kind: 'tool', label: 'Buildings Companion', description: 'Compare wider city-building progression and permanent account development alongside Oasis investment.', to: '/buildings' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Coordinate long-term construction, combat-stat and progression spending with KvK preparation.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'guide', label: 'Flamedragon Tyrant', description: 'See where healing, deployment capacity and combat stats become operationally valuable in a major alliance battlefield.', to: '/guides/flamedragon-tyrant-event-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Use the resource-management mindset from Oasis alongside staged event-spending decisions.', to: '/guides/kingshot-alliance-brawl-event-guide' },
  ],
  sections: [
    {
      id: 'unlock', eyebrow: 'System basics', title: 'What Oasis Island is and when it unlocks',
      content: <>
        <p>Oasis Island unlocks at <strong>Town Center Level 19</strong>. A Dock appears in the city and provides access to an island centred on the Fountain of Life.</p>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>1</span><div><h3>Collect Water Essence</h3><p>Use the Fountain, Reservoir workers, treasure chests, quests and social actions.</p></div></article>
          <article className="guide-article__step"><span>2</span><div><h3>Place and upgrade structures</h3><p>Functional decorations add Prosperity and permanent account buffs while they are active.</p></div></article>
          <article className="guide-article__step"><span>3</span><div><h3>Reach Prosperity gates</h3><p>Prosperity unlocks the next Fountain level. It is a threshold score, not a currency that gets spent.</p></div></article>
          <article className="guide-article__step"><span>4</span><div><h3>Upgrade the Fountain</h3><p>Higher levels improve Water output and unlock major permanent bonuses.</p></div></article>
        </div>
      </>,
    },
    {
      id: 'water', eyebrow: 'Core currency', title: 'Water Essence: where it comes from and how to avoid waste',
      content: <>
        <p>Water Essence is used to upgrade the Fountain of Life and Reservoirs and to purchase decorations. The Fountain has a verified <strong>12-hour storage window</strong>, so letting it sit capped loses generation time.</p>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>120–420/hr</strong><h3>Fountain</h3><p>The supplied and corroborated Fountain table rises from 120 per hour at Level 1 to 420 at Level 10.</p></article>
          <article className="guide-article__card"><strong>Variable</strong><h3>Reservoir workers</h3><p>Output depends on worker movement and online/offline processing; do not invent a fixed clearing formula.</p></article>
          <article className="guide-article__card"><strong>One-time</strong><h3>Treasure chests</h3><p>Hidden chests provide large early injections and make route planning strategically important.</p></article>
          <article className="guide-article__card"><strong>Scaling</strong><h3>Alliance help</h3><p>Both players gain Water Essence, but the caretaker amount varies with Fountain level.</p></article>
        </div>
      </>,
    },
    {
      id: 'prosperity', eyebrow: 'Progress gate', title: 'Prosperity, Type Limits and duplicate rules',
      content: <>
        <ul>
          <li>Prosperity rises when qualifying decorations are placed or upgraded.</li>
          <li>It is <strong>not spent</strong> when the Fountain upgrades.</li>
          <li>Retrieving an active decoration removes its Prosperity contribution and active buff until placed again.</li>
          <li>Only copies inside a decoration’s Type Limit contribute. If the Type Limit is 1, a second placed copy gives no extra Prosperity or bonus.</li>
          <li>Where multiple copies are permitted, the game prioritises the highest-level active copies.</li>
          <li>Buffs from different decoration types stack.</li>
        </ul>
        <p className="guide-article__callout"><strong>Practical rule:</strong> place useful new functional types first. Surplus duplicates are usually more valuable as future upgrade material than as inactive decoration spam.</p>
      </>,
    },
    {
      id: 'fountain', eyebrow: 'Primary progression', title: 'Fountain of Life levels and permanent buffs',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Lv</th><th>Prosperity required</th><th>Water/hr</th><th>Buff unlocked</th></tr></thead><tbody>{fountainRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p>At Level 8, the +40% Deployment Capacity value <strong>replaces</strong> the earlier +10%; the source does not support adding them together.</p>
        <p className="guide-article__callout"><strong>Level 10 total from the supplied/corroborated table:</strong> +30% Healing Speed, +40% Squads’ Deployment Capacity, +5% Squads’ Defense, +5% Squads’ Attack, +5% Squads’ Health and +5% Squads’ Lethality.</p>
      </>,
    },
    {
      id: 'reservoirs', eyebrow: 'Clearing engine', title: 'Reservoirs, workers, cacti and the Purifier',
      content: <>
        <p>Reservoirs have a verified Type Limit of 2. The research identifies <strong>Level 4</strong> as the key second-worker milestone and Level 10 as the long-term target.</p>
        <ol>
          <li>Rush the first Reservoir to Level 4 early.</li>
          <li>Do the same with the second Reservoir when it becomes available.</li>
          <li>Reposition Reservoirs near the part of the island you want workers to clear; you cannot directly select an individual cactus.</li>
          <li>Workers continue while you are offline, but the research says efficiency is higher while the Oasis Island screen is actively open.</li>
          <li>After every cactus is cleared, Reservoirs become normal decorations and a Purifier begins producing Water Essence.</li>
        </ol>
        <p className="guide-article__callout guide-article__callout--warning"><strong>No fixed cactus timer:</strong> Century Games does not publish cactus durability or the full online/offline calculation formula. Forge does not manufacture one.</p>
      </>,
    },
    {
      id: 'chests', eyebrow: 'Actionable route planning', title: 'Treasure chests and the Forge route optimiser',
      content: <>
        <p>Treasure chests are valuable one-time Water Essence rewards hidden beneath cactus-covered ground. Move Reservoirs toward the next visible or suspected chest route rather than allowing workers to wander through low-priority terrain indefinitely.</p>
        <p>The supplied community strategy recommends clearing toward the <strong>left side first</strong> and working the island edge to expose chest outlines through partial fog. This is useful strategy guidance, but it is <strong>not an official canonical chest-density rule</strong>.</p>
        <p><Link className="guide-article__link" to="/calculators/island-chest-route-optimizer">Open the Island Chest Route Optimizer →</Link></p>
      </>,
    },
    {
      id: 'upgrades', eyebrow: 'Investment order', title: 'What to upgrade at each stage',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Stage</th><th>Priority</th><th>Why</th></tr></thead><tbody>
          <tr><td>Early</td><td>Fountain whenever gated; first Reservoir → Lv4; clear cacti/chests; place useful first copies.</td><td>Maximises Water flow, land access and compounding progression.</td></tr>
          <tr><td>Growing island</td><td>Second Reservoir → Lv4; Reservoirs toward Lv10; Construction/Research/Training buffs.</td><td>Economic acceleration compounds across the account.</td></tr>
          <tr><td>Combat-focused</td><td>Highest-impact stat buildings for your actual rally/garrison role.</td><td>Turns island investment into useful PvP/PvE power rather than decorative power.</td></tr>
          <tr><td>End game</td><td>Golden Sunset, high-ceiling premium structures and final layout optimisation.</td><td>Late-game permanent-stat optimisation after mechanical needs are covered.</td></tr>
        </tbody></table></div>
      </>,
    },
    {
      id: 'buildings', eyebrow: 'Functional highlights', title: 'Economy and combat buildings worth understanding',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Building</th><th>Rarity</th><th>Max Lv</th><th>Maximum effect</th><th>Max Prosperity</th></tr></thead><tbody>{highlights.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p>The complete intake contains 50 detailed functional records and their per-level values. The public guide focuses on player decisions rather than reproducing every row before the governed Oasis catalogue itself is exposed as a public browsing surface.</p>
        <div className="guide-article__callout guide-article__callout--warning"><strong>Known verification flags:</strong> Dinosaur Fossils has a Training Speed vs Training Capacity label conflict; Oasis Spring Level 2 has a Research Speed anomaly; “Ssilor’s Cottage” spelling/art mapping needs live-client confirmation; Skating Rink lacks a complete verified ladder.</div>
      </>,
    },
    {
      id: 'golden-sunset', eyebrow: 'Late-game Wonder', title: 'Golden Sunset',
      content: <>
        <p>Golden Sunset is a special Wonder/Lighthouse system rather than an ordinary duplicate-copy decoration. The verified research supports:</p>
        <ul>
          <li>Unlock access when the Fountain of Life reaches Level 10.</li>
          <li>Upgrade using Golden Sunset Wonder Blueprints.</li>
          <li>General Wonder Blueprints refresh weekly in the Marketplace.</li>
          <li>The supplied/current guide records an exchange of 10 General Wonder Blueprints for 1 Golden Sunset Wonder Blueprint.</li>
        </ul>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Not yet canonical:</strong> exact maximum level, purchase price and the complete Health/Lethality ladder. Those should stay unverified until captured in game or published by an authoritative source.</p>
      </>,
    },
    {
      id: 'social', eyebrow: 'Alliance value', title: 'Alliance help, visiting and social play',
      content: <>
        <p>Helping an ally care for their Fountain gives Water Essence to both players. A recipient can receive help once every <strong>six hours</strong>. The exact daily-count limits in older community material are not treated as canonical here.</p>
        <p>Players can also visit islands through social and leaderboard routes. Keep social rewards as useful extras rather than the core of your Water plan.</p>
      </>,
    },
    {
      id: 'recycling', eyebrow: 'Inventory discipline', title: 'Recycling, retrieval and duplicate management',
      content: <>
        <ul>
          <li>Check whether a duplicate is needed as upgrade material before recycling it.</li>
          <li>Retrieving an active structure can immediately reduce Prosperity and remove its buff.</li>
          <li>Marketplace, Event/Pack and Mythic decorations can have different retrieval restrictions.</li>
          <li>Keep scarce premium/event duplicates when reacquisition is limited and future upgrades may consume them.</li>
        </ul>
        <p>The verified research notes that retrievable decorations return half of their original selling price, but it deliberately avoids the false simplification that every decoration can always be recycled.</p>
      </>,
    },
    {
      id: 'mistakes', eyebrow: 'Avoidable losses', title: 'Common Oasis Island mistakes',
      content: <>
        <ul>
          <li>Placing duplicates beyond Type Limit and expecting stacked bonuses.</li>
          <li>Leaving Fountain storage capped beyond its 12-hour window.</li>
          <li>Delaying Reservoir Level 4 and the second-worker milestone.</li>
          <li>Never repositioning Reservoirs while workers clear low-priority areas.</li>
          <li>Spending heavily on visual layout before enough land, cacti and chests are cleared.</li>
          <li>Retrieving functional structures for aesthetics and accidentally losing Prosperity or buffs.</li>
          <li>Treating community chest routes or unverified event-building values as official constants.</li>
          <li>Buying every limited building instead of targeting buffs that match your account goal.</li>
        </ul>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Routine', title: 'Oasis Island player checklist',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Cadence</th><th>Action</th></tr></thead><tbody>
          <tr><td>Every login / when convenient</td><td>Collect Water Essence before Fountain storage reaches its 12-hour cap.</td></tr>
          <tr><td>During cactus phase</td><td>Check Reservoir position and move toward the next chest or priority clearing area.</td></tr>
          <tr><td>Daily</td><td>Use available ally Fountain helps and collect quest/like rewards when present.</td></tr>
          <tr><td>At a Prosperity threshold</td><td>Upgrade the Fountain promptly when resources allow.</td></tr>
          <tr><td>When a useful copy appears</td><td>Place the first functional copy; reserve extras for upgrades based on current goals.</td></tr>
          <tr><td>Weekly at Fountain Lv10+</td><td>Check General/Golden Sunset blueprint availability and relevant event sources.</td></tr>
          <tr><td>After all cacti are cleared</td><td>Shift from clearing efficiency toward Purifier income, permanent stats and final layout.</td></tr>
        </tbody></table></div>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Oasis Island FAQ',
      content: <>
        <details><summary>When does Oasis Island unlock?</summary><p>At Town Center Level 19. The Dock provides access.</p></details>
        <details><summary>What should I upgrade first?</summary><p>Keep Fountain progression moving and rush the first Reservoir to the Level 4 second-worker milestone.</p></details>
        <details><summary>Do duplicate buildings stack?</summary><p>Only up to the building’s Type Limit. A second copy beyond the active limit gives no extra bonus or Prosperity.</p></details>
        <details><summary>Does Prosperity get spent?</summary><p>No. It is a threshold score, although it can fall when contributing decorations are retrieved.</p></details>
        <details><summary>How often should I collect the Fountain?</summary><p>Before the verified 12-hour storage window becomes full, so generation is not wasted.</p></details>
        <details><summary>Can workers clear while I am offline?</summary><p>Yes. The research also says worker efficiency is higher while you are actively viewing the Oasis Island screen.</p></details>
        <details><summary>Can I choose a specific cactus?</summary><p>No. Reposition the Reservoir closer to the area you want cleared.</p></details>
        <details><summary>What happens when every cactus is gone?</summary><p>Reservoirs become normal decorations and you receive a Purifier that produces Water Essence.</p></details>
        <details><summary>Should I build economy or combat first?</summary><p>For most developing accounts, compounding construction, research and training benefits are stronger early investments. Combat-focused players can move stat buildings forward when those stats directly serve their role.</p></details>
      </>,
    },
  ],
}
