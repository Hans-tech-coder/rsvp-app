// Each event's color theme: the semantic color tokens of globals.css `@theme`
// (`--color-ink`, `--color-primary`, ...), saved per event in `content/theme`
// and written as a `:root` style by the event page, so a new palette needs no
// rebuild. Pure, used by the server pages and the Theme editor.

export const THEME_COLOR_KEYS = [
  'primary', 'accent', 'surface', 'ink',
  'primaryLight', 'primaryDeep', 'accentLight', 'accentDark', 'surfaceSoft',
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];
export type ThemeColors = Record<ThemeColorKey, string>;

/** The `content/theme` doc. `preset` is the preset the colors came from, or 'custom'. */
export type Theme = { preset: string; colors: ThemeColors };

type ColorInfo = {
  /** CSS variable in globals.css `@theme` (Tailwind: bg-/text-/border-<name>) */
  cssVar: string;
  label: string;
  hint: string;
  /** A shade follows its main color when that is picked (see deriveShades). */
  shadeOf?: { key: ThemeColorKey; mix: 'white' | 'black' | 'ink'; amount: number };
};

export const THEME_COLOR_INFO: Record<ThemeColorKey, ColorInfo> = {
  primary: { cssVar: '--color-primary', label: 'Main color', hint: 'Buttons and highlights' },
  accent: { cssVar: '--color-accent', label: 'Accent', hint: 'Headings, lines, icons and button text' },
  surface: { cssVar: '--color-surface', label: 'Background', hint: 'Behind every screen' },
  ink: { cssVar: '--color-ink', label: 'Text', hint: 'Body text and names' },
  primaryLight: { cssVar: '--color-primary-light', label: 'Main color, light', hint: 'Hover and the current menu item', shadeOf: { key: 'primary', mix: 'white', amount: 0.25 } },
  primaryDeep: { cssVar: '--color-primary-deep', label: 'Main color, deep', hint: 'Dark backdrops and gradients', shadeOf: { key: 'primary', mix: 'black', amount: 0.65 } },
  accentLight: { cssVar: '--color-accent-light', label: 'Accent, light', hint: 'Soft highlights', shadeOf: { key: 'accent', mix: 'white', amount: 0.4 } },
  accentDark: { cssVar: '--color-accent-dark', label: 'Accent, dark', hint: 'Borders and depth', shadeOf: { key: 'accent', mix: 'black', amount: 0.22 } },
  surfaceSoft: { cssVar: '--color-surface-soft', label: 'Background, soft', hint: 'Panels and cards', shadeOf: { key: 'surface', mix: 'ink', amount: 0.04 } },
};

export type ThemePreset = { id: string; name: string; colors: ThemeColors };

export const THEME_PRESETS: ThemePreset[] = [
  {
    // The Wedding template's default: equal to globals.css @theme (theme.test.ts)
    id: 'burgundy-gold', name: 'Burgundy & Gold',
    colors: {
      primary: '#800020', accent: '#C5A059', surface: '#12100E', ink: '#FCFAF6',
      primaryLight: '#B53351', primaryDeep: '#2E000B', accentLight: '#E0C79B', accentDark: '#997A44', surfaceSoft: '#1A1715',
    },
  },
  {
    id: 'sage-cream', name: 'Sage & Cream',
    colors: {
      primary: '#55704F', accent: '#D8C9A3', surface: '#0F1410', ink: '#F8F5EC',
      primaryLight: '#8DA888', primaryDeep: '#1A2419', accentLight: '#EDE3C8', accentDark: '#A8976D', surfaceSoft: '#161C17',
    },
  },
  {
    id: 'navy-silver', name: 'Navy & Silver',
    colors: {
      primary: '#1F3A6B', accent: '#C0C6D0', surface: '#0B0F1A', ink: '#F4F6FA',
      primaryLight: '#4A6BA8', primaryDeep: '#0A1428', accentLight: '#E2E6EC', accentDark: '#8A93A3', surfaceSoft: '#121828',
    },
  },
  {
    id: 'blush-rose-gold', name: 'Blush & Rose Gold',
    colors: {
      primary: '#8E4A56', accent: '#D9A58F', surface: '#161012', ink: '#FBF4F2',
      primaryLight: '#C47F8B', primaryDeep: '#3A1C22', accentLight: '#EBC9B9', accentDark: '#A87862', surfaceSoft: '#1F171A',
    },
  },
  {
    id: 'black-gold', name: 'Black & Gold',
    colors: {
      primary: '#2A2418', accent: '#D4AF37', surface: '#0A0A0A', ink: '#FAF7F0',
      primaryLight: '#B8954A', primaryDeep: '#1A160E', accentLight: '#E8D18A', accentDark: '#A08428', surfaceSoft: '#141414',
    },
  },
  {
    id: 'emerald-gold', name: 'Emerald & Gold',
    colors: {
      primary: '#0F5C45', accent: '#C9A85C', surface: '#08120E', ink: '#F7F5EE',
      primaryLight: '#2E8A6C', primaryDeep: '#052118', accentLight: '#E3CC97', accentDark: '#9A7D3E', surfaceSoft: '#0F1A15',
    },
  },
];

