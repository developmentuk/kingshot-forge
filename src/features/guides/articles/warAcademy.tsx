import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const technologyRows = [
  ['Truegold Battalion', 'Infantry', '5', '+200 Deploy Cap/lv'],
  ['Truegold Shields', 'Infantry', '8', 'Infantry Health'],
  ['Truegold Blades', 'Infantry', '8', 'Infantry Lethality'],
  ['Truegold Legionaries', 'Infantry', '12', 'Rally Squad Cap'],
  ['Truegold Mauls', 'Infantry', '12', 'Infantry Attack'],
  ['Truegold Plating', 'Infantry', '12', 'Infantry Defense'],
  ['Truegold Infantry', 'Infantry', '1', 'Unlock T11 Infantry'],
  ['TG Infantry Healing', 'Infantry', '10', '-5% Heal Cost/lv'],
  ['TG Infantry Aid', 'Infantry', '10', '-1.5% Heal Time/lv'],
  ['TG Infantry Training', 'Infantry', '10', '-5% Train Cost/lv'],
  ['TG Battalion (Cav)', 'Cavalry', '5', '+200 Deploy Cap/lv'],
  ['Truegold Farriery', 'Cavalry', '8', 'Cavalry Health'],
  ['Truegold Charge', 'Cavalry', '8', 'Cavalry Lethality'],
  ['TG Legionaries (Cav)', 'Cavalry', '12', 'Rally Squad Cap'],
  ['Truegold Lances', 'Cavalry', '12', 'Cavalry Attack'],
  ['Truegold Platecraft', 'Cavalry', '12', 'Cavalry Defense'],
  ['Truegold Cavalry', 'Cavalry', '1', 'Unlock T11 Cavalry'],
  ['TG Cavalry Healing', 'Cavalry', '10', '-5% Heal Cost/lv'],
  ['TG Cavalry Aid', 'Cavalry', '10', '-1.5% Heal Time/lv'],
  ['TG Cavalry Training', 'Cavalry', '10', '-5% Train Cost/lv'],
  ['TG Battalion (Arc)', 'Archer', '5', '+200 Deploy Cap/lv'],
  ['Truegold Bracers', 'Archer', '8', 'Archer Health'],
  ['Truegold Bows', 'Archer', '8', 'Archer Lethality'],
  ['TG Legionaries (Arc)', 'Archer', '12', 'Rally Squad Cap'],
  ['Truegold Arrows', 'Archer', '12', 'Archer Attack'],
  ['Truegold Vests', 'Archer', '12', 'Archer Defense'],
  ['Truegold Archer', 'Archer', '1', 'Unlock T11 Archer'],
  ['TG Archer Healing', 'Archer', '10', '-5% Heal Cost/lv'],
  ['TG Archer Training', 'Archer', '10', '-5% Train Cost/lv'],
  ['TG Archer Aid', 'Archer', '10', '-1.5% Heal Time/lv'],
] as const

const exampleCosts = [
  ['Truegold Battalion', 'Lv.1', '300,000', '300,000', '60,000', '15,000', '5,000', '16', '8m'],
  ['Truegold Battalion', 'Lv.5', '2,000,000', '2,000,000', '400,000', '100,000', '33,000', '108', '54m'],
  ['Truegold Shields', 'Lv.1', '800,000', '800,000', '160,000', '40,000', '10,000', '40', '20m'],
  ['Truegold Shields', 'Lv.8', '6,600,000', '6,600,000', '1,300,000', '330,000', '83,000', '334', '2h 47m'],
] as const

