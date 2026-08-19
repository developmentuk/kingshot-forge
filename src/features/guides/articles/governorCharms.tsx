import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const charmRows = [
  ['1', '5', '5', '9%', '9%', '205,700', '90'],
  ['2', '40', '15', '3%', '12%', '82,300', '90'],
  ['3', '60', '40', '4%', '16%', '82,000', '90'],
  ['4', '80', '100', '3%', '19%', '82,000', '90'],
  ['5', '100', '200', '6%', '25%', '124,000', '90'],
  ['6', '120', '300', '5%', '30%', '124,000', '90'],
  ['7', '140', '400', '5%', '35%', '124,000', '90'],
  ['8', '200', '400', '5%', '40%', '124,000', '90'],
  ['9', '300', '400', '5%', '45%', '124,000', '90'],
  ['10', '420', '420', '5%', '50%', '124,000', '90'],
  ['11', '560', '420', '5%', '55%', '124,000', '90'],
  ['12', '580', '600', '4%', '59%', '96,000', '90'],
  ['13', '610', '780', '4%', '63%', '96,000', '90'],
  ['14', '645', '960', '4%', '67%', '96,000', '90'],
  ['15', '685', '1,140', '4%', '71%', '96,000', '90'],
  ['16', '730', '1,320', '4%', '75%', '96,000', '90'],
  ['17', '780', '1,500', '4%', '79%', '96,000', '90'],
  ['18', '835', '1,680', '4%', '83%', '96,000', '90'],
  ['19', '895', '1,860', '4%', '87%', '96,000', '90'],
  ['20', '960', '2,040', '4%', '91%', '96,000', '90'],
  ['21', '1,030', '2,220', '4%', '95%', '96,000', '90'],
  ['22', '1,105', '2,400', '4%', '99%', '96,000', '90'],
] as const

const milestoneRows = [
  ['Lv.1', '9%', '205,700'],
  ['Lv.5', '25%', '618,000'],
  ['Lv.10', '50%', '1,238,000'],
  ['Lv.12', '59%', '1,458,000'],
  ['Lv.15', '71%', '1,746,000'],
  ['Lv.18', '83%', '2,034,000'],
  ['Lv.22', '99%', '2,376,000'],
] as const

