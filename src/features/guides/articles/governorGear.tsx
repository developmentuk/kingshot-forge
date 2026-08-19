import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const upgradeRows = [
  ['Green', '0★', '1,500', '15', '—', '9.35%', '224,400', '99'],
  ['Green', '1★', '3,800', '40', '—', '12.75%', '306,000', '99'],
  ['Blue', '0★', '7,000', '70', '—', '17.00%', '408,000', '99'],
  ['Blue', '1★', '9,700', '95', '—', '21.25%', '510,000', '99'],
  ['Blue', '2★', '1,000', '10', '45', '25.50%', '612,000', '99'],
  ['Blue', '3★', '1,000', '10', '50', '29.75%', '714,000', '99'],
  ['Purple', '0★', '1,500', '15', '60', '34.00%', '816,000', '99'],
  ['Purple', '1★', '1,500', '15', '70', '36.89%', '885,360', '99'],
  ['Purple', '2★', '6,500', '65', '40', '39.78%', '954,720', '99'],
  ['Purple', '3★', '8,000', '80', '50', '42.67%', '1,024,080', '99'],
  ['Purple T1', '0★', '10,000', '95', '60', '45.56%', '1,093,440', '99'],
  ['Purple T1', '1★', '11,000', '110', '70', '48.45%', '1,162,800', '99'],
  ['Purple T1', '2★', '13,000', '130', '85', '51.34%', '1,232,160', '99'],
  ['Purple T1', '3★', '15,000', '160', '100', '54.23%', '1,301,520', '99'],
  ['Gold', '0★', '22,000', '220', '40', '56.78%', '1,362,720', '99'],
  ['Gold', '1★', '23,000', '230', '40', '59.33%', '1,423,920', '99'],
  ['Gold', '2★', '25,000', '250', '45', '61.88%', '1,485,120', '99'],
  ['Gold', '3★', '26,000', '260', '45', '64.43%', '1,546,320', '99'],
  ['Gold T1', '0★', '28,000', '280', '45', '66.98%', '1,607,520', '99'],
  ['Gold T1', '1★', '30,000', '300', '55', '69.53%', '1,668,720', '99'],
  ['Gold T1', '2★', '32,000', '320', '55', '72.08%', '1,729,920', '99'],
  ['Gold T1', '3★', '35,000', '340', '55', '74.63%', '1,791,120', '99'],
  ['Gold T2', '0★', '38,000', '390', '55', '77.18%', '1,852,320', '99'],
  ['Gold T2', '1★', '43,000', '430', '75', '79.73%', '1,913,520', '99'],
  ['Gold T2', '2★', '45,000', '460', '80', '82.28%', '1,974,720', '99'],
  ['Gold T2', '3★', '48,000', '500', '85', '84.83%', '2,040,000', '99'],
  ['Gold T3', '0★', '60,000', '600', '120', '87.38%', '2,097,120', '99'],
  ['Gold T3', '1★', '70,000', '700', '140', '89.93%', '2,158,320', '99'],
  ['Gold T3', '2★', '80,000', '800', '160', '92.48%', '2,219,520', '99'],
  ['Gold T3', '3★', '90,000', '900', '180', '95.00%', '2,280,000', '99'],
  ['Red', '0★', '108,000', '1,080', '220', '97.50%', '2,340,000', '99'],
  ['Red', '1★', '114,000', '1,140', '230', '100.00%', '2,400,000', '99'],
  ['Red', '2★', '121,000', '1,210', '240', '102.50%', '2,460,000', '99'],
  ['Red', '3★', '128,000', '1,280', '250', '105.00%', '2,520,000', '99'],
  ['Red T1', '0★', '154,000', '1,540', '300', '107.50%', '2,580,000', '99'],
  ['Red T1', '1★', '163,000', '1,630', '320', '110.00%', '2,640,000', '99'],
  ['Red T1', '2★', '173,000', '1,730', '340', '112.50%', '2,700,000', '99'],
  ['Red T1', '3★', '183,000', '1,830', '360', '115.00%', '2,760,000', '99'],
  ['Red T2', '0★', '220,000', '2,200', '430', '117.50%', '2,820,000', '99'],
  ['Red T2', '1★', '233,000', '2,330', '460', '120.00%', '2,880,000', '99'],
  ['Red T2', '2★', '247,000', '2,470', '490', '122.50%', '2,940,000', '99'],
  ['Red T2', '3★', '264,000', '2,640', '520', '125.00%', '3,000,000', '99'],
  ['Red T3', '0★', '288,000', '2,880', '570', '127.75%', '3,066,000', '91'],
  ['Red T3', '1★', '302,000', '3,020', '600', '130.50%', '3,132,000', '91'],
  ['Red T3', '2★', '317,000', '3,170', '630', '133.25%', '3,198,000', '91'],
  ['Red T3', '3★', '333,000', '3,330', '660', '136.00%', '3,264,000', '91'],
  ['Red T4', '0★', '358,000', '3,580', '720', '138.75%', '3,330,000', '91'],
  ['Red T4', '1★', '384,000', '3,840', '770', '141.50%', '3,396,000', '91'],
  ['Red T4', '2★', '403,000', '4,030', '810', '144.25%', '3,462,000', '91'],
  ['Red T4', '3★', '423,000', '4,230', '850', '147.00%', '3,528,000', '91'],
  ['Red T5', '0★', '451,000', '4,510', '910', '150.00%', '3,600,000', '87'],
  ['Red T5', '1★', '479,000', '4,790', '970', '153.00%', '3,672,000', '87'],
  ['Red T5', '2★', '507,000', '5,070', '1,030', '156.00%', '3,744,000', '87'],
  ['Red T5', '3★', '535,000', '5,350', '1,090', '159.00%', '3,816,000', '87'],
  ['Red T6', '0★', '548,000', '5,480', '1,110', '162.00%', '3,888,000', '87'],
  ['Red T6', '1★', '565,000', '5,650', '1,140', '165.00%', '3,960,000', '87'],
  ['Red T6', '2★', '582,000', '5,820', '1,170', '168.00%', '4,032,000', '87'],
  ['Red T6', '3★', '599,000', '5,990', '1,210', '171.00%', '4,104,000', '87'],
] as const

