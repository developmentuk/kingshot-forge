import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const heroXpRows = [
  [1, 0, 65],
  [2, 480, 140],
  [3, 690, 220],
  [4, 920, 305],
  [5, 1200, 400],
  [6, 1500, 500],
  [7, 1800, 605],
  [8, 2200, 720],
  [9, 2600, 840],
  [10, 3100, 970],
  [11, 3800, 1100],
  [12, 4200, 1240],
  [13, 5100, 1390],
  [14, 5700, 1540],
  [15, 6800, 1700],
  [16, 7800, 1870],
  [17, 8900, 2050],
  [18, 10000, 2240],
  [19, 12000, 2440],
  [20, 13000, 2650],
  [21, 14000, 2870],
  [22, 15000, 3100],
  [23, 16000, 3340],
  [24, 17000, 3590],
  [25, 18000, 3850],
  [26, 19000, 4120],
  [27, 20000, 4400],
  [28, 21000, 4690],
  [29, 22000, 4990],
  [30, 24000, 5300],
  [31, 26000, 5620],
  [32, 28000, 5950],
  [33, 30000, 6290],
  [34, 32000, 6640],
  [35, 36000, 7000],
  [36, 40000, 7170],
  [37, 44000, 7340],
  [38, 48000, 7510],
  [39, 52000, 7680],
  [40, 58000, 7775],
  [41, 64000, 8070],
  [42, 70000, 8365],
  [43, 76000, 8655],
  [44, 82000, 8950],
  [45, 90000, 9245],
  [46, 98000, 9540],
  [47, 100000, 9835],
  [48, 110000, 10130],
  [49, 120000, 10425],
  [50, 130000, 10630],
  [51, 140000, 10925],
  [52, 150000, 11140],
  [53, 160000, 11340],
  [54, 170000, 11525],
  [55, 190000, 11700],
  [56, 210000, 11875],
  [57, 230000, 12050],
  [58, 250000, 12225],
  [59, 270000, 12400],
  [60, 300000, 12575],
  [61, 330000, 12750],
  [62, 360000, 12925],
  [63, 390000, 13100],
  [64, 420000, 13275],
  [65, 470000, 13450],
  [66, 520000, 13625],
  [67, 570000, 13800],
  [68, 620000, 13975],
  [69, 670000, 14150],
  [70, 770000, 14325],
  [71, 870000, 14500],
  [72, 970000, 14675],
  [73, 1000000, 14850],
  [74, 1100000, 15025],
  [75, 1300000, 15200],
  [76, 1500000, 15375],
  [77, 1700000, 15550],
  [78, 1900000, 15725],
  [79, 2100000, 15900],
  [80, 2400000, 16075],
] as const

const milestoneRows = [
  ['Lv.10', '3,100', '14,490', '970'],
  ['Lv.15', '6,800', '40,090', '1,700'],
  ['Lv.20', '13,000', '91,790', '2,650'],
  ['Lv.30', '24,000', '277,790', '5,300'],
  ['Lv.40', '58,000', '671,790', '7,775'],
  ['Lv.50', '130,000', '1,611,790', '10,630'],
  ['Lv.60', '300,000', '3,681,790', '12,575'],
  ['Lv.70', '770,000', '8,801,790', '14,325'],
  ['Lv.80', '2,400,000', '23,641,790', '16,075'],
] as const

const shardRows = [
  ['1', '10', '15', '20'],
  ['2', '20', '30', '50'],
  ['3', '40', '60', '100'],
  ['4', '80', '120', '200'],
  ['5', '160', '240', '400'],
  ['6', '320', '480', '800'],
  ['7', '600', '900', '1,500'],
  ['8', '1,000', '1,500', '2,500'],
  ['9', '1,500', '2,200', '4,000'],
  ['10', '2,500', '3,500', '6,500'],
] as const

