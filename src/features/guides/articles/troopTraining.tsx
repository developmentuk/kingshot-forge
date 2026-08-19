import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const troopRows = [
  ['Infantry', 'T1', '80', '80', '0', '0', '12s', '1', '1', '1', 'EST'],
  ['Infantry', 'T2', '150', '150', '60', '0', '45s', '2', '2', '2', 'EST'],
  ['Infantry', 'T3', '400', '400', '200', '100', '3m', '5', '5', '2', 'EST'],
  ['Infantry', 'T4', '1,200', '1,200', '600', '400', '10m', '10', '10', '4', 'EST'],
  ['Infantry', 'T5', '3,500', '3,500', '2,000', '1,500', '30m', '25', '25', '10', 'EST'],
  ['Lancer', 'T1', '80', '0', '80', '0', '12s', '1', '1', '1', 'EST'],
  ['Lancer', 'T2', '150', '60', '150', '0', '45s', '2', '2', '2', 'EST'],
  ['Lancer', 'T3', '400', '100', '400', '200', '3m', '5', '5', '2', 'EST'],
  ['Lancer', 'T4', '1,200', '400', '1,200', '600', '10m', '10', '10', '4', 'EST'],
  ['Lancer', 'T5', '3,500', '1,500', '3,500', '2,000', '30m', '25', '25', '10', 'EST'],
  ['Marksman', 'T1', '80', '0', '0', '80', '12s', '1', '1', '1', 'EST'],
  ['Marksman', 'T2', '150', '0', '60', '150', '45s', '2', '2', '2', 'EST'],
  ['Marksman', 'T3', '400', '200', '100', '400', '3m', '5', '5', '2', 'EST'],
  ['Marksman', 'T4', '1,200', '600', '400', '1,200', '10m', '10', '10', '4', 'EST'],
  ['Marksman', 'T5', '3,500', '2,000', '1,500', '3,500', '30m', '25', '25', '10', 'EST'],
] as const

const troopTotals = [
  ['Infantry', '5,330', '5,330', '2,860', '2,000', '43m 57s'],
  ['Lancer', '5,330', '2,060', '5,330', '2,800', '43m 57s'],
  ['Marksman', '5,330', '2,800', '2,060', '5,330', '43m 57s'],
] as const

