// Each event's font pairing: which loaded font fills each of the guest site's
// three font roles (globals.css `@theme`: `font-heading`, `font-elegant`,
// `font-body`). Saved per event as `fontPairing` in `content/theme` and written
// into the same `:root` style as the colors (themeCss in src/lib/theme.ts).
// Pure; the fonts themselves are loaded once by src/app/fonts.ts.

export const FONT_ROLES = ['heading', 'elegant', 'body'] as const;
export type FontRole = (typeof FONT_ROLES)[number];

/** CSS variable of each role in globals.css `@theme` (Tailwind: font-heading, ...). */
export const FONT_ROLE_VARS: Record<FontRole, string> = {
  heading: '--font-heading',
  elegant: '--font-elegant',
  body: '--font-body',
};

export const FONT_ROLE_INFO: Record<FontRole, { label: string; hint: string }> = {
  heading: { label: 'Titles', hint: 'Names and screen titles, often in capitals' },
  elegant: { label: 'Elegant text', hint: 'Subtitles, quotes and longer italic text' },
  body: { label: 'Body', hint: 'Buttons, labels, forms and small text' },
};

type FontFamily = {
  /** Family name as Google Fonts spells it */
  name: string;
  /** Variable set by next/font in src/app/fonts.ts (must match `variable:` there) */
  cssVar: string;
  fallback: 'serif' | 'sans-serif';
};

export const FONT_FAMILIES = {
  cinzel: { name: 'Cinzel', cssVar: '--font-cinzel', fallback: 'serif' },
  cormorantGaramond: { name: 'Cormorant Garamond', cssVar: '--font-cormorant-garamond', fallback: 'serif' },
  inter: { name: 'Inter', cssVar: '--font-inter', fallback: 'sans-serif' },
  playfairDisplay: { name: 'Playfair Display', cssVar: '--font-playfair-display', fallback: 'serif' },
  ebGaramond: { name: 'EB Garamond', cssVar: '--font-eb-garamond', fallback: 'serif' },
  raleway: { name: 'Raleway', cssVar: '--font-raleway', fallback: 'sans-serif' },
  marcellus: { name: 'Marcellus', cssVar: '--font-marcellus', fallback: 'serif' },
  lora: { name: 'Lora', cssVar: '--font-lora', fallback: 'serif' },
  nunitoSans: { name: 'Nunito Sans', cssVar: '--font-nunito-sans', fallback: 'sans-serif' },
  montserrat: { name: 'Montserrat', cssVar: '--font-montserrat', fallback: 'sans-serif' },
  sourceSerif: { name: 'Source Serif 4', cssVar: '--font-source-serif', fallback: 'serif' },
  dmSans: { name: 'DM Sans', cssVar: '--font-dm-sans', fallback: 'sans-serif' },
  italiana: { name: 'Italiana', cssVar: '--font-italiana', fallback: 'serif' },
  bodoniModa: { name: 'Bodoni Moda', cssVar: '--font-bodoni-moda', fallback: 'serif' },
  jost: { name: 'Jost', cssVar: '--font-jost', fallback: 'sans-serif' },
} as const satisfies Record<string, FontFamily>;

export type FontFamilyId = keyof typeof FONT_FAMILIES;

export type FontPairing = {
  id: string;
  name: string;
  /** What it suits, shown under the name in the editor */
  mood: string;
  fonts: Record<FontRole, FontFamilyId>;
};

export const FONT_PAIRINGS: FontPairing[] = [
  {
    // The Wedding template's default: equal to globals.css @theme (fonts.test.ts)
    id: 'classic', name: 'Classic', mood: 'Engraved capitals, timeless',
    fonts: { heading: 'cinzel', elegant: 'cormorantGaramond', body: 'inter' },
  },
  {
    id: 'romantic', name: 'Romantic', mood: 'High-contrast serif, soft and warm',
    fonts: { heading: 'playfairDisplay', elegant: 'ebGaramond', body: 'raleway' },
  },
  {
    id: 'garden', name: 'Garden', mood: 'Gentle and friendly',
    fonts: { heading: 'marcellus', elegant: 'lora', body: 'nunitoSans' },
  },
  {
    id: 'modern', name: 'Modern', mood: 'Clean, for seminars and corporate events',
    fonts: { heading: 'montserrat', elegant: 'sourceSerif', body: 'dmSans' },
  },
  {
    id: 'glamour', name: 'Glamour', mood: 'Fashion-magazine look, for debuts and galas',
    fonts: { heading: 'italiana', elegant: 'bodoniModa', body: 'jost' },
  },
];

/** The pairing an event without a saved one uses (the Wedding template's). */
export const DEFAULT_FONT_PAIRING_ID = 'classic';

export const getFontPairing = (id: string): FontPairing =>
  FONT_PAIRINGS.find((p) => p.id === id) ?? FONT_PAIRINGS.find((p) => p.id === DEFAULT_FONT_PAIRING_ID)!;

export const isFontPairingId = (value: unknown): value is string =>
  typeof value === 'string' && FONT_PAIRINGS.some((p) => p.id === value);

/** `var(--font-cinzel), serif` for one role of a pairing. */
export function fontStack(pairing: FontPairing, role: FontRole): string {
  const family = FONT_FAMILIES[pairing.fonts[role]];
  return `var(${family.cssVar}), ${family.fallback}`;
}

/** The role variables of a pairing as CSS declarations (`--font-heading:var(--font-cinzel), serif;...`). */
export function fontDeclarations(pairing: FontPairing): string {
  return FONT_ROLES.map((role) => `${FONT_ROLE_VARS[role]}:${fontStack(pairing, role)};`).join('');
}
