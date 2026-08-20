import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const buildingTotals = [
  ['Town Center', '994,100,000', '995,038,385', '198,047,660', '50,655,660', '0', '174d 11h 15m 6s'],
  ['War Academy', '405,940,000', '406,778,390', '79,418,020', '20,332,560', '0', '26d 5h 52m 41s'],
  ['Barracks', '355,470,000', '356,208,185', '70,181,485', '17,755,465', '0', '26d 5h 52m 41s'],
  ['Infirmary', '254,010,000', '254,536,860', '50,694,970', '12,563,445', '0', '24d 11h 52m 26s'],
  ['Storehouse', '222,670,000', '223,141,850', '43,994,740', '11,090,780', '0', '26d 5h 53m 11s'],
] as const

const milestoneRows = [
  ['Town Center', 'Lv.10→11', '0', '460,000', '92,000', '23,000', '6h'],
  ['War Academy', 'Lv.10→11', '0', '410,000', '82,000', '20,000', '54m'],
  ['Barracks', 'Lv.10→11', '0', '360,000', '73,000', '18,000', '54m'],
  ['Infirmary', 'Lv.10→11', '0', '260,000', '52,000', '13,000', '50m'],
  ['Storehouse', 'Lv.10→11', '0', '230,000', '46,000', '11,000', '54m'],
  ['Town Center', 'Lv.20→21', '21,000,000', '21,000,000', '4,300,000', '1,000,000', '3d 9h 50m'],
  ['War Academy', 'Lv.20→21', '8,600,000', '8,600,000', '1,700,000', '430,000', '12h 20m 30s'],
  ['Barracks', 'Lv.20→21', '7,500,000', '7,500,000', '1,500,000', '370,000', '12h 20m 30s'],
  ['Infirmary', 'Lv.20→21', '5,300,000', '5,300,000', '1,000,000', '260,000', '11h 31m'],
  ['Storehouse', 'Lv.20→21', '4,700,000', '4,700,000', '940,000', '230,000', '12h 20m 30s'],
  ['Town Center', 'Lv.25→26', '81,000,000', '81,000,000', '16,000,000', '4,000,000', '18d 8h 2m'],
  ['War Academy', 'Lv.25→26', '32,000,000', '32,000,000', '6,500,000', '1,600,000', '2d 18h 3m'],
  ['Barracks', 'Lv.25→26', '28,000,000', '28,000,000', '5,700,000', '1,400,000', '2d 18h 3m'],
  ['Infirmary', 'Lv.25→26', '20,000,000', '20,000,000', '4,000,000', '1,000,000', '2d 13h 39m'],
  ['Storehouse', 'Lv.25→26', '17,000,000', '17,000,000', '3,500,000', '890,000', '2d 18h 3m'],
  ['Town Center', 'Lv.29→30', '240,000,000', '240,000,000', '49,000,000', '12,000,000', '33d 12h 2m'],
  ['War Academy', 'Lv.29→30', '98,000,000', '98,000,000', '19,000,000', '4,900,000', '5d 33m'],
  ['Barracks', 'Lv.29→30', '86,000,000', '86,000,000', '17,000,000', '4,300,000', '5d 33m'],
  ['Infirmary', 'Lv.29→30', '61,000,000', '61,000,000', '12,000,000', '3,000,000', '4d 16h 31m'],
  ['Storehouse', 'Lv.29→30', '54,000,000', '54,000,000', '10,000,000', '2,700,000', '5d 33m'],
] as const