/** The preset an event without a saved theme uses (the Wedding template's). */
export const DEFAULT_THEME_PRESET_ID = 'burgundy-gold';
export const CUSTOM_PRESET_ID = 'custom';

export const DEFAULT_THEME: Theme = {
  preset: DEFAULT_THEME_PRESET_ID,
  colors: { ...THEME_PRESETS.find((p) => p.id === DEFAULT_THEME_PRESET_ID)!.colors },
};

const HEX = /^#[0-9a-f]{6}$/i;
export const isHexColor = (value: unknown): value is string => typeof value === 'string' && HEX.test(value);

/** A saved `content/theme` doc over the default: known keys only, an invalid color keeps the default. */
export function mergeTheme(doc: unknown): Theme {
  const theme: Theme = { preset: DEFAULT_THEME.preset, colors: { ...DEFAULT_THEME.colors } };
  if (!doc || typeof doc !== 'object') return theme;
  const { preset, colors } = doc as { preset?: unknown; colors?: Record<string, unknown> };
  if (typeof preset === 'string' && preset) theme.preset = preset;
  if (colors && typeof colors === 'object') {
    for (const key of THEME_COLOR_KEYS) {
      if (isHexColor(colors[key])) theme.colors[key] = colors[key].toUpperCase();
    }
  }
  return theme;
}

/** CSS declarations for the colors (`--color-ink:#FCFAF6;...`). Values must be merged (hex only). */
export function themeDeclarations(colors: ThemeColors): string {
  return THEME_COLOR_KEYS.map((key) => `${THEME_COLOR_INFO[key].cssVar}:${colors[key]};`).join('');
}

/** The `:root` rule the event page writes; unlayered, so it beats Tailwind's `@layer theme`. */
export function themeCss(colors: ThemeColors): string {
  return `:root{${themeDeclarations(colors)}}`;
}

// ---- color math (sRGB hex) ----

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** `a` blended toward `b` by `amount` (0 to 1); also used for the RSVP email's rgba-free colors. */
export function mixHex(a: string, b: string, amount: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((v, i) => v + (cb[i] - v) * amount));
}

/** The shades of a main color that was just picked, from THEME_COLOR_INFO[*].shadeOf. */
export function deriveShades(colors: ThemeColors, changed: ThemeColorKey): ThemeColors {
  const next = { ...colors };
  for (const key of THEME_COLOR_KEYS) {
    const shade = THEME_COLOR_INFO[key].shadeOf;
    if (shade?.key !== changed) continue;
    const target = shade.mix === 'white' ? '#FFFFFF' : shade.mix === 'black' ? '#000000' : colors.ink;
    next[key] = mixHex(colors[changed], target, shade.amount);
  }
  return next;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Text-on-background pairs the guest site actually uses, checked by the Theme editor. */
export const CONTRAST_PAIRS: { text: ThemeColorKey; background: ThemeColorKey; label: string }[] = [
  { text: 'ink', background: 'surface', label: 'Text on background' },
  { text: 'ink', background: 'surfaceSoft', label: 'Text on panels' },
  { text: 'accent', background: 'surface', label: 'Headings on background' },
  { text: 'accentLight', background: 'surface', label: 'Highlights on background' },
  { text: 'accent', background: 'primary', label: 'Button text' },
  { text: 'ink', background: 'primaryDeep', label: 'Text on deep backdrops' },
];

/** WCAG AA: 4.5 for normal text, 3 for large text (titles). */
export type ContrastLevel = 'good' | 'large-only' | 'poor';
export const contrastLevel = (ratio: number): ContrastLevel =>
  ratio >= 4.5 ? 'good' : ratio >= 3 ? 'large-only' : 'poor';
