import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const scoringRows = [
  ['1', 'City Construction', 'Charm level increase', 'levels', '70'],
  ['1', 'City Construction', 'Truegold building upgrade', 'upgrades', '2,000'],
  ['1', 'City Construction', 'Speedups used (1M each)', 'million', '30'],
  ['1', 'City Construction', 'Intel Mission completed', 'missions', '6,000'],
  ['2', 'Basic Skills Up', 'Truegold building upgrade', 'upgrades', '2,000'],
  ['2', 'Basic Skills Up', 'Speedups used (1M each)', 'million', '30'],
  ['2', 'Basic Skills Up', 'Hero Roulette spin', 'spins', '8,000'],
  ['2', 'Basic Skills Up', 'Hero Shards ascension (Epic)', 'ascensions', '1,220'],
  ['2', 'Basic Skills Up', 'Hero Shards ascension (Mythic)', 'ascensions', '3,040'],
  ['2', 'Basic Skills Up', 'Resources gathered (per 1K food/wood)', 'thousands', '2'],
  ['3', 'Pet Training', 'Pet advancement', 'levels', '50'],
  ['3', 'Pet Training', 'Advanced Taming Mark', 'marks', '15,000'],
  ['3', 'Pet Training', 'Common Taming Mark', 'marks', '1,150'],
  ['3', 'Pet Training', 'Charm level increase', 'levels', '70'],
  ['3', 'Pet Training', 'Hero Roulette spin', 'spins', '8,000'],
  ['3', 'Pet Training', 'Intel Mission completed', 'missions', '6,000'],
  ['4', 'Hero Development', 'Charm level increase', 'levels', '70'],
  ['4', 'Hero Development', 'Hero Gear Forgehammer used', 'hammers', '4,000'],
  ['4', 'Hero Development', 'Hero Exclusive Gear Widget', 'widgets', '8,000'],
  ['4', 'Hero Development', 'Mithril used', 'mithril', '40,000'],
  ['4', 'Hero Development', 'Troops trained (per unit, T1-T3)', 'troops', '3'],
  ['4', 'Hero Development', 'Troops trained (per unit, T4-T6)', 'troops', '10'],
  ['4', 'Hero Development', 'Troops trained (per unit, T7-T10)', 'troops', '30'],
  ['5', 'Power Boost', 'Pet advancement', 'levels', '50'],
  ['5', 'Power Boost', 'Advanced Taming Mark', 'marks', '15,000'],
  ['5', 'Power Boost', 'Common Taming Mark', 'marks', '1,150'],
  ['5', 'Power Boost', 'Mithril used', 'mithril', '40,000'],
  ['5', 'Power Boost', 'Forgehammer used', 'hammers', '4,000'],
  ['5', 'Power Boost', 'Widget used', 'widgets', '8,000'],
  ['5', 'Power Boost', 'Truegold building upgrade', 'upgrades', '2,000'],
  ['5', 'Power Boost', 'Speedups used (1M each)', 'million', '30'],
  ['5', 'Power Boost', 'Intel Mission completed', 'missions', '6,000'],
] as const

const repeatRows = [
  ['Charm level increase', 'Days 1, 3 & 4', '70 / level'],
  ['Truegold building upgrade', 'Days 1, 2 & 5', '2,000 / upgrade'],
  ['Speedups used (1M each)', 'Days 1, 2 & 5', '30 / source-defined million'],
  ['Intel Mission completed', 'Days 1, 3 & 5', '6,000 / mission'],
  ['Hero Roulette spin', 'Days 2 & 3', '8,000 / spin'],
  ['Pet advancement', 'Days 3 & 5', '50 / level'],
  ['Advanced Taming Mark', 'Days 3 & 5', '15,000 / mark'],
  ['Common Taming Mark', 'Days 3 & 5', '1,150 / mark'],
  ['Mithril used', 'Days 4 & 5', '40,000 / Mithril'],
] as const

