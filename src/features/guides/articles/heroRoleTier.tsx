import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const heroRows = [
  ['Amadeus', 1, 'Legendary', 'Infantry', 'S', 'B', 'S', 'A', 'No', 'Rally lead & bear hunt (VIP hero)'],
  ['Jabel', 1, 'Legendary', 'Cavalry', 'B', 'S', 'B', '-', 'Yes', 'Garrison defender'],
  ['Helga', 1, 'Legendary', 'Infantry', 'A', 'B', 'B', '-', 'No', 'Early rally alternative'],
  ['Saul', 1, 'Legendary', 'Archer', 'B', 'A', 'B', 'S', 'Yes', 'Garrison joiner & stacking'],
  ['Zoe', 2, 'Legendary', 'Infantry', 'B', 'S', '-', '-', 'Yes', 'F2P garrison tank'],
  ['Hilde', 2, 'Legendary', 'Cavalry', 'B', 'S', 'A', 'S', 'No', 'Garrison joiner & healer'],
  ['Marlin', 2, 'Legendary', 'Archer', 'S', 'B', 'B', '-', 'Yes', 'Long-term archer carry'],
  ['Petra', 3, 'Legendary', 'Cavalry', 'S', 'B', 'B', '-', 'Yes', 'Cavalry rally lead'],
  ['Eric', 3, 'Legendary', 'Infantry', 'B', 'S', 'B', '-', 'No', 'Garrison defender'],
  ['Jaeger', 3, 'Legendary', 'Archer', 'B', 'S', 'B', '-', 'No', 'Garrison archer'],
  ['Rosa', 4, 'Legendary', 'Archer', 'A', 'B', 'B', '-', 'No', 'Arena specialist'],
  ['Alcar', 4, 'Legendary', 'Infantry', 'B', 'S', 'A', '-', 'No', 'Garrison infantry'],
  ['Margot', 4, 'Legendary', 'Cavalry', 'B', 'S', 'S', 'A', 'No', 'Garrison & bear joiner'],
  ['Vivian', 5, 'Legendary', 'Archer', 'S+', 'B', 'S', 'S', 'No', 'Army-wide damage buff'],
  ['Thrud', 5, 'Legendary', 'Cavalry', 'S', 'A', 'B', '-', 'No', 'Cavalry multiplier'],
  ['Long Fei', 5, 'Legendary', 'Infantry', 'A', 'S', 'A', '-', 'No', 'Garrison infantry'],
  ['Yang', 6, 'Legendary', 'Archer', 'S+', 'B', 'S', '-', 'Yes', 'F2P rally carry'],
  ['Sophia', 6, 'Legendary', 'Cavalry', 'S', 'A', 'B', '-', 'No', 'Confusion-based debuffer'],
  ['Triton', 6, 'Legendary', 'Infantry', 'A', 'S', 'A', '-', 'No', 'Garrison infantry'],
  ['Chenko', 1, 'Epic', 'Cavalry', '-', '-', 'S', 'S', 'Yes', 'Best F2P rally joiner'],
  ['Amane', 1, 'Epic', 'Archer', '-', '-', 'S', 'S', 'Yes', 'Offensive stacking joiner'],
  ['Yeonwoo', 1, 'Epic', 'Archer', '-', '-', 'S', 'S', 'Yes', 'Non-chance offensive joiner'],
  ['Gordon', 1, 'Epic', 'Cavalry', 'B', '-', '-', 'A', 'Yes', 'Early-game reliable'],
  ['Howard', 1, 'Epic', 'Infantry', '-', 'B', '-', '-', 'Yes', 'Garrison only'],
  ['Quinn', 1, 'Epic', 'Archer', '-', '-', '-', '-', 'Yes', 'Low priority'],
  ['Diana', 1, 'Epic', 'Archer', '-', '-', '-', '-', 'Yes', 'Gathering (no battle skills)'],
  ['Fahd', 1, 'Epic', 'Cavalry', '-', '-', 'D', 'B', 'Yes', 'Low priority joiner'],
] as const

const roleHighlights = [
  ['Rally S / S+', 'Amadeus, Marlin, Petra, Vivian, Thrud, Yang, Sophia'],
  ['Garrison S', 'Jabel, Zoe, Hilde, Eric, Jaeger, Alcar, Margot, Long Fei, Triton'],
  ['Bear S', 'Amadeus, Margot, Vivian, Yang, Chenko, Amane, Yeonwoo'],
  ['Joiner S', 'Saul, Hilde, Vivian, Chenko, Amane, Yeonwoo'],
] as const