export const governorCharmsGuide: GuideArticleDefinition = {
  slug: 'kingshot-governor-charms-upgrade-cost-guide',
  title: 'Kingshot Governor Charms: Lv.1–22 Cost, Stats & Power Guide',
  shortTitle: 'Governor Charms',
  eyebrow: 'System Guide · Governor Charms',
  summary: 'Plan all 22 Governor Charm levels with Charm Guides, Charm Designs, per-level stat increases, cumulative bonuses, power gains and source confidence.',
  intro: 'Governor Charms use two dedicated progression materials — Charm Guides and Charm Designs — across a 22-level ladder. Forge’s supplied dataset records the cost, stat increase and power gained for every level, and its stat ladder has an independent in-game checkpoint: a live profile with three Lv.12 charms shows +177.00% Lethality/Health, exactly matching 3 × the dataset’s 59% cumulative Lv.12 value. This guide preserves that evidence while keeping material and power confidence at the source’s stated level.',
  theme: 'royal',
  tags: ['Governor Charms', 'Charm Guides', 'Charm Designs', 'Lv.22', 'stats', 'power', 'F2P', 'Alliance Brawl', 'KvK', 'resource management'],
  sourceNote: 'This article uses the supplied `kingshot-governor-charm` dataset, updated 14 June 2026 and verified in April 2026. kingshot.net and kingshotguide.org agree exactly across all 22 levels for Guides, Designs, stat increases and power. The cumulative stat ladder is independently supported by an in-game profile checkpoint at Lv.12. The source keeps every row at confidence 90 rather than Verified because the two public data sources may share a feed and the material/power rows have not been independently checked in-game.',
  alert: <><strong>Confidence 90 does not mean “unreliable”.</strong> The stat ladder has a strong in-game checkpoint, but Forge preserves the source’s distinction between independently verified stats and material/power values that are cross-checked through two potentially related public sources.</>,
  connections: [
    { kind: 'item', label: 'Charm Guides', description: 'Search Forge Companion for the first material used at every Governor Charm level.', to: '/companion?q=Charm%20Guides' },
    { kind: 'item', label: 'Charm Designs', description: 'Open the Companion catalogue search for the second Governor Charm progression material.', to: '/companion?q=Charm%20Designs' },
    { kind: 'guide', label: 'Governor Gear', description: 'Compare the parallel Governor Gear progression system without mixing its Satin, Gilded Threads and Artisan’s Vision costs into Charms.', to: '/guides/kingshot-governor-gear-upgrade-cost-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Use Brawl’s gear-enhancement stage guidance before spending saved Charm materials for event overlap.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Coordinate Charm spending with the supplied KvK Prep day that includes Governor Charms and other progression materials.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'hero', label: 'Hero Companion', description: 'Keep account-wide Governor progression in context with the heroes and combat roles you are actually developing.', to: '/companion/heroes' },
  ],
  sections: [
    {
      id: 'system', eyebrow: 'Progression structure', title: 'A 22-level two-material ladder',
      content: <>
        <p>The supplied source is deliberately simple: each Governor Charm level has a Charm Guide cost, a Charm Design cost, a stat increase percentage and a power gain. Every row carries confidence 90.</p>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>22</strong><h3>Levels</h3><p>The dataset runs continuously from Lv.1 through Lv.22.</p></article>
          <article className="guide-article__card"><strong>2</strong><h3>Materials</h3><p>Charm Guides and Charm Designs are required throughout the ladder.</p></article>
          <article className="guide-article__card"><strong>99%</strong><h3>Lv.22 cumulative stat</h3><p>Forge-calculated by summing the supplied per-level stat increases.</p></article>
          <article className="guide-article__card"><strong>90</strong><h3>Confidence</h3><p>The same scored confidence applies to all 22 source rows.</p></article>
        </div>
      </>,
    },
    {
      id: 'verification', eyebrow: 'In-game checkpoint', title: 'Why Lv.12 matters to the confidence model',
      content: <>
        <p>Adding the source’s per-level stat increases from Lv.1 through Lv.12 gives <strong>59%</strong> for one charm. The dataset metadata records a live profile with three Lv.12 charms showing <strong>+177.00% Lethality/Health</strong>. Three times 59% is 177%, so that screenshot independently confirms the cumulative stat ladder through Lv.12.</p>
        <p className="guide-article__callout"><strong>What it does not prove:</strong> the screenshot does not independently verify every Charm Guide, Charm Design or power value. That is why the source retains confidence 90 rather than promoting the whole dataset to a higher verification class.</p>
      </>,
    },
    {
      id: 'materials', eyebrow: 'Full-ladder planning', title: 'How much material does one complete Lv.1→22 sequence contain?',
      content: <>
        <p>Summing the 22 supplied rows gives a <strong>Forge-calculated</strong> full-ladder total of <strong>10,880 Charm Guides</strong> and <strong>19,200 Charm Designs</strong>. The same rows sum to <strong>2,376,000 power gained</strong>.</p>
        <p>These totals are arithmetic across the source rows for one sequential charm progression. They are not pack values, event rewards, acquisition rates or a claim about how many charms a player must upgrade.</p>
        <ul>
          <li>Early levels are light on both materials: Lv.1 costs 5 Guides + 5 Designs.</li>
          <li>Design pressure grows faster in the late ladder: Lv.22 costs 1,105 Guides + 2,400 Designs.</li>
          <li>From Lv.12 onward, every supplied row adds 4 percentage points and 96,000 power, while material requirements continue rising.</li>
        </ul>
      </>,
    },
    {
      id: 'milestones', eyebrow: 'Cumulative view', title: 'Useful stat and power checkpoints',
      content: <>
        <p>The source stores <em>per-level</em> stat increases and power gains. The cumulative percentages and power below are Forge calculations made by summing the source rows through each milestone.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Level</th><th>Cumulative stat</th><th>Cumulative power gained</th></tr></thead><tbody>{milestoneRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      </>,
    },
    {
      id: 'full-table', eyebrow: 'All source rows', title: 'Complete Governor Charm cost table',
      content: <>
        <p>The “Cumulative stat” column is Forge-calculated from the supplied per-level increases. All other numeric columns below are direct source values.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Level</th><th>Charm Guides</th><th>Charm Designs</th><th>Stat increase</th><th>Cumulative stat</th><th>Power gained</th><th>Confidence</th></tr></thead><tbody>{charmRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      </>,
    },
    {
      id: 'spending', eyebrow: 'Connected event planning', title: 'Use events to improve timing, not to force an upgrade',
      content: <>
        <p>The Charm dataset contains progression costs, not event-scoring rules. Forge therefore keeps event advice separate and links it to the guides that actually document those event decisions.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Situation</th><th>Forge guidance</th></tr></thead><tbody>
          <tr><td>Alliance Brawl gear stage</td><td>Check the <Link className="guide-article__link" to="/guides/kingshot-alliance-brawl-event-guide">Alliance Brawl guide</Link> before releasing a saved Charm reserve.</td></tr>
          <tr><td>KvK Preparation</td><td>The <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">KvK guide</Link> includes Governor Charms in its Pets & Charms Prep-day context.</td></tr>
          <tr><td>Balancing account-wide Governor systems</td><td>Compare with the <Link className="guide-article__link" to="/guides/kingshot-governor-gear-upgrade-cost-guide">Governor Gear guide</Link> rather than treating Charms and Gear as one inventory.</td></tr>
        </tbody></table></div>
        <p className="guide-article__callout"><strong>Planning rule:</strong> make the upgrade because it fits your account progression, then use an event window to improve the return on that decision. Do not manufacture a bad upgrade simply because a scoring task is live.</p>
      </>,
    },
    {
      id: 'f2p', eyebrow: 'F2P planning', title: 'A practical low-spend approach',
      content: <>
        <p>The source does not prescribe a universal Charm upgrade order, so these are Forge planning principles rather than source rules:</p>
        <ol>
          <li>Know the exact next Charm level and both material requirements before spending.</li>
          <li>Track Charm Designs separately from Guides; Designs become the larger numerical requirement in the late ladder.</li>
          <li>Use cumulative milestones to decide whether the next level meaningfully advances the stat target you are chasing.</li>
          <li>Save large upgrades for a useful Brawl/KvK overlap when doing so does not delay an important account breakpoint.</li>
          <li>Do not use Governor Gear, Hero Gear or Charm material names interchangeably — they are distinct systems.</li>
        </ol>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Before upgrading', title: 'Governor Charm checklist',
      content: <>
        <ul>
          <li>Confirm the current charm level and the exact next source row.</li>
          <li>Check both Charm Guides and Charm Designs.</li>
          <li>Understand the per-level stat increase and the cumulative stat after the upgrade.</li>
          <li>Use the confidence note correctly: stats have an independent Lv.12 checkpoint; materials/power remain cross-checked rather than independently verified.</li>
          <li>Check Alliance Brawl and KvK timing if you already intend to spend.</li>
          <li>Keep Charms separate from Governor Gear and Hero Gear when budgeting materials.</li>
        </ul>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Governor Charms FAQ',
      content: <>
        <h3>How many Charm levels are in the supplied dataset?</h3><p>22, from Lv.1 through Lv.22.</p>
        <h3>What does Lv.12 reach cumulatively?</h3><p>59% for one charm by summing the supplied per-level stat increases. The source metadata says three Lv.12 charms produced +177.00% on a live profile, matching 3 × 59%.</p>
        <h3>What does Lv.22 cost?</h3><p>The source records 1,105 Charm Guides and 2,400 Charm Designs for the Lv.22 row.</p>
        <h3>What is the cumulative stat through Lv.22?</h3><p>99%, calculated by summing all 22 supplied stat increases.</p>
        <h3>How many materials are in the complete 22-row sequence?</h3><p>10,880 Charm Guides and 19,200 Charm Designs, calculated from the supplied rows.</p>
        <h3>Are the costs fully independently verified in-game?</h3><p>No. The source scores all rows at 90: two public sources agree exactly, while the stat ladder has independent in-game support but materials and power do not yet have the same independent check.</p>
      </>,
    },
  ],
}
