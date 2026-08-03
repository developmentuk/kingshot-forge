import { useId, type ReactNode } from 'react'

type BuildingIllustrationProps = {
  buildingKey: string
  name: string
  compact?: boolean
  decorative?: boolean
}

function motif(buildingKey: string): ReactNode {
  switch (buildingKey) {
    case 'town-center':
      return <>
        <path d="M238 242h244v190H238z" fill="#263a56" stroke="#f0bc55" strokeWidth="8" />
        <path d="M280 242v-86h56v86m112 0v-86h56v86" fill="#324b6d" stroke="#f0bc55" strokeWidth="8" />
        <path d="M342 432V302h76v130" fill="#152235" stroke="#f0bc55" strokeWidth="8" />
        <path d="M270 156l38-48 38 48m92 0 38-48 38 48" fill="#f0bc55" opacity=".9" />
        <path d="M380 302v-92l48 24-48 24" fill="#ef6a4d" stroke="#f0bc55" strokeWidth="6" />
      </>
    case 'academy':
      return <>
        <path d="M224 412h272l-24-156H248z" fill="#263a56" stroke="#77c7e8" strokeWidth="8" />
        <path d="M280 256c10-96 150-96 160 0" fill="#334d6e" stroke="#77c7e8" strokeWidth="8" />
        <circle cx="360" cy="190" r="42" fill="#16283e" stroke="#f0bc55" strokeWidth="8" />
        <path d="M360 164v52m-26-26h52" stroke="#f0bc55" strokeWidth="8" strokeLinecap="round" />
        <path d="M276 326h168M296 366h128" stroke="#77c7e8" strokeWidth="9" strokeLinecap="round" opacity=".8" />
      </>
    case 'barracks':
      return <>
        <path d="M220 418h280V238l-140-78-140 78z" fill="#2e4058" stroke="#ef765c" strokeWidth="8" />
        <path d="M284 418V300h152v118" fill="#18263a" stroke="#ef765c" strokeWidth="8" />
        <path d="M318 306l42-34 42 34-16 66h-52z" fill="#ef765c" stroke="#f5d08a" strokeWidth="6" />
        <path d="M360 280v82" stroke="#f5d08a" strokeWidth="7" />
        <path d="M252 232v-72m216 72v-72" stroke="#f5d08a" strokeWidth="8" />
      </>
    case 'command-center':
      return <>
        <path d="M206 416h308l-42-166-112-82-112 82z" fill="#2a3f5b" stroke="#f0bc55" strokeWidth="8" />
        <path d="M360 168v-82l92 30-92 30" fill="#ef6a4d" stroke="#f0bc55" strokeWidth="7" />
        <path d="M300 416V298h120v118" fill="#17263a" stroke="#f0bc55" strokeWidth="8" />
        <path d="M326 334h68m-34-34v68" stroke="#7cc8e8" strokeWidth="8" strokeLinecap="round" />
      </>
    case 'embassy':
      return <>
        <path d="M210 416h300V246l-150-82-150 82z" fill="#293f5b" stroke="#9bd4b6" strokeWidth="8" />
        <path d="M260 416V282h200v134" fill="#17273b" stroke="#9bd4b6" strokeWidth="8" />
        <path d="M292 330c28-36 54-36 68 0 14-36 40-36 68 0-34 46-68 62-68 62s-34-16-68-62z" fill="#9bd4b6" opacity=".9" />
        <path d="M252 232v-78m216 78v-78" stroke="#f0bc55" strokeWidth="8" />
        <path d="M252 154l56 20-56 20m216-40-56 20 56 20" fill="#ef6a4d" stroke="#f0bc55" strokeWidth="5" />
      </>
    case 'infirmary':
      return <>
        <path d="M222 418h276V224H222z" fill="#eef2eb" stroke="#82c8b3" strokeWidth="8" />
        <path d="M268 224l92-74 92 74" fill="#d9e6df" stroke="#82c8b3" strokeWidth="8" />
        <path d="M326 274h68v42h42v68h-42v42h-68v-42h-42v-68h42z" fill="#ef6a5b" />
        <path d="M246 418V360h62v58m104 0v-58h62v58" fill="#26384d" />
      </>
    case 'range':
      return <>
        <path d="M214 416h292V250l-146-84-146 84z" fill="#2d435e" stroke="#d19b62" strokeWidth="8" />
        <circle cx="360" cy="316" r="76" fill="#e8e1d3" stroke="#d19b62" strokeWidth="8" />
        <circle cx="360" cy="316" r="50" fill="#ef765c" />
        <circle cx="360" cy="316" r="22" fill="#f5d08a" />
        <path d="M252 180l216 270m-16-246L236 438" stroke="#8dd1e8" strokeWidth="8" strokeLinecap="round" />
      </>
    case 'stable':
      return <>
        <path d="M208 418h304V242l-152-78-152 78z" fill="#3d3b3a" stroke="#d5a76d" strokeWidth="8" />
        <path d="M270 418V296h180v122" fill="#201f24" stroke="#d5a76d" strokeWidth="8" />
        <path d="M306 316c10-46 98-46 108 0 6 34-18 62-54 82-36-20-60-48-54-82z" fill="none" stroke="#f0bc55" strokeWidth="12" />
        <path d="M320 350h80" stroke="#f0bc55" strokeWidth="9" strokeLinecap="round" />
      </>
    case 'storehouse':
      return <>
        <path d="M210 416h300V246l-150-82-150 82z" fill="#493c31" stroke="#d4aa69" strokeWidth="8" />
        <path d="M260 416V286h200v130" fill="#29221e" stroke="#d4aa69" strokeWidth="8" />
        <path d="M286 312h58v52h-58zm90 0h58v52h-58zm-45 58h58v48h-58z" fill="#b87943" stroke="#f0bc55" strokeWidth="5" />
        <path d="M240 246h240" stroke="#f0bc55" strokeWidth="8" />
      </>
    case 'war-academy':
      return <>
        <path d="M208 418h304V224H208z" fill="#252f43" stroke="#9d8bd8" strokeWidth="8" />
        <path d="M248 224v-72h58v72m108 0v-72h58v72" fill="#313f59" stroke="#9d8bd8" strokeWidth="8" />
        <path d="M302 302l116 116m0-116L302 418" stroke="#f0bc55" strokeWidth="14" strokeLinecap="round" />
        <path d="M286 288l38 10-28 28zm148 0-38 10 28 28z" fill="#ef6a5b" />
        <path d="M360 224v-82l62 24-62 24" fill="#9d8bd8" stroke="#f0bc55" strokeWidth="6" />
      </>
    default:
      return <>
        <path d="M214 418h292V244l-146-80-146 80z" fill="#2b405c" stroke="#f0bc55" strokeWidth="8" />
        <path d="M286 418V302h148v116" fill="#18283c" stroke="#f0bc55" strokeWidth="8" />
        <circle cx="360" cy="350" r="34" fill="#7cc8e8" opacity=".9" />
      </>
  }
}

