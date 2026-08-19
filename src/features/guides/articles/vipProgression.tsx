import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const vipRows = [
  ['1', '0', '0'],
  ['2', '2,500', '5,000'],
  ['3', '5,000', '10,000'],
  ['4', '12,500', '25,000'],
  ['5', '30,000', '60,000'],
  ['6', '40,000', '80,000'],
  ['7', '60,000', '120,000'],
  ['8', '100,000', '200,000'],
  ['9', '350,000', '700,000'],
  ['10', '600,000', '1,200,000'],
  ['11', '1,200,000', '2,400,000'],
  ['12', '2,400,000', '4,800,000'],
] as const

export const vipProgressionGuide: GuideArticleDefinition = {
  slug: 'kingshot-vip-1-12-xp-gem-cost-guide',
  title: 'Kingshot VIP 1–12: VIP XP & Gem-Equivalent Cost Guide',
  shortTitle: 'VIP Progression',
  eyebrow: 'System Guide · VIP',
  summary: 'Plan VIP 1–12 using the supplied VIP XP requirements and exact 1 VIP point = 2 gems conversion, with source limits kept explicit.',
  intro: 'Kingshot Forge’s supplied VIP dataset contains one narrow but useful progression truth: the VIP XP recorded for Levels 1–12 and the exact gem-equivalent conversion at 2 gems for every 1 VIP point. It does not contain a VIP benefits, rewards or unlock table, so this guide stays focused on cost planning rather than inventing what each level grants.',
  theme: 'royal',
  tags: ['VIP', 'VIP 12', 'VIP XP', 'Gems', 'progression', 'gem budgeting', 'resource planning'],
  sourceNote: 'This article uses the supplied `kingshot-vip` dataset, updated 14 June 2026 and verified 18 June 2026. Its provenance note records an accuracy score of 90 and says the VIP XP values were cross-checked across kingshot.net, Kingshot Mastery, LootBar and LDShop. The dataset explicitly states the conversion rule: 1 VIP point = 2 gems.',
  alert: <><strong>This is a cost guide, not a benefits guide.</strong> The supplied dataset does not define the buffs, daily rewards, unlocks, free chests or other benefits attached to VIP Levels 1–12. Forge therefore does not publish those claims here.</>,
  connections: [
    { kind: 'item', label: 'Governor Rename Card', description: 'A separate governed Companion record showing another current Gem decision: the card avoids the normal 400-Gem rename cost.', to: '/companion/items/governor-rename-card' },
    { kind: 'guide', label: 'Governor Gear', description: 'Compare another long-term account progression system with a fully governed material ladder.', to: '/guides/kingshot-governor-gear-upgrade-cost-guide' },
    { kind: 'guide', label: 'Governor Charms', description: 'Plan the separate Lv.1–22 Charm material and stat progression ladder.', to: '/guides/kingshot-governor-charms-upgrade-cost-guide' },
    { kind: 'guide', label: 'Truegold Progression', description: 'Compare VIP gem planning with the governed TG1–TG8 building progression system.', to: '/guides/kingshot-truegold-tempered-truegold-building-guide' },
  ],
  sections: [
    {
      id: 'conversion', eyebrow: 'Core rule', title: 'The dataset uses a fixed 1:2 VIP-to-Gem conversion',
      content: <>
        <p>The supplied source defines <strong>1 VIP point = 2 gems</strong>. Every gem-equivalent value in the table is therefore exactly double its corresponding VIP XP figure.</p>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>12</strong><h3>VIP levels</h3><p>The source covers VIP 1 through VIP 12.</p></article>
          <article className="guide-article__card"><strong>2×</strong><h3>Gem conversion</h3><p>Two gems for every one VIP point.</p></article>
          <article className="guide-article__card"><strong>90</strong><h3>Source score</h3><p>The supplied provenance marks this dataset at accuracy score 90.</p></article>
          <article className="guide-article__card"><strong>VIP 12</strong><h3>Top supplied level</h3><p>The source does not extend beyond Level 12.</p></article>
        </div>
      </>,
    },
    {
      id: 'table', eyebrow: 'All supplied rows', title: 'VIP 1–12 XP and Gem-equivalent table',
      content: <>
        <p>The values below are copied from the supplied dataset. Forge has not reinterpreted them as benefit values, event costs or recommended Gem spending.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>VIP level</th><th>XP recorded to reach level</th><th>Gem equivalent</th></tr></thead><tbody>{vipRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      </>,
    },
    {
      id: 'curve', eyebrow: 'Planning view', title: 'Where the supplied cost curve becomes steep',
      content: <>
        <p>The table is relatively compact through VIP 8, where the source row is 100,000 VIP XP / 200,000 gems. The next four supplied levels rise sharply:</p>
        <ul>
          <li><strong>VIP 9:</strong> 350,000 VIP XP / 700,000 gems.</li>
          <li><strong>VIP 10:</strong> 600,000 VIP XP / 1,200,000 gems.</li>
          <li><strong>VIP 11:</strong> 1,200,000 VIP XP / 2,400,000 gems.</li>
          <li><strong>VIP 12:</strong> 2,400,000 VIP XP / 4,800,000 gems.</li>
        </ul>
        <p className="guide-article__callout"><strong>Planning interpretation:</strong> the gem-equivalent column tells you the mathematical value of the recorded VIP XP at the source’s 1:2 conversion. It does not say spending Gems is the best or only way to gain VIP XP.</p>
      </>,
    },
    {
      id: 'budgeting', eyebrow: 'Gem budgeting', title: 'Do not confuse “gem equivalent” with “recommended spend”',
      content: <>
        <p>The supplied data is a conversion table. It does not describe VIP XP acquisition routes, free daily VIP gain, paid packs, subscriptions, events or the relative value of spending Gems elsewhere.</p>
        <p>That means Forge can safely answer “what Gem value corresponds to this VIP XP row?” but not “should I spend Gems to reach this VIP level?” from this dataset alone.</p>
        <p>For a separate governed Gem-use example, the <Link className="guide-article__link" to="/companion/items/governor-rename-card">Governor Rename Card</Link> record documents a current 400-Gem rename alternative when no card is available. That is a different system and is linked only to help players think about competing Gem uses.</p>
      </>,
    },
    {
      id: 'limits', eyebrow: 'Source boundary', title: 'What this VIP dataset does not establish',
      content: <>
        <ul>
          <li>No VIP benefit or buff list.</li>
          <li>No daily chest/reward table.</li>
          <li>No construction, training, march, combat or resource bonuses.</li>
          <li>No VIP activation duration or subscription mechanics.</li>
          <li>No acquisition-rate table for free or paid VIP XP.</li>
          <li>No levels beyond VIP 12.</li>
        </ul>
        <p>Those details need a separate governed source before Forge should publish them.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Before spending', title: 'VIP planning checklist',
      content: <>
        <ol>
          <li>Find your target VIP level in the 1–12 source table.</li>
          <li>Read the recorded VIP XP requirement rather than estimating from a neighbouring tier.</li>
          <li>Use the exact ×2 conversion only when you need the Gem-equivalent value.</li>
          <li>Do not treat the equivalent as a recommendation to spend that many Gems.</li>
          <li>Check other planned Gem uses before making an irreversible spend.</li>
          <li>If you need VIP benefits or acquisition routes, wait for a source that explicitly governs those mechanics rather than relying on this cost dataset.</li>
        </ol>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'VIP progression FAQ',
      content: <>
        <h3>How many VIP levels are in the supplied Forge dataset?</h3><p>12, covering VIP 1 through VIP 12.</p>
        <h3>What conversion does the source use?</h3><p>1 VIP point = 2 gems.</p>
        <h3>What is the VIP 8 row?</h3><p>100,000 VIP XP and a 200,000-gem equivalent.</p>
        <h3>What is the VIP 10 row?</h3><p>600,000 VIP XP and a 1,200,000-gem equivalent.</p>
        <h3>What is the VIP 12 row?</h3><p>2,400,000 VIP XP and a 4,800,000-gem equivalent.</p>
        <h3>Does this guide tell me what VIP 12 gives?</h3><p>No. The supplied dataset contains costs, not a governed benefit table, so Forge does not invent VIP-level rewards or buffs here.</p>
      </>,
    },
  ],
}
