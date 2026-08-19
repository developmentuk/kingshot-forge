import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const buildingRows = [
  ['Town Center', '660', '790', '1,190', '1,400', '1,675', '900 + 60 T', '1,080 + 90 T', '1,080 + 120 T', '92'],
  ['Embassy', '165', '195', '295', '350', '415', '225 + 13 T', '270 + 19 T', '270 + 24 T', '92'],
  ['Command Center', '130', '155', '235', '280', '335', '180 + 13 T', '216 + 19 T', '216 + 24 T', '92'],
  ['Infirmary', '130', '155', '235', '280', '335', '180 + 13 T', '216 + 19 T', '216 + 24 T', '92'],
  ['Barracks', '295', '355', '535', '630', '750', '405 + 25 T', '486 + 37 T', '486 + 54 T', '92'],
  ['Stable', '295', '355', '535', '630', '750', '405 + 25 T', '486 + 37 T', '486 + 54 T', '92'],
  ['Range', '295', '355', '535', '630', '750', '405 + 25 T', '486 + 37 T', '486 + 54 T', '92'],
  ['War Academy', '0', '71', '107', '126', '150', '45 + 9 T', '54 + 13 T', '54 + 18 T', '80'],
] as const

const tierTotals = [
  ['TG1', '1,970', '—'],
  ['TG2', '2,431', '—'],
  ['TG3', '3,667', '—'],
  ['TG4', '4,326', '—'],
  ['TG5', '5,160', '—'],
  ['TG6', '2,745', '183'],
  ['TG7', '3,294', '271'],
  ['TG8', '3,294', '372'],
] as const

