import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

export const kingdomTransferGuide: GuideArticleDefinition = {
  slug: 'kingshot-kingdom-transfer-guide',
  title: 'Kingshot Kingdom Transfer: Eligibility, Transfer Passes & Move Checklist',
  shortTitle: 'Kingdom Transfer',
  eyebrow: 'Event Guide · Kingdom Transfer',
  summary: 'Check transfer eligibility, Power Cap rules, Transfer Pass costs, invite types, kingdom quotas and the permanent-move checklist before changing Kingdom.',
  intro: 'Kingdom Transfer is one of the highest-consequence decisions in Kingshot because the move is permanent. This guide is built primarily from current Century Games / Kingshot Help Center rules rather than community estimates. Use it to confirm whether you can move, understand Ordinary and Special Invites, budget Transfer Passes and protect anything that could be lost before you commit.',
  theme: 'royal',
  tags: ['Kingdom Transfer', 'Transfer Pass', 'Power Cap', 'Special Invite', 'Ordinary Invite', 'Leading Kingdom', 'Transfer Hub', 'Kingdom', 'resources', 'F2P'],
  sourceNote: 'Fresh official verification completed 20 August 2026 against the current Century Games / Kingshot Help Center Kingdom Transfer material. The Help Center confirms the three transfer phases, Hero Generation and Truegold compatibility checks, the kingdom-dependent character-age threshold, Ordinary/Special Invite rules, current transfer quotas, the 1–50 Transfer Pass range, a 25-day post-transfer cooldown, resource-loss rules and permanent-transfer consequences. Exact Power Caps, available slots, eligible target Kingdoms and the current event window are live-game values, so the in-game Kingdom List and event screen remain the final authority.',
  alert: <><strong>Permanent move:</strong> Century Games says a cross-server Kingdom Transfer is permanent. Confirm the target Kingdom, live eligibility, available slots and protected resources before spending Transfer Passes.</>,
  connections: [
    { kind: 'tool', label: 'Transfer Hub', description: 'Use Forge’s transfer area to browse transfer-minded players and plan recruitment around a target Kingdom.', to: '/transfer-hub' },
    { kind: 'tool', label: 'My Transfer Profile', description: 'Keep your own transfer profile current so recruiting alliances can see the information you choose to share.', to: '/my-forge/transfer-profile' },
    { kind: 'item', label: 'Transfer Pass', description: 'Open the governed Companion record for the item consumed by Kingdom Transfer.', to: '/companion/items/transfer-pass' },
    { kind: 'community', label: 'Kingdom Community', description: 'Check Forge kingdom/community context before treating a transfer as only a Power calculation.', to: '/kingdom-community' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Keep cross-kingdom battle planning separate from transfer eligibility and transfer Power rules.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
  ],
  sections: [
    {
      id: 'phases', eyebrow: 'Official event flow', title: 'Kingdom Transfer runs in three phases',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Phase I</strong><h3>Pre-Transfer</h3><p>The King sets the Transfer Power Cap for the Kingdom. If there is no current King, the Help Center says the most recent King performs this duty.</p></article>
          <article className="guide-article__card"><strong>Phase II</strong><h3>Invitational Transfer</h3><p>Kings can issue Ordinary Invites and, where permitted, Special Invites. The Power Cap cannot be changed after this phase begins.</p></article>
          <article className="guide-article__card"><strong>Phase III</strong><h3>Transfer Opens</h3><p>Eligible Governors within the target Power Cap can use the open transfer allocation while slots remain.</p></article>
        </div>
        <p className="guide-article__callout"><strong>No fixed calendar promise:</strong> the Help Center does not define a permanent recurrence interval. Always use the current in-game transfer schedule.</p>
      </>,
    },
    {
      id: 'eligibility', eyebrow: 'Eligibility', title: 'Check compatibility before you count your Transfer Passes',
      content: <>
        <p>Current official rules require the target Kingdom to match your origin Kingdom’s <strong>Hero Generation and Truegold level</strong>. Character age is also checked against the target Kingdom.</p>
        <ul>
          <li>The permitted character-age difference varies with the target Kingdom’s development.</li>
          <li>The current Help Center describes that threshold as ranging from <strong>90 days to 180 days</strong>.</li>
          <li>A compatible Kingdom still needs an available transfer slot and you must satisfy its live Power Cap or have the appropriate Special Invite.</li>
          <li>Use the live Kingdom List for the final eligibility result; Forge does not attempt to reproduce changing target-Kingdom caps.</li>
        </ul>
      </>,
    },
    {
      id: 'power-invites', eyebrow: 'Power Cap & invites', title: 'Ordinary and Special Invites solve different problems',
      content: <>
        <p>An <strong>Ordinary Invite</strong> is for a Governor who is already within the target Kingdom’s Transfer Power Cap. A <strong>Special Invite</strong> exists specifically for a Governor whose Power is above that cap.</p>
        <ul>
          <li>Ordinary Kingdoms begin with up to three Special Transfer Invites.</li>
          <li>One spent Special Invite is restored on the first day of each month at 00:00 UTC, up to the maximum of three.</li>
          <li>Leading Kingdoms cannot issue Special Invites.</li>
          <li>An invited Governor still pays their own Transfer Pass cost; the King does not pay it for them.</li>
          <li>Special Invites are a governed exception to the Power Cap, not a reason to assume every other eligibility rule disappears.</li>
        </ul>
      </>,
    },
    {
      id: 'kingdom-types', eyebrow: 'Current quotas', title: 'Ordinary and Leading Kingdoms have different standard capacity',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Ordinary Kingdom</strong><h3>55 standard transfers</h3><p>The current Help Center breaks this into 35 Ordinary Invite places plus 20 places during Transfer Opens. Ordinary Kingdoms may also use the separately governed Special Invite mechanism for over-cap Governors.</p></article>
          <article className="guide-article__card"><strong>Leading Kingdom</strong><h3>30 standard transfers</h3><p>The current Help Center breaks this into 20 Ordinary Invite places plus 10 places during Transfer Opens. Leading Kingdoms cannot issue Special Invites.</p></article>
        </div>
        <p>Slots are limited and the Help Center describes target availability as first come, first served. Do not treat an invitation conversation as a guaranteed open slot until the game confirms it.</p>
      </>,
    },
    {
      id: 'passes', eyebrow: 'Transfer cost', title: 'Budget 1–50 Transfer Passes — but do not guess the formula',
      content: <>
        <p>Century Games currently states that Kingdom Transfer costs between <strong>1 and 50 Transfer Passes</strong>, with higher player Power requiring more passes. The Help Center does not publish a stable exact Power-to-pass formula for Forge to reproduce.</p>
        <p>Check the live transfer screen for your account’s requirement, then use the <Link className="guide-article__link" to="/companion/items/transfer-pass">Transfer Pass Companion record</Link> for Forge’s separately governed item context. Do not dismantle an account simply to chase an assumed lower transfer cost: current official guidance says dismissing troops or unequipping gear does not change the transfer score.</p>
      </>,
    },
    {
      id: 'keep-lose', eyebrow: 'Before you commit', title: 'Know what survives the move — and what does not',
      content: <>
        <ul>
          <li><strong>Resources:</strong> resources above the Storehouse Protection limit can be lost after transfer.</li>
          <li><strong>Ranked events:</strong> the Help Center says ongoing event ranking rewards are not received after transfer; progress-based rewards can still be retained.</li>
          <li><strong>Social:</strong> friends and private chats remain, but Chat Groups are removed.</li>
          <li><strong>Characters:</strong> the target Kingdom can contain no more than four of your characters.</li>
          <li><strong>Return trip:</strong> there is no automatic return to the previous Kingdom. The transfer is permanent.</li>
        </ul>
      </>,
    },
    {
      id: 'edge-cases', eyebrow: 'Official clarifications', title: 'A few common transfer myths are already answered',
      content: <>
        <p>Current Help Center material explicitly answers several edge cases that players often try to optimise around:</p>
        <ul>
          <li>Oasis Island progress currently does not affect the Transfer Pass requirement.</li>
          <li>Governors can transfer with soldiers in the Infirmary or Enlistment Office.</li>
          <li>Holding a city position or having Offender status does not itself prevent transfer.</li>
          <li>Dismissed troops and unequipped gear do not reduce the transfer score used for the move.</li>
        </ul>
        <p>These clarifications do not replace the live eligibility check. If the event UI blocks your account for another reason, use the game’s current message rather than assuming one of these exceptions overrides it.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Move-day checklist', title: 'Do these checks before pressing Transfer',
      content: <>
        <ul>
          <li>Use <Link className="guide-article__link" to="/transfer-hub">Transfer Hub</Link> and kingdom/community research to confirm the destination is actually right for you.</li>
          <li>Confirm Hero Generation, Truegold compatibility and the target Kingdom’s live age requirement.</li>
          <li>Check the target Power Cap and remaining transfer slots in game.</li>
          <li>If you are over the Power Cap, confirm a valid Special Invite is available and that the destination is not a Leading Kingdom.</li>
          <li>Confirm your live requirement of 1–50 Transfer Passes.</li>
          <li>Spend, move or protect resources that sit above Storehouse Protection.</li>
          <li>Understand any unfinished ranked-event reward consequence before leaving.</li>
          <li>Save any Chat Group information you need; groups are removed by the transfer.</li>
          <li>Check that moving will not create more than four of your characters in the destination Kingdom.</li>
          <li>Read the destination one final time. The move is permanent.</li>
        </ul>
      </>,
    },
    {
      id: 'after-transfer', eyebrow: 'After arrival', title: 'You cannot immediately transfer again',
      content: <>
        <p>The current official cooldown is <strong>25 days</strong> before a Governor can complete another Kingdom Transfer. Treat the first move as a long-term community decision, not a short test visit.</p>
        <p className="guide-article__callout"><strong>Forge workflow:</strong> keep your <Link className="guide-article__link" to="/my-forge/transfer-profile">Transfer Profile</Link> accurate before recruitment, use <Link className="guide-article__link" to="/transfer-hub">Transfer Hub</Link> for discovery, and re-establish alliance/community coordination after arrival because the game removes Chat Groups during transfer.</p>
      </>,
    },
  ],
}