const milestoneRows = [
  ['Green 1★', '12.75%', '306,000', '99'],
  ['Blue 3★', '29.75%', '714,000', '99'],
  ['Purple T1 3★', '54.23%', '1,301,520', '99'],
  ['Gold T3 3★', '95.00%', '2,280,000', '99'],
  ['Red 3★', '105.00%', '2,520,000', '99'],
  ['Red T2 3★', '125.00%', '3,000,000', '99'],
  ['Red T4 3★', '147.00%', '3,528,000', '91'],
  ['Red T6 3★', '171.00%', '4,104,000', '87'],
] as const

export const governorGearGuide: GuideArticleDefinition = {
  slug: 'kingshot-governor-gear-upgrade-cost-guide',
  title: 'Kingshot Governor Gear: Complete Upgrade Cost & Progression Guide',
  shortTitle: 'Governor Gear',
  eyebrow: 'System Guide · Governor Gear',
  summary: 'Plan all 58 Governor Gear upgrade steps from Green to Red T6, including Satin, Gilded Threads, Artisan’s Vision, stat milestones, power and source confidence.',
  intro: 'Governor Gear progresses through a long rarity-and-star ladder, and the material pressure changes sharply as you move from early Satin and Gilded Threads into Artisan’s Vision-heavy Red tiers. Forge’s supplied dataset contains 58 upgrade steps from Green to Red T6, with cumulative Attack/Defence bonuses, per-piece gear power and a confidence score for every row. This guide preserves that full ladder while separating source values from Forge-calculated totals and planning advice.',
  theme: 'war',
  tags: ['Governor Gear', 'Satin', 'Gilded Threads', 'Artisan’s Vision', 'Red T6', 'gear', 'F2P', 'Alliance Brawl', 'KvK', 'resource management', 'power'],
  sourceNote: 'This article uses the supplied `kingshot-governor-gear` dataset, updated and verified on 18 June 2026. The source says kingshot.net and kingshotguide.org agree exactly on the full ladder, while the structurally independent kingshot-data.com corroborates Green through Red T2. The newer Red T3–T4 values have a source conflict and therefore score 91; Red T5–T6 score 87 because they rely on newer corroborating tables without independent in-game confirmation. Green through Red T2 score 99.',
  alert: <><strong>Do not treat every Red-tier number as equally verified.</strong> Green → Red T2 is the strongest part of the supplied dataset. Red T3–T4 is confirmed by current tables but conflicts with an older independent source, while Red T5–T6 still needs live in-game confirmation.</>,
  connections: [
    { kind: 'item', label: 'Satin', description: 'Search Forge Companion for one of the two materials used from the very first Governor Gear step.', to: '/companion?q=Satin' },
    { kind: 'item', label: 'Gilded Threads', description: 'Open the Companion search for the second core material used throughout the progression ladder.', to: '/companion?q=Gilded%20Threads' },
    { kind: 'item', label: 'Artisan’s Vision', description: 'Search the Companion catalogue for the material that enters at Blue 2★ and becomes a major late-game bottleneck.', to: '/companion?q=Artisan%27s%20Vision' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Use the connected Brawl guide before spending Governor Gear materials during gear-scoring stages.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Compare your broader resource reserve with KvK Prep priorities before emptying high-value progression materials.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'hero', label: 'Hero Companion', description: 'Keep Governor Gear investment in context with the heroes and combat roles your account is actually building.', to: '/companion/heroes' },
  ],
  sections: [
    {
      id: 'ladder', eyebrow: 'Progression structure', title: 'The complete rarity ladder',
      content: <>
        <p>The supplied dataset defines this order: <strong>Green → Blue → Purple → Purple T1 → Gold → Gold T1 → Gold T2 → Gold T3 → Red → Red T1 → Red T2 → Red T3 → Red T4 → Red T5 → Red T6</strong>.</p>
        <p>Green contains 0★ and 1★ only. Every later tier contains 0★ through 3★, producing 58 recorded upgrade steps in total.</p>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>58</strong><h3>Upgrade steps</h3><p>Every source row is represented in the table below.</p></article>
          <article className="guide-article__card"><strong>15</strong><h3>Named tiers</h3><p>From Green through Red T6.</p></article>
          <article className="guide-article__card"><strong>3</strong><h3>Materials</h3><p>Satin, Gilded Threads and Artisan’s Vision.</p></article>
          <article className="guide-article__card"><strong>99 → 87</strong><h3>Confidence range</h3><p>Confidence decreases only in the newest Red tiers.</p></article>
        </div>
      </>,
    },
    {
      id: 'materials', eyebrow: 'Material pressure', title: 'When each material starts to matter',
      content: <>
        <ul>
          <li><strong>Satin</strong> and <strong>Gilded Threads</strong> are present from Green 0★ and remain required throughout the entire ladder.</li>
          <li><strong>Artisan’s Vision</strong> first appears at Blue 2★ with a source cost of 45, then remains part of later progression.</li>
          <li>By Red T6 3★, the single source row is 599,000 Satin, 5,990 Gilded Threads and 1,210 Artisan’s Vision.</li>
        </ul>
        <p className="guide-article__callout"><strong>Forge-calculated dataset total:</strong> adding all 58 source rows produces 9,967,500 Satin, 99,710 Gilded Threads and 20,305 Artisan’s Vision. That is a sum of the dataset’s step costs, not a statement about event rewards, packs or how quickly a player can obtain them.</p>
      </>,
    },
    {
      id: 'milestones', eyebrow: 'Stat & power milestones', title: 'How the recorded bonuses grow',
      content: <>
        <p>The source describes Attack and Defence as cumulative percentages and `power_total` as the cumulative gear-power contribution of one piece. It explicitly notes that a uniformly upgraded six-piece set would be six times the per-piece power figure.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Milestone</th><th>Attack / Defence</th><th>Power per piece</th><th>Confidence</th></tr></thead><tbody>{milestoneRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p>At Red T6 3★, the source records 4,104,000 power for one piece. Applying the source’s ×6 full-set rule gives 24,624,000 gear power for six pieces at that same step.</p>
      </>,
    },
    {
      id: 'full-table', eyebrow: 'All source rows', title: 'Complete Governor Gear upgrade table',
      content: <>
        <p>Material columns show the cost recorded for that individual upgrade row. Attack and Defence are equal at every supplied step, so the table shows the shared cumulative percentage once.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Tier</th><th>Stars</th><th>Satin</th><th>Gilded Threads</th><th>Artisan’s Vision</th><th>Attack / Defence</th><th>Power per piece</th><th>Confidence</th></tr></thead><tbody>{upgradeRows.map((row, rowIndex) => <tr key={`${row[0]}-${row[1]}-${rowIndex}`}>{row.map((cell, index) => <td key={`${rowIndex}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      </>,
    },
    {
      id: 'confidence', eyebrow: 'Verification boundary', title: 'Why Red T3+ needs extra care',
      content: <>
        <h3>Green → Red T2: confidence 99</h3><p>The source says two current tables agree and an independent older source corroborates this range, including an in-game Red T2 +117.50% checkpoint.</p>
        <h3>Red T3 → Red T4: confidence 91</h3><p>Current tables agree, but the independent older source diverges in the newest progression range. The supplied dataset chooses the newer values and flags the conflict rather than hiding it.</p>
        <h3>Red T5 → Red T6: confidence 87</h3><p>These are the newest rows. They are internally consistent and supported by the current tables, but the source explicitly says they still need independent in-game confirmation.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Player action:</strong> if a Red T3+ upgrade would consume nearly all of your reserve, compare the live upgrade screen with Forge before spending. That is exactly where the source confidence tells us verification is most valuable.</p>
      </>,
    },
    {
      id: 'strategy', eyebrow: 'Upgrade strategy', title: 'Upgrade for account value, then use events to improve the timing',
      content: <>
        <p>The gear dataset tells us costs and progression values; it does not define a universal “best” spending schedule. Forge therefore treats event overlap as a timing bonus rather than a reason to make a bad upgrade.</p>
        <ul>
          <li>Choose the Governor Gear upgrade because it improves the account you are building.</li>
          <li>Check <Link className="guide-article__link" to="/guides/kingshot-alliance-brawl-event-guide">Alliance Brawl</Link> before spending if Governor Gear advancement is part of the live stage.</li>
          <li>Protect your wider <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">KvK reserve</Link> when multiple progression events compete for the same stockpile.</li>
          <li>Do not confuse Governor Gear with Hero Gear: Mithril and Forgehammers belong to the Hero Gear system, while this dataset is Satin, Gilded Threads and Artisan’s Vision.</li>
        </ul>
      </>,
    },
    {
      id: 'f2p', eyebrow: 'F2P planning', title: 'A practical low-spend approach',
      content: <>
        <p>The source does not prescribe an F2P build order, so the following is Forge planning guidance rather than a data claim:</p>
        <ol>
          <li>Know the exact next row you are targeting before spending materials.</li>
          <li>Track Artisan’s Vision separately once you approach Blue 2★; late tiers require hundreds to more than a thousand per row.</li>
          <li>Avoid scattering scarce materials across upgrades simply because an event is active.</li>
          <li>When you reach Red T3+, confirm the live cost if your reserve is tight because confidence is lower than the older ladder.</li>
          <li>Use event overlap to reward an upgrade you already intended to make, not to create one.</li>
        </ol>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Before upgrading', title: 'Governor Gear checklist',
      content: <>
        <ul>
          <li>Confirm the current tier and star of the specific gear piece.</li>
          <li>Read the next row’s Satin, Gilded Threads and Artisan’s Vision requirements.</li>
          <li>Check the cumulative Attack/Defence and power milestone you are buying.</li>
          <li>If the target is Red T3+, compare the live game screen with the source value.</li>
          <li>Check whether Brawl or KvK timing makes spending now more efficient.</li>
          <li>Keep Governor Gear and Hero Gear inventories separate when planning.</li>
        </ul>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Governor Gear FAQ',
      content: <>
        <h3>How many Governor Gear upgrade steps are in the supplied dataset?</h3><p>58, from Green 0★ through Red T6 3★.</p>
        <h3>When does Artisan’s Vision first appear?</h3><p>Blue 2★, where the source records 45 Artisan’s Vision.</p>
        <h3>What is the Red T6 3★ source cost?</h3><p>599,000 Satin, 5,990 Gilded Threads and 1,210 Artisan’s Vision.</p>
        <h3>What bonus does Red T6 3★ record?</h3><p>171.00% cumulative Attack and 171.00% cumulative Defence, with 4,104,000 power per piece.</p>
        <h3>Are the newest Red tiers fully verified?</h3><p>No. Red T3–T4 score 91 and Red T5–T6 score 87 in the supplied confidence model; both ranges need more live-client confirmation than Green through Red T2.</p>
        <h3>Is Governor Gear the same as Hero Gear?</h3><p>No. This guide is the Governor Gear ladder using Satin, Gilded Threads and Artisan’s Vision.</p>
      </>,
    },
  ],
}
