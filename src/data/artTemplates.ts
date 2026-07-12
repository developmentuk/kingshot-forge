export type ArtCategory =
  | 'Cats'
  | 'Announcements'
  | 'Battle'
  | 'Flags'
  | 'Nature'
  | 'Funny'

export type ArtTemplate = {
  id: string
  title: string
  category: ArtCategory
  description: string
  art: string
  tags: string[]
  compact?: boolean
}

export const artTemplates: ArtTemplate[] = [
  {
    id: 'cat-wave',
    title: 'Waving Cat',
    category: 'Cats',
    description: 'A simple cat waving hello.',
    tags: ['cat', 'hello', 'wave', 'cute'],
    art: `||
||   /\\_/\\
||  ( •ω• )ノ
||  /     /
||  しーＪ`,
    compact: true,
  },
  {
    id: 'cat-angry',
    title: 'Angry Cat',
    category: 'Cats',
    description: 'A dramatic angry cat for alliance chat.',
    tags: ['cat', 'angry', 'warning', 'funny'],
    art: `||
||    /\\_/\\
||   ( •̀ω•́ )
||   / づ💥
||  しーＪ`,
    compact: true,
  },
  {
    id: 'cat-sleeping',
    title: 'Sleeping Cat',
    category: 'Cats',
    description: 'A sleepy cat resting under the moon.',
    tags: ['cat', 'sleep', 'moon', 'cute'],
    art: `🌙
||
||      /\\_/\\
||     ( -.- )💤
||     / づづ
||  ＿しーＪ＿`,
  },
  {
    id: 'cat-fight',
    title: 'Cat Battle',
    category: 'Cats',
    description: 'Two cats locked in a dramatic duel.',
    tags: ['cat', 'fight', 'battle', 'funny'],
    art: `╔════════════════╗
║   CAT BATTLE   ║
╚════════════════╝

 /\\_/\\       /\\_/\\
( •̀ω•́)⚔️(•̀ω•́ )
 / づ         ⊂ \\

     💥 CLASH 💥`,
  },
  {
    id: 'important-banner',
    title: 'Important Announcement',
    category: 'Announcements',
    description: 'A clean announcement frame.',
    tags: ['important', 'announcement', 'notice'],
    art: `✦ ━━━━━━━━━ ✦
📢 IMPORTANT 📢
Your message here
✦ ━━━━━━━━━ ✦`,
    compact: true,
  },
  {
    id: 'royal-decree',
    title: 'Royal Decree',
    category: 'Announcements',
    description: 'A formal announcement for leadership messages.',
    tags: ['royal', 'r5', 'leader', 'announcement'],
    art: `╔══════👑══════╗
   ROYAL DECREE
 Your message here
╚══════👑══════╝`,
  },
  {
    id: 'recruitment',
    title: 'Recruitment Banner',
    category: 'Announcements',
    description: 'A recruitment template for alliances.',
    tags: ['recruitment', 'alliance', 'join'],
    art: `✯━━━━━━━━━━━━✯
📢 RECRUITING 📢
⚔️ Active Players
🐻 Event Focused
🤝 Friendly Team
✯━━━━━━━━━━━━✯`,
  },
  {
    id: 'bear-trap',
    title: 'Bear Trap Alert',
    category: 'Battle',
    description: 'A ready-to-use Bear Trap reminder.',
    tags: ['bear', 'trap', 'event', 'alert'],
    art: `🐻━━━━━━━━━━━━🐻
🔥 BEAR TRAP 🔥
⏰ Starts in 10 mins
🎯 Join every rally
🐻━━━━━━━━━━━━🐻`,
  },
  {
    id: 'kvk-alert',
    title: 'KvK Alert',
    category: 'Battle',
    description: 'A bold KvK preparation message.',
    tags: ['kvk', 'battle', 'war', 'alert'],
    art: `◤━━━━⚔️━━━━◥
🏰 KVK ALERT 🏰
Save resources
Heal troops
Prepare for battle
◣━━━━⚔️━━━━◢`,
  },
  {
    id: 'rally-now',
    title: 'Rally Now',
    category: 'Battle',
    description: 'A compact rally call.',
    tags: ['rally', 'battle', 'attack'],
    art: `⚔️══════════⚔️
🚨 RALLY NOW 🚨
JOIN FAST
⚔️══════════⚔️`,
    compact: true,
  },
  {
    id: 'union-jack',
    title: 'Union Jack',
    category: 'Flags',
    description: 'A compact emoji Union Jack.',
    tags: ['uk', 'british', 'flag', 'union jack'],
    art: `||🔵🔵⚪🔴⚪⚪⚪⚪🔴⚪🔵🔵
||🔵🔵🔵⚪🔴⚪⚪🔴⚪🔵🔵🔵
||⚪🔵🔵🔵⚪⚪⚪⚪🔵🔵🔵⚪
||🔴⚪⚪⚪⚪🔴🔴⚪⚪⚪⚪🔴
||🔴⚪⚪⚪⚪🔴🔴⚪⚪⚪⚪🔴
||⚪🔵🔵🔵⚪⚪⚪⚪🔵🔵🔵⚪
||🔵🔵🔵⚪🔴⚪⚪🔴⚪🔵🔵🔵
||🔵🔵⚪🔴⚪⚪⚪⚪🔴⚪🔵🔵`,
  },
  {
    id: 'norway-flag',
    title: 'Norway Flag',
    category: 'Flags',
    description: 'A simple Norwegian flag design.',
    tags: ['norway', 'flag', 'nordic'],
    art: `||🔴🔴⚪🔵🔵⚪🔴🔴🔴🔴🔴🔴
||🔴🔴⚪🔵🔵⚪🔴🔴🔴🔴🔴🔴
||⚪⚪⚪🔵🔵⚪⚪⚪⚪⚪⚪⚪
||🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵
||🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵
||⚪⚪⚪🔵🔵⚪⚪⚪⚪⚪⚪⚪
||🔴🔴⚪🔵🔵⚪🔴🔴🔴🔴🔴🔴
||🔴🔴⚪🔵🔵⚪🔴🔴🔴🔴🔴🔴`,
  },
  {
    id: 'tree-moon',
    title: 'Moonlit Tree',
    category: 'Nature',
    description: 'A quiet tree scene for chat.',
    tags: ['tree', 'moon', 'nature', 'night'],
    art: `🌙

        🌿
      🌿🌿🌿
    🌿🌿🌿🌿🌿
        ||||
        ||||
   ____||||____`,
  },
  {
    id: 'autumn-scene',
    title: 'Autumn Scene',
    category: 'Nature',
    description: 'A seasonal autumn message.',
    tags: ['autumn', 'leaves', 'season'],
    art: `🍁  🍂  🍁  🍂

      🌳
   🍂  ||  🍁
      ||||
  ____||||____`,
  },
  {
    id: 'pineapple-pizza',
    title: 'Pineapple on Pizza',
    category: 'Funny',
    description: 'The definitive pizza announcement.',
    tags: ['pineapple', 'pizza', 'funny', 'debate'],
    art: `✦ ━━━━━━━━━ ✦
📢 IMPORTANT 📢
🍍 Pineapple belongs
🍕 on pizza.
Debate over.
✦ ━━━━━━━━━ ✦`,
  },
  {
    id: 'r5-right',
    title: 'R5 Is Right',
    category: 'Funny',
    description: 'A useful reminder for alliance chat.',
    tags: ['r5', 'leader', 'funny'],
    art: `✦ ━━━━━━━━━ ✦
📢 IMPORTANT 📢
R5 is always...
probably...
right.
✦ ━━━━━━━━━ ✦`,
  },
]

export const artCategories: Array<'All' | ArtCategory> = [
  'All',
  'Cats',
  'Announcements',
  'Battle',
  'Flags',
  'Nature',
  'Funny',
]