export const buildingProgressionGuide: GuideArticleDefinition = {
  slug: 'kingshot-building-upgrade-cost-time-guide',
  title: 'Kingshot Buildings: Lv.1–30 Upgrade Cost & Time Guide',
  shortTitle: 'Building Progression',
  eyebrow: 'System Guide · Building Progression',
  summary: 'Plan Town Center, War Academy, Barracks, Infirmary and Storehouse upgrades from Lv.1 to Lv.30 using the supplied resource and build-time data.',
  intro: 'Forge’s supplied building dataset contains five core buildings with 29 upgrade rows each, covering the steps from Lv.1 to Lv.30. Every row records Food, Wood, Stone, Iron, Gold and build time. The source does not contain prerequisite chains, unlock bonuses or building buffs, so this guide stays focused on the cost-and-time ladder and links out to Forge’s Building Planner for the full per-level planning experience.',
  theme: 'royal',
  tags: ['buildings', 'Town Center', 'War Academy', 'Barracks', 'Infirmary', 'Storehouse', 'Lv.30', 'Building Planner', 'resources', 'build time', 'KvK', 'Alliance Brawl'],
  sourceNote: 'This article is based on the supplied `kingshot-buildings` dataset, updated 14 June 2026 and verified 18 June 2026. Its provenance cites the kingshot.net building database (April 2026), gives an overall accuracy score of 78, and says most values were verified while a few level entries remain community estimates. The Town Center note specifically marks the Level 11 Stone value as estimated. The dataset is licensed CC-BY-4.0 with attribution to kingshotpro.com.',
  alert: <><strong>Scope matters:</strong> this source contains five buildings only and no prerequisite/bonus tree. Its 145 rows are resource-and-time records, not a complete statement of everything required to unlock or upgrade a building. Gold is present in the source schema but is 0 on every supplied row.</>,
  connections: [
    { kind: 'tool', label: 'Building Planner', description: 'Use Forge’s calculator for the full per-level planning workflow around these governed building costs.', to: '/calculators/buildings' },
    { kind: 'tool', label: 'Buildings Companion', description: 'Browse Forge’s building records alongside this cost-and-time guide.', to: '/buildings' },
    { kind: 'guide', label: 'Truegold Progression', description: 'Continue into the separate TG1–TG8 building material ladder after ordinary Lv.1–30 progression.', to: '/guides/kingshot-truegold-tempered-truegold-building-guide' },
    { kind: 'guide', label: 'War Academy', description: 'Keep the War Academy building cost separate from its Truegold Dust research system.', to: '/guides/kingshot-war-academy-research-truegold-dust-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Coordinate planned construction completions with Forge’s separately governed KvK strategy.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Use Brawl timing only when it improves an upgrade you already intend to make.', to: '/guides/kingshot-alliance-brawl-event-guide' },
  ],
  sections: [
    {
      id: 'coverage', eyebrow: 'Dataset coverage', title: 'Five buildings × 29 upgrade steps',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>5</strong><h3>Buildings</h3><p>Town Center, War Academy, Barracks, Infirmary and Storehouse.</p></article>
          <article className="guide-article__card"><strong>29</strong><h3>Steps each</h3><p>The source runs from Lv.1→2 through Lv.29→30.</p></article>
          <article className="guide-article__card"><strong>145</strong><h3>Source rows</h3><p>Each row records ordinary resources and raw build time.</p></article>
          <article className="guide-article__card"><strong>78</strong><h3>Accuracy score</h3><p>Most values are described as verified; some remain estimated.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Not included:</strong> prerequisites, building effects, unlock bonuses and TG1+ Truegold requirements are outside this dataset.</p>
      </>,
    },
    {
      id: 'totals', eyebrow: 'Forge calculation', title: 'Straight Lv.1→30 sums for each supplied building',
      content: <>
        <p>These totals are arithmetic across each building’s 29 source rows. They show the scale of the supplied ladder, but they are not adjusted for construction-speed buffs, alliance help, prerequisites, event bonuses or account-specific modifiers.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Building</th><th>Food</th><th>Wood</th><th>Stone</th><th>Iron</th><th>Gold</th><th>Raw build time</th></tr></thead><tbody>{buildingTotals.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>All five source ladders combined:</strong> 2,232,190,000 Food, 2,235,703,670 Wood, 442,336,875 Stone, 112,397,910 Iron, 0 Gold and 277d 16h 46m 5s of raw listed build time. This is a dataset sum, not a personal progression requirement.</p>
      </>,
    },
    {
      id: 'milestones', eyebrow: 'Planning checkpoints', title: 'How the cost pressure grows towards Lv.30',
      content: <>
        <p>The table below uses four checkpoints from the supplied 29-row ladder. It is intended as a readable guide view; the connected Building Planner remains the better place to work through individual levels.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Building</th><th>Upgrade</th><th>Food</th><th>Wood</th><th>Stone</th><th>Iron</th><th>Time</th></tr></thead><tbody>{milestoneRows.map((row) => <tr key={`${row[0]}-${row[1]}`}>{row.map((cell, index) => <td key={`${row[0]}-${row[1]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p>The source shows Town Center as the largest single commitment among these five buildings. Its Lv.29→30 row alone records 240M Food, 240M Wood, 49M Stone, 12M Iron and 33d 12h 2m of raw build time.</p>
      </>,
    },
    {
      id: 'verification', eyebrow: 'Verification boundary', title: 'Town Center Lv.11 Stone is explicitly estimated',
      content: <>
        <p>The Town Center source note says <strong>“Level 11 stone [EST]”</strong>. Forge preserves that warning instead of treating the dataset’s accuracy score as if every field had identical verification.</p>
        <p>The Lv.11→12 Town Center row records 1.3M Food, 1.3M Wood, 200,000 Stone, 65,000 Iron and 7h 30m of raw build time. If that Stone requirement affects a tight stockpile, verify it against the live game before committing resources.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>No silent correction:</strong> Forge reproduces the supplied value and its estimate warning; it does not replace it with an unsupported alternative.</p>
      </>,
    },
    {
      id: 'planning', eyebrow: 'Practical use', title: 'Use costs to plan; use the wider Forge to decide when',
      content: <>
        <ul>
          <li>Start with the exact building and target level your account actually needs.</li>
          <li>Use this guide for source-governed scale, totals and milestone pressure.</li>
          <li>Use the <Link className="guide-article__link" to="/calculators/buildings">Building Planner</Link> for the full per-level workflow rather than treating this article as a prerequisite engine.</li>
          <li>After ordinary Lv.1–30 progression, use the <Link className="guide-article__link" to="/guides/kingshot-truegold-tempered-truegold-building-guide">Truegold guide</Link> for the separate TG1–TG8 material ladder.</li>
          <li>For War Academy, keep the building cost here separate from <Link className="guide-article__link" to="/guides/kingshot-war-academy-research-truegold-dust-guide">War Academy research</Link>.</li>
          <li>Only use KvK or Alliance Brawl timing when it rewards an upgrade that already makes sense for your account.</li>
        </ul>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Building progression FAQ',
      content: <>
        <h3>Does this cover every Kingshot building?</h3><p>No. The supplied source contains exactly five buildings.</p>
        <h3>Does it include Lv.30→Truegold?</h3><p>No. This dataset covers ordinary Lv.1→30 progression. The separate Forge Truegold guide covers TG1–TG8 for its governed building set.</p>
        <h3>Why is Gold always zero?</h3><p>The source schema includes Gold, but all 145 supplied rows record 0.</p>
        <h3>Are these my actual construction times?</h3><p>They are the raw times in the supplied source. It does not model your personal construction-speed modifiers, alliance help or other reductions.</p>
        <h3>Does the source tell me which building to upgrade first?</h3><p>No. It provides costs and times, not a universal priority or prerequisite tree.</p>
      </>,
    },
  ],
}
