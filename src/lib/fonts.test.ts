import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FONT_PAIRING_ID, FONT_FAMILIES, FONT_PAIRINGS, FONT_ROLES, FONT_ROLE_VARS,
  fontDeclarations, fontStack, getFontPairing,
} from './fonts';

describe('fonts', () => {
  it('default pairing equals the globals.css @theme font roles (the CSS fallback)', () => {
    const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');
    const pairing = getFontPairing(DEFAULT_FONT_PAIRING_ID);
    for (const role of FONT_ROLES) {
      const match = css.match(new RegExp(`${FONT_ROLE_VARS[role]}:\\s*([^;]+);`));
      expect(match?.[1].trim(), role).toBe(fontStack(pairing, role));
    }
  });

  it('every family is loaded by src/app/fonts.ts under its variable', () => {
    const loader = readFileSync(join(__dirname, '../app/fonts.ts'), 'utf8');
    for (const family of Object.values(FONT_FAMILIES)) {
      expect(loader, family.name).toContain(`variable: '${family.cssVar}'`);
    }
  });

  it('pairings have unique ids and use loaded families', () => {
    expect(new Set(FONT_PAIRINGS.map((p) => p.id)).size).toBe(FONT_PAIRINGS.length);
    for (const pairing of FONT_PAIRINGS) {
      for (const role of FONT_ROLES) expect(FONT_FAMILIES[pairing.fonts[role]], `${pairing.id}.${role}`).toBeDefined();
    }
  });

  it('an unknown id falls back to the default pairing', () => {
    expect(getFontPairing('nope').id).toBe(DEFAULT_FONT_PAIRING_ID);
    expect(fontDeclarations(getFontPairing('modern'))).toContain('--font-heading:var(--font-montserrat), sans-serif;');
  });
});