export const warAcademyGuide: GuideArticleDefinition = {
  slug: 'kingshot-war-academy-research-truegold-dust-guide',
  title: 'Kingshot War Academy: Research, Truegold Dust & T11 Guide',
  shortTitle: 'War Academy',
  eyebrow: 'System Guide · War Academy',
  summary: 'Plan the supplied 30-technology War Academy tree with troop-specific research, Truegold Dust, resources, time and T11 unlock paths.',
  intro: 'The War Academy is a late-game research system built around troop-specific combat upgrades, deployment and rally capacity, healing/training efficiencies and T11 troop unlocks. Forge’s supplied dataset contains 30 technologies across Infantry, Cavalry and Archer branches, with per-level Food, Wood, Stone, Iron, Gold, Truegold Dust and research time. This guide turns that source into a navigable planning reference without pretending the single-source data is independently confirmed.',
  theme: 'royal',
  tags: ['War Academy', 'Truegold Dust', 'T11', 'research', 'Infantry', 'Cavalry', 'Archer', 'troops', 'KvK', 'Alliance Brawl', 'resource management'],
  sourceNote: 'This article is based on the supplied `kingshot-war-academy` dataset, updated 14 June 2026 and verified 18 June 2026. Its metadata assigns accuracy score 78 and cites a single kingshot.net War Academy database source. The dataset states that Cavalry and Archer technologies mirror Infantry costs while using troop-specific stat benefits. Forge therefore presents the values as a useful governed planning dataset, not as independently in-game verified research costs.',
  alert: <><strong>Confidence 78:</strong> this is a single-source research dataset. Before committing a tightly budgeted Truegold Dust reserve, confirm the live War Academy screen. Event-spending advice elsewhere in this guide comes from separate Forge guides, not from the War Academy cost source.</>,
  connections: [
    { kind: 'item', label: 'Truegold Dust', description: 'Open the governed Companion record for the research material used throughout the supplied War Academy dataset.', to: '/companion/items/truegold-dust' },
    { kind: 'tool', label: 'Buildings Companion', description: 'Review War Academy building progression alongside the research tree.', to: '/buildings' },
    { kind: 'guide', label: 'Truegold Progression', description: 'Keep War Academy building Truegold costs separate from the Truegold Dust consumed by War Academy research.', to: '/guides/kingshot-truegold-tempered-truegold-building-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Use the separate KvK guide when deciding whether to hold planned research for a useful scoring window.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Coordinate research spending with Brawl only when the research already advances your account plan.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'item', label: 'Trial Crystal', description: 'The governed Companion record lists Truegold Dust among representative Mystic Trial Shop rewards.', to: '/companion/items/trial-crystal' },
  ],
  sections: [
    {
      id: 'overview', eyebrow: 'Dataset coverage', title: '30 technologies across three troop branches',
      content: <>
        <p>The supplied tree is evenly split: 10 Infantry technologies, 10 Cavalry technologies and 10 Archer technologies. The branches repeat the same broad progression shape while changing the troop-specific stat labels.</p>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>30</strong><h3>Technologies</h3><p>Ten technologies for each of the three troop categories.</p></article>
          <article className="guide-article__card"><strong>1–12</strong><h3>Levels per technology</h3><p>Different technologies cap at 1, 5, 8, 10 or 12 levels in the source.</p></article>
          <article className="guide-article__card"><strong>7</strong><h3>Cost fields</h3><p>Food, Wood, Stone, Iron, Gold, Truegold Dust and research time.</p></article>
          <article className="guide-article__card"><strong>78</strong><h3>Source confidence</h3><p>Useful planning data, but based on one named external database source.</p></article>
        </div>
      </>,
    },
    {
      id: 'tree', eyebrow: 'Research map', title: 'Complete technology list',
      content: <>
        <p>This table preserves the names, branch, level count and benefit labels from the supplied dataset. It does not infer prerequisite order because prerequisite links are not present in the source.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Technology</th><th>Branch</th><th>Levels</th><th>Recorded benefit</th></tr></thead><tbody>{technologyRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      </>,
    },
    {
      id: 'what-it-improves', eyebrow: 'Progression shape', title: 'What each branch is trying to improve',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Combat stats</strong><h3>Health, Lethality, Attack, Defence</h3><p>Each troop branch contains dedicated technologies for the four named combat stat families.</p></article>
          <article className="guide-article__card"><strong>Capacity</strong><h3>Deployment & rally size</h3><p>Battalion technologies record +200 Deployment Capacity per level, while Legionaries technologies are labelled Rally Squad Capacity.</p></article>
          <article className="guide-article__card"><strong>T11</strong><h3>Troop unlock research</h3><p>Each branch contains a one-level technology explicitly labelled as the T11 unlock for that troop type.</p></article>
          <article className="guide-article__card"><strong>Efficiency</strong><h3>Healing & training</h3><p>Each branch has Healing, Aid and Training lines covering heal cost, heal time and training cost reductions.</p></article>
        </div>
      </>,
    },
    {
      id: 'cost-model', eyebrow: 'Per-level costs', title: 'Research consumes more than Truegold Dust',
      content: <>
        <p>Every level row in the supplied dataset can contain ordinary settlement resources, Gold, Truegold Dust and a research timer. Truegold Dust is therefore only one constraint in the upgrade decision.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Technology</th><th>Level</th><th>Food</th><th>Wood</th><th>Stone</th><th>Iron</th><th>Gold</th><th>Truegold Dust</th><th>Time</th></tr></thead><tbody>{exampleCosts.map((row) => <tr key={`${row[0]}-${row[1]}`}>{row.map((cell, index) => <td key={`${row[0]}-${row[1]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>These are examples, not a substitute for the full dataset.</strong> Costs rise by technology and level, so there is no safe flat “Dust per research” figure.</p>
      </>,
    },
    {
      id: 'truegold-dust', eyebrow: 'Key bottleneck', title: 'Plan Truegold Dust by target, not by inventory size',
      content: <>
        <p>The governed <Link className="guide-article__link" to="/companion/items/truegold-dust">Truegold Dust Companion record</Link> identifies it as a War Academy research material and explicitly warns that costs vary by technology and level.</p>
        <ul>
          <li>Pick the exact technology and target level first.</li>
          <li>Add the Dust requirements for the levels you intend to complete.</li>
          <li>Keep War Academy <strong>research Dust</strong> separate from the ordinary/Tempered Truegold used by the War Academy <strong>building</strong>.</li>
          <li>If your reserve is tight, check the live research screen because the supplied dataset carries confidence 78.</li>
        </ul>
        <p>The <Link className="guide-article__link" to="/companion/items/trial-crystal">Trial Crystal Companion record</Link> also lists Truegold Dust among representative Mystic Trial Shop rewards, giving Forge a connected acquisition context without inventing a universal farming rate.</p>
      </>,
    },
    {
      id: 't11', eyebrow: 'Troop progression', title: 'Three explicit T11 unlock technologies',
      content: <>
        <p>The source contains one single-level unlock technology for each troop branch:</p>
        <ul>
          <li><strong>Truegold Infantry</strong> — Unlock T11 Infantry.</li>
          <li><strong>Truegold Cavalry</strong> — Unlock T11 Cavalry.</li>
          <li><strong>Truegold Archer</strong> — Unlock T11 Archer.</li>
        </ul>
        <p>Forge does not claim those rows are the only prerequisites for T11, because prerequisite dependencies are not included in this dataset. Treat them as the explicit unlock nodes recorded by the source, not a complete prerequisite graph.</p>
      </>,
    },
    {
      id: 'mirrored-branches', eyebrow: 'Source structure', title: 'Why the branches look so similar',
      content: <>
        <p>The dataset metadata states that Cavalry and Archer technologies use the same costs as Infantry with different stat benefits. That is why the branch structure repeats Battalion, combat stats, Legionaries, T11 unlock, Healing, Aid and Training lines.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Do not turn that metadata note into an independent verification claim.</strong> Forge is preserving what the supplied source says. If the live client shows a branch-specific cost difference, the governed dataset should be corrected rather than the game being forced to match this article.</p>
      </>,
    },
    {
      id: 'priority', eyebrow: 'Planning strategy', title: 'A safer way to choose research priority',
      content: <>
        <p>The source gives costs and benefit labels, but it does not provide a universal optimal research order. A useful planning approach is to choose based on the formation and activity you actually use.</p>
        <ul>
          <li><strong>Need bigger marches?</strong> Review Battalion deployment-capacity levels.</li>
          <li><strong>Need larger rallies?</strong> Review the Legionaries capacity line.</li>
          <li><strong>Building toward T11?</strong> Work backward from the troop branch you intend to unlock, while verifying live prerequisites.</li>
          <li><strong>Heavy combat/healing account?</strong> Compare combat-stat lines with Healing/Aid efficiencies rather than assuming damage is always the best next research.</li>
          <li><strong>Training bottleneck?</strong> Training technologies reduce the recorded troop training cost by 5% per level according to the source labels.</li>
        </ul>
      </>,
    },
    {
      id: 'events', eyebrow: 'Connected Forge strategy', title: 'Research timing versus event timing',
      content: <>
        <p>The War Academy dataset does not contain event points. Any event timing below comes from separate Forge guides and must remain secondary to a research choice that is already good for the account.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Situation</th><th>Forge connection</th></tr></thead><tbody>
          <tr><td>KvK preparation</td><td>The <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">Kingdom of Power guide</Link> recommends preserving major progression resources between cycles and using useful scoring windows where practical.</td></tr>
          <tr><td>Alliance Brawl</td><td>The <Link className="guide-article__link" to="/guides/kingshot-alliance-brawl-event-guide">Alliance Brawl guide</Link> provides the separate event framework for deciding whether planned progression should be timed into a Brawl stage.</td></tr>
          <tr><td>War Academy building progression</td><td>The <Link className="guide-article__link" to="/guides/kingshot-truegold-tempered-truegold-building-guide">Truegold guide</Link> covers the building’s TG-tier material costs, which are separate from this research tree.</td></tr>
        </tbody></table></div>
        <p className="guide-article__callout"><strong>Account-first rule:</strong> an event should improve the timing of research you already want, not pressure you into burning Dust on a low-priority branch.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Player checklist', title: 'Before starting a War Academy research level',
      content: <>
        <ul>
          <li>Confirm the troop branch and exact technology you want to advance.</li>
          <li>Check the target level’s Food, Wood, Stone, Iron, Gold, Truegold Dust and time.</li>
          <li>If the objective is T11, verify the live prerequisite chain; the supplied dataset does not contain dependencies.</li>
          <li>Keep Truegold Dust budgeting separate from War Academy building Truegold/Tempered Truegold.</li>
          <li>Check the live client before a tight spend because the source confidence is 78.</li>
          <li>Only then consider whether KvK or Alliance Brawl gives a useful timing overlap.</li>
        </ul>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'War Academy FAQ',
      content: <>
        <h3>How many War Academy technologies are in the supplied dataset?</h3><p>30: 10 Infantry, 10 Cavalry and 10 Archer technologies.</p>
        <h3>Does every technology have the same number of levels?</h3><p>No. The source contains caps of 1, 5, 8, 10 and 12 levels depending on the technology.</p>
        <h3>What material is unique to this research dataset?</h3><p>Truegold Dust is the distinctive research material recorded alongside ordinary resources, Gold and research time.</p>
        <h3>Does this guide prove the full prerequisite route to T11?</h3><p>No. It identifies the three explicit one-level T11 unlock technologies in the source, but prerequisite links are not included.</p>
        <h3>Are Cavalry and Archer costs independently verified against Infantry?</h3><p>No. The supplied dataset metadata says those branches mirror Infantry costs. Forge preserves that claim with confidence 78 rather than upgrading it to independent verification.</p>
      </>,
    },
  ],
}
