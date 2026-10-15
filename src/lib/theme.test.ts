import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTRAST_PAIRS, DEFAULT_THEME, THEME_COLOR_INFO, THEME_COLOR_KEYS, THEME_PRESETS,
  contrastRatio, deriveShades, mergeTheme, themeCss,
} from './theme';

describe('theme', () => {
  it('default equals the globals.css @theme values (the CSS fallback)', () => {
    const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');
    for (const key of THEME_COLOR_KEYS) {
      const { cssVar } = THEME_COLOR_INFO[key];
      const match = css.match(new RegExp(`${cssVar}:\\s*(#[0-9a-fA-F]{6})`));
      expect(match?.[1].toUpperCase(), cssVar).toBe(DEFAULT_THEME.colors[key]);
    }
  });

  it('every preset has every color as #RRGGBB and readable body text', () => {
    for (const preset of THEME_PRESETS) {
      for (const key of THEME_COLOR_KEYS) expect(preset.colors[key], `${preset.id}.${key}`).toMatch(/^#[0-9A-F]{6}$/);
      expect(contrastRatio(preset.colors.ink, preset.colors.surface), preset.id).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('mergeTheme keeps valid known colors only', () => {
    const theme = mergeTheme({ preset: 'custom', colors: { primary: '#123abc', accent: 'red', extra: '#000000' } });
    expect(theme.preset).toBe('custom');
    expect(theme.colors.primary).toBe('#123ABC');
    expect(theme.colors.accent).toBe(DEFAULT_THEME.colors.accent);
    expect(theme.colors).not.toHaveProperty('extra');
    expect(mergeTheme(undefined)).toEqual(DEFAULT_THEME);
  });

  it('themeCss writes one :root rule with every variable', () => {
    const css = themeCss(DEFAULT_THEME.colors);
    expect(css.startsWith(':root{')).toBe(true);
    expect(css).toContain('--color-primary:#800020;');
    expect(css).not.toMatch(/[<>]/);
  });

  it('deriveShades updates only the shades of the changed color', () => {
    const next = deriveShades({ ...DEFAULT_THEME.colors, primary: '#000080' }, 'primary');
    expect(next.primaryLight).not.toBe(DEFAULT_THEME.colors.primaryLight);
    expect(next.primaryDeep).not.toBe(DEFAULT_THEME.colors.primaryDeep);
    expect(next.accentLight).toBe(DEFAULT_THEME.colors.accentLight);
  });

  it('contrastRatio matches WCAG', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(CONTRAST_PAIRS.length).toBeGreaterThan(0);
  });
});
