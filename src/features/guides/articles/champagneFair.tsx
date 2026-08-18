import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const exchangeRows = [
  ['Hero Widgets', 'Open widget crates first; unopened crates are not directly exchangeable in the supplied notes.', '200–500 vouchers by generation', '100'],
  ['Maxed Mythic hero shards', 'Only surplus shards for a fully maxed hero qualify.', 'Source gives multiple generation-dependent ranges', '500 shard exchanges'],
  ['Epic hero shards', 'Surplus shards after the hero is maxed.', '10 vouchers each', '500 shard exchanges'],
  ['Rare hero shards', 'Surplus shards after the hero is maxed.', '6 vouchers each', '500 shard exchanges'],
  ['Universal Epic / Rare shards', 'Only exchange when they are genuinely surplus to your progression plan.', '10 / 6 vouchers', '500 shard exchanges'],
  ['Skill Books', 'Expedition or Conquest books.', 'Rare 2; Epic is inconsistent in the source at 4 vs 6', '500'],
] as const

export const champagneFairGuide: GuideArticleDefinition = {
  slug: 'kingshot-champagne-fair-guide',
  title: 'Kingshot Champagne Fair: Voucher Exchange & Shop Guide',
  shortTitle: 'Champagne Fair',
  eyebrow: 'Event Guide · Champagne Fair',
  summary: 'Use Champagne Fair to turn obsolete inventory into persistent Fair Vouchers without sacrificing higher-value event scoring or future hero progression.',
  intro: 'Champagne Fair is a recurring two-day recycling event where surplus or obsolete inventory can be exchanged for Fair Vouchers and redirected into higher-value progression materials. The key is not simply to trade everything: the best returns come from protecting useful shards, respecting exchange caps, and saving persistent vouchers until the shop offers something that genuinely advances your account.',
  theme: 'royal',
  tags: ['Champagne Fair', 'vouchers', 'Mithril', 'hero widgets', 'hero shards', 'F2P', 'economy', 'resource management'],
  sourceNote: 'This article is based on the supplied Champagne Fair guide. Where that source gives different values for the same item — notably Epic Skill Books and some Mythic shard generations — Forge shows the discrepancy instead of inventing a single rate. Always confirm the current exchange value displayed by your live event before committing inventory.',
  alert: <><strong>Do not trade for the sake of clearing inventory.</strong> Fair Vouchers persist across event runs in the supplied guide. If the current shop does not contain a high-value item for your account, holding vouchers is often better than buying filler.</>,
  connections: [
    { kind: 'item', label: 'Mithril', description: 'Open the Companion item search for Mithril, the source’s highest-priority Champagne Fair purchase.', to: '/companion?q=Mithril' },
    { kind: 'item', label: 'Forgehammers', description: 'Review published Companion information before spending vouchers on hero-gear progression.', to: '/companion?q=Forgehammers' },
    { kind: 'hero', label: 'Hero Companion', description: 'Check which heroes still deserve shards or Widgets before converting duplicates.', to: '/companion/heroes' },
    { kind: 'guide', label: 'Generation 6 Heroes', description: 'Use the Gen 6 guide when deciding whether current-generation Widgets are worth saving vouchers for.', to: '/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Compare whether shards, Widgets or gear materials are more valuable as Brawl scoring resources than as Fair exchanges.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Check KvK Prep priorities before consuming stockpiles that could score during the next kingdom cycle.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
  ],
  sections: [
    {
      id: 'overview',
      eyebrow: 'Event basics',
      title: 'How Champagne Fair works',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>2 days</strong><h3>Event window</h3><p>The supplied guide describes a 48-hour recurring Fair.</p></article>
          <article className="guide-article__card"><strong>After 3rd HoG</strong><h3>Unlock</h3><p>The source places the unlock after the third Hall of Governors cycle on a server.</p></article>
          <article className="guide-article__card"><strong>Persistent</strong><h3>Fair Vouchers</h3><p>Unused vouchers carry forward across future Champagne Fair runs in the supplied material.</p></article>
          <article className="guide-article__card"><strong>Progression-aware</strong><h3>Shop stock</h3><p>The shop is described as changing with server progression and hero generation.</p></article>
        </div>
        <p className="guide-article__callout"><strong>The right mental model:</strong> Champagne Fair is an inventory-conversion event, not a forced spending event. Convert things that have lost progression value, then spend only when the replacement item is more valuable.</p>
      </>,
    },
    {
      id: 'exchange',
      eyebrow: 'Obtain Vouchers',
      title: 'What to exchange — and what to protect',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Category</th><th>Requirement / note</th><th>Voucher yield in supplied source</th><th>Event cap</th></tr></thead><tbody>{exchangeRows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
        <h3>Trade highest-value duplicates first</h3>
        <p>If you are going to hit a category cap, use the cap on the highest-value genuinely surplus items first. The source specifically recommends prioritising Mythic duplicates before filling remaining shard capacity with Epic or Rare shards.</p>
        <h3>Open crates and recruitment stock before the final calculation</h3>
        <p>The supplied strategy recommends opening eligible Widget crates before exchange and considering stored recruitment Keys because they may generate additional duplicate shards from already-maxed heroes.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Rate discrepancy:</strong> one section of the source lists Epic Skill Books at 4 vouchers while another lists 6. It also gives different generation bands for Mythic shards. Treat the live event UI as authoritative for the current run.</p>
      </>,
    },
    {
      id: 'shop',
      eyebrow: 'Redemption Shop',
      title: 'What should you buy first?',
      content: <>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>1</span><div><h3>Mithril</h3><p>The supplied guide consistently ranks Mithril first because it becomes a major Mythic Hero Gear bottleneck. <Link className="guide-article__link" to="/companion?q=Mithril">Check Mithril in Companion</Link>.</p></div></article>
          <article className="guide-article__step"><span>2</span><div><h3>Core Hero Widgets</h3><p>Buy only for heroes that remain in your main rally, garrison or core formation. Do not spread vouchers across every generation simply because the Widget is available.</p></div></article>
          <article className="guide-article__step"><span>3</span><div><h3>Universal Mythic fragments and system bottlenecks</h3><p>Charm Designs/Guides, Pet Advancement materials, Artisan’s Visions and Forgehammers are presented as strong secondary choices when they unlock meaningful progression.</p></div></article>
          <article className="guide-article__step"><span>Hold</span><div><h3>Keep the remaining vouchers</h3><p>Basic resources, Hero XP, stamina and similar farmable items sit at the bottom of the source’s value list. Persistent vouchers let you wait for a better Fair.</p></div></article>
        </div>
      </>,
    },
    {
      id: 'f2p',
      eyebrow: 'Low-spend planning',
      title: 'F2P and low-spender strategy',
      content: <>
        <h3>Generation skipping beats small purchases every cycle</h3>
        <p>The source recommends saving through two or three Fair cycles if necessary so you can fund a meaningful Widget or progression purchase rather than buying small items every month.</p>
        <h3>Let natural duplicate sources do the work</h3>
        <ul>
          <li>Rare heroes such as Forrest, Seth, Olive and Edwin are described as fast to cap through standard recruitment and Intel.</li>
          <li>Diana is highlighted as a repeatable Epic duplicate source through Dreadwolf rallies.</li>
          <li>Quinn, Amane and Howard are named as heroes whose duplicates can build naturally from Gold Keys, Intel and event rewards.</li>
          <li>Do not spend Universal Epic shards simply to force a hero to max for voucher farming; the source recommends saving universals for heroes you actually use.</li>
        </ul>
        <p className="guide-article__callout"><strong>Practical target:</strong> the source uses 500 vouchers as a common Widget example and shows that 50 surplus Epic shards at 10 vouchers each would meet it. Higher-generation Widget prices are described as potentially higher, so confirm your current shop.</p>
      </>,
    },
    {
      id: 'timing',
      eyebrow: 'Event stacking',
      title: 'Do not destroy scoring value to create vouchers',
      content: <>
        <p>One of the most useful points in the source is that Champagne Fair can overlap or sit close to events where the same inventory earns points. Trading a shard away does not score the shard-consumption task that upgrading a hero would have scored.</p>
        <div className="guide-article__split">
          <article className="guide-article__card"><h3>Upgrade first when the action scores</h3><p>If “Grow Your Heroes”, Alliance Brawl, Hall of Governors or KvK Prep is rewarding star-ups or shard use, use eligible progression first and only convert the true surplus afterward.</p></article>
          <article className="guide-article__card"><h3>Protect strategic Epic shards</h3><p>The source warns that Epic shards may also be useful for Alliance Mobilization or KvK milestones. Ten vouchers may be a poor trade if those shards unlock a much larger overlapping reward.</p></article>
        </div>
        <p>For broader resource timing, use the <Link className="guide-article__link" to="/guides/kingshot-alliance-brawl-event-guide">Alliance Brawl guide</Link> and <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">Kingdom of Power guide</Link> before emptying major stockpiles.</p>
      </>,
    },
    {
      id: 'examples',
      eyebrow: 'Voucher maths',
      title: 'Source examples for reaching 500 vouchers',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Scenario</th><th>Example</th><th>Result</th></tr></thead><tbody>
          <tr><td>Epic shards</td><td>50 × 10-voucher surplus Epic shards</td><td>500 vouchers</td></tr>
          <tr><td>Rare shards</td><td>84 × 6-voucher surplus Rare shards</td><td>504 vouchers</td></tr>
          <tr><td>Rare skill books</td><td>250 × 2-voucher books</td><td>500 vouchers</td></tr>
          <tr><td>Mixed stock</td><td>10 Epic shards + 25 Rare shards + source-example Epic/Rare books</td><td>Source demonstrates a 500-voucher mixed route</td></tr>
        </tbody></table></div>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Do not copy the mixed-book arithmetic without checking the live rate.</strong> The supplied document itself disagrees on whether an Epic Skill Book pays 4 or 6 vouchers.</p>
      </>,
    },
    {
      id: 'faq',
      eyebrow: 'Quick answers',
      title: 'Champagne Fair FAQ',
      content: <>
        <details><summary>Do Fair Vouchers expire?</summary><p>Not according to the supplied guide. It explicitly recommends saving them across multiple Fair runs.</p></details>
        <details><summary>Can I exchange shards from a hero I have not maxed?</summary><p>The supplied material says only excess hero shards from fully maxed heroes qualify.</p></details>
        <details><summary>Should I buy resources or stamina?</summary><p>The source places basic resources, Hero XP and stamina at the bottom of the purchase order because they are farmable compared with progression bottlenecks.</p></details>
        <details><summary>Should I spend vouchers on every new generation?</summary><p>No. The supplied F2P strategy recommends generation skipping and saving for a hero or system that will materially improve your account.</p></details>
        <details><summary>What is the exact Epic Skill Book exchange rate?</summary><p>The source is internally inconsistent at 4 versus 6 vouchers. Check the live event screen for your current server and client version.</p></details>
      </>,
    },
  ],
}