export const kvkScoringGuide: GuideArticleDefinition = {
  slug: 'kingshot-kvk-preparation-scoring-guide',
  title: 'Kingshot KvK Preparation: Complete 5-Day Scoring Reference',
  shortTitle: 'KvK Prep Scoring',
  eyebrow: 'Event Reference · Kingdom of Power',
  summary: 'Use the supplied five-day KvK Preparation scoring table with all 32 activity rows, repeated-resource opportunities and explicit source-confidence boundaries.',
  intro: 'Forge’s supplied KvK scoring dataset records the five Preparation days and the points awarded for each listed activity. It contains 32 scored rows across City Construction, Basic Skills Up, Pet Training, Hero Development and Power Boost. This reference is designed to sit beside the broader Kingdom of Power strategy guide: the strategy guide explains how to prepare and coordinate, while this page preserves the supplied point table and the repeat opportunities visible across days.',
  theme: 'war',
  tags: ['KvK', 'Kingdom of Power', 'prep', 'scoring', 'Truegold', 'Charms', 'Mithril', 'Forgehammer', 'Hero Roulette', 'troops', 'Intel Missions', 'resource management'],
  sourceNote: 'This article is based on the supplied `kingshot-kvk-scoring` dataset, verified 18 June 2026. Its metadata cites kingshotguide.org and kingshotdata.com, describes the values as cross-verified across two independent sources, and assigns an accuracy score of 90. The source also notes that live event schedules can change. Forge preserves the source labels and units exactly rather than silently reinterpreting them.',
  alert: <><strong>Check the live event before committing a major stockpile.</strong> The supplied source carries confidence 90, not 100, and its metadata warns that live schedules can shift. Points with different units are not directly comparable: “40,000 per Mithril” and “6,000 per mission”, for example, describe different actions and should not be ranked as if they shared one denominator.</>,
  connections: [
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Use the broader strategy guide for Prep planning, Castle Battle, Field Triage and alliance coordination.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'guide', label: 'Truegold Progression', description: 'Price TG1–TG8 building requirements before deciding when a scored Truegold upgrade is worth completing.', to: '/guides/kingshot-truegold-tempered-truegold-building-guide' },
    { kind: 'guide', label: 'Governor Charms', description: 'Plan Charm Guides and Charm Designs before spending charm levels on a scored Prep day.', to: '/guides/kingshot-governor-charms-upgrade-cost-guide' },
    { kind: 'guide', label: 'Troop Training', description: 'Compare the separate T1–T5 estimated troop cost source with the KvK scoring bands recorded here.', to: '/guides/kingshot-troop-training-t1-t5-cost-time-guide' },
    { kind: 'guide', label: 'Hero Progression', description: 'Keep hero levelling and low-confidence shard estimates separate from the exact KvK scoring actions listed here.', to: '/guides/kingshot-hero-xp-shard-progression-guide' },
    { kind: 'item', label: 'Mithril', description: 'Search Companion for the Hero Gear material scored on Days 4 and 5 in this source.', to: '/companion?q=Mithril' },
    { kind: 'item', label: 'Forgehammer', description: 'Search Companion for the Hero Gear material referenced by the Day 4 and Day 5 scoring rows.', to: '/companion?q=Forgehammer' },
  ],
  sections: [
    {
      id: 'overview', eyebrow: 'Source coverage', title: 'Five Prep days, 32 scored activity rows',
      content: <>
        <p>The source contains five named days. Their action counts are 4, 6, 6, 7 and 9 respectively, for 32 total rows. Repeated activities retain the same point values wherever the exact source label repeats.</p>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>5</strong><h3>Prep days</h3><p>City Construction through Power Boost.</p></article>
          <article className="guide-article__card"><strong>32</strong><h3>Scoring rows</h3><p>Every supplied action is reproduced below.</p></article>
          <article className="guide-article__card"><strong>19</strong><h3>Distinct exact signatures</h3><p>Forge count of unique label + unit + point combinations.</p></article>
          <article className="guide-article__card"><strong>90</strong><h3>Source confidence</h3><p>Cross-verified according to the supplied metadata.</p></article>
        </div>
      </>,
    },
    {
      id: 'full-table', eyebrow: 'Governed scoring table', title: 'Every supplied KvK Preparation action',
      content: <>
        <p>Points are reproduced using the source’s own action labels and unit names. “1M” is intentionally left exactly as written in the source instead of being expanded to a different interpretation.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Day</th><th>Day name</th><th>Activity</th><th>Source unit</th><th>Points</th></tr></thead><tbody>{scoringRows.map((row, rowIndex) => <tr key={`${row[0]}-${row[2]}-${rowIndex}`}>{row.map((cell, index) => <td key={`${row[0]}-${rowIndex}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      </>,
    },
    {
      id: 'repeat-opportunities', eyebrow: 'Forge planning view', title: 'Resources and actions that repeat across days',
      content: <>
        <p>The table below is a <strong>Forge grouping of repeated source rows</strong>. It does not create new scoring rules; it simply shows where the same exact activity/point combination appears on more than one supplied day.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Activity</th><th>Appears on</th><th>Recorded rate</th></tr></thead><tbody>{repeatRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Planning implication:</strong> repeated scoring windows give you choices about when to spend a limited stockpile. They do not prove that one day is universally “best”; your live event state, other simultaneous events and account priorities still matter.</p>
      </>,
    },
    {
      id: 'troop-scoring', eyebrow: 'Day 4 detail', title: 'Troop training uses three source-defined scoring bands',
      content: <>
        <p>Hero Development records troop training at three rates: <strong>3 points per T1–T3 troop</strong>, <strong>10 points per T4–T6 troop</strong>, and <strong>30 points per T7–T10 troop</strong>.</p>
        <p>That does <strong>not</strong> extend Forge’s separate troop-cost dataset. The <Link className="guide-article__link" to="/guides/kingshot-troop-training-t1-t5-cost-time-guide">Troop Training guide</Link> only has estimated cost/time rows through T5, while this KvK source independently records scoring bands through T10. Forge keeps those scopes separate.</p>
      </>,
    },
    {
      id: 'day-focus', eyebrow: 'Day-by-day reading', title: 'What each supplied day is centred on',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Day 1</strong><h3>City Construction</h3><p>Charms, Truegold upgrades, speedups and Intel missions.</p></article>
          <article className="guide-article__card"><strong>Day 2</strong><h3>Basic Skills Up</h3><p>Truegold, speedups, Roulette, Epic/Mythic shard ascension and gathering.</p></article>
          <article className="guide-article__card"><strong>Day 3</strong><h3>Pet Training</h3><p>Pet advancement, taming marks, Charms, Roulette and Intel missions.</p></article>
          <article className="guide-article__card"><strong>Day 4</strong><h3>Hero Development</h3><p>Charms, Hero Gear materials and troop training.</p></article>
          <article className="guide-article__card"><strong>Day 5</strong><h3>Power Boost</h3><p>Pets, taming marks, Hero Gear materials, Truegold, speedups and Intel missions.</p></article>
        </div>
      </>,
    },
    {
      id: 'source-boundaries', eyebrow: 'Verification discipline', title: 'What this dataset does not tell us',
      content: <>
        <ul>
          <li>It does not provide milestone thresholds, reward chests or leaderboard cut-offs.</li>
          <li>It does not state daily point caps or spending limits.</li>
          <li>It does not provide acquisition costs for the scored materials.</li>
          <li>It does not prove that the same five-day order will never change in a future live cycle.</li>
          <li>It does not define whether similarly named Day 4 and Day 5 Forgehammer/Widget rows are mechanically identical beyond the labels and point values shown.</li>
        </ul>
        <p>Use the <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">main KvK guide</Link> for strategy and this page for the supplied scoring reference.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Before Prep begins', title: 'KvK scoring checklist',
      content: <>
        <ul>
          <li>Check the live Prep-day name and activity list against this reference.</li>
          <li>Identify resources that appear on multiple supplied days before spending them on the first opportunity.</li>
          <li>Price expensive progression actions — especially Truegold and Charms — using their connected Forge guides first.</li>
          <li>Keep the troop scoring source separate from the lower-confidence troop cost source.</li>
          <li>Do not compare point numbers across different units without considering what one unit actually costs you.</li>
          <li>Prefer an upgrade you already need over manufacturing progress solely for points.</li>
        </ul>
      </>,
    },
  ],
}