export const heroRoleTierGuide: GuideArticleDefinition = {
  slug: 'kingshot-heroes-gen1-gen6-role-tier-reference',
  title: 'Kingshot Heroes Gen 1–6: Role, Tier & F2P Reference',
  shortTitle: 'Heroes Gen 1–6',
  eyebrow: 'Hero Reference · Generations 1–6',
  summary: 'Compare all 27 heroes in the supplied Gen 1–6 roster by generation, rarity, troop type, editorial combat tiers, F2P flag and best-use guidance.',
  intro: 'Forge’s supplied hero dataset contains 27 heroes spanning Generations 1–6. It is strongest as a roster-and-role reference: names, generations, rarities and troop types are treated by the source as verified facts, while Rally, Garrison, Bear and Joiner tiers are explicitly community/editorial judgement. This page preserves that split so a tier letter never masquerades as a measured game statistic.',
  theme: 'war',
  tags: ['heroes', 'Generation 1', 'Generation 6', 'tier list', 'rally', 'garrison', 'Bear Hunt', 'joiner', 'F2P', 'Infantry', 'Cavalry', 'Archer'],
  sourceNote: 'This article is based on the supplied `kingshot-heroes` dataset, updated 13 June 2026 and verified in April 2026. Its metadata cites Kingshot Mastery, Kingshot Guides, Grind N Strat and Kingshot Data. The source assigns accuracy 95 to hero names, rarities, troop types and generations, while explicitly classifying Rally/Garrison/Bear/Joiner rankings as editorial community consensus. The payload contains Generations 1–6 only, despite its metadata describing the dataset as “every Kingshot hero”. Forge therefore does not present it as a current complete roster.',
  alert: <><strong>This is not a Gen 7 tier list.</strong> The supplied payload stops at Generation 6. Forge has a separate <Link className="guide-article__link" to="/guides/kingshot-generation-7-heroes-ava-charles-wee-woo-guide">Generation 7 skill guide</Link>, but its evidence model is different, so those heroes are not silently appended to this older tier dataset.</>,
  connections: [
    { kind: 'tool', label: 'Hero Companion', description: 'Browse Forge’s hero experience separately from this source-specific Gen 1–6 tier reference.', to: '/companion/heroes' },
    { kind: 'guide', label: 'Generation 6 Heroes', description: 'Go deeper on Yang, Sophia and Triton using the dedicated Gen 6 guide.', to: '/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide' },
    { kind: 'guide', label: 'Generation 7 Heroes', description: 'Continue beyond this dataset with Ava, Charles and Wee & Woo under their separate verification boundary.', to: '/guides/kingshot-generation-7-heroes-ava-charles-wee-woo-guide' },
    { kind: 'guide', label: 'Hero Progression', description: 'Plan Lv.1–80 XP and keep the lower-confidence shard estimates separate from role rankings.', to: '/guides/kingshot-hero-xp-shard-progression-guide' },
    { kind: 'guide', label: 'KvK Preparation Scoring', description: 'Use the separate governed scoring table when hero materials, shards or Hero Gear are part of a live Prep day.', to: '/guides/kingshot-kvk-preparation-scoring-guide' },
    { kind: 'guide', label: 'VIP Progression', description: 'The source flags Amadeus as a VIP hero; use the VIP guide for the separate supplied VIP XP/gem-equivalent ladder.', to: '/guides/kingshot-vip-1-12-xp-gem-cost-guide' },
  ],
  sections: [
    {
      id: 'coverage', eyebrow: 'Source coverage', title: '27 heroes across six generations',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>27</strong><h3>Hero rows</h3><p>12 Gen 1 heroes, then three per generation from Gen 2 through Gen 6.</p></article>
          <article className="guide-article__card"><strong>19 / 8</strong><h3>Legendary / Epic</h3><p>Source-recorded rarity split across the 27 rows.</p></article>
          <article className="guide-article__card"><strong>95</strong><h3>Factual confidence</h3><p>Names, generations, rarities and troop types only.</p></article>
          <article className="guide-article__card"><strong>Editorial</strong><h3>Tier letters</h3><p>Community consensus, not measured combat values.</p></article>
        </div>
        <p>The source records 14 rows with <code>f2p: true</code> and 13 with <code>f2p: false</code>. Forge preserves that field as source guidance, but does not elevate it into the source’s 95-confidence factual set because the metadata only explicitly grants that confidence to identity/generation/rarity/troop fields.</p>
      </>,
    },
    {
      id: 'generation-map', eyebrow: 'Roster map', title: 'Who appears in each supplied generation',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Gen 1 · 12</strong><h3>Foundation roster</h3><p>Amadeus, Jabel, Helga, Saul, Chenko, Amane, Yeonwoo, Gordon, Howard, Quinn, Diana and Fahd.</p></article>
          <article className="guide-article__card"><strong>Gen 2 · 3</strong><h3>Zoe · Hilde · Marlin</h3><p>One Infantry, one Cavalry and one Archer in the supplied roster.</p></article>
          <article className="guide-article__card"><strong>Gen 3 · 3</strong><h3>Petra · Eric · Jaeger</h3><p>Cavalry, Infantry and Archer respectively.</p></article>
          <article className="guide-article__card"><strong>Gen 4 · 3</strong><h3>Rosa · Alcar · Margot</h3><p>Archer, Infantry and Cavalry respectively.</p></article>
          <article className="guide-article__card"><strong>Gen 5 · 3</strong><h3>Vivian · Thrud · Long Fei</h3><p>Archer, Cavalry and Infantry respectively.</p></article>
          <article className="guide-article__card"><strong>Gen 6 · 3</strong><h3>Yang · Sophia · Triton</h3><p>Archer, Cavalry and Infantry respectively.</p></article>
        </div>
      </>,
    },
    {
      id: 'full-roster', eyebrow: 'Complete supplied table', title: 'Every Gen 1–6 row in the source',
      content: <>
        <p>The four tier columns and “best use” column are editorial guidance from the supplied dataset. A dash means that the source does not assign a tier in that role.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Hero</th><th>Gen</th><th>Rarity</th><th>Troop</th><th>Rally</th><th>Garrison</th><th>Bear</th><th>Joiner</th><th>F2P</th><th>Editorial best use</th></tr></thead><tbody>{heroRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      </>,
    },
    {
      id: 'role-highlights', eyebrow: 'Editorial grouping', title: 'Where the source assigns S or S+',
      content: <>
        <p>These are <strong>not Forge-measured performance rankings</strong>. They are a compact grouping of the source’s editorial tier letters.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Editorial tier group</th><th>Heroes in the supplied data</th></tr></thead><tbody>{roleHighlights.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td></tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Use tiers as a shortlist, not a proof.</strong> Formation, skill levels, hero generation, opponent, rally role and account investment can all change the practical choice. The source itself labels these rankings as opinion.</p>
      </>,
    },
    {
      id: 'f2p-reading', eyebrow: 'Source guidance', title: 'How to read the F2P flag',
      content: <>
        <p>Among the Legendary rows, the source flags <strong>Jabel, Saul, Zoe, Marlin, Petra and Yang</strong> as F2P-accessible. All eight Epic rows are also marked F2P. Amadeus is the only row carrying the separate <code>vip: true</code> field.</p>
        <p>Those flags are useful planning hints, but the source metadata does not give them the same explicit 95-confidence treatment as hero identity, generation, rarity and troop type. Availability can also evolve with live events and shops, so check the current game before making a long-term shard plan.</p>
      </>,
    },
    {
      id: 'source-boundaries', eyebrow: 'Verification discipline', title: 'What this reference does not establish',
      content: <>
        <ul>
          <li>It does not contain Generation 7 heroes, despite the older dataset title implying complete coverage.</li>
          <li>It does not contain skill-level numbers, exclusive-gear progression or combat formulas.</li>
          <li>Tier letters are editorial consensus, not benchmark results or game-published rankings.</li>
          <li>The source does not provide matchup-specific formations or universal investment order.</li>
          <li>F2P and best-use fields should be treated as source guidance that can age as acquisition methods change.</li>
        </ul>
        <p>Use <Link className="guide-article__link" to="/companion/heroes">Hero Companion</Link> for the current Forge hero experience, the <Link className="guide-article__link" to="/guides/kingshot-hero-xp-shard-progression-guide">Hero Progression guide</Link> for XP planning, and the generation-specific guides when you need deeper skill context.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Before investing', title: 'Hero decision checklist',
      content: <>
        <ul>
          <li>Start with the role you actually need: rally lead, garrison, Bear or rally joiner.</li>
          <li>Use the tier letter only as editorial guidance, then inspect the hero’s actual skills and your available investment path.</li>
          <li>Confirm the current acquisition route before treating an older F2P flag as guaranteed availability.</li>
          <li>Keep Gen 7 decisions in the separate Gen 7 evidence set rather than extrapolating this Gen 1–6 table.</li>
          <li>Price XP and shards separately; the role table does not tell you whether an upgrade is affordable.</li>
        </ul>
      </>,
    },
  ],
}