export default function BuildingIllustration({ buildingKey, name, compact = false, decorative = false }: BuildingIllustrationProps) {
  const uniqueId = useId().replace(/:/g, '')
  const skyId = `building-sky-${uniqueId}`
  const glowId = `building-glow-${uniqueId}`

  return <svg
    className={compact ? 'building-illustration building-illustration--compact' : 'building-illustration'}
    viewBox="0 0 720 520"
    role={decorative ? undefined : 'img'}
    aria-hidden={decorative ? true : undefined}
    aria-label={decorative ? undefined : `${name} — original Kingshot Forge companion illustration`}
    preserveAspectRatio="xMidYMid slice"
  >
    {!decorative && <title>{name} — original Kingshot Forge companion illustration</title>}
    <defs>
      <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#07111d" />
        <stop offset=".58" stopColor="#122239" />
        <stop offset="1" stopColor="#26384a" />
      </linearGradient>
      <radialGradient id={glowId} cx="50%" cy="38%" r="48%">
        <stop offset="0" stopColor="#7cc8e8" stopOpacity=".28" />
        <stop offset="1" stopColor="#7cc8e8" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="720" height="520" rx="34" fill={`url(#${skyId})`} />
    <circle cx="360" cy="196" r="220" fill={`url(#${glowId})`} />
    <path d="M0 438c120-46 198-24 286-2 116 30 224 18 434-30v114H0z" fill="#101b28" />
    <path d="M0 464c138-30 248-14 338 8 94 22 204 12 382-18v66H0z" fill="#0a121c" />
    <g>{motif(buildingKey)}</g>
    <circle cx="104" cy="94" r="34" fill="#f0bc55" opacity=".88" />
    <g fill="#d6edf7" opacity=".72">
      <circle cx="584" cy="92" r="3" /><circle cx="628" cy="148" r="4" /><circle cx="548" cy="174" r="2.5" />
      <circle cx="142" cy="162" r="3" /><circle cx="92" cy="214" r="2.5" /><circle cx="654" cy="230" r="3" />
    </g>
  </svg>
}
