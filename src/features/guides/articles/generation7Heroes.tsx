import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const avaSkills = [
  ['Color Bomb', 'Conquest', 'Attack × 70% area damage every 0.5s for 3s.'],
  ['Corruption Bomb', 'Conquest', 'Attack × 35% damage every 0.5s and +25% damage taken on the target for 2s.'],
  ['Disguise Pigment', 'Conquest', '+75% Defense to Ava.'],
  ['Dissolution', 'Expedition', '-25% total enemy Defense.'],
  ['Chiaroscuro', 'Expedition', 'All enemy soldiers receive +50% damage for 2 turns every 4 turns.'],
  ['Light and Cold', 'Expedition', '+25% soldiers’ Lethality.'],
] as const

const charlesSkills = [
  ['Vengeance', 'Conquest', 'Attack × 140% fan-area damage, 1s stun and +100% self Attack for 2s.'],
  ['Parting Gift', 'Conquest', 'Attack × 280% area damage around Charles when the mech is destroyed.'],
  ['Nimble Soul', 'Conquest', '50% chance to reduce damage taken by 50%.'],
  ['Intimidation', 'Expedition', '-20% enemy Squad total Lethality.'],
  ['Iron Bodies', 'Expedition', '-20% Squad damage taken.'],
  ['Great Justice', 'Expedition', '+25% Squad total Health.'],
] as const

const weeWooSkills = [
  ['High Ground', 'Conquest', 'Attack × 420% area damage.'],
  ['Incendiaries', 'Conquest', 'Attack × 84% area damage plus Attack × 25% burn damage every 0.5s for 2s.'],
  ['Frontal Support', 'Conquest', '+26% Attack.'],
  ['Artillerymen', 'Expedition', '+15% all-Squad Attack and +10% Lethality.'],
  ['Chain Shelling', 'Expedition', '+30% damage to Archers and +25% damage to Infantry.'],
  ['Boom Boom', 'Expedition', '50% chance for Squad attacks to deal 50% additional damage.'],
] as const

