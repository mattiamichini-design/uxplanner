import { Play } from 'lucide-react';
import { logoMarkPath as markPath } from '@/components/ui/logo-mark';

// Generic UI icons come from Lucide, the set the product uses.
export {
  AppWindow as BrowserIcon, Code as CodeIcon, MessageCircle as ChatIcon, Plug as PluginIcon, RotateCcw as ResetIcon,
  ThumbsUp as ThumbsUpIcon, TriangleAlert as WarningIcon,
} from 'lucide-react';

// The marks below are drawn inline from the Paper references. All icons are decorative.

// Satoshi Bold wordmark softened with the same fillets as the lattice mark, outlined from the branding file.
const wordmarkPath =
  'M1992 479C2138 479 2234 380 2234 239C2234 96 2139 0 1992 0H1727C1713.7 0 1703 10.7 1703 24V707C1703 720.3 1713.7 731 1727 731H1807C1820.3 731 1831 720.3 1831 707V564C1831 517.1 1869.1 479 1916 479ZM944.4 318.4C963.5 347.2 963.3 384.7 943.9 413.2L744.9 706.2C737.7 716.7 745.2 731 758 731H865.2C873.2 731 880.7 727 885.1 720.3L997.1 552.4C1023.9 512.2 1083.8 514.8 1109 556.1C1119.8 573.9 1131 591.6 1143 610L1217.9 720.5C1222.3 727.1 1229.8 731 1237.7 731H1346C1358.9 731 1366.6 716.7 1359.5 705.9L1166.5 411.6C1148 383.3 1148 346.7 1166.5 318.4L1358.6 25.1C1365.6 14.3 1357.9 0 1345 0H1239.2C1231 0 1223.3 4.2 1218.9 11.1L1112.9 178.3C1087.4 218.5 1028 216.4 1002.9 176C993.7 161 984.1 146.2 974 131L892.1 10.5C887.7 3.9 880.2 0 872.3 0H763C750.2 0 742.5 14.3 749.6 25ZM76 464C76 636 188 743 365 743C543 743 655 635 655 464V24C655 10.7 644.3 0 631 0H551C537.7 0 527 10.7 527 24V456C527 560 469 619 365 619C261 619 204 561 204 456V24C204 10.7 193.3 0 180 0H100C86.7 0 76 10.7 76 24ZM2682 744C2713.3 744 2742.9 738.2 2768.5 727.9C2800.2 715.2 2824.3 719.7 2851.3 724.8C2867.2 727.8 2884.1 731 2904.1 731H2939C2952.3 731 2963 720.3 2963 707V431C2963 294 2881 222 2748 222C2624.3 222 2539.8 281.7 2527.5 375.1C2525.8 388.2 2536.7 399 2550 399H2606C2619.3 399 2629.5 388 2633.2 375.3C2643.9 338 2681.8 317 2742 317C2804 317 2844 344 2844 411V412.1C2844 417.7 2839.7 422.3 2834.1 422.7L2696 433C2579 442 2513 499 2513 590C2513 683 2577 744 2682 744ZM4422 744C4539.4 744 4624.4 690.2 4654.7 599.2C4659.4 584.8 4648 571 4632.9 571H4566.9C4556.3 571 4547.2 578.1 4542.4 587.6C4523.7 624.1 4482.6 644 4424 644C4377.3 644 4342.2 629.4 4319.2 600.3C4287.9 560.9 4331.7 512.9 4382 512.7L4636.1 512.1C4649.3 512 4660 501.3 4660 488.1V475C4660 321 4566 222 4418 222C4273 222 4172 329 4172 484C4172 637 4275 744 4422 744ZM3344 222C3316.1 222 3289.4 227 3265.5 236.5C3231.7 250 3206.3 246.2 3177.3 241.8C3161.6 239.5 3144.9 237 3125.1 237H3087C3073.7 237 3063 247.7 3063 261V707C3063 720.3 3073.7 731 3087 731H3161C3174.3 731 3185 720.3 3185 707V465C3185 385 3231 333 3306 333C3369 333 3410 373 3410 456V707C3410 720.3 3420.7 731 3434 731H3508C3521.3 731 3532 720.3 3532 707V427C3532 299 3468 222 3344 222ZM3913 222C3885.1 222 3858.4 227 3834.5 236.5C3800.7 250 3775.3 246.2 3746.3 241.8C3730.6 239.5 3713.9 237 3694.1 237H3656C3642.7 237 3632 247.7 3632 261V707C3632 720.3 3642.7 731 3656 731H3730C3743.3 731 3754 720.3 3754 707V465C3754 385 3800 333 3875 333C3938 333 3979 373 3979 456V707C3979 720.3 3989.7 731 4003 731H4077C4090.3 731 4101 720.3 4101 707V427C4101 299 4037 222 3913 222ZM2403 731C2416.3 731 2427 720.3 2427 707V11C2427 -2.3 2416.3 -13 2403 -13H2330C2316.7 -13 2306 -2.3 2306 11V707C2306 720.3 2316.7 731 2330 731ZM4994 228C4970.6 228 4949.6 232.1 4931.3 239.7C4900.9 252.2 4877.7 248.1 4851.6 243.5C4836.7 240.8 4820.8 238 4802 238H4762C4748.7 238 4738 248.7 4738 262V707C4738 720.3 4748.7 731 4762 731H4836C4849.3 731 4860 720.3 4860 707V491C4860 395 4915 348 5003 348H5024C5037.3 348 5048 337.3 5048 324V253.7C5048 242.7 5040.5 233 5029.7 231.1C5017.2 228.9 5005.6 228 4994 228ZM1967 114C2052 114 2100 158 2100 238C2100 318 2053 365 1965 365H1886.2C1855.7 365 1831 340.3 1831 309.8V169.2C1831 138.7 1855.7 114 1886.2 114ZM2722 652C2667 652 2637 630 2637 585C2637 545 2666 520 2742 513L2821.7 506.8C2834.3 505.8 2845 515.8 2845 528.4V531C2845 607 2797 652 2722 652ZM4419 322C4482.7 322 4526.7 356.3 4536.8 410.3C4539.3 423.8 4527.9 435 4514.1 435H4320.2C4304.9 435 4293 421.2 4297.7 406.6C4315.6 351.1 4356.9 322 4419 322Z';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'logo-mark'} viewBox="0 0 336 336" aria-hidden="true">
      <path fill="currentColor" d={markPath} />
    </svg>
  );
}

