import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const flipCosts = [
  ['1', '1', '1', '15', '16'], ['2', '2', '3', '14', '17'], ['3', '3', '6', '13', '19'], ['4', '4', '10', '10', '20'], ['5', '6', '16', '6', '22'], ['6', '8', '24', '5', '29'], ['7', '12', '36', '4', '40'], ['8', '15', '51', '3', '54'], ['9', '20', '71', '2', '73'], ['10', '25', '96', '1', '97'],
] as const

export const mysticDivinationGuide: GuideArticleDefinition = {
  slug: 'kingshot-mystic-divination-event-guide',
  title: 'Kingshot Mystic Divination: Fortune Token Strategy Guide',
  shortTitle: 'Mystic Divination',
  eyebrow: 'Event Guide · Mystic Divination',
  summary: 'Mystic Divination becomes much more efficient when you treat every board as a probability decision instead of automatically clearing ten cards.',
  intro: 'Mystic Divination is a two-day card-flipping event built around persistent Fortune Tokens, a chosen Wish Reward and a ten-card board with escalating flip costs. The supplied strategy focuses on selective resets: spend cheaply while the board is efficient, abandon poor boards before the expensive flips, and hoard tokens across cycles when a future milestone or older-server reward pool offers better value.',
  theme: 'mystic',
  tags: ['Mystic Divination', 'Fortune Tokens', 'probability', 'F2P', 'hoarding', 'Truegold', 'multipliers', 'rewards'],
  sourceNote: 'This article follows the supplied Mystic Divination guide. Its token income, milestone contents, probability examples and store-pack prices are source-specific and may vary by server age, region or event revision. Pack pricing is therefore labelled as an example rather than current commerce data.',
  alert: <><strong>Fortune Tokens persist in the supplied guide.</strong> F2P players do not need to force a spend every run. If the current reward pool is weak, carrying Tokens into a later server stage or milestone push may offer better long-term value.</>,
  connections: [
    { kind: 'item', label: 'Truegold', description: 'Search the Companion catalogue for the late-game material repeatedly named in Mystic Divination reward pools.', to: '/companion?q=Truegold' },
    { kind: 'item', label: 'Forgehammers', description: 'Review published Forge item information for a major 250/750 milestone reward in the supplied guide.', to: '/companion?q=Forgehammers' },
    { kind: 'item', label: 'Charm materials', description: 'Open the Companion search for Charm progression materials that appear in older-server reward pools.', to: '/companion?q=Charm' },
    { kind: 'guide', label: 'Champagne Fair', description: 'Compare another persistent-currency event where waiting for a stronger shop can beat routine spending.', to: '/guides/kingshot-champagne-fair-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Check whether gear, shard or progression spending can double-dip into Brawl stages.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Keep broader progression timing aligned with KvK Prep before committing scarce materials.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
  ],
  sections: [
    {
      id: 'mechanics',
      eyebrow: 'Board basics',
      title: 'Wish Reward, Fortune Tokens and the 10-card grid',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>2 days</strong><h3>Event duration</h3><p>The supplied guide describes Mystic Divination as a two-day event repeating every four weeks.</p></article>
          <article className="guide-article__card"><strong>10 cards</strong><h3>One board</h3><p>You choose one Wish Reward and the game places it among nine side rewards.</p></article>
          <article className="guide-article__card"><strong>Persistent</strong><h3>Fortune Tokens</h3><p>Unused tokens carry into later event runs in the uploaded source.</p></article>
          <article className="guide-article__card"><strong>0.5%</strong><h3>Initial Wish chance</h3><p>The source gives a heavily weighted 0.5% starting chance on the first flip.</p></article>
        </div>
        <p>The source also says every board includes a guaranteed ×2 multiplier card, with some reward pools containing larger multipliers or premium progression materials depending on server age.</p>
      </>,
    },
    {
      id: 'costs',
      eyebrow: 'Escalating spend',
      title: 'Flip costs and reset costs',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Flip</th><th>Flip cost</th><th>Cumulative</th><th>Manual reset</th><th>Flip + reset total</th></tr></thead><tbody>{flipCosts.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>The cost curve is the whole event.</strong> The first five cards cost only 16 cumulative Tokens in the supplied table; cards six through ten consume another 80. That is why automatic full clears are inefficient unless the remaining board is genuinely valuable.</p>
      </>,
    },
    {
      id: 'five-flip',
      eyebrow: 'Mathematical baseline',
      title: 'The five-flip reset strategy',
      content: <>
        <p>The uploaded analysis identifies five flips as its statistical sweet spot, estimating roughly 28.2 Tokens per Wish Reward versus about 31.4 when clearing every board.</p>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>1–5</span><div><h3>Flip up to five cards</h3><p>Spend the cheap portion of the curve first.</p></div></article>
          <article className="guide-article__step"><span>Wish?</span><div><h3>If the Wish appears, take the free reset</h3><p>The source says finding your Wish Reward grants a free board reset. Do not automatically pay for the remaining cards.</p></div></article>
          <article className="guide-article__step"><span>No</span><div><h3>If it does not appear, reset at five</h3><p>The supplied table gives a six-Token reset after the fifth flip, keeping the full attempt at 22 Tokens before starting a fresh board.</p></div></article>
        </div>
        <p className="guide-article__callout guide-article__callout--warning"><strong>This is a statistical strategy, not a guarantee.</strong> Individual boards can still produce the Wish early or late. The point is to optimise long-run Token efficiency rather than predict a hidden card.</p>
      </>,
    },
    {
      id: 'recon',
      eyebrow: 'Board quality',
      title: 'The four-flip reconnaissance method',
      content: <>
        <p>If you care about side rewards as well as the Wish, the source recommends reassessing after four flips rather than following a fixed reset rule blindly.</p>
        <ol>
          <li>Spend the first ten cumulative Tokens to reveal four cards.</li>
          <li>Open the Round Rewards list and inspect what remains hidden.</li>
          <li>If premium multipliers, Truegold, large Gem packs or other high-value rewards remain, continue.</li>
          <li>If the hidden pool is mostly basic resources or low-value speedups, pay the source-described ten-Token reset at that point and move on.</li>
        </ol>
        <p className="guide-article__callout"><strong>Avoid the sunk-cost trap:</strong> spending ten Tokens already does not make the next 86 Tokens cheaper. Judge the remaining board on its current expected value.</p>
      </>,
    },
    {
      id: 'multipliers',
      eyebrow: 'Golden boards',
      title: 'Multiplier stacking can change the decision',
      content: <>
        <p>The supplied guide says multiplier cards affect rewards flipped after them on the same board and stack multiplicatively. Its example is ×2 followed by ×3 producing ×6 for later cards.</p>
        <div className="guide-article__split">
          <article className="guide-article__card"><h3>Early multiplier</h3><p>A multiplier revealed before the Wish or a large progression reward raises the value of continuing that board.</p></article>
          <article className="guide-article__card"><h3>Multiplier still hidden</h3><p>If the Round Rewards list shows ×3, ×4 or ×5 alongside premium materials, the source classifies that as a “Golden Board” worth a deeper clear.</p></article>
        </div>
        <p>Whales are advised to clear more of these premium boards, while F2P players should still compare the remaining reward quality against the escalating Token cost.</p>
      </>,
    },
    {
      id: 'f2p',
      eyebrow: 'Persistent-token planning',
      title: 'F2P milestone hoarding',
      content: <>
        <p>The supplied guide gives a baseline of 46 free Tokens per two-day run: 22 from Daily Missions per day plus one free event Token per day. It recommends collecting all daily mission rewards manually before the event closes.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Target</th><th>Source strategy</th><th>Approximate wait from 46/run</th><th>Best fit</th></tr></thead><tbody>
          <tr><td>100</td><td>Skip roughly one run, spend on a later run with carry-over / rebate Tokens.</td><td>2–3 cycles depending on leftovers</td><td>Early progression and regular speedups.</td></tr>
          <tr><td>250</td><td>Build across about five event cycles.</td><td>~20 weeks in the source</td><td>Mid-game Forgehammers and larger milestone rewards.</td></tr>
          <tr><td>750</td><td>Very long-term carry-over strategy.</td><td>15–16 cycles in the source</td><td>Patient mature-server accounts targeting the top milestone.</td></tr>
        </tbody></table></div>
        <p className="guide-article__callout"><strong>Server-age value:</strong> the supplied guide says reward pools improve as a server matures. On a newer server, hoarding can therefore improve both your milestone reach and the quality of the board you eventually spend on.</p>
      </>,
    },
    {
      id: 'wish',
      eyebrow: 'Reward selection',
      title: 'Choose a Wish Reward that solves a bottleneck',
      content: <>
        <p>The source says younger servers may show more speedups, hero shards and basic progression items, while older servers add materials such as Truegold, Charm Designs and Master-related resources.</p>
        <p>Do not choose by rarity colour alone. Compare the Wish with what is actually blocking your account. Open <Link className="guide-article__link" to="/companion?q=Truegold">Truegold</Link>, <Link className="guide-article__link" to="/companion?q=Charm">Charm materials</Link> or <Link className="guide-article__link" to="/companion?q=Forgehammers">Forgehammers</Link> in the Companion catalogue before setting the target.</p>
      </>,
    },
    {
      id: 'whales',
      eyebrow: 'High-spend strategy',
      title: 'How whale play differs',
      content: <>
        <ul>
          <li>Target the 750-Token milestone each active run when the top reward is valuable enough.</li>
          <li>Ignore small reset-cost savings on genuinely premium boards containing large multipliers or rare materials.</li>
          <li>Use fast five-flip resets on weak boards when cycling specifically for a desired Wish.</li>
          <li>Prioritise non-farmable late-game bottlenecks rather than generic speedups once the server reward pool matures.</li>
        </ul>
        <p>The source estimates a full board at 96 Tokens and a targeted five-flip approach around 28 Tokens per Wish on average. Those are strategy-model values from the document, not guaranteed realised costs.</p>
      </>,
    },
    {
      id: 'packs',
      eyebrow: 'Source pricing examples',
      title: 'Paid Token calculations',
      content: <>
        <p>The supplied document includes example store tiers from 10 to 420 Tokens and regional price examples from roughly £0.99/$0.99 up to £49.99/$49.99. It then models 720–725 purchased Tokens plus the 46 free baseline as enough to clear the 750 milestone.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Do not treat these as current prices.</strong> Event packs, regional pricing, purchase limits and Token bundles can change. Forge intentionally does not reproduce the source’s shopping combination as a current recommendation.</p>
      </>,
    },
    {
      id: 'checklist',
      eyebrow: 'Micro optimisation',
      title: 'Mystic Divination checklist',
      content: <>
        <ul>
          <li>Check the Round Rewards pool before the first flip.</li>
          <li>Collect every free Daily Mission Token manually during the event window.</li>
          <li>Use five flips as the baseline reset point, not an absolute rule.</li>
          <li>Re-evaluate after four flips if premium side rewards are still hidden.</li>
          <li>Reset immediately after finding the Wish unless the remaining board is unusually valuable.</li>
          <li>Do not spend persistent Tokens simply because the event is open.</li>
          <li>Align large progression rewards with other Forge-planned events where possible.</li>
        </ul>
      </>,
    },
    {
      id: 'faq',
      eyebrow: 'Quick answers',
      title: 'Mystic Divination FAQ',
      content: <>
        <details><summary>Do Fortune Tokens expire?</summary><p>The supplied guide says unused Fortune Tokens persist across event runs.</p></details>
        <details><summary>Should I always stop after five flips?</summary><p>No. Five flips is the source’s statistical baseline. A board with strong multipliers or premium hidden rewards can justify continuing.</p></details>
        <details><summary>What happens after I find my Wish Reward?</summary><p>The supplied source says finding it grants a free board reset. Normally reset immediately instead of paying to clear low-value leftovers.</p></details>
        <details><summary>How many free Tokens does the source expect?</summary><p>46 per two-day cycle: 44 from Daily Missions and two free event claims.</p></details>
        <details><summary>Are the pack prices in this guide current?</summary><p>No. They are preserved only as source context and should not be treated as live pricing.</p></details>
      </>,
    },
  ],
}