function SkillTable({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  return <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Skill</th><th>Mode</th><th>Level 5 effect in supplied source</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
}

export const generation7HeroesGuide: GuideArticleDefinition = {
  slug: 'kingshot-generation-7-heroes-ava-charles-wee-woo-guide',
  title: 'Kingshot Generation 7 Heroes: Ava, Charles & Wee & Woo Skill Guide',
  shortTitle: 'Generation 7 Heroes',
  eyebrow: 'Hero Guide · Generation 7',
  summary: 'Compare the supplied Generation 7 skill kits for Ava, Charles and Wee & Woo, including damage amplification, defensive utility and direct offensive pressure.',
  intro: 'Forge’s supplied Generation 7 verification sheets contain complete six-skill sets for Ava, Charles and Wee & Woo. They are useful enough to explain what each kit is designed to do, but the source does not establish acquisition paths, widgets, troop classes, base stats or a final in-game verification state. This guide therefore focuses on the documented skills and clearly separates source facts from Forge’s practical reading of those kits.',
  theme: 'mystic',
  tags: ['heroes', 'Generation 7', 'Ava', 'Charles', 'Wee & Woo', 'skill guide', 'damage amplification', 'defence', 'rallies', 'PvP'],
  sourceNote: 'This article uses the supplied Forge Hero Skills Verification and Editorial Review workbooks. Ava and Charles are marked “Editorial review complete; mechanical values require final in-game check”. Wee & Woo are marked “Cross-checked against multiple public sources”. The Gen 7 rows do not carry a completed in-game verification flag, so Forge does not present these values as final live-client certification.',
  alert: <><strong>Scope matters:</strong> the supplied sheets support the six listed skills and their upgrade values. They do not support firm claims about acquisition, shard cost, troop class, widget effects, base stats, release timing or a definitive “best hero” ranking. Those fields are intentionally omitted rather than guessed.</>,
  connections: [
    { kind: 'hero', label: 'Hero Companion', description: 'Browse Forge’s currently published hero catalogue. Gen 7 individual records are not yet live, so this link stays at the governed Hero Companion hub.', to: '/companion/heroes' },
    { kind: 'guide', label: 'Generation 6 Heroes', description: 'Compare the documented Yang, Sophia and Triton kits before deciding whether a future Gen 7 investment would replace an existing role.', to: '/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Use the large-scale combat guide when evaluating how damage amplification, mitigation and health effects could matter operationally.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'guide', label: 'Swordland', description: 'Swordland is a useful reference battlefield for understanding offensive pressure, defensive holds and structure fights.', to: '/guides/kingshot-swordland-showdown-summit-league-guide' },
    { kind: 'guide', label: 'Flamedragon Tyrant', description: 'Compare the documented Gen 7 skill shapes with Palace/Aerie rally and garrison requirements without assuming an event-specific Gen 7 meta.', to: '/guides/flamedragon-tyrant-event-guide' },
    { kind: 'guide', label: 'Viking Vengeance', description: 'Charles’ documented mitigation and Health effects are relevant to garrison thinking, but the source does not itself rank him for Viking Vengeance.', to: '/guides/kingshot-viking-vengeance-event-guide' },
  ],
  sections: [
    {
      id: 'overview', eyebrow: 'At a glance', title: 'What the three documented kits suggest',
      content: <>
        <div className="guide-article__grid guide-article__grid--three">
          <article className="guide-article__card"><strong>Ava</strong><h3>Debuff & amplification profile</h3><p>Her supplied Expedition kit reduces enemy Defense, increases enemy damage taken on a repeating cycle and adds Lethality. Her Conquest kit also includes repeated area damage and a direct damage-taken debuff.</p></article>
          <article className="guide-article__card"><strong>Charles</strong><h3>Durability & mitigation profile</h3><p>His Expedition skills reduce enemy Lethality, reduce Squad damage taken and increase total Health. His Conquest skills add control, burst damage and a large defensive proc.</p></article>
          <article className="guide-article__card"><strong>Wee & Woo</strong><h3>Direct offensive profile</h3><p>Their supplied kit is dominated by area damage, Attack/Lethality increases, target-type bonus damage and a chance for additional damage.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Forge interpretation, not a source ranking:</strong> Ava reads as an offensive amplifier/debuffer, Charles as the most defensive of the three, and Wee & Woo as the most direct damage-oriented kit. The source does not provide a universal build order.</p>
      </>,
    },
    {
      id: 'ava', eyebrow: 'Generation 7', title: 'Ava: damage amplification and enemy debuffs',
      content: <>
        <SkillTable rows={avaSkills} />
        <p>Ava’s strongest documented identity comes from stacking enemy-side disadvantages. <strong>Dissolution</strong> reduces total enemy Defense by 25%, <strong>Chiaroscuro</strong> creates a repeating +50% damage-taken window, and <strong>Light and Cold</strong> adds 25% Lethality.</p>
        <p>Her Conquest kit points in the same direction: <strong>Corruption Bomb</strong> both deals repeated damage and raises the target’s damage taken by 25% for 2 seconds. <strong>Disguise Pigment</strong> gives Ava a large personal Defense increase, which may help her survive long enough to keep applying pressure.</p>
        <p className="guide-article__callout"><strong>Practical reading:</strong> if the final live-client behaviour matches the supplied values, Ava looks built to make the rest of a formation hit harder rather than relying only on her own raw damage.</p>
      </>,
    },
    {
      id: 'charles', eyebrow: 'Generation 7', title: 'Charles: mitigation, Health and frontline control',
      content: <>
        <SkillTable rows={charlesSkills} />
        <p>Charles’ Expedition skills are unusually coherent: <strong>Intimidation</strong> reduces enemy total Lethality by 20%, <strong>Iron Bodies</strong> reduces Squad damage taken by 20%, and <strong>Great Justice</strong> raises total Health by 25%.</p>
        <p>His Conquest kit adds a 50% chance to halve damage taken, a 1-second stun on <strong>Vengeance</strong>, and a large temporary self-Attack increase. <strong>Parting Gift</strong> also creates damage on mech destruction rather than making defeat purely passive.</p>
        <p className="guide-article__callout"><strong>Practical reading:</strong> Charles is the clearest defensive/attrition profile in the supplied Gen 7 set. That makes garrison and structure-hold contexts worth investigating later, but the current source does not certify an event-specific ranking.</p>
      </>,
    },
    {
      id: 'wee-woo', eyebrow: 'Generation 7', title: 'Wee & Woo: artillery pressure and target bonuses',
      content: <>
        <SkillTable rows={weeWooSkills} />
        <p><strong>High Ground</strong> is a large 420% area attack at Level 5, while <strong>Incendiaries</strong> adds a second area hit plus repeated burn damage. <strong>Frontal Support</strong> provides a straight 26% Attack increase.</p>
        <p>The Expedition side continues the offensive pattern: <strong>Artillerymen</strong> increases Attack and Lethality, <strong>Chain Shelling</strong> raises damage against Archers and Infantry, and <strong>Boom Boom</strong> gives Squad attacks a 50% chance to deal 50% additional damage.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Editorial restoration note:</strong> the raw verification sheet has blank descriptions for Wee & Woo’s three Expedition skills. The supplied Editorial Review restores those descriptions from its named public references and marks them as cross-checked. Forge uses the restored wording here rather than pretending the raw row was complete.</p>
      </>,
    },
    {
      id: 'comparison', eyebrow: 'Role comparison', title: 'How the documented kits differ',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Question</th><th>Ava</th><th>Charles</th><th>Wee & Woo</th></tr></thead><tbody>
          <tr><td>Primary documented strength</td><td>Enemy debuffs and damage amplification</td><td>Damage mitigation and Health</td><td>Area damage and offensive buffs</td></tr>
          <tr><td>Enemy-side pressure</td><td>-25% Defense; +50% damage taken cycle</td><td>-20% enemy Lethality</td><td>Bonus damage vs Archers and Infantry</td></tr>
          <tr><td>Friendly-side stat support</td><td>+25% Lethality</td><td>-20% damage taken; +25% Health</td><td>+15% Attack; +10% Lethality</td></tr>
          <tr><td>Personal Conquest survival</td><td>+75% Defense</td><td>50% chance to reduce damage by 50%</td><td>No equivalent defensive effect in supplied kit</td></tr>
          <tr><td>Best description supported by source</td><td>Amplifier / debuffer</td><td>Defensive / attrition</td><td>Direct offensive artillery</td></tr>
        </tbody></table></div>
        <p>This table compares only the supplied skill text. It does not include troop-class matchups, widgets, base stats, acquisition cost or star-level accessibility because those are not present in the supplied Gen 7 verification material.</p>
      </>,
    },
    {
      id: 'expedition', eyebrow: 'Rallies & garrisons', title: 'How to read Expedition skills safely',
      content: <>
        <p>For Forge strategy pages, Expedition skills matter because they describe effects applied at Squad or enemy-Squad level. The supplied Gen 7 sheets clearly document several effects that are strategically relevant:</p>
        <ul>
          <li>Ava: enemy Defense down, enemy damage taken up and Lethality up.</li>
          <li>Charles: enemy Lethality down, Squad damage taken down and total Health up.</li>
          <li>Wee & Woo: Attack/Lethality up, target-type damage bonuses and a chance for additional damage.</li>
        </ul>
        <p>What the sheets do <strong>not</strong> establish is how every one of these effects behaves when a hero is a rally lead, rally joiner, garrison lead or ordinary reinforcement in each event. Those interaction rules need separate live-client verification before Forge turns them into hard recommendations.</p>
      </>,
    },
    {
      id: 'gen6', eyebrow: 'Upgrade decision', title: 'Do not replace a built Generation 6 hero from skill text alone',
      content: <>
        <p>Generation numbers by themselves do not tell you whether replacing a developed hero is efficient. The Gen 7 source here gives skill mechanics, but not acquisition cost, star accessibility, widget progression or full base-stat comparisons.</p>
        <p>That means a properly built Yang, Sophia or Triton may still be more useful to your account than an incomplete Gen 7 hero. Use the existing <Link className="guide-article__link" to="/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide">Generation 6 guide</Link> to compare the role you already have before committing resources when Gen 7 becomes available to your kingdom.</p>
      </>,
    },
    {
      id: 'verification', eyebrow: 'Source quality', title: 'What is verified, reviewed and still missing',
      content: <>
        <ul>
          <li><strong>Ava and Charles:</strong> the Editorial Review says editorial review is complete, but mechanical values still require final in-game checking.</li>
          <li><strong>Wee & Woo:</strong> the Editorial Review says the skill rows are cross-checked against multiple public sources.</li>
          <li><strong>In-game flag:</strong> the supplied Gen 7 rows do not show a completed “Verified In Game” value.</li>
          <li><strong>Missing fields:</strong> acquisition, troop class, base stats, widget skills and release timing are not established in the supplied Gen 7 sheets.</li>
          <li><strong>Hero Companion:</strong> Forge’s current production hero table does not yet contain Ava, Charles or Wee & Woo, so this guide does not fabricate individual profile routes.</li>
        </ul>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Player checklist', title: 'What to check before investing',
      content: <>
        <ul>
          <li>Confirm the Gen 7 hero is actually available in your kingdom.</li>
          <li>Check the live skill text against the values in this guide.</li>
          <li>Confirm acquisition and shard availability before abandoning a built Gen 6 hero.</li>
          <li>Verify widget effects and troop class in game; the supplied source does not include them.</li>
          <li>For rallies or garrisons, test which Expedition effects apply from the hero’s actual slot and role.</li>
          <li>Choose between amplification (Ava), durability (Charles) and direct offense (Wee & Woo) only after matching that role to your account.</li>
        </ul>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Generation 7 FAQ',
      content: <>
        <h3>Which Generation 7 heroes are in the supplied Forge sheets?</h3><p>Ava, Charles and Wee & Woo.</p>
        <h3>Which one is best?</h3><p>The supplied source does not provide a definitive ranking. Their documented kits serve different purposes.</p>
        <h3>Which looks most offensive from the supplied skills?</h3><p>Wee & Woo has the clearest direct-damage profile, while Ava adds substantial enemy debuffs and damage amplification.</p>
        <h3>Which looks most defensive?</h3><p>Charles, based on enemy Lethality reduction, Squad damage reduction and total Health increase.</p>
        <h3>Are these values verified in game?</h3><p>Not fully in the supplied workbooks. Ava and Charles still require final mechanical in-game checking; Wee & Woo is cross-checked against multiple public sources, but the Gen 7 rows do not show a completed in-game verification flag.</p>
        <h3>Why are there no individual Hero Companion links?</h3><p>The current Forge production hero table does not yet contain these three records. Forge avoids creating dead or fabricated detail routes.</p>
      </>,
    },
  ],
}