export function LogoTile({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 480 480" aria-hidden="true">
      <rect width="480" height="480" rx="96" fill="var(--ink)" />
      <path fill="var(--on-ink)" transform="translate(72 72)" d={markPath} />
    </svg>
  );
}

export function Logo() {
  return (
    <>
      <LogoMark />
      <svg className="wordmark" viewBox="76 -13 4972 757" aria-hidden="true">
        <path fill="currentColor" d={wordmarkPath} />
      </svg>
    </>
  );
}

export function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

export function PlayIcon() {
  return <Play aria-hidden="true" fill="currentColor" />;
}

function DialRings() {
  return (
    <>
      <circle className="dial-ring" cx="100" cy="100" r="94" fill="none" stroke="var(--line-strong)" strokeWidth="6" strokeDasharray="1.5 6" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="var(--line)" />
    </>
  );
}

const dialLabel = { textAnchor: 'middle', fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--muted)' } as const;
const dialLetter = { textAnchor: 'middle', fontFamily: 'var(--sans)', fontWeight: 500 } as const;

export function PersonasDial() {
  return (
    <svg className="dial-art" viewBox="0 0 200 200" aria-hidden="true">
      <DialRings />
      <g className="dial-core">
        <circle cx="86" cy="86" r="26" fill="var(--ink)" />
        <text x="86" y="93" fontSize="20" fill="var(--on-ink)" {...dialLetter}>A</text>
        <circle cx="122" cy="102" r="20" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <text x="122" y="108" fontSize="16" fill="var(--ink)" {...dialLetter}>B</text>
        <text x="100" y="148" {...dialLabel}>GOALS · NEEDS</text>
      </g>
    </svg>
  );
}