export const troopTrainingGuide: GuideArticleDefinition = {
  slug: 'kingshot-troop-training-t1-t5-cost-time-guide',
  title: 'Kingshot Troop Training: T1–T5 Cost, Time & Event-Point Guide',
  shortTitle: 'Troop Training',
  eyebrow: 'System Guide · Troop Training',
  summary: 'Compare the supplied T1–T5 Infantry, Lancer and Marksman training costs, times and calculator-default event points with explicit estimate warnings.',
  intro: 'Forge’s supplied troop-training dataset contains 15 per-unit rows: Infantry, Lancer and Marksman from T1 through T5. Each row records Food, Wood, Stone, Iron, training time and default point values for HoG, KvK and TSG calculations. The source metadata describes broader T1–T12 coverage, but the actual payload stops at T5, and every supplied row is marked EST. This guide therefore treats the file as an estimated T1–T5 planning reference rather than claiming complete troop progression.',
  theme: 'royal',
  tags: ['troops', 'troop training', 'T1', 'T5', 'Infantry', 'Lancer', 'Marksman', 'training time', 'KvK', 'HoG', 'TSG', 'resource management'],
  sourceNote: 'This article is based on the supplied `kingshot-troops` dataset, updated 14 June 2026. Its provenance cites direct in-game observation and community estimates via KingshotPro, gives an overall accuracy score of 70, and explicitly states that tiers carrying status `EST` are community estimates not yet confirmed in-game. All 15 rows in the supplied payload carry `EST`. The source also says its event-point values are calculator defaults adjustable by the user. The file description says T1–T12, but the actual payload contains only T1–T5; Forge preserves that mismatch as a verification issue rather than inventing missing tiers.',
  alert: <><strong>Coverage is T1–T5 only.</strong> Do not extrapolate these rows to T6–T12. Training costs/times remain estimated in this source, and HoG/KvK/TSG point values are calculator defaults rather than verified event rules.</>,
  connections: [
    { kind: 'tool', label: 'Hero Companion', description: 'Pair troop investment with the heroes you actually use rather than levelling every system in isolation.', to: '/companion/heroes' },
    { kind: 'guide', label: 'War Academy', description: 'Continue into late-game troop research, Truegold Dust and the source-governed T11 unlock nodes.', to: '/guides/kingshot-war-academy-research-truegold-dust-guide' },
    { kind: 'guide', label: 'Hero Progression', description: 'Compare troop-training resource pressure with Hero XP and shard investment.', to: '/guides/kingshot-hero-xp-shard-progression-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Use the separate KvK guide for event timing and strategy; this troop source only supplies adjustable calculator defaults.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Coordinate training with broader event-resource planning without treating the troop dataset as Brawl scoring authority.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'item', label: 'Food', description: 'Search the Companion catalogue for Food-related resources and items.', to: '/companion?q=Food' },
  ],
  sections: [
    {
      id: 'coverage', eyebrow: 'Source coverage', title: 'What is actually in the supplied troop file',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>15</strong><h3>Rows</h3><p>Five tiers for each of three troop types.</p></article>
          <article className="guide-article__card"><strong>T1–T5</strong><h3>Actual tiers</h3><p>The payload ends at T5 even though the metadata description says T1–T12.</p></article>
          <article className="guide-article__card"><strong>70</strong><h3>Accuracy score</h3><p>The dataset-level confidence score supplied by the source.</p></article>
          <article className="guide-article__card"><strong>15 / 15 EST</strong><h3>Row status</h3><p>Every provided troop-tier row is explicitly estimated.</p></article>
        </div>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Do not infer missing tiers.</strong> Forge has no T6–T12 training rows in this source, so the guide does not create them from patterns, War Academy values or outside assumptions.</p>
      </>,
    },
    {
      id: 'full-table', eyebrow: 'Per-unit source data', title: 'Complete supplied T1–T5 training table',
      content: <>
        <p>Costs below are per supplied troop row. HoG, KvK and TSG columns reproduce the source’s calculator-default point values; they are not presented as independently verified live-event scoring.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Type</th><th>Tier</th><th>Food</th><th>Wood</th><th>Stone</th><th>Iron</th><th>Time</th><th>HoG*</th><th>KvK*</th><th>TSG*</th><th>Status</th></tr></thead><tbody>{troopRows.map((row) => <tr key={`${row[0]}-${row[1]}`}>{row.map((cell, index) => <td key={`${row[0]}-${row[1]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>*Calculator defaults:</strong> the source explicitly says event-point values are adjustable by the user. Always use current in-game event rules for an actual scoring decision.</p>
      </>,
    },
    {
      id: 'resource-shape', eyebrow: 'Resource profile', title: 'The three troop types shift the secondary-resource burden',
      content: <>
        <p>Food is identical for all three troop types at each supplied tier. The difference is where Wood, Stone and Iron pressure lands.</p>
        <div className="guide-article__grid guide-article__grid--three">
          <article className="guide-article__card"><strong>Infantry</strong><h3>Wood-heavy profile</h3><p>Across one of each supplied T1–T5 row: 5,330 Food, 5,330 Wood, 2,860 Stone and 2,000 Iron.</p></article>
          <article className="guide-article__card"><strong>Lancer</strong><h3>Stone-heavy profile</h3><p>The same five-row sum is 5,330 Food, 2,060 Wood, 5,330 Stone and 2,800 Iron.</p></article>
          <article className="guide-article__card"><strong>Marksman</strong><h3>Iron-heavy profile</h3><p>The supplied sequence totals 5,330 Food, 2,800 Wood, 2,060 Stone and 5,330 Iron.</p></article>
        </div>
        <p>Those figures are <strong>Forge arithmetic over one copy of each T1–T5 source row</strong>. They are not a statement about promotion mechanics, batch size or the number of troops an account should train.</p>
      </>,
    },
    {
      id: 'totals', eyebrow: 'Forge calculation', title: 'One-of-each-tier totals by troop type',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Type</th><th>Food</th><th>Wood</th><th>Stone</th><th>Iron</th><th>Training time</th></tr></thead><tbody>{troopTotals.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>All 15 rows combined:</strong> 15,990 Food, 10,190 Wood, 10,250 Stone, 10,130 Iron and 7,911 seconds of listed training time (2h 11m 51s). This is a dataset-sum reference only.</p>
      </>,
    },
    {
      id: 'time-curve', eyebrow: 'Training time', title: 'The supplied time curve rises sharply by T5',
      content: <>
        <p>Training time is identical across Infantry, Lancer and Marksman for a given supplied tier: 12 seconds at T1, 45 seconds at T2, 3 minutes at T3, 10 minutes at T4 and 30 minutes at T5.</p>
        <ul>
          <li>T1 → T2 increases from 12s to 45s.</li>
          <li>T3 is 180s (3m).</li>
          <li>T4 is 600s (10m).</li>
          <li>T5 is 1,800s (30m), three times the T4 source value.</li>
        </ul>
        <p>The source does not document training-speed buffs, queue size, promotion time or building-level modifiers, so Forge does not turn these base rows into account-specific completion estimates.</p>
      </>,
    },
    {
      id: 'points', eyebrow: 'Event-point caution', title: 'Use the HoG / KvK / TSG numbers as defaults, not authority',
      content: <>
        <p>The file supplies the same HoG and KvK defaults at each tier: 1, 2, 5, 10 and 25 points from T1 through T5. TSG defaults are 1, 2, 2, 4 and 10.</p>
        <p>That does <strong>not</strong> establish current live scoring. The source metadata explicitly labels those values as calculator defaults that can be adjusted by the user. For event decisions, use the current event screen and Forge’s dedicated event guide where available.</p>
        <p>For example, the <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">Kingdom of Power / KvK guide</Link> owns event strategy; this troop dataset owns only its supplied training rows and defaults.</p>
      </>,
    },
    {
      id: 'naming', eyebrow: 'Cross-source terminology', title: 'Lancer / Marksman here; Cavalry / Archer in War Academy',
      content: <>
        <p>The troop-training source names its three categories <strong>Infantry, Lancer and Marksman</strong>. The separate War Academy dataset uses <strong>Infantry, Cavalry and Archer</strong>.</p>
        <p>Forge does not silently rewrite one source into the vocabulary of the other. The guides remain connected because both concern troop progression, but the naming difference is preserved until a governed mapping is explicitly verified.</p>
      </>,
    },
    {
      id: 'planning', eyebrow: 'Player planning', title: 'How to use this dataset safely',
      content: <>
        <ul>
          <li>Use the table to compare the relative Food/Wood/Stone/Iron shape of T1–T5 training.</li>
          <li>Treat all listed costs and times as estimates because every source row is marked EST.</li>
          <li>Do not extrapolate the T5 pattern into T6–T12.</li>
          <li>Do not treat the event-point defaults as current live scoring without checking the relevant event.</li>
          <li>For late-game troop progression and T11, move to the <Link className="guide-article__link" to="/guides/kingshot-war-academy-research-truegold-dust-guide">War Academy guide</Link> rather than extending this dataset beyond its coverage.</li>
          <li>Balance troop investment against Hero progression and the actual marches you use.</li>
        </ul>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Troop training FAQ',
      content: <>
        <h3>Does this source contain T6–T12 costs?</h3><p>No. Its description says T1–T12, but the actual payload supplied to Forge contains only T1–T5 for Infantry, Lancer and Marksman.</p>
        <h3>Are the T1–T5 costs verified?</h3><p>The dataset has an overall accuracy score of 70, but every individual supplied row is marked EST. Forge therefore treats them as estimated planning values.</p>
        <h3>What is the supplied T5 training time?</h3><p>1,800 seconds (30 minutes) for each of the three troop types in this dataset.</p>
        <h3>Are HoG and KvK points official?</h3><p>Not according to this source. Its metadata explicitly calls them calculator defaults adjustable by the user.</p>
        <h3>Why does the War Academy guide say Cavalry and Archer?</h3><p>Because that separate source uses different terminology. Forge preserves both source vocabularies instead of silently asserting a mapping.</p>
      </>,
    },
  ],
}
