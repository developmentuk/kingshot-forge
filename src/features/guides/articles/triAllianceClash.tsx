import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

export const triAllianceClashGuide: GuideArticleDefinition = {
  slug: 'kingshot-tri-alliance-clash-guide',
  title: 'Kingshot Tri-Alliance Clash: Registration, Matchmaking & Battlefield Strategy Guide',
  shortTitle: 'Tri-Alliance Clash',
  eyebrow: 'Event Guide · Alliance Battlefield',
  summary: 'Prepare both legions, understand official matchmaking, conserve battlefield energy and coordinate lanes, Garrisons and the Temple of Tides.',
  intro: 'Tri-Alliance Clash is a monthly alliance battlefield where preparation before Saturday matters as much as fighting on the map. Century Games currently confirms the weekly event lifecycle, two-legion structure, participation requirements and matchmaking formula. Detailed lane assignments, objective timing and Temple rotations are covered here as current battlefield strategy rather than official Help Center rules.',
  theme: 'ocean',
  tags: ['Tri-Alliance Clash', 'alliance', 'PvP', 'Temple of Tides', 'Garrisons', 'legions', 'matchmaking', 'energy', 'battlefield', 'F2P', 'rallies', 'map control'],
  sourceNote: 'Fresh verification completed 20 August 2026. Century Games / Kingshot Help Center confirms Tri-Alliance Clash opens once each month, with Voting Monday–Tuesday, Sign-Up Wednesday–Thursday, Matchmaking Friday and Battle Saturday; each alliance may form two legions with separate time slots and reward calculations. Official Help Center material also confirms top-20 Alliance Power eligibility, a minimum of 15 total combatants plus substitutes for a legion to participate, and matchmaking based on the combined Squad Power of the top 20 Governors across combatants and substitutes. Battlefield phase timings and tactical guidance were cross-checked against the Kingshot Tri-Alliance Clash announcement archive and current Kingshot Mastery, Kingshot Wiki and Kingshot WebApps references. Where those sources go beyond Help Center rules, Forge labels the material as strategy guidance.',
  alert: <><strong>Matchmaking warning:</strong> substitutes are not “free” roster depth. Century Games says substitute power is included, and matchmaking uses the top 20 Governors across both combatants and substitutes. Do not stack a legion with high-power substitutes unless they are part of the plan.</>,
  connections: [
    { kind: 'guide', label: 'Swordland', description: 'Compare another objective-led alliance battlefield where role discipline and rotations matter more than random fighting.', to: '/guides/kingshot-swordland-showdown-summit-league-guide' },
    { kind: 'guide', label: 'Heroes Gen 1–6', description: 'Use the hero role reference when deciding rally, garrison and flexible battlefield squads.', to: '/guides/kingshot-heroes-gen1-gen6-role-tier-reference' },
    { kind: 'hero', label: 'Hero Companion', description: 'Check your available hero roster and current progression before assigning battlefield squads.', to: '/companion/heroes' },
    { kind: 'guide', label: 'Troop Training', description: 'Review your available troop tiers and training-cost context before the event.', to: '/guides/kingshot-troop-training-t1-t5-cost-time-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Coordinate resource use around another alliance event instead of draining everything into one week.', to: '/guides/kingshot-alliance-brawl-event-guide' },
  ],
  sections: [
    {
      id: 'official-lifecycle', eyebrow: 'Official structure', title: 'The event is won before Saturday starts',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Mon–Tue</strong><h3>Voting</h3><p>Alliance members vote for the preferred participation time.</p></article>
          <article className="guide-article__card"><strong>Wed–Thu</strong><h3>Sign-Up</h3><p>Leadership builds the two legions and selects combatants and substitutes.</p></article>
          <article className="guide-article__card"><strong>Friday</strong><h3>Matchmaking</h3><p>The two legions are matched separately. If a legion receives auto-advance, it does not enter a normal match.</p></article>
          <article className="guide-article__card"><strong>Saturday</strong><h3>Battle</h3><p>Each legion fights in its selected slot with separate reward calculation.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Eligibility:</strong> current Help Center guidance says the alliance must be top 20 on the Alliance Power Leaderboard, and a legion needs at least 15 total combatants plus substitutes to participate.</p>
      </>,
    },
    {
      id: 'matchmaking', eyebrow: 'Official matchmaking', title: 'Roster strength matters more than roster size',
      content: <>
        <p>Century Games states that the number of combatants itself does not affect matchmaking. Instead, the system looks at the <strong>total Squad Power of the top 20 Governors</strong> across both combatants and substitutes.</p>
        <ul>
          <li>Do not assume substitutes are excluded from the calculation.</li>
          <li>Build each legion around people who will actually attend, not just the maximum names you can register.</li>
          <li>Keep the two legions strategically balanced if both need competitive matches; their matchmaking and rewards are separate.</li>
          <li>Re-check the live sign-up screen before lock because current UI limits and kingdom eligibility remain the final authority.</li>
        </ul>
      </>,
    },
    {
      id: 'battle-phases', eyebrow: 'Battlefield flow', title: 'Four phases change what the map is worth',
      content: <>
        <p>Current event references consistently describe a one-hour battle split into <strong>3 minutes of Preparation, 17 minutes of Seize & Conquer, 20 minutes of Garrison Occupation and 20 minutes of Temple Onslaught</strong>. Treat those timings as current battlefield guidance and verify them on the live event screen.</p>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><h3>Preparation</h3><p>Officers place marks, confirm lanes and make sure every player knows their first move before the map opens.</p></article>
          <article className="guide-article__card"><h3>Seize & Conquer</h3><p>Secure your route network and early structures. Random kills that abandon your lane are usually a bad trade.</p></article>
          <article className="guide-article__card"><h3>Garrison Occupation</h3><p>Rotate strength towards Garrisons as they become available while keeping enough pressure to protect your route into the final phase.</p></article>
          <article className="guide-article__card"><h3>Temple Onslaught</h3><p>The Temple of Tides becomes the central objective. Arrive with squads, energy and reinforcement routes still intact.</p></article>
        </div>
      </>,
    },
    {
      id: 'energy', eyebrow: 'Battlefield economy', title: 'Energy is a strategic resource, not just a movement bar',
      content: <>
        <p>The event announcement states that battlefield actions such as moving, conscripting, advancing, retreating and reviving consume Energy. That means unnecessary movement has a real opportunity cost.</p>
        <ul>
          <li>Use route calls and map marks so players do not zig-zag between objectives.</li>
          <li>Avoid reviving or repositioning purely to chase low-value fights.</li>
          <li>Keep a reserve for the Garrison and Temple transitions instead of exhausting every squad in the opening minutes.</li>
          <li>Send the right squad the first time; repeated corrections spend both time and Energy.</li>
        </ul>
      </>,
    },
    {
      id: 'roles', eyebrow: 'Alliance organisation', title: 'Give every player a lane and a job',
      content: <>
        <p>Current strategy references consistently favour predefined roles: strong anchor players on priority lanes, support players maintaining routes and buildings, mobile disruption squads, and a reserve that can answer whichever front starts to collapse.</p>
        <p className="guide-article__callout"><strong>Forge recommendation:</strong> one clear caller per legion is more valuable than thirty independent tactical opinions. Officers should publish lane assignments, first destinations and the trigger for rotating towards Garrisons and the Temple before battle begins.</p>
      </>,
    },
    {
      id: 'map-control', eyebrow: 'Win condition', title: 'Fight for objectives, not for a prettier kill feed',
      content: <>
        <p>Tri-Alliance Clash is fundamentally a map-control event. Combat is useful when it captures, protects or opens a route to a scoring structure. It is wasteful when a strong squad leaves an assigned objective simply to chase an enemy.</p>
        <ul>
          <li>Secure connected routes so reinforcements can move where they are needed.</li>
          <li>Do not overcommit your strongest players to low-value structures while a higher-value objective is opening.</li>
          <li>Rotate before a phase change, not after the enemy has already occupied the new objective.</li>
          <li>Keep one reserve group free enough to respond to a second enemy alliance; this is a three-way battlefield, not a normal two-side war.</li>
        </ul>
      </>,
    },
    {
      id: 'heroes', eyebrow: 'Squad planning', title: 'Build three squads for different battlefield jobs',
      content: <>
        <p>Current event references state that each participating Governor can field up to three squads. Rather than cloning one favourite formation three times, build around the jobs your legion actually needs: a strong objective/rally squad, a durable hold or reinforcement squad, and a mobile flexible squad where your roster allows it.</p>
        <p>Use the <Link className="guide-article__link" to="/guides/kingshot-heroes-gen1-gen6-role-tier-reference">Heroes Gen 1–6 reference</Link> and <Link className="guide-article__link" to="/companion/heroes">Hero Companion</Link> to check your own options. Forge does not prescribe one universal Tri-Alliance hero trio because hero generations, stars and account progression vary too much.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Before sign-up locks', title: 'Tri-Alliance Clash officer checklist',
      content: <>
        <ul>
          <li>Confirm the alliance is eligible and both legions have enough registrants.</li>
          <li>Choose players who will actually attend; substitutes count towards matchmaking power.</li>
          <li>Balance the two legions deliberately rather than treating Legion 2 as leftovers.</li>
          <li>Publish lane assignments, first objectives and one legion caller.</li>
          <li>Tell players to preserve Energy for phase transitions and avoid random movement.</li>
          <li>Prepare three battlefield squads before Saturday.</li>
          <li>Set a clear Garrison rotation and Temple rotation trigger.</li>
          <li>Check the live event rules before battle in case time slots, point values or battlefield details changed after this guide was verified.</li>
        </ul>
      </>,
    },
  ],
}