const journeyCells: { x: number; y: number; mark: 'dot' | 'ring' | 'warn'; focus?: boolean }[] = [
  { x: 50, y: 70, mark: 'dot' }, { x: 85, y: 70, mark: 'ring' }, { x: 120, y: 70, mark: 'dot' },
  { x: 50, y: 93, mark: 'ring' }, { x: 85, y: 93, mark: 'warn', focus: true }, { x: 120, y: 93, mark: 'dot' },
  { x: 50, y: 116, mark: 'dot' }, { x: 85, y: 116, mark: 'ring' }, { x: 120, y: 116, mark: 'warn' },
];

export function JourneysDial() {
  return (
    <svg className="dial-art" viewBox="0 0 200 200" aria-hidden="true">
      <DialRings />
      <g className="dial-core">
        {[50, 85, 120].map(x => <rect key={x} x={x} y="58" width="30" height="6" rx="3" fill="var(--ink)" />)}
        {journeyCells.map(({ x, y, mark, focus }) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="30" height="18" rx="4" fill="var(--surface)" stroke={focus ? 'var(--ink)' : 'var(--connector)'} strokeWidth={focus ? 1.5 : 1} />
            {mark === 'dot' && <circle cx={x + 8} cy={y + 9} r="3" fill="var(--ink)" />}
            {mark === 'ring' && <circle cx={x + 8} cy={y + 9} r="2.6" fill="none" stroke="var(--ink)" strokeWidth="1.2" />}
            {mark === 'warn' && (
              <path d={`M${x + 8} ${y + 5.5} L${x + 11.5} ${y + 12} L${x + 4.5} ${y + 12} Z`} fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
            )}
          </g>
        ))}
        <text x="100" y="152" {...dialLabel}>PHASES × ROWS</text>
      </g>
    </svg>
  );
}

export function FlowsDial() {
  return (
    <svg className="dial-art" viewBox="0 0 200 200" aria-hidden="true">
      <DialRings />
      <g className="dial-core">
        <rect x="74" y="44" width="52" height="20" rx="6" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <line x1="100" y1="64" x2="100" y2="80" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M100,80 L114,94 L100,108 L86,94 Z" fill="var(--ink)" />
        <path d="M86,94 L62,94 L62,124" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M114,94 L138,94 L138,124" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x="42" y="124" width="40" height="20" rx="6" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x="118" y="124" width="40" height="20" rx="6" fill="var(--panel)" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="3 2" />
      </g>
    </svg>
  );
}

export function StoriesDial() {
  return (
    <svg className="dial-art" viewBox="0 0 200 200" aria-hidden="true">
      <DialRings />
      <g className="dial-core">
        <path d="M100,20 A80,80 0 1 1 30.7,140" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
        {[66, 92].map(y => (
          <g key={y}>
            <rect x="52" y={y} width="12" height="12" rx="3" fill="var(--ink)" />
            <path d={`M55,${y + 6} L57.5,${y + 8.5} L61,${y + 3.5}`} fill="none" stroke="var(--on-ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        <rect x="72" y="69" width="76" height="6" rx="3" fill="var(--line-strong)" />
        <rect x="72" y="95" width="60" height="6" rx="3" fill="var(--line-strong)" />
        <rect x="52.75" y="118.75" width="10.5" height="10.5" rx="2.5" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x="72" y="121" width="68" height="6" rx="3" fill="var(--line)" />
      </g>
    </svg>
  );
}

export function DownArrow() {
  return (
    <svg width="12" height="22" viewBox="0 0 12 22" aria-hidden="true">
      <path d="M6 1V20M2 16L6 20.5L10 16" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