export const heroProgressionGuide: GuideArticleDefinition = {
  slug: 'kingshot-hero-xp-shard-progression-guide',
  title: 'Kingshot Hero Progression: Lv.1–80 XP & Shard Cost Guide',
  shortTitle: 'Hero Progression',
  eyebrow: 'System Guide · Hero Progression',
  summary: 'Plan hero levels 1–80 with the supplied XP curve, deployment-capacity data and a clearly separated low-confidence shard estimate table.',
  intro: 'Hero progression has two different cost questions: how much Hero XP is needed to reach the next level, and how many shards are needed for star-up progression. Forge’s supplied sources cover both, but at very different confidence levels. The 80-level XP table is the stronger dataset. The shard ladder is explicitly a community estimate and is therefore presented as a planning reference, not a verified in-game cost schedule.',
  theme: 'royal',
  tags: ['heroes', 'Hero XP', 'hero shards', 'Lv.80', 'star-up', 'deployment capacity', 'F2P', 'progression', 'resource management'],
  sourceNote: 'Hero XP data comes from the supplied `kingshot-hero-xp` dataset, updated 14 June 2026 and verified 18 June 2026, with accuracy score 70. Its provenance states that XP values were verified from kingshot-data.com, while deployment capacity was verified only for levels 1–15 and estimated for levels 16–80. Shard data comes from the separate supplied `kingshot-hero-shards` dataset with accuracy score 45; its provenance explicitly labels the values as community estimates that should be verified in-game. Both supplied files carry CC-BY-4.0 attribution to KingshotPro.',
  alert: <><strong>Do not treat every number on this page as equally verified.</strong> XP values are the strongest part of the source. Deployment capacity after Lv.15 is estimated, and every shard-cost row is community-estimated.</>,
  connections: [
    { kind: 'tool', label: 'Hero Companion', description: 'Open Forge’s governed hero catalogue before deciding which heroes deserve scarce XP and shards.', to: '/companion/heroes' },
    { kind: 'guide', label: 'Generation 6 Heroes', description: 'Compare Yang, Sophia and Triton before committing major progression resources.', to: '/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide' },
    { kind: 'guide', label: 'Generation 7 Heroes', description: 'Use the Ava, Charles and Wee & Woo skill guide alongside this cost reference.', to: '/guides/kingshot-generation-7-heroes-ava-charles-wee-woo-guide' },
    { kind: 'guide', label: 'Champagne Fair', description: 'The supplied Champagne Fair guide covers exchanging surplus hero shards and other hero materials for Fair Vouchers.', to: '/guides/kingshot-champagne-fair-guide' },
  ],
  sections: [
    {
      id: 'source-boundary', eyebrow: 'Confidence first', title: 'Three data layers, three different trust levels',
      content: <>
        <div className="guide-article__grid guide-article__grid--three">
          <article className="guide-article__card"><strong>70</strong><h3>Hero XP dataset</h3><p>All 80 XP rows are source-backed and form the core of this guide.</p></article>
          <article className="guide-article__card"><strong>Lv.1–15</strong><h3>Capacity verified</h3><p>The source says deployment capacity is verified only through level 15.</p></article>
          <article className="guide-article__card"><strong>45</strong><h3>Shard dataset</h3><p>The shard ladder is explicitly marked as community-estimated and should be checked in-game.</p></article>
        </div>
        <p>Forge keeps these layers separate so an estimated deployment-capacity or shard value cannot inherit the stronger confidence of the XP table simply by appearing beside it.</p>
      </>,
    },
    {
      id: 'xp-milestones', eyebrow: 'XP planning', title: 'Where the level curve becomes expensive',
      content: <>
        <p>The source field is <code>xpToReach</code>. Forge’s cumulative column below is a straight sum of those supplied rows from Lv.1 through the stated milestone. It is a derived planning number rather than an additional source field.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Milestone</th><th>XP row</th><th>Forge cumulative sum</th><th>Deployment capacity</th></tr></thead><tbody>{milestoneRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Scale:</strong> summing all supplied <code>xpToReach</code> rows through Lv.80 gives 23,641,790 XP. More than half of that total sits in the final ten levels, so taking several heroes deep into the curve is materially different from spreading early levels across a roster.</p>
      </>,
    },
    {
      id: 'full-xp-table', eyebrow: 'Complete source table', title: 'Hero XP and deployment capacity, Lv.1–80',
      content: <>
        <p>Rows 1–15 show source-verified deployment capacity. From Lv.16 onward the capacity column is an estimate according to the dataset metadata, even though the XP row remains source-backed.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Level</th><th>XP to reach</th><th>Deployment capacity</th><th>Capacity status</th></tr></thead><tbody>{heroXpRows.map(([level, xp, capacity]) => <tr key={level}><td>{level}</td><td>{xp.toLocaleString()}</td><td>{capacity.toLocaleString()}</td><td>{level <= 15 ? 'Verified in source' : 'Estimated in source'}</td></tr>)}</tbody></table></div>
      </>,
    },
    {
      id: 'deployment-capacity', eyebrow: 'Use estimates carefully', title: 'Deployment capacity is not equally certain across the curve',
      content: <>
        <p>The source specifically says capacity values were verified for levels 1–15 and estimated for levels 16–80. That means Lv.80’s listed 16,075 capacity is useful for rough planning, but Forge does not present it as a confirmed live-game value.</p>
        <ul>
          <li>Use Lv.1–15 capacity figures as the stronger reference.</li>
          <li>Use Lv.16–80 capacity figures to understand the shape of the source model, not as exact account-planning guarantees.</li>
          <li>If capacity is the reason for a major XP spend, confirm the live hero screen before committing.</li>
        </ul>
      </>,
    },
    {
      id: 'shards', eyebrow: 'Low-confidence planning layer', title: 'Community-estimated shard costs by source tier',
      content: <>
        <p>The shard file groups costs by Epic, Legendary and Mythic rarity and labels progression rows as tiers 1–10. The source title describes these as star-up costs, but it does not provide a richer star-segment model in this file. Forge therefore preserves the tier numbering exactly rather than inventing half-star or sub-stage labels.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Source tier</th><th>Epic shards</th><th>Legendary shards</th><th>Mythic shards</th></tr></thead><tbody>{shardRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Confidence 45:</strong> a straight Forge sum of all ten estimated rows is 6,230 Epic, 9,045 Legendary or 16,070 Mythic shards. Those totals are arithmetic over a community-estimated source, not independently verified max-star requirements.</p>
      </>,
    },
    {
      id: 'planning', eyebrow: 'Practical progression', title: 'Spend on a plan, not on an available red dot',
      content: <>
        <p>The datasets tell us costs; they do not tell us which hero is best for your account. Use Forge’s hero records and generation guides to make that choice first, then use this page to understand the cost pressure.</p>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Levels first</strong><h3>Prioritise active heroes</h3><p>Because XP rises sharply late in the curve, spreading every hero toward Lv.80 can consume a large stockpile without improving your strongest line-up efficiently.</p></article>
          <article className="guide-article__card"><strong>Shards second</strong><h3>Treat the table as provisional</h3><p>Use the shard rows only for rough reserve planning and confirm the live requirement before a large star-up.</p></article>
          <article className="guide-article__card"><strong>Surplus materials</strong><h3>Check Champagne Fair</h3><p>The supplied Fair guide explicitly covers exchanging surplus hero shards and related materials, so avoid assuming every spare shard must stay idle forever.</p></article>
          <article className="guide-article__card"><strong>Hero context</strong><h3>Use the Companion</h3><p><Link className="guide-article__link" to="/companion/heroes">Compare governed hero records</Link> before deciding where expensive late-level XP belongs.</p></article>
        </div>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Hero progression FAQ',
      content: <>
        <h3>How much XP does the source list for Lv.80?</h3><p>The Lv.80 row is 2,400,000 XP. Summing all supplied rows from Lv.1 through Lv.80 gives 23,641,790 XP as a Forge-derived cumulative total.</p>
        <h3>Is Lv.80 deployment capacity confirmed?</h3><p>No. The supplied dataset lists 16,075, but its own provenance says capacity is estimated from Lv.16 onward.</p>
        <h3>Are the shard costs verified?</h3><p>No. The supplied shard dataset has accuracy score 45 and explicitly calls the values community estimates.</p>
        <h3>Does the source define half-star stages?</h3><p>Not in this file. It provides ten numbered tiers for each rarity, so Forge preserves those tiers without adding an unsupported stage model.</p>
      </>,
    },
  ],
}
