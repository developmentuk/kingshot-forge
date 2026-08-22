import type { GuideArticleDefinition } from '../guideTypes'
import VipPlannerPanel from '../VipPlannerPanel'

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
  title: 'Kingshot VIP 1–12: Benefits, Rewards, Packs & Progression Planner',
  shortTitle: 'VIP Progression',
  eyebrow: 'System Guide · VIP',
  summary: 'Compare VIP 1–12 progression, governed benefits, daily free bundles and Special Packs with source conflicts kept explicit.',
  intro: 'Kingshot Forge now has a governed VIP 1–12 contract covering progression requirements, active benefits, daily free bundles and one-time Special Pack contents. Use the planner below to compare your current level with a target while keeping disputed VIP 8 and VIP 12 claims visibly unresolved.',
  theme: 'royal',
  tags: ['VIP', 'VIP 12', 'VIP XP', 'Gems', 'benefits', 'daily rewards', 'Special Packs', 'Helga', 'Amadeus', 'progression', 'resource planning'],
  sourceNote: 'This guide uses the governed VIP-001A public dataset. VIP XP/Gem-equivalent rows come from the preserved structured baseline; benefits, daily bundles and Special Pack contents come from the owner-supplied VIP dataset. F2P timing remains community guidance, pack currency is not inferred, and four explicit source conflicts remain open.',
  alert: <><strong>Do not read the planner total as a canonical cumulative VIP XP figure.</strong> It is a derived sum of the published per-level requirements between your selected levels. The supplied source conflicts over VIP 12 cumulative wording, so Forge deliberately publishes no cumulative field.</>,
  connections: [
    { kind: 'guide', label: 'Governor Gear', description: 'Compare VIP investment with another long-term account progression system.', to: '/guides/kingshot-governor-gear-upgrade-cost-guide' },
    { kind: 'guide', label: 'Governor Charms', description: 'Plan the separate Lv.1–22 Charm material and stat progression ladder.', to: '/guides/kingshot-governor-charms-upgrade-cost-guide' },
    { kind: 'guide', label: 'Truegold Progression', description: 'Compare VIP planning with the governed TG1–TG8 building progression system.', to: '/guides/kingshot-truegold-tempered-truegold-building-guide' },
  ],
  sections: [
    {
      id: 'planner', eyebrow: 'Interactive comparison', title: 'Plan from your current VIP level to a target',
      content: <VipPlannerPanel />,
    },
    {
      id: 'progression', eyebrow: 'Published progression', title: 'VIP 1–12 per-level XP and Gem-equivalent rows',
      content: <>
        <p>Each row below is the published requirement associated with that VIP level. The Gem-equivalent value remains exactly <strong>2 Gems per 1 VIP point</strong>.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>VIP level</th><th>Published XP requirement</th><th>Gem equivalent</th></tr></thead><tbody>{vipRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Planner rule:</strong> when you compare two levels, Forge sums only the published rows above your current level through the selected target. That derived sum is useful for planning but is not stored or presented as a canonical cumulative field.</p>
      </>,
    },
    {
      id: 'benefits', eyebrow: 'Benefit landmarks', title: 'Where the governed VIP rows become more significant',
      content: <>
        <ul>
          <li><strong>VIP 4:</strong> the governed row includes Construction Speed +10%.</li>
          <li><strong>VIP 5:</strong> the governed row includes +1 Formation.</li>
          <li><strong>VIP 6:</strong> the governed row includes +1 March Queue alongside +1 Formation.</li>
          <li><strong>VIP 8:</strong> the governed row reaches +2 Formations, Resource Production Speed +16% and Storehouse Capacity +700,000.</li>
          <li><strong>VIP 9:</strong> the governed row includes Squads’ Defence +10% and Construction Speed +20%.</li>
          <li><strong>VIP 10:</strong> the governed row includes Squads’ Attack +12%, Squads’ Defence +12% and a 48-hour Custom Avatar Upload Cooldown Reduction.</li>
          <li><strong>VIP 11:</strong> Attack, Defence and Health are all source-supported at +14%.</li>
          <li><strong>VIP 12:</strong> Defence +16% and Lethality +16% are published, while Attack and Health remain unresolved because the supplied source conflicts.</li>
        </ul>
      </>,
    },
    {
      id: 'daily-bundles', eyebrow: 'Daily value', title: 'Daily free bundles scale from Rare to Mythic materials',
      content: <>
        <p>The governed contract contains a daily free bundle for every VIP level. Early rows focus on Rare and Epic Skill Books/Manuals and General Hero Shards; later rows move into Mythic General Hero Shards and Mythic Skill materials.</p>
        <p>VIP 12 additionally includes three Lucky Hero Gear Chests in its daily bundle. Use the target-level panel above for the exact source-governed contents of any selected tier.</p>
      </>,
    },
    {
      id: 'special-packs', eyebrow: 'One-time packs', title: 'Special Packs contain Gems, hero shards, XP and speedups',
      content: <>
        <p>VIP 1–6 Special Packs use Helga Shards; VIP 7–12 use Amadeus Shards. The public contract also carries listed Gems, VIP XP, Hero XP, construction/research/training speedups and Alliance Gift tier.</p>
        <p>Where the supplied detailed rows do not state a currency, Forge shows the numeric price but does not label it USD or any other currency. VIP 8 is stricter: its price remains completely unresolved because two source sections disagree.</p>
      </>,
    },
    {
      id: 'conflicts', eyebrow: 'Verification boundary', title: 'Four claims remain deliberately unresolved',
      content: <>
        <ol>
          <li><strong>VIP 8 pack price:</strong> detailed and later prose disagree, so no canonical price is published.</li>
          <li><strong>VIP 12 Attack and Health:</strong> competing percentages remain null/conflicted.</li>
          <li><strong>VIP 12 cumulative XP wording:</strong> Forge publishes per-level requirements only and derives comparison totals at runtime.</li>
          <li><strong>Amadeus shard aggregate:</strong> detailed VIP 7–12 rows total 975, while later prose gives conflicting aggregate figures; Forge publishes the individual rows, not an aggregate.</li>
        </ol>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Planning safely', title: 'VIP planning checklist',
      content: <>
        <ol>
          <li>Select your current and target VIP level in the planner.</li>
          <li>Use the derived XP/Gem totals as planning arithmetic, not as a stored cumulative field.</li>
          <li>Compare the target row’s active benefits and daily bundle before deciding whether the progression matters to you.</li>
          <li>Treat F2P timing as community guidance rather than a guaranteed schedule.</li>
          <li>Do not infer a currency for Special Pack prices.</li>
          <li>Where the page says “unresolved”, wait for verification rather than choosing the more attractive source claim.</li>
        </ol>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'VIP progression FAQ',
      content: <>
        <h3>Does Forge now publish VIP benefits?</h3><p>Yes. VIP-001A governs the benefits, daily free bundles and Special Pack rows for VIP 1–12, except fields explicitly retained as source conflicts.</p>
        <h3>What conversion does the progression source use?</h3><p>1 VIP point = 2 Gems.</p>
        <h3>Is the planner’s total cumulative VIP XP?</h3><p>No. It is a derived sum of published per-level requirements between the two selected levels.</p>
        <h3>What does VIP 12 give for Attack and Health?</h3><p>Forge does not publish a canonical value yet because the source gives conflicting percentages.</p>
        <h3>What is the VIP 8 Special Pack price?</h3><p>Unresolved. The supplied source conflicts, so Forge does not choose one figure.</p>
      </>,
    },
  ],
}