export const truegoldProgressionGuide: GuideArticleDefinition = {
  slug: 'kingshot-truegold-tempered-truegold-building-guide',
  title: 'Kingshot Truegold & Tempered Truegold: TG1–TG8 Building Cost Guide',
  shortTitle: 'Truegold Progression',
  eyebrow: 'System Guide · Truegold Progression',
  summary: 'Plan TG1–TG8 building costs with the governed Forge Truegold dataset, including Tempered Truegold from TG6, source confidence and event-spending connections.',
  intro: 'Truegold is one of Kingshot’s major late-game building bottlenecks, and from TG6 the supplied dataset adds Tempered Truegold alongside ordinary Truegold. Forge’s governed source records eight key buildings from TG1 through TG8, with per-building confidence scores and explicit corrections where older copied values were wrong. This guide turns that data into a planning reference without inventing unlock rules, acquisition rates or live event scoring that the source does not provide.',
  theme: 'royal',
  tags: ['Truegold', 'Tempered Truegold', 'TG1', 'TG6', 'TG8', 'buildings', 'Building Planner', 'KvK', 'Alliance Brawl', 'resource management', 'F2P'],
  sourceNote: 'This article is based on the supplied `kingshot-truegold` dataset, verified on 18 June 2026. Its metadata says 77 of 88 TG1–TG8 values matched exactly between kingshot.net and kingshotdata.kr. It also records two deliberate corrections: War Academy TG2–TG8/Tempered values had been wrongly copied from troop buildings, and the Embassy TG8 Tempered value was corrected from 30 to 24. Seven buildings carry confidence 92; War Academy carries confidence 80 because the corrected values rely on one primary table with broader corroboration rather than a second exact match.',
  alert: <><strong>“T” in the tables means Tempered Truegold.</strong> The supplied dataset states that Tempered Truegold applies from TG6 upward. The guide does not assume a universal unlock date, acquisition rate or event point conversion because those are outside this source.</>,
  connections: [
    { kind: 'tool', label: 'Building Planner', description: 'Turn these per-tier material requirements into a wider construction plan with Forge’s governed building data.', to: '/calculators/buildings' },
    { kind: 'tool', label: 'Buildings Companion', description: 'Review building progression and requirements alongside the Truegold cost table.', to: '/buildings' },
    { kind: 'item', label: 'Truegold', description: 'Open the Companion catalogue search for the progression item used throughout TG1–TG8.', to: '/companion?q=Truegold' },
    { kind: 'item', label: 'Tempered Truegold', description: 'Search Forge’s Companion catalogue for the TG6+ material.', to: '/companion?q=Tempered%20Truegold' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Coordinate large Truegold building completions with the supplied KvK Construction-day strategy instead of spending blindly between cycles.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Balance building progression against Brawl stages that reward construction and Truegold spending.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'guide', label: 'Mystic Divination', description: 'The supplied Mystic guide includes Truegold among high-value reward targets, making it relevant to long-term stockpiling.', to: '/guides/kingshot-mystic-divination-event-guide' },
  ],
  sections: [
    {
      id: 'overview', eyebrow: 'What the dataset covers', title: 'Eight buildings, eight Truegold tiers',
      content: <>
        <p>The governed source contains eight building rows: Town Center, Embassy, Command Center, Infirmary, Barracks, Stable, Range and War Academy. Each row records ordinary Truegold for TG1–TG8 and, where applicable, Tempered Truegold for TG6–TG8.</p>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>8</strong><h3>Buildings</h3><p>The dataset is deliberately bounded to the eight listed progression buildings.</p></article>
          <article className="guide-article__card"><strong>TG1–TG8</strong><h3>Tier coverage</h3><p>Every listed building has ordinary Truegold values through TG8.</p></article>
          <article className="guide-article__card"><strong>TG6+</strong><h3>Tempered Truegold</h3><p>The source begins Tempered requirements at TG6.</p></article>
          <article className="guide-article__card"><strong>80–92</strong><h3>Confidence</h3><p>Seven building rows score 92; corrected War Academy data scores 80.</p></article>
        </div>
      </>,
    },
    {
      id: 'tier-totals', eyebrow: 'Planning view', title: 'Simple per-tier totals across all eight source rows',
      content: <>
        <p>The following totals are a <strong>Forge calculation</strong>: a straight sum of every building row in the supplied dataset for that tier. They are useful for scale, but they are not presented as an in-game “one-click upgrade bundle” or a statement that every account upgrades all eight buildings together.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Tier</th><th>Truegold total</th><th>Tempered Truegold total</th></tr></thead><tbody>{tierTotals.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Full dataset sum:</strong> TG1–TG8 across all eight rows equals 26,887 ordinary Truegold plus 826 Tempered Truegold. Treat this as a dataset total, not a guaranteed personal progression requirement.</p>
      </>,
    },
    {
      id: 'costs', eyebrow: 'Governed requirements', title: 'TG1–TG8 building cost table',
      content: <>
        <p>For TG6–TG8, each cell shows <strong>ordinary Truegold + Tempered Truegold</strong>. For example, Town Center TG6 is 900 Truegold plus 60 Tempered Truegold in the supplied dataset.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Building</th><th>TG1</th><th>TG2</th><th>TG3</th><th>TG4</th><th>TG5</th><th>TG6</th><th>TG7</th><th>TG8</th><th>Confidence</th></tr></thead><tbody>{buildingRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>War Academy TG1 = 0</strong> in the source. That is a recorded zero, not a missing value.</p>
      </>,
    },
    {
      id: 'tg6', eyebrow: 'Material transition', title: 'What changes at TG6',
      content: <>
        <p>The source makes one clear structural change at TG6: Tempered Truegold appears as an additional material. At the same point, the ordinary Truegold numbers in the table are lower than TG5 for every listed building.</p>
        <p>Forge does <strong>not</strong> infer a hidden conversion formula from that pattern. The safe planning approach is to treat TG6+ as a two-material requirement and track ordinary and Tempered stock separately.</p>
        <ul>
          <li>Do not compare TG5 and TG6 using ordinary Truegold alone.</li>
          <li>Keep a separate Tempered target for Town Center, troop buildings, support buildings and War Academy.</li>
          <li>Use the <Link className="guide-article__link" to="/calculators/buildings">Building Planner</Link> for the rest of the upgrade requirements rather than treating Truegold as the only constraint.</li>
        </ul>
      </>,
    },
    {
      id: 'building-priority', eyebrow: 'Resource strategy', title: 'Prioritise by account need, not by the biggest number',
      content: <>
        <p>The dataset tells us what each listed tier costs; it does not publish a universal upgrade order. A useful Forge planning model is therefore to start from the system you need next and use the cost table to price that choice.</p>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Town Center</strong><h3>Largest single row</h3><p>Town Center has the highest Truegold and Tempered requirement at every recorded tier. That makes it the largest single reservation in this dataset, but not automatically the next upgrade for every account.</p></article>
          <article className="guide-article__card"><strong>Troop buildings</strong><h3>Three identical cost rows</h3><p>Barracks, Stable and Range share the same TG1–TG8 requirement pattern in the supplied source. Upgrading all three therefore multiplies that row rather than creating a cheaper mixed path.</p></article>
          <article className="guide-article__card"><strong>Support buildings</strong><h3>Smaller individual reservations</h3><p>Embassy, Command Center and Infirmary cost materially less than Town Center or a troop-building row, which can matter when you are allocating a limited stockpile.</p></article>
          <article className="guide-article__card"><strong>War Academy</strong><h3>Lowest row, lower confidence</h3><p>War Academy has the smallest recorded Truegold requirement, but it is also the only row with confidence 80 rather than 92.</p></article>
        </div>
      </>,
    },
    {
      id: 'war-academy', eyebrow: 'Verification note', title: 'Why War Academy is treated differently',
      content: <>
        <p>The source metadata explicitly says an earlier War Academy TG2–TG8 and Tempered sequence had been wrongly copied from Barracks/Stable/Range. The current dataset replaces those values with a separate War Academy sequence:</p>
        <ul>
          <li>TG2–TG5 ordinary Truegold: 71, 107, 126, 150.</li>
          <li>TG6: 45 Truegold + 9 Tempered.</li>
          <li>TG7: 54 Truegold + 13 Tempered.</li>
          <li>TG8: 54 Truegold + 18 Tempered.</li>
        </ul>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Confidence 80:</strong> the corrected row is considered likely/corroborated, not equivalent to the 92-confidence rows where two independent sources matched exactly. Confirm the live upgrade screen before committing a tightly budgeted final reserve.</p>
      </>,
    },
    {
      id: 'events', eyebrow: 'Connected event planning', title: 'When to spend versus when to hold',
      content: <>
        <p>The Truegold dataset itself contains costs, not event-scoring rules. The spending advice below comes from Forge’s separate connected event guides and should be treated as strategy context rather than part of the Truegold source.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Situation</th><th>Connected Forge guidance</th></tr></thead><tbody>
          <tr><td>Preparing a large building completion</td><td><Link className="guide-article__link" to="/calculators/buildings">Price the full build first</Link>, then reserve the Truegold/Tempered requirement shown here.</td></tr>
          <tr><td>KvK Preparation</td><td>The <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">KvK guide</Link> recommends holding major construction and Truegold spending for the relevant scoring window when possible.</td></tr>
          <tr><td>Alliance Brawl</td><td>The <Link className="guide-article__link" to="/guides/kingshot-alliance-brawl-event-guide">Brawl guide</Link> includes construction/Truegold among Stage I and final-stage spending decisions.</td></tr>
          <tr><td>Building the stockpile</td><td>The <Link className="guide-article__link" to="/guides/kingshot-mystic-divination-event-guide">Mystic Divination guide</Link> treats Truegold as one of the higher-value reward outcomes worth considering.</td></tr>
        </tbody></table></div>
        <p className="guide-article__callout"><strong>Rule of thumb:</strong> never let an event force an upgrade you were not already prepared to make. Account progression comes first; event overlap should improve the timing of a valid upgrade, not manufacture one.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Player checklist', title: 'Before you press upgrade',
      content: <>
        <ul>
          <li>Identify the exact building and Truegold tier you are targeting.</li>
          <li>Check ordinary Truegold and, from TG6 onward, Tempered Truegold separately.</li>
          <li>Use Forge’s Building Planner to confirm the rest of the upgrade cost and timing.</li>
          <li>For War Academy, verify the live requirement if your reserve is tight because that source row carries lower confidence.</li>
          <li>Check whether an upcoming KvK or Alliance Brawl window can reward an upgrade you already intend to complete.</li>
          <li>Do not convert the eight-building dataset total into a personal target unless you genuinely plan to upgrade every listed row.</li>
        </ul>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Truegold FAQ',
      content: <>
        <h3>When does Tempered Truegold begin in this dataset?</h3><p>TG6. The supplied source records Tempered Truegold for TG6, TG7 and TG8 only.</p>
        <h3>How much Truegold does Town Center TG8 cost?</h3><p>The supplied dataset records 1,080 Truegold plus 120 Tempered Truegold.</p>
        <h3>Do Barracks, Stable and Range use the same values?</h3><p>Yes. Their TG1–TG8 rows are identical in the supplied dataset.</p>
        <h3>Why is War Academy confidence lower?</h3><p>Its earlier values had been copied incorrectly from troop buildings. The current corrected sequence is supported by one primary table and broader cross-source agreement, so the dataset assigns confidence 80 instead of 92.</p>
        <h3>Does this guide say how to obtain Truegold or Tempered Truegold?</h3><p>No. The supplied requirements dataset does not define acquisition rates or complete source lists, so Forge does not invent them here.</p>
        <h3>Is 26,887 Truegold the amount every player needs?</h3><p>No. That is simply the sum of all eight building rows across TG1–TG8 in this dataset, useful for scale but not a universal personal progression requirement.</p>
      </>,
    },
  ],
}
